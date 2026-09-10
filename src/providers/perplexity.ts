/**
 * `dshws-perplexity` chain member: Perplexity search over the Agent API
 * (`POST /v1/agent`, responses shape — the Sonar `/chat/completions` line this
 * member used previously is deprecated and stops working on 2026-09-27). Wire
 * contract per the official docs (2026-09-10, docs.perplexity.ai/api-reference/
 * agent-post + migrate-from-sonar): the query rides as the top-level `input`
 * string, `max_tokens` became `max_output_tokens`, and web search became an
 * OPT-IN `web_search` tool — this member always includes it (dropping it would
 * answer from parametric memory). The S17 parameter surface maps in place:
 * `search_recency_filter` moves into the tool's `filters`, `search_context_size`
 * and the unified geo entry's `user_location` sit on the tool top level,
 * `language_preference` stays top-level. Bare model names gain the required
 * `perplexity/` prefix at the wire (stored configs keep `sonar`/`sonar-pro`
 * unchanged — the zero-config-change migration promise).
 *
 * The response is a full trace: the `output[]` items of `type:'message'` carry
 * the answer text and `type:'search_results'` the structured sources
 * (url/title/snippet/date — richer than the old flat `citations[]`, which stays
 * as a tolerant last-resort fallback alongside `url_citation` annotations).
 * `finish_reason`/truncation fields do not exist on this API; the only
 * truncation signal is `status:'incomplete'`, which is NOT mapped onto
 * `truncated` — that field is the seam's own "sources were dropped" signal
 * (S17 stage-2 B3 ruling) and token truncation stays observable through the
 * raw response.
 *
 * The key resolves fresh per operation through the injected thunk — the
 * provider never holds it.
 *
 * @module dsh-websearch/providers/perplexity
 */
import type { PerplexityMemberConfig } from '../config.ts'
import type { UnifiedSearchGeo } from '../config.ts'
import { MEMBER_ERROR_CODES } from '../errors.ts'
import type { WebSearchProvider, WebSearchRequest, WebSearchResult, WebSearchSource } from '@deepseek-ai/dsh-web'
import {
  isAbortError,
  memberAborted,
  memberBadResponse,
  memberFetchFailure,
  resolveMemberApiKey,
  throwIfMemberAborted,
  unfoldHttpErrorDetail,
} from './shared.ts'
import { DshwsError } from '../errors.ts'

/** Stable id this member registers under (chain + direct pin, `dshws-` prefixed). */
export const PERPLEXITY_MEMBER_ID = 'dshws-perplexity'

/** Default Perplexity endpoint; `/v1/agent` is the operation (S18 Agent API migration). */
export const PERPLEXITY_DEFAULT_BASE_URL = 'https://api.perplexity.ai'

/** Default search model. */
export const PERPLEXITY_DEFAULT_MODEL = 'sonar'

/** Upper bound on generated answer tokens; request-shape constant, not a deployment tunable. */
export const PERPLEXITY_DEFAULT_MAX_TOKENS = 1024
const codes = MEMBER_ERROR_CODES.perplexity

/** Attribution header sent on every request; bump with the package version. */
const USER_AGENT = 'dsh-websearch/0.3.1'

/** Wire type of one structured search result (Agent API `search_results` item entry; tolerant). */
export interface PerplexitySearchResult {
  /** Citation index the answer text's `[n]` markers refer to. */
  readonly id?: number
  readonly url?: string
  readonly title?: string
  readonly snippet?: string
  readonly date?: string
  /** Alternative timestamp field (Agent API); used when `date` is absent. */
  readonly last_updated?: string
  /** Result origin (`web`); read past. */
  readonly source?: string
}

/** Wire type of one `url_citation` annotation on a message content part (tolerant). */
interface PerplexityUrlCitation {
  readonly type?: string
  readonly url?: string
  readonly title?: string
}

/**
 * Wire type of one Agent API output trace item. The trace carries more item
 * kinds (search calls, sandbox runs, …) — only `message` and `search_results`
 * carry data this member maps; everything else is read past tolerantly.
 */
export interface PerplexityOutputItem {
  readonly type?: string
  /** `search_results` items: the queries that produced the list; read past. */
  readonly queries?: readonly string[]
  /** `message` items: a plain string or content parts carrying `text` and citations. */
  readonly content?: string | readonly { readonly type?: string, readonly text?: string, readonly annotations?: readonly PerplexityUrlCitation[] }[]
  /** `search_results` items: the structured source list. */
  readonly results?: readonly PerplexitySearchResult[]
}

