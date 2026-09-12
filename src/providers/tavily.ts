/**
 * `dshws-tavily` chain member: Tavily search API (`POST /search`, bearer
 * auth). Wire contract per the official API reference (2026-09-10,
 * docs.tavily.com/documentation/api-reference/endpoint/search): request takes
 * `query` + optional `max_results` (API-side default 10), `topic`
 * (`general|news|finance`; `news` carries `published_date`), `time_range`
 * (`day|week|month|year`), `search_depth` (`basic|advanced|fast|ultra-fast`;
 * `advanced` costs 2 credits), and `include_answer` (`basic|advanced` — the
 * boolean form evolved into this enum). `include_answer: 'basic'` is sent by
 * default (S17 D4): the generated answer is free per the official docs and
 * the response's top-level `answer` becomes the seam result's `content`
 * (blank stays omitted). Response `results[]` carries
 * `url`/`title`/`content`/`score`/`published_date`, where `content` is a
 * short excerpt mapped to the seam's `snippet`.
 *
 * `max_results` is passed through unclamped: the seam's `maxResults` is a
 * caller bound the API enforces (a >20 value gets a 4xx, which reads as an
 * HTTP error like any other), mirroring the upstream Exa member's behavior.
 * The key resolves fresh per operation through the injected thunk — the
 * provider never holds it.
 *
 * @module dsh-websearch/providers/tavily
 */
import type { TavilyMemberConfig } from '../config.ts'
import type { UnifiedSearchFanout } from '../config.ts'
import { DshwsError, MEMBER_ERROR_CODES } from '../errors.ts'
import type { WebFetchProvider, WebFetchRequest, WebFetchResult, WebSearchProvider, WebSearchRequest, WebSearchResult, WebSearchSource } from '@deepseek-ai/dsh-web'
import {
  isAbortError,
  isPositiveInteger,
  memberAborted,
  memberBadResponse,
  memberFetchFailure,
  resolveMemberApiKey,
  throwIfMemberAborted,
  unfoldHttpErrorDetail,
} from './shared.ts'

/** Stable id this member registers under (chain + direct pin, `dshws-` prefixed). */
export const TAVILY_MEMBER_ID = 'dshws-tavily'

/** Default Tavily API base; `/search` is the operation. */
export const TAVILY_DEFAULT_BASE_URL = 'https://api.tavily.com'

const codes = MEMBER_ERROR_CODES.tavily

/** Attribution header sent on every request; bump with the package version. */
const USER_AGENT = 'dsh-websearch/0.1.0'

/** Wire type of one Tavily `results[]` entry (optional fields read tolerantly). */
export interface TavilyResultItem {
  readonly url?: string
  readonly title?: string
  readonly content?: string
  readonly score?: number
  readonly published_date?: string
}

/** Wire type of one /extract results[] entry (optional fields read tolerantly). */
export interface TavilyExtractResultItem {
  readonly url?: string
  readonly raw_content?: string
}

export interface TavilyExtractResponse {
  readonly results?: readonly TavilyExtractResultItem[]
  readonly failed_results?: readonly { readonly url?: string, readonly error?: string }[]
}

export interface TavilySearchResponse {
  readonly results?: readonly TavilyResultItem[]
  /** Generated answer; present when `include_answer` was requested (S17 D4). */
  readonly answer?: string
}

