/**
 * `dshws-exa` chain member: Exa search API (`POST /search` with highlight
 * contents). Wire contract mirrors the upstream implementation
 * (deepseek-harness `packages/web/web-search-exa`, dev@3281e04b59 — re-implemented
 * here because the upstream `exa` id collides with the host's already-registered
 * provider and breaks the `dshws-` prefix discipline, ADR-0003). Entries carry
 * no usable snippet are dropped — the seam has no other field to derive one
 * from, and inventing one would lie. Exa returns no generated answer, so
 * `content` stays omitted.
 *
 * The key resolves fresh per operation through the injected thunk — the
 * provider never holds it.
 *
 * @module dsh-websearch/providers/exa
 */
import type { ExaMemberConfig } from '../config.ts'
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

/** Default retrieval mode: let Exa pick between keyword and neural search. */
export const EXA_DEFAULT_SEARCH_TYPE = 'auto'

/** Default number of highlight sentences requested per result. */
export const EXA_DEFAULT_HIGHLIGHTS_PER_RESULT = 1

const codes = MEMBER_ERROR_CODES.exa

/** Attribution header sent on every request; bump with the package version. */
const USER_AGENT = 'dsh-websearch/0.1.0'

/** Wire type of one Exa `results[]` entry (optional fields read tolerantly). */
export interface ExaResultItem {
  readonly url?: string
  readonly title?: string
  readonly publishedDate?: string
  readonly highlights?: readonly string[]
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
}

/**
 * Explicit defaulting at the owning boundary (explicit > implicit): the base
 * URL default lands here, config passthrough stays untouched.
 */
export function resolveExaMemberOptions(
  config: ExaMemberConfig,
  resolveApiKey: () => Promise<string | undefined>,
): ExaMemberOptions {
  return {
    apiKeyRef: config.apiKeyEnv,
    resolveApiKey,
    baseURL: config.baseURL ?? EXA_DEFAULT_BASE_URL,
    numResults: config.numResults,
  }
}

/**
 * Map one Exa result to a normalized source, or `undefined` when it carries
 * no portable snippet: the first non-blank highlight becomes `snippet`, and
 * an entry without one is dropped.
 */
export function mapExaResult(result: ExaResultItem): WebSearchSource | undefined {
  const snippet = result.highlights?.find(highlight => highlight.trim().length > 0)
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
          type: EXA_DEFAULT_SEARCH_TYPE,
          contents: { highlights: { highlightsPerUrl: EXA_DEFAULT_HIGHLIGHTS_PER_RESULT } },
          ...numResults !== undefined ? { numResults } : {},
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
        if (detail !== undefined && detail.length > 0) message = detail
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
