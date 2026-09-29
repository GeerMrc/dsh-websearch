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
import type { AnysearchMemberConfig, UnifiedSearchFanout } from '../config.ts'
import { DshwsError, MEMBER_ERROR_CODES } from '../errors.ts'
import type { WebFetchProvider, WebFetchRequest, WebFetchResult, WebSearchProvider, WebSearchRequest, WebSearchResult, WebSearchSource } from '@deepseek-ai/dsh-web'
import {
  memberFetchFailure,
  resolveMemberApiKey,
  throwIfMemberAborted,
  USER_AGENT,
  readMemberEnvelope,

} from './shared.ts'

/** Stable id this member registers under (chain + direct pin, `dshws-` prefixed). */
export const ANYSEARCH_MEMBER_ID = 'dshws-anysearch'

/** Default Anysearch API base; `/v1/search` is the operation. */
export const ANYSEARCH_DEFAULT_BASE_URL = 'https://api.anysearch.com'

const codes = MEMBER_ERROR_CODES.anysearch

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
  /** Search face: the results page; extract face: the {url, title, content} payload (S21). */
  readonly data?: AnysearchSearchData | { url?: string, title?: string, content?: string }
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
  /** Result-language preference in BCP-47 form, mapped from the unified entry; absent = not sent (S22 P3). */
  readonly language?: string
}

/**
 * Explicit defaulting at the owning boundary (explicit > implicit): the base
 * URL default lands here, config passthrough stays untouched.
 */
export function resolveAnysearchMemberOptions(
  config: AnysearchMemberConfig,
  resolveApiKey: () => Promise<string | undefined>,
  fanout?: UnifiedSearchFanout,
): AnysearchMemberOptions {
  return {
    apiKeyRef: config.apiKeyEnv,
    resolveApiKey,
    baseURL: config.baseURL ?? ANYSEARCH_DEFAULT_BASE_URL,
    zone: config.zone,
    language: fanout?.language !== undefined ? toAnysearchLanguage(fanout.language) : undefined,
  }
}

/**
 * Map the unified entry's region-less ISO 639-1 value (stored lower-case) to
 * the BCP-47 form the API expects: `zh` gains the default `CN` region, any
 * other value keeps its subtag but the region part is re-cased to upper
 * (`zh-tw` -> `zh-TW`); a bare language passes through unchanged (S22 P3).
 */
export function toAnysearchLanguage(language: string): string {
  if (language === 'zh') return 'zh-CN'
  const [primary, region] = language.split('-')
  return region !== undefined ? `${primary}-${region.toUpperCase()}` : primary
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

/**
 * Map an /v1/extract envelope data payload to a fetch result (S21, probe
 * contract docs/notes/2026-09-10-s21-anysearch-extract-probe.md): the
 * denoised markdown `content` becomes the text body; the probe-measured
 * ~50k cap (49,934 on an over-long page) maps to `truncated` through a
 * 49,900 defensive band.
 */
export function mapAnysearchExtractData(requestUrl: string, data: { url?: string, title?: string, content?: string }): WebFetchResult {
  if (data.content === undefined || data.content.length === 0) {
    throw new DshwsError(codes.badResponse, 'AnySearch extract returned no content on a code-0 envelope')
  }
  return {
    url: data.url ?? requestUrl,
    statusCode: 200,
    body: { kind: 'text', content: data.content },
    truncated: data.content.length >= 49_900,
  }
}

/** The Anysearch-backed chain member on both capability faces (search + extract, S21). */
/** S37 T4: append the envelope diagnostics the upstream documents on every error. */
function anysearchErrorDiagnostics(parsed: unknown): string {
  const envelope = parsed as { readonly request_id?: string, readonly error_code?: string }
  const requestId = envelope?.request_id !== undefined ? ` (request_id: ${envelope.request_id})` : ''
  const errorCode = envelope?.error_code !== undefined ? ` [${envelope.error_code}]` : ''
  return `${errorCode}${requestId}`
}

export class AnysearchSearchProvider implements WebSearchProvider, WebFetchProvider {
  readonly id = ANYSEARCH_MEMBER_ID

  constructor(private readonly options: AnysearchMemberOptions) {}

  /** Cheap local config check (no network, no key dimension — the gate owns that). */
  available(): boolean {
    return URL.canParse(this.options.baseURL)
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    throwIfMemberAborted(codes, 'AnySearch', signal)
    const apiKey = await this.#apiKey(signal)
    throwIfMemberAborted(codes, 'AnySearch', signal)
    // Caller-bound request sizing is clamped into the official 1-20 range here
    // rather than bounced as an upstream 400 invalid_request (same ruling as
    // the tavily face's header note, S37 T6).
    const maxResults = request.maxResults === undefined
      ? undefined
      : Math.min(20, Math.max(1, Math.round(request.maxResults)))
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
          ...this.options.language !== undefined ? { language: this.options.language } : {},
        }),
        ...(signal !== undefined ? { signal } : {}),
      })
    } catch (error: unknown) {
      throw memberFetchFailure(codes, 'Anysearch', error, signal)
    }

    const envelope = await readMemberEnvelope<AnysearchEnvelope>(response, { codes, label: 'AnySearch', signal, decorate: anysearchErrorDiagnostics })
    // Business error over HTTP 200: the envelope's code and request id are
    // the diagnostics anysearch documents (ADR-0009).
    if (envelope.code !== 0) {
      const requestId = envelope.request_id !== undefined ? ` (request_id: ${envelope.request_id})` : ''
      throw new DshwsError(
        codes.httpError,
        `Anysearch API error (code ${envelope.code})${envelope.message !== undefined ? `: ${envelope.message}` : ''}${requestId}`,
      )
    }
    return mapAnysearchResponse((envelope.data as AnysearchSearchData | undefined) ?? {})
  }

  /** Resolve one operation's key without retaining it; a missing key is a loud member error. */
  /**
   * The extract face (S21, probe-backed): `POST /v1/extract` with a single
   * `{url}` body — the probe rejected the array form. Envelope `code !== 0`
   * rides the established business-error path (chain degradation).
   */
  async fetch(request: WebFetchRequest, signal?: AbortSignal): Promise<WebFetchResult> {
    throwIfMemberAborted(codes, 'AnySearch', signal)
    const apiKey = await this.#apiKey(signal)
    throwIfMemberAborted(codes, 'AnySearch', signal)
    let response: Response
    try {
      response = await fetch(`${this.options.baseURL}/v1/extract`, {
        method: 'POST',
        redirect: 'error',
        headers: {
          'authorization': `Bearer ${apiKey}`,
          'content-type': 'application/json',
          'accept': 'application/json',
          'user-agent': USER_AGENT,
        },
        body: JSON.stringify({ url: request.url }),
        ...(signal !== undefined ? { signal } : {}),
      })
    } catch (error: unknown) {
      throw memberFetchFailure(codes, 'AnySearch', error, signal)
    }
    const envelope = await readMemberEnvelope<AnysearchEnvelope>(response, { codes, label: 'AnySearch', signal, decorate: anysearchErrorDiagnostics })
    if (envelope.code !== 0) {
      const requestId = envelope.request_id !== undefined ? ` (request_id: ${envelope.request_id})` : ''
      throw new DshwsError(
        codes.httpError,
        `Anysearch API error (code ${envelope.code})${envelope.message !== undefined ? `: ${envelope.message}` : ''}${requestId}`,
      )
    }
    return mapAnysearchExtractData(request.url, (envelope.data as { url?: string, title?: string, content?: string } | undefined) ?? {})
  }

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
