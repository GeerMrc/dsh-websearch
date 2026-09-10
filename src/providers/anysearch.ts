/**
 * `dshws-anysearch` chain member: the Anysearch search API (`POST /v1/search`,
 * bearer auth, response envelope). Wire contract per the official
 * `@anysearch/anysearch-dsh` client (2026-09-03, ADR-0009): requests take
 * `query` + optional `max_results`/`zone`; **responses are enveloped** —
 * `{code, message, data, request_id?}` with `code !== 0` meaning a business
 * error even over HTTP 200, surfaced as this member's http error with the
 * envelope message and request id for diagnostics.
 *
 * Mapping policy (ADR-0009 Decision 2): `data.results[].{url, title}`
 * plus a snippet taken from `snippet`, falling back to `content` — the
 * official provider mapping drops `content` entirely, which this member
 * deliberately does not. The key resolves fresh per operation through the
 * injected thunk — the provider never holds it.
 *
 * @module dsh-websearch/providers/anysearch
 */
import type { AnysearchMemberConfig } from '../config.ts'
import { DshwsError, MEMBER_ERROR_CODES } from '../errors.ts'
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

/** Stable id this member registers under (chain + direct pin, `dshws-` prefixed). */
export const ANYSEARCH_MEMBER_ID = 'dshws-anysearch'

/** Default Anysearch API base; `/v1/search` is the operation. */
export const ANYSEARCH_DEFAULT_BASE_URL = 'https://api.anysearch.com'

const codes = MEMBER_ERROR_CODES.anysearch

/** Attribution header sent on every request; bump with the package version. */
const USER_AGENT = 'dsh-websearch/0.4.0'

/** Wire type of one Anysearch `data.results[]` entry (optional fields read tolerantly). */
export interface AnysearchResultItem {
  readonly url?: string
  readonly title?: string
  readonly snippet?: string
  readonly content?: string
}

/** Wire type of the envelope's `data` payload for a search. */
export interface AnysearchSearchData {
  readonly results?: readonly AnysearchResultItem[]
}

/** The response envelope: `code !== 0` is a business error over any HTTP status. */
export interface AnysearchEnvelope {
  readonly code: number
  readonly message?: string
  readonly data?: AnysearchSearchData
  readonly request_id?: string
}

/** Fully-resolved runtime options for the member; defaults applied by {@link resolveAnysearchMemberOptions}. */
export interface AnysearchMemberOptions {
  /** Credential-ref env name, for missing-credential diagnostics. */
  readonly apiKeyRef: string
  /** Resolve the current API key per operation (credentials service-backed). */
  readonly resolveApiKey: () => Promise<string | undefined>
  /** Endpoint base; `/v1/search` is appended. */
  readonly baseURL: string
  /** Regional zone; sent in the request body only when configured. */
  readonly zone?: 'cn' | 'intl'
}

/**
 * Explicit defaulting at the owning boundary (explicit > implicit): the base
 * URL default lands here, config passthrough stays untouched.
 */
export function resolveAnysearchMemberOptions(
  config: AnysearchMemberConfig,
  resolveApiKey: () => Promise<string | undefined>,
): AnysearchMemberOptions {
  return {
    apiKeyRef: config.apiKeyEnv,
    resolveApiKey,
    baseURL: config.baseURL ?? ANYSEARCH_DEFAULT_BASE_URL,
    zone: config.zone,
  }
}

/**
 * Map one Anysearch result to a normalized source. The portable snippet is
 * `snippet`, falling back to `content` (the official mapping drops content —
 * ADR-0009 Decision 2 keeps it); blank optional fields are omitted rather
 * than emitted as empty. Entries without a `url` are dropped — a source
 * always has a URL.
 */
export function mapAnysearchResult(item: AnysearchResultItem): WebSearchSource | undefined {
  if (item.url === undefined || item.url.length === 0) return undefined
  const snippet = [item.snippet, item.content].find((candidate) => candidate !== undefined && candidate.trim().length > 0)
  return {
    url: item.url,
    ...item.title != null && item.title.length > 0 ? { title: item.title } : {},
    ...snippet !== undefined ? { snippet } : {},
  }
}

/** Map an envelope data payload to a normalized result (no provider-side truncation). */
export function mapAnysearchResponse(data: AnysearchSearchData): WebSearchResult {
  const sources = (data.results ?? [])
    .map(mapAnysearchResult)
    .filter((source): source is WebSearchSource => source !== undefined)
  return { sources, truncated: false }
}

/** The Anysearch-backed chain member; redirects fail as a request failure. */
export class AnysearchSearchProvider implements WebSearchProvider {
  readonly id = ANYSEARCH_MEMBER_ID

  constructor(private readonly options: AnysearchMemberOptions) {}

  /** Cheap local config check (no network, no key dimension — the gate owns that). */
  available(): boolean {
    return URL.canParse(this.options.baseURL)
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    throwIfMemberAborted(codes, 'Anysearch', signal)
    const apiKey = await this.#apiKey(signal)
    throwIfMemberAborted(codes, 'Anysearch', signal)
    const maxResults = request.maxResults
    let response: Response
    try {
      response = await fetch(`${this.options.baseURL}/v1/search`, {
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
          ...this.options.zone !== undefined ? { zone: this.options.zone } : {},
        }),
        ...(signal !== undefined ? { signal } : {}),
      })
    } catch (error: unknown) {
      throw memberFetchFailure(codes, 'Anysearch', error, signal)
    }

    if (!response.ok) {
      const status = response.status
      let message = `Anysearch API error (HTTP ${status})`
      try {
        const parsed = await response.json() as Parameters<typeof unfoldHttpErrorDetail>[0]
        const detail = unfoldHttpErrorDetail(parsed)
        if (detail !== undefined && detail.length > 0) message += `: ${detail}`
      } catch (error: unknown) {
        // An abort firing mid-body must surface as aborted, not be swallowed
        // into a generic HTTP-error message.
        if (signal?.aborted === true || isAbortError(error)) throw memberAborted(codes, 'Anysearch', signal, error)
      }
      throw new DshwsError(codes.httpError, message, { httpStatus: status })
    }

    let envelope: AnysearchEnvelope
    try {
      envelope = await response.json() as AnysearchEnvelope
    } catch (error: unknown) {
      if (signal?.aborted === true || isAbortError(error)) throw memberAborted(codes, 'Anysearch', signal, error)
      throw memberBadResponse(codes, 'Anysearch', error)
    }
    // Business error over HTTP 200: the envelope's code and request id are
    // the diagnostics anysearch documents (ADR-0009).
    if (envelope.code !== 0) {
      const requestId = envelope.request_id !== undefined ? ` (request_id: ${envelope.request_id})` : ''
      throw new DshwsError(
        codes.httpError,
        `Anysearch API error (code ${envelope.code})${envelope.message !== undefined ? `: ${envelope.message}` : ''}${requestId}`,
      )
    }
    return mapAnysearchResponse(envelope.data ?? {})
  }

  /** Resolve one operation's key without retaining it; a missing key is a loud member error. */
  #apiKey(signal?: AbortSignal): Promise<string> {
    return resolveMemberApiKey({
      codes,
      label: 'Anysearch',
      apiKeyRef: this.options.apiKeyRef,
      resolveApiKey: this.options.resolveApiKey,
      signal,
    })
  }
}