export interface PerplexityResponse {
  readonly output?: readonly PerplexityOutputItem[]
  /** Legacy flat URL list — tolerant last-resort fallback when the trace carries no sources. */
  readonly citations?: readonly string[]
}

/** Fully-resolved runtime options for the member; defaults applied by {@link resolvePerplexityMemberOptions}. */
export interface PerplexityMemberOptions {
  /** Credential-ref env name, for missing-credential diagnostics. */
  readonly apiKeyRef: string
  /** Resolve the current API key per operation (credentials service-backed). */
  readonly resolveApiKey: () => Promise<string | undefined>
  /** Endpoint base; `/v1/agent` is appended (S18). */
  readonly baseURL: string
  /** Search model name. */
  readonly model: string
  /** Response token cap; resolved default 1024 (S17 P1). */
  readonly maxTokens: number
  /** Publication-recency filter; absent = not sent (S17 P1). */
  readonly searchRecencyFilter?: 'hour' | 'day' | 'week' | 'month' | 'year'
  /** Search context tier; absent = not sent (S17 P1). */
  readonly searchContextSize?: 'low' | 'medium' | 'high'
  /** Unified search region (ISO 3166-1 alpha-2) for `user_location.country`; absent = not sent (S17 P1, ADR-0015). */
  readonly userLocationCountry?: string
  /** Unified search language (ISO 639-1) for `language_preference`; absent = not sent (S17 P1, ADR-0015). */
  readonly languagePreference?: string
}

/**
 * Explicit defaulting at the owning boundary (explicit > implicit): omitted
 * config fields become the provider constants here, not via schema injection.
 */
export function resolvePerplexityMemberOptions(
  config: PerplexityMemberConfig,
  resolveApiKey: () => Promise<string | undefined>,
  geo?: UnifiedSearchGeo,
): PerplexityMemberOptions {
  return {
    apiKeyRef: config.apiKeyEnv,
    resolveApiKey,
    baseURL: config.baseURL ?? PERPLEXITY_DEFAULT_BASE_URL,
    model: config.model ?? PERPLEXITY_DEFAULT_MODEL,
    maxTokens: config.maxTokens ?? PERPLEXITY_DEFAULT_MAX_TOKENS,
    searchRecencyFilter: config.searchRecencyFilter,
    searchContextSize: config.searchContextSize,
    userLocationCountry: geo?.country,
    languagePreference: geo?.language,
  }
}

/**
 * Map one structured Perplexity search result to a normalized source; blank
 * fields are omitted rather than set empty, `last_updated` backs up `date`.
 * Entries without a `url` are dropped — a source always has a URL.
 */
export function mapPerplexityResult(result: PerplexitySearchResult): WebSearchSource | undefined {
  if (result.url === undefined || result.url.length === 0) return undefined
  const publishedAt = result.date ?? result.last_updated
  return {
    url: result.url,
    ...result.title != null && result.title.length > 0 ? { title: result.title } : {},
    ...result.snippet != null && result.snippet.trim().length > 0 ? { snippet: result.snippet } : {},
    ...publishedAt != null && publishedAt.length > 0 ? { publishedAt } : {},
  }
}

/** Extract the answer text from a `message` item's content (parts join, plain string tolerated). */
function messageText(content: PerplexityOutputItem['content']): string | undefined {
  if (typeof content === 'string') return content.length > 0 ? content : undefined
  if (content === undefined) return undefined
  const text = content.map((part) => (typeof part?.text === 'string' ? part.text : '')).join('')
  return text.length > 0 ? text : undefined
}

/**
 * Map an Agent API response to a normalized search result: the trace's
 * `message` item becomes `content` (omitted when empty); sources prefer the
 * `search_results` item, fall back to the message's `url_citation`
 * annotations, and only then to the legacy flat `citations` URL list.
 */
export function mapPerplexityResponse(response: PerplexityResponse): WebSearchResult {
  const output = response.output ?? []
  const message = output.find((item) => item.type === 'message')
  const content = messageText(message?.content)
  const searchResults = output.find((item) => item.type === 'search_results')?.results
  const sources = searchResults !== undefined
    ? searchResults.map(mapPerplexityResult).filter((source): source is WebSearchSource => source !== undefined)
    : messageAnnotations(message) ?? (response.citations ?? []).map(url => ({ url }))
  return {
    ...content !== undefined ? { content } : {},
    sources,
    truncated: false,
  }
}

