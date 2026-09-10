/**
 * `dshws-exa` chain member: Exa search API (`POST /search` with highlight and
 * text contents). Wire contract mirrors the upstream implementation
 * (deepseek-harness `packages/web/web-search-exa`, dev@3281e04b59 — re-implemented
 * here because the upstream `exa` id collides with the host's already-registered
 * provider and breaks the `dshws-` prefix discipline, ADR-0003) updated to the
 * current official API (2026-09-10, exa.ai/docs/reference/search): `type` is
 * the current 6-value enum (`keyword`/`neural` were removed upstream), and
 * `contents.text` is requested alongside the highlights by default (S17 D4) —
 * a result whose highlights are absent keeps its full-text excerpt as the
 * snippet instead of being dropped; entries with neither portable excerpt are
 * still dropped (the seam has no other field to derive one from, and inventing
 * one would lie). `startPublishedDate` (date-only input normalized to the
 * date-time form) is passed through when set. Exa returns no generated
 * answer, so `content` stays omitted.
 *
 * The key resolves fresh per operation through the injected thunk — the
 * provider never holds it.
 *
 * @module dsh-websearch/providers/exa
 */
import type { ExaMemberConfig } from '../config.ts'
import type { UnifiedSearchFanout } from '../config.ts'
import { MEMBER_ERROR_CODES } from '../errors.ts'
import type { WebSearchProvider, WebSearchRequest, WebSearchResult, WebSearchSource } from '@deepseek-ai/dsh-web'
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
import { DshwsError } from '../errors.ts'

/** Stable id this member registers under (chain + direct pin, `dshws-` prefixed). */
export const EXA_MEMBER_ID = 'dshws-exa'

/** Default Exa search endpoint; `/search` is the operation. */
export const EXA_DEFAULT_BASE_URL = 'https://api.exa.ai'

/** Default retrieval type: let Exa pick between keyword and neural search. */
export const EXA_DEFAULT_SEARCH_TYPE = 'auto'

/** Highlight snippet budget per result in characters (the current official form; the old `highlightsPerUrl` count is deprecated and ignored upstream). */
export const EXA_HIGHLIGHT_MAX_CHARACTERS = 400

/** Text-fallback excerpt budget per result in characters (S17 P1; official range 1-10000). */
export const EXA_TEXT_FALLBACK_MAX_CHARACTERS = 1000

/** Exa search type (S17 P1): the current official 6-value enum — `keyword`/`neural` were removed upstream. */
export type ExaSearchType = 'instant' | 'fast' | 'auto' | 'deep-lite' | 'deep' | 'deep-reasoning'

const codes = MEMBER_ERROR_CODES.exa

/** Attribution header sent on every request; bump with the package version. */
const USER_AGENT = 'dsh-websearch/0.6.0'

/**
 * Normalize a stored publication-date floor to the ISO date-time form the API
 * expects: a date-only `YYYY-MM-DD` value (the GUI date input's shape) gains
 * a midnight-UTC time; a full date-time string passes through.
 */
export function normalizeStartPublishedDate(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value
}

/** Wire type of one Exa `results[]` entry (optional fields read tolerantly). */
export interface ExaResultItem {
  readonly url?: string
  readonly title?: string
  readonly publishedDate?: string
  readonly highlights?: readonly string[]
  /** Full-text excerpt; present when `contents.text` was requested (S17 P1). */
  readonly text?: string
}

export interface ExaSearchResponse {
  readonly results?: readonly ExaResultItem[]
}

/** Fully-resolved runtime options for the member; defaults applied by {@link resolveExaMemberOptions}. */
export interface ExaMemberOptions {
  /** Credential-ref env name, for missing-credential diagnostics. */
  readonly apiKeyRef: string
  /** Resolve the current API key per operation (credentials service-backed). */
  readonly resolveApiKey: () => Promise<string | undefined>
  /** Endpoint base; `/search` is appended. */
  readonly baseURL: string
  /** Default result count when a request carries no `maxResults`. */
  readonly numResults?: number
  /** Search type; resolved default `'auto'` (S17 P1). */
  readonly type: ExaSearchType
  /** Text fallback; resolved default `true` — `contents.text` rides along (S17 P1, D4). */
  readonly textFallback: boolean
  /** Publication-date floor, normalized to date-time; absent = not sent (S17 P1). */
  readonly startPublishedDate?: string
  /** Unified search region (ISO 3166-1 alpha-2) as Exa's `userLocation`; absent = not sent (S17 P1, ADR-0015). */
  readonly userLocation?: string
  /** Unified include-domain allowlist (≤1200, hostname/path-prefix/wildcard); empty = not sent (S20 P1, ADR-0018). */
  readonly includeDomains?: readonly string[]
  /** Unified exclude-domain blocklist; empty = not sent (S20 P1, ADR-0018). */
  readonly excludeDomains?: readonly string[]
  /** Vertical category; absent = not sent (S20 P2). */
  readonly category?: 'company' | 'publication' | 'news' | 'personal site' | 'financial report' | 'people'
  /** Content cache freshness; absent = not sent (S20 P2). */
  readonly maxAgeHours?: number
}

/**
 * Explicit defaulting at the owning boundary (explicit > implicit): the base
 * URL default lands here, config passthrough stays untouched.
 */