/** Fully-resolved runtime options for the member; defaults applied by {@link resolveTavilyMemberOptions}. */
export interface TavilyMemberOptions {
  /** Credential-ref env name, for missing-credential diagnostics. */
  readonly apiKeyRef: string
  /** Resolve the current API key per operation (credentials service-backed). */
  readonly resolveApiKey: () => Promise<string | undefined>
  /** Endpoint base; `/search` is appended. */
  readonly baseURL: string
  /** Default result count when a request carries no `maxResults`. */
  readonly maxResults?: number
  /** Search category; absent = not sent (S17 P1). */
  readonly topic?: 'general' | 'news' | 'finance'
  /** Publication-recency filter; absent = not sent (S17 P1). */
  readonly timeRange?: 'day' | 'week' | 'month' | 'year'
  /** Search depth tier; absent = API default `basic` (S17 P1). */
  readonly searchDepth?: 'basic' | 'advanced' | 'fast' | 'ultra-fast'
  /** Generated-answer tier; resolved default `'basic'` (S17 P1, D4). */
  readonly includeAnswer: 'basic' | 'advanced'
  /** Unified search language (ISO 639-1); absent = not sent (S17 P1, ADR-0015). */
  readonly language?: string
  /** Unified include-domain allowlist; wildcard entries skip the whole domain fan-out for this member (S20 P1, ADR-0018 — Tavily has no wildcard support). */
  readonly includeDomains?: readonly string[]
  /** Wildcard guard flag: set when any unified domain entry contains `*` (S20 stage-5 F-1). */
  readonly domainsHaveWildcard?: boolean
  /** Unified exclude-domain blocklist; empty = not sent (S20 P1, ADR-0018). */
  readonly excludeDomains?: readonly string[]
  /** Content chunks per source; absent = not sent (S20 P2). */
  readonly chunksPerSource?: number
  /** Hard language filter; only sent when `language` is set (S20 P2, official 400 constraint). */
  readonly filterByLanguage?: boolean
  /** Include-list semantics; only sent with a non-empty include list (S20 P2). */
  readonly includeDomainsMode?: 'filter' | 'boost'
  /** Publication-date window lower bound (`YYYY-MM-DD`); absent = not sent (S22 P3). */
  readonly startDate?: string
  /** Publication-date window upper bound; absent = not sent (S22 P3). */
  readonly endDate?: string
  /** Exact quoted-phrase filter; absent = not sent (S22 P3). */
  readonly exactMatch?: boolean
}

/**
 * Explicit defaulting at the owning boundary (explicit > implicit): the base
 * URL default lands here, config passthrough stays untouched. The geo entry
 * contributes only the language — Tavily's `country` expects country-name
 * strings (ISO-code compatibility unverified), so v1 does not fan the region
 * out here (ADR-0015).
 */
export function resolveTavilyMemberOptions(
  config: TavilyMemberConfig,
  resolveApiKey: () => Promise<string | undefined>,
  fanout?: UnifiedSearchFanout,
): TavilyMemberOptions {
  return {
    apiKeyRef: config.apiKeyEnv,
    resolveApiKey,
    baseURL: config.baseURL ?? TAVILY_DEFAULT_BASE_URL,
    maxResults: config.maxResults,
    topic: config.topic,
    timeRange: config.timeRange,
    searchDepth: config.searchDepth,
    includeAnswer: config.includeAnswer ?? 'basic',
    language: fanout?.language,
    includeDomains: fanout?.includeDomains?.length ? fanout.includeDomains : undefined,
    excludeDomains: fanout?.excludeDomains?.length ? fanout.excludeDomains : undefined,
    domainsHaveWildcard: (fanout?.includeDomains ?? []).some((entry) => entry.includes('*'))
      || (fanout?.excludeDomains ?? []).some((entry) => entry.includes('*')),
    chunksPerSource: config.chunksPerSource,
    filterByLanguage: config.filterByLanguage,
    includeDomainsMode: config.includeDomainsMode,
    startDate: config.startDate?.trim().length ? config.startDate.trim() : undefined,
    endDate: config.endDate?.trim().length ? config.endDate.trim() : undefined,
    exactMatch: config.exactMatch,
  }
}

/**
 * Map one Tavily result to a normalized source. `content` is the excerpt and
 * maps to `snippet`; blank optional fields are omitted rather than emitted
 * as empty. Entries without a `url` are dropped — a source always has a URL.
 */
export function mapTavilyResult(item: TavilyResultItem): WebSearchSource | undefined {
  if (item.url === undefined || item.url.length === 0) return undefined
  return {
    url: item.url,
    ...item.title != null && item.title.length > 0 ? { title: item.title } : {},
    ...item.content != null && item.content.trim().length > 0 ? { snippet: item.content } : {},
    ...item.published_date != null && item.published_date.length > 0 ? { publishedAt: item.published_date } : {},
  }
}

/**
 * Map a search response envelope to a normalized result: the generated
 * `answer` (requested by default, S17 D4) becomes `content` — blank stays
 * omitted; no provider-side truncation (the web service owns that).
 */