/** Citation fallback: the message content parts' `url_citation` annotations (undefined when none carry a URL). */
function messageAnnotations(message: PerplexityOutputItem | undefined): WebSearchSource[] | undefined {
  if (message === undefined || !Array.isArray(message.content)) return undefined
  const citations = message.content.flatMap((part) => part.annotations ?? [])
    .filter((annotation) => annotation.type === 'url_citation' && annotation.url !== undefined && annotation.url.length > 0)
  if (citations.length === 0) return undefined
  return citations.map((annotation) => ({
    url: annotation.url!,
    ...annotation.title != null && annotation.title.length > 0 ? { title: annotation.title } : {},
  }))
}

/** The Perplexity-backed chain member; redirects fail as a request failure. */
export class PerplexitySearchProvider implements WebSearchProvider {
  readonly id = PERPLEXITY_MEMBER_ID

  constructor(private readonly options: PerplexityMemberOptions) {}

  /** Cheap local config check (no network, no key dimension — the gate owns that). */
  available(): boolean {
    return URL.canParse(this.options.baseURL)
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    throwIfMemberAborted(codes, 'Perplexity', signal)
    const apiKey = await this.#apiKey(signal)
    throwIfMemberAborted(codes, 'Perplexity', signal)
    let response: Response
    // The single construction point for the always-on web_search tool (S18):
    // recency nests inside `filters`, context size and the unified geo
    // entry's user_location sit on the tool top level — dropping the tool
    // entirely would answer from parametric memory (Agent API opt-in).
    const webSearchFilters: Record<string, string> = {}
    if (this.options.searchRecencyFilter !== undefined) webSearchFilters.search_recency_filter = this.options.searchRecencyFilter
    const webSearchTool = {
      type: 'web_search' as const,
      ...Object.keys(webSearchFilters).length > 0 ? { filters: webSearchFilters } : {},
      ...this.options.searchContextSize !== undefined ? { search_context_size: this.options.searchContextSize } : {},
      ...this.options.userLocationCountry !== undefined ? { user_location: { country: this.options.userLocationCountry } } : {},
    }
    // Bare Sonar-era model names gain the required provider prefix; explicit
    // provider-prefixed names pass through untouched (zero-config migration).
    const model = this.options.model.includes('/') ? this.options.model : `perplexity/${this.options.model}`
    try {
      response = await fetch(`${this.options.baseURL}/v1/agent`, {
        method: 'POST',
        redirect: 'error',
        headers: {
          'authorization': `Bearer ${apiKey}`,
          'content-type': 'application/json',
          'accept': 'application/json',
          'user-agent': USER_AGENT,
        },
        body: JSON.stringify({
          model,
          input: request.query,
          max_output_tokens: this.options.maxTokens,
          tools: [webSearchTool],
          ...this.options.languagePreference !== undefined ? { language_preference: this.options.languagePreference } : {},
        }),
        ...(signal !== undefined ? { signal } : {}),
      })
    } catch (error: unknown) {
      throw memberFetchFailure(codes, 'Perplexity', error, signal)
    }

    if (!response.ok) {
      const status = response.status
      let message = `Perplexity API error (HTTP ${status})`
      try {
        const parsed = await response.json() as Parameters<typeof unfoldHttpErrorDetail>[0]
        const detail = unfoldHttpErrorDetail(parsed)
        if (detail !== undefined && detail.length > 0) message = detail
      } catch (error: unknown) {
        // An abort firing mid-body must surface as aborted, not be swallowed
        // into a generic HTTP-error message; otherwise the status is already
        // in `message` and a non-JSON error body only ever cost the richer text.
        if (signal?.aborted === true || isAbortError(error)) throw memberAborted(codes, 'Perplexity', signal, error)
      }
      throw new DshwsError(codes.httpError, message, { httpStatus: status })
    }

    try {
      const payload = await response.json() as PerplexityResponse
      return mapPerplexityResponse(payload)
    } catch (error: unknown) {
      if (signal?.aborted === true || isAbortError(error)) throw memberAborted(codes, 'Perplexity', signal, error)
      throw memberBadResponse(codes, 'Perplexity', error)
    }
  }

  /** Resolve one operation's key without retaining it; a missing key is a loud member error. */
  #apiKey(signal?: AbortSignal): Promise<string> {
    return resolveMemberApiKey({
      codes,
      label: 'Perplexity',
      apiKeyRef: this.options.apiKeyRef,
      resolveApiKey: this.options.resolveApiKey,
      signal,
    })
  }
}