export function resolveExaMemberOptions(
  config: ExaMemberConfig,
  resolveApiKey: () => Promise<string | undefined>,
  fanout?: UnifiedSearchFanout,
): ExaMemberOptions {
  return {
    apiKeyRef: config.apiKeyEnv,
    resolveApiKey,
    baseURL: config.baseURL ?? EXA_DEFAULT_BASE_URL,
    numResults: config.numResults,
    type: config.type ?? EXA_DEFAULT_SEARCH_TYPE,
    textFallback: config.textFallback ?? true,
    startPublishedDate: config.startPublishedDate !== undefined
      ? normalizeStartPublishedDate(config.startPublishedDate)
      : undefined,
    userLocation: fanout?.country,
    includeDomains: fanout?.includeDomains?.length ? fanout.includeDomains : undefined,
    excludeDomains: fanout?.excludeDomains?.length ? fanout.excludeDomains : undefined,
    category: config.category || undefined,
    maxAgeHours: config.maxAgeHours,
  }
}

/**
 * Map one Exa result to a normalized source, or `undefined` when it carries
 * no portable excerpt: the first non-blank highlight becomes `snippet`, with
 * the full-text `text` as the fallback (S17 P1); an entry with neither is
 * dropped.
 */
export function mapExaResult(result: ExaResultItem): WebSearchSource | undefined {
  const highlight = result.highlights?.find(h => h.trim().length > 0)
  const snippet = highlight ?? (result.text !== undefined && result.text.trim().length > 0 ? result.text : undefined)
  if (snippet === undefined || result.url === undefined || result.url.length === 0) return undefined
  return {
    url: result.url,
    ...result.title != null && result.title.length > 0 ? { title: result.title } : {},
    snippet,
    ...result.publishedDate != null && result.publishedDate.length > 0 ? { publishedAt: result.publishedDate } : {},
  }
}

/**
 * Map an Exa response envelope to a normalized search result: snippet-less
 * entries are dropped ({@link mapExaResult}), no generated answer, no
 * provider-side truncation (the web service owns that).
 */
export function mapExaResponse(response: ExaSearchResponse): WebSearchResult {
  const sources = (response.results ?? [])
    .map(mapExaResult)
    .filter((source): source is WebSearchSource => source !== undefined)
  return { sources, truncated: false }
}

/** The Exa-backed chain member; redirects fail as a request failure. */
export class ExaSearchProvider implements WebSearchProvider {
  readonly id = EXA_MEMBER_ID

  constructor(private readonly options: ExaMemberOptions) {}

  /** Cheap local config check (no network, no key dimension — the gate owns that). */
  available(): boolean {
    return URL.canParse(this.options.baseURL)
      && (this.options.numResults === undefined || isPositiveInteger(this.options.numResults))
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    throwIfMemberAborted(codes, 'Exa', signal)
    const apiKey = await this.#apiKey(signal)
    throwIfMemberAborted(codes, 'Exa', signal)
    // A per-request bound wins over the configured default; either may be absent.
    const numResults = request.maxResults ?? this.options.numResults
    let response: Response
    // Guards evaluated inside this single body construction: the
    // company/people categories officially reject the date floor and the
    // exclude-domain list (400), so those parameters are suppressed only
    // when one of those categories is set.
    const dateFloor = this.options.category === 'company' || this.options.category === 'people'
      ? undefined
      : this.options.startPublishedDate
    const excludeDomains = this.options.category === 'company' || this.options.category === 'people'
      ? undefined
      : this.options.excludeDomains
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
          type: this.options.type,
          contents: {
            ...this.options.maxAgeHours !== undefined ? { maxAgeHours: this.options.maxAgeHours } : {},
            highlights: { query: request.query, maxCharacters: EXA_HIGHLIGHT_MAX_CHARACTERS },
            // S17 D4: text rides along by default so snippet-less results are
            // kept; turning the fallback off restores the highlight-only wire.
            ...this.options.textFallback ? { text: { maxCharacters: EXA_TEXT_FALLBACK_MAX_CHARACTERS } } : {},
          },
          ...numResults !== undefined ? { numResults } : {},
          ...this.options.category !== undefined ? { category: this.options.category } : {},
          ...dateFloor !== undefined ? { startPublishedDate: dateFloor } : {},
          ...this.options.userLocation !== undefined ? { userLocation: this.options.userLocation } : {},
          ...this.options.includeDomains !== undefined ? { includeDomains: [...this.options.includeDomains] } : {},
          ...excludeDomains !== undefined ? { excludeDomains: [...excludeDomains] } : {},
        }),
        ...(signal !== undefined ? { signal } : {}),
      })
    } catch (error: unknown) {
      throw memberFetchFailure(codes, 'Exa', error, signal)
    }

    if (!response.ok) {
      const status = response.status
      let message = `Exa API error (HTTP ${status})`
      try {
        const parsed = await response.json() as Parameters<typeof unfoldHttpErrorDetail>[0]
        const detail = unfoldHttpErrorDetail(parsed)
        if (detail !== undefined && detail.length > 0) message += `: ${detail}`
      } catch (error: unknown) {
        // An abort firing mid-body must surface as aborted, not be swallowed
        // into a generic HTTP-error message; otherwise the status is already
        // in `message` and a non-JSON error body only ever cost the richer text.
        if (signal?.aborted === true || isAbortError(error)) throw memberAborted(codes, 'Exa', signal, error)
      }
      throw new DshwsError(codes.httpError, message, { httpStatus: status })
    }

    try {
      const payload = await response.json() as ExaSearchResponse
      return mapExaResponse(payload)
    } catch (error: unknown) {
      if (signal?.aborted === true || isAbortError(error)) throw memberAborted(codes, 'Exa', signal, error)
      throw memberBadResponse(codes, 'Exa', error)
    }
  }

  /** Resolve one operation's key without retaining it; a missing key is a loud member error. */
  #apiKey(signal?: AbortSignal): Promise<string> {
    return resolveMemberApiKey({
      codes,
      label: 'Exa',
      apiKeyRef: this.options.apiKeyRef,
      resolveApiKey: this.options.resolveApiKey,
      signal,
    })
  }
}