export function mapTavilyResponse(response: TavilySearchResponse): WebSearchResult {
  const sources = (response.results ?? [])
    .map(mapTavilyResult)
    .filter((source): source is WebSearchSource => source !== undefined)
  return {
    ...response.answer != null && response.answer.trim().length > 0 ? { content: response.answer } : {},
    sources,
    truncated: false,
  }
}

/**
 * Map an /extract response to a fetch result: the entry's raw_content
 * (markdown by request) becomes the text body; a failed_results entry is a
 * member error so the chain degrades instead of faking a success.
 */
export function mapTavilyExtractResponse(requestUrl: string, response: TavilyExtractResponse): WebFetchResult {
  const failed = response.failed_results?.find((entry) => entry.url === requestUrl) ?? response.failed_results?.[0]
  if (failed !== undefined) {
    throw new DshwsError(codes.httpError, `Tavily extract failed for ${failed.url ?? requestUrl}${failed.error !== undefined ? `: ${failed.error}` : ''}`)
  }
  const entry = response.results?.find((item) => item.url === requestUrl) ?? response.results?.[0]
  if (entry?.raw_content === undefined || entry.raw_content.length === 0) {
    throw new DshwsError(codes.badResponse, 'Tavily extract returned no content though the URL was not in failed_results')
  }
  return {
    url: entry.url ?? requestUrl,
    statusCode: 200,
    body: { kind: 'text', content: entry.raw_content },
    truncated: false,
  }
}

/**
 * The Tavily-backed chain member on both capability faces: search (`/search`)
 * and fetch (`/extract`, S21 — markdown by request, single URL per the seam's
 * one-URL contract). Redirects fail as a request failure.
 */
export class TavilySearchProvider implements WebSearchProvider, WebFetchProvider {
  readonly id = TAVILY_MEMBER_ID

  constructor(private readonly options: TavilyMemberOptions) {}

  /** Cheap local config check (no network, no key dimension — the gate owns that). */
  available(): boolean {
    return URL.canParse(this.options.baseURL)
      && (this.options.maxResults === undefined || isPositiveInteger(this.options.maxResults))
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    throwIfMemberAborted(codes, 'Tavily', signal)
    const apiKey = await this.#apiKey(signal)
    throwIfMemberAborted(codes, 'Tavily', signal)
    const maxResults = request.maxResults ?? this.options.maxResults
    let response: Response
    try {
      response = await fetch(`${this.options.baseURL}/search`, {
        method: 'POST',
        redirect: 'error',
        headers: {
          'authorization': `Bearer ${apiKey}`,
          'content-type': 'application/json',
          'accept': 'application/json',
          'user-agent': USER_AGENT,
        },
        body: JSON.stringify({
          query: request.query,
          ...maxResults !== undefined ? { max_results: maxResults } : {},
          ...this.options.topic !== undefined ? { topic: this.options.topic } : {},
          ...this.options.timeRange !== undefined ? { time_range: this.options.timeRange } : {},
          ...this.options.searchDepth !== undefined ? { search_depth: this.options.searchDepth } : {},
          // Always sent: the official docs state include_answer must be set
          // manually (auto_parameters never manages it); the resolved default
          // is 'basic' (S17 D4).
          include_answer: this.options.includeAnswer,
          ...this.options.language !== undefined ? { language: this.options.language } : {},
          ...this.options.includeDomains !== undefined && !this.options.domainsHaveWildcard
            ? { include_domains: [...this.options.includeDomains] }
            : {},
          ...this.options.excludeDomains !== undefined && !this.options.domainsHaveWildcard
            ? { exclude_domains: [...this.options.excludeDomains] }
            : {},
          // Guards evaluated inside this single body construction: each optional
          // parameter is suppressed when its official pairing is absent, so the
          // hot options never produce a 400 from a stale combination.
          ...this.options.chunksPerSource !== undefined && this.options.searchDepth !== 'ultra-fast'
            ? { chunks_per_source: this.options.chunksPerSource }
            : {},
          ...this.options.filterByLanguage === true && this.options.language !== undefined
            ? { filter_by_language: true }
            : {},
          ...this.options.includeDomainsMode !== undefined && this.options.includeDomains !== undefined
            ? { include_domains_mode: this.options.includeDomainsMode }
            : {},
          ...this.options.startDate !== undefined ? { start_date: this.options.startDate } : {},
          ...this.options.endDate !== undefined ? { end_date: this.options.endDate } : {},
          ...this.options.exactMatch === true ? { exact_match: true } : {},
        }),
        ...(signal !== undefined ? { signal } : {}),
      })
    } catch (error: unknown) {
      throw memberFetchFailure(codes, 'Tavily', error, signal)
    }

    if (!response.ok) {
      const status = response.status
      let message = `Tavily API error (HTTP ${status})`
      try {
        const parsed = await response.json() as Parameters<typeof unfoldHttpErrorDetail>[0]
        const detail = unfoldHttpErrorDetail(parsed)
        if (detail !== undefined && detail.length > 0) message += `: ${detail}`
      } catch (error: unknown) {
        // An abort firing mid-body must surface as aborted, not be swallowed
        // into a generic HTTP-error message; otherwise the status is already
        // in `message` and a non-JSON error body only ever cost the richer text.
        if (signal?.aborted === true || isAbortError(error)) throw memberAborted(codes, 'Tavily', signal, error)
      }
      throw new DshwsError(codes.httpError, message, { httpStatus: status })
    }

    try {
      const payload = await response.json() as TavilySearchResponse
      return mapTavilyResponse(payload)
    } catch (error: unknown) {
      if (signal?.aborted === true || isAbortError(error)) throw memberAborted(codes, 'Tavily', signal, error)
      throw memberBadResponse(codes, 'Tavily', error)
    }
  }

