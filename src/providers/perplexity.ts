/**
 * `dshws-perplexity` chain member: Perplexity search over its
 * OpenAI-compatible chat-completions endpoint. Wire contract mirrors the
 * upstream implementation (deepseek-harness
 * `packages/web/web-search-perplexity`, dev@3281e04b59 — re-implemented here
 * because the upstream `perplexity` id collides with the host's
 * already-registered provider and breaks the `dshws-` prefix discipline,
 * ADR-0003). The generated answer becomes `content` (this is the one bundled
 * member that has one); sources prefer structured `search_results[]` and fall
 * back to URL-only `citations[]` only when `search_results` is absent.
 *
 * The key resolves fresh per operation through the injected thunk — the
 * provider never holds it.
 *
 * @module dsh-websearch/providers/perplexity
 */
import type { PerplexityMemberConfig } from '../config.ts'
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

/** Default Perplexity endpoint; `/chat/completions` is the operation. */
export const PERPLEXITY_DEFAULT_BASE_URL = 'https://api.perplexity.ai'

/** Default search model. */
export const PERPLEXITY_DEFAULT_MODEL = 'sonar'

/** Upper bound on generated answer tokens; request-shape constant, not a deployment tunable. */
export const PERPLEXITY_DEFAULT_MAX_TOKENS = 1024

const codes = MEMBER_ERROR_CODES.perplexity

/** Attribution header sent on every request; bump with the package version. */
const USER_AGENT = 'dsh-websearch/0.1.0'

/** Wire type of one structured `search_results[]` entry (optional fields read tolerantly). */
export interface PerplexitySearchResult {
  readonly url?: string
  readonly title?: string
  readonly snippet?: string
  readonly date?: string
}

export interface PerplexityResponse {
  readonly choices?: readonly {
    readonly message?: {
      readonly content?: string
    }
  }[]
  readonly search_results?: readonly PerplexitySearchResult[]
  readonly citations?: readonly string[]
}

/** Fully-resolved runtime options for the member; defaults applied by {@link resolvePerplexityMemberOptions}. */
export interface PerplexityMemberOptions {
  /** Credential-ref env name, for missing-credential diagnostics. */
  readonly apiKeyRef: string
  /** Resolve the current API key per operation (credentials service-backed). */
  readonly resolveApiKey: () => Promise<string | undefined>
  /** Endpoint base; `/chat/completions` is appended. */
  readonly baseURL: string
  /** Search model name. */
  readonly model: string
}

/**
 * Explicit defaulting at the owning boundary (explicit > implicit): omitted
 * config fields become the provider constants here, not via schema injection.
 */
export function resolvePerplexityMemberOptions(
  config: PerplexityMemberConfig,
  resolveApiKey: () => Promise<string | undefined>,
): PerplexityMemberOptions {
  return {
    apiKeyRef: config.apiKeyEnv,
    resolveApiKey,
    baseURL: config.baseURL ?? PERPLEXITY_DEFAULT_BASE_URL,
    model: config.model ?? PERPLEXITY_DEFAULT_MODEL,
  }
}

/**
 * Map one structured Perplexity search result to a normalized source; blank
 * fields are omitted rather than set empty. Entries without a `url` are
 * dropped — a source always has a URL.
 */
export function mapPerplexityResult(result: PerplexitySearchResult): WebSearchSource | undefined {
  if (result.url === undefined || result.url.length === 0) return undefined
  return {
    url: result.url,
    ...result.title != null && result.title.length > 0 ? { title: result.title } : {},
    ...result.snippet != null && result.snippet.length > 0 ? { snippet: result.snippet } : {},
    ...result.date != null && result.date.length > 0 ? { publishedAt: result.date } : {},
  }
}

/**
 * Map a Perplexity response envelope to a normalized search result: the
 * generated answer becomes `content` (omitted when empty); sources prefer
 * structured `search_results[]` and fall back to URL-only `citations[]` only
 * when `search_results` is absent.
 */
export function mapPerplexityResponse(response: PerplexityResponse): WebSearchResult {
  const content = response.choices?.[0]?.message?.content
  const sources = response.search_results !== undefined
    ? (response.search_results ?? [])
        .map(mapPerplexityResult)
        .filter((source): source is WebSearchSource => source !== undefined)
    : (response.citations ?? []).map(url => ({ url }))
  return {
    ...content != null && content.length > 0 ? { content } : {},
    sources,
    truncated: false,
  }
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
    try {
      response = await fetch(`${this.options.baseURL}/chat/completions`, {
        method: 'POST',
        redirect: 'error',
        headers: {
          'authorization': `Bearer ${apiKey}`,
          'content-type': 'application/json',
          'accept': 'application/json',
          'user-agent': USER_AGENT,
        },
        body: JSON.stringify({
          model: this.options.model,
          max_tokens: PERPLEXITY_DEFAULT_MAX_TOKENS,
          messages: [{ role: 'user', content: request.query }],
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
      throw new DshwsError(codes.httpError, message)
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
