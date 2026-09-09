/**
 * `dshws-tavily` chain member: Tavily search API (`POST /search`, bearer
 * auth). Wire contract per the official API reference (2026-09-02,
 * docs.tavily.com/documentation/api-reference/endpoint/search): request takes
 * `query` + optional `max_results` (API-side default 10); response carries
 * `results[]` with `url`/`title`/`content`/`score`/`published_date`, where
 * `content` is a short excerpt mapped to the seam's `snippet`. No generated
 * answer is requested (`include_answer` stays off), so `content` stays
 * omitted on the normalized result.
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
import { DshwsError, MEMBER_ERROR_CODES } from '../errors.ts'
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

/** Stable id this member registers under (chain + direct pin, `dshws-` prefixed). */
export const TAVILY_MEMBER_ID = 'dshws-tavily'

/** Default Tavily API base; `/search` is the operation. */
export const TAVILY_DEFAULT_BASE_URL = 'https://api.tavily.com'

const codes = MEMBER_ERROR_CODES.tavily

/** Attribution header sent on every request; bump with the package version. */
const USER_AGENT = 'dsh-websearch/0.2.2'

/** Wire type of one Tavily `results[]` entry (optional fields read tolerantly). */
export interface TavilyResultItem {
  readonly url?: string
  readonly title?: string
  readonly content?: string
  readonly score?: number
  readonly published_date?: string
}

export interface TavilySearchResponse {
  readonly results?: readonly TavilyResultItem[]
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
}

/**
 * Explicit defaulting at the owning boundary (explicit > implicit): the base
 * URL default lands here, config passthrough stays untouched.
 */
export function resolveTavilyMemberOptions(
  config: TavilyMemberConfig,
  resolveApiKey: () => Promise<string | undefined>,
): TavilyMemberOptions {
  return {
    apiKeyRef: config.apiKeyEnv,
    resolveApiKey,
    baseURL: config.baseURL ?? TAVILY_DEFAULT_BASE_URL,
    maxResults: config.maxResults,
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
 * Map a search response envelope to a normalized result: no generated
 * answer, no provider-side truncation (the web service owns that).
 */
export function mapTavilyResponse(response: TavilySearchResponse): WebSearchResult {
  const sources = (response.results ?? [])
    .map(mapTavilyResult)
    .filter((source): source is WebSearchSource => source !== undefined)
  return { sources, truncated: false }
}

/** The Tavily-backed chain member; redirects fail as a request failure. */
export class TavilySearchProvider implements WebSearchProvider {
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