  /**
   * The extract face (S21): one URL in, markdown out. Billing is per success
   * (1 credit / 5 URLs basic); the chain's per-member budget governs — no
   * extra timeout field is sent (the API default 10s sits well inside it).
   */
  async fetch(request: WebFetchRequest, signal?: AbortSignal): Promise<WebFetchResult> {
    throwIfMemberAborted(codes, 'Tavily', signal)
    const apiKey = await this.#apiKey(signal)
    throwIfMemberAborted(codes, 'Tavily', signal)
    let response: Response
    try {
      response = await fetch(`${this.options.baseURL}/extract`, {
        method: 'POST',
        redirect: 'error',
        headers: {
          'authorization': `Bearer ${apiKey}`,
          'content-type': 'application/json',
          'accept': 'application/json',
          'user-agent': USER_AGENT,
        },
        body: JSON.stringify({ urls: [request.url], format: 'markdown' }),
        ...(signal !== undefined ? { signal } : {}),
      })
    } catch (error: unknown) {
      throw memberFetchFailure(codes, 'Tavily', error, signal)
    }
    if (!response.ok) {
      const status = response.status
      let message = `Tavily API error (HTTP ${status})`
      try {
        const parsed = await response.json() as Parameters<typeof unfoldHttpErrorDetail>[0]
        const detail = unfoldHttpErrorDetail(parsed)
        if (detail !== undefined && detail.length > 0) message += `: ${detail}`
      } catch (error: unknown) {
        if (signal?.aborted === true || isAbortError(error)) throw memberAborted(codes, 'Tavily', signal, error)
      }
      throw new DshwsError(codes.httpError, message, { httpStatus: status })
    }
    try {
      const payload = await response.json() as TavilyExtractResponse
      return mapTavilyExtractResponse(request.url, payload)
    } catch (error: unknown) {
      if (error instanceof DshwsError) throw error
      if (signal?.aborted === true || isAbortError(error)) throw memberAborted(codes, 'Tavily', signal, error)
      throw memberBadResponse(codes, 'Tavily', error)
    }
  }

  /** Resolve one operation's key without retaining it; a missing key is a loud member error. */
  #apiKey(signal?: AbortSignal): Promise<string> {
    return resolveMemberApiKey({
      codes,
      label: 'Tavily',
      apiKeyRef: this.options.apiKeyRef,
      resolveApiKey: this.options.resolveApiKey,
      signal,
    })
  }
}
