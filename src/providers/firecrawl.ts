/**
 * `dshws-firecrawl` chain member: Firecrawl v2 API — search (`POST /v2/search`)
 * and scrape (`POST /v2/scrape`) under one class and one credential, since the
 * same key powers both faces (architecture §3: search + 抓取，同 key). Wire
 * contract per the official docs (2026-09-02, docs.firecrawl.dev — no upstream
 * reference exists for this provider): search responds with
 * `{ success, data: { web: [...] } }` grouped by source type (only `web` is
 * requested); scrape responds with `{ success, data: { markdown, metadata } }`,
 * and the page's own status (`metadata.statusCode`) becomes the fetch result's
 * status code — a non-2xx page is a result, not an error (the seam's fetch
 * contract). Markdown maps to the seam body's `text` kind (the closed union
 * has no markdown arm).
 *
 * The key resolves fresh per operation through the injected thunk — the
 * provider never holds it.
 *
 * @module dsh-websearch/providers/firecrawl
 */
import type { FirecrawlMemberConfig } from '../config.ts'
import type { UnifiedSearchFanout } from '../config.ts'
import { DshwsError, MEMBER_ERROR_CODES } from '../errors.ts'
import type {
  WebFetchProvider,
  WebFetchRequest,
  WebFetchResult,
  WebSearchProvider,
  WebSearchRequest,
  WebSearchResult,
  WebSearchSource,
} from '@deepseek-ai/dsh-web'
import {
  isAbortError,
  memberAborted,
  memberBadResponse,
  memberFetchFailure,
  resolveMemberApiKey,
  throwIfMemberAborted,
  unfoldHttpErrorDetail,
} from './shared.ts'

/** Search-face timeout cap: the chain budget is 30s per member, so the server stops at 20s (S20 P2). */
export const FIRECRAWL_SEARCH_TIMEOUT_MS = 20_000

/** Stable id this member registers under (search + fetch, `dshws-` prefixed). */
export const FIRECRAWL_MEMBER_ID = 'dshws-firecrawl'

/** Default Firecrawl API base; `/v2/search` and `/v2/scrape` are the operations. */
export const FIRECRAWL_DEFAULT_BASE_URL = 'https://api.firecrawl.dev'

const codes = MEMBER_ERROR_CODES.firecrawl

/** Attribution header sent on every request; bump with the package version. */
const USER_AGENT = 'dsh-websearch/0.9.0'

/** Wire type of one Firecrawl `data.web[]` search entry (optional fields read tolerantly). */
export interface FirecrawlWebResult {
  readonly url?: string
  readonly title?: string
  readonly description?: string
  readonly position?: number
}

/** Wire type of one Firecrawl `data.news[]` entry (optional fields read tolerantly). */
export interface FirecrawlNewsResult {
  readonly url?: string
  readonly title?: string
  readonly snippet?: string
  readonly date?: string
}

export interface FirecrawlSearchResponse {
  readonly success?: boolean
  readonly data?: {
    readonly web?: readonly FirecrawlWebResult[]
    readonly news?: readonly FirecrawlNewsResult[]
  }
}

export interface FirecrawlScrapeMetadata {
  readonly sourceURL?: string
  readonly url?: string
  readonly statusCode?: number
  readonly contentType?: string
}

export interface FirecrawlScrapeResponse {
  readonly success?: boolean
  readonly data?: {
    readonly markdown?: string
    readonly metadata?: FirecrawlScrapeMetadata
  }
}

/** Fully-resolved runtime options for the member; defaults applied by {@link resolveFirecrawlMemberOptions}. */
export interface FirecrawlMemberOptions {
  /** Credential-ref env name, for missing-credential diagnostics. */
  readonly apiKeyRef: string
  /** Resolve the current API key per operation (credentials service-backed). */
  readonly resolveApiKey: () => Promise<string | undefined>
  /** Endpoint base; `/v2/search` and `/v2/scrape` are appended. */
  readonly baseURL: string
  /** Time-based search filter; absent = not sent (S17 P1). */
  /** Time-based search filter (presets + official combos); absent = not sent (S17/S22 P3). */
  readonly tbs?: string
  /** SafeSearch filter; absent = not sent (S22 P3). */
  readonly safe?: boolean
  /** Free-text geo location; absent = not sent (S17 P1). */
  readonly location?: string
  /** Unified search region (ISO 3166-1 alpha-2); absent = not sent (S17 P1, ADR-0015 — the fix for the API's US default). */
  readonly country?: string
  /** Unified include-domain allowlist, hostname-normalized; wildcards skip the fan-out (S20 P1, ADR-0018). */
  readonly includeDomains?: readonly string[]
  /** Unified exclude-domain blocklist, hostname-normalized; wildcards skip the fan-out (S20 P1, ADR-0018). */
  readonly excludeDomains?: readonly string[]
  /** Result sources; absent = not sent (web-only API default) (S20 P2). */
  readonly sources?: 'news' | 'web+news'
  /** Result category; absent = not sent (S20 P2). */
  readonly categories?: 'developer' | 'research' | 'pdf'
}

/**
 * Firecrawl accepts bare hostnames only (no protocol/path/wildcard): URL-like
 * entries collapse to their host; any wildcard entry makes the whole list an
 * Exa-only capability, so this member's domain fan-out is skipped entirely
 * (sending it would 400 — the same defensive-skip shape as the Exa category
 * guard). Evaluated once per options resolution.
 */
function normalizeFirecrawlDomains(fanout: UnifiedSearchFanout | undefined): {
  includeDomains?: readonly string[]
  excludeDomains?: readonly string[]
} {
  const raw = fanout?.includeDomains?.length ? fanout.includeDomains
    : fanout?.excludeDomains?.length ? fanout.excludeDomains
    : undefined
  if (raw === undefined) return {}
  if (raw.some((entry) => entry.includes('*'))) return {}
  const normalized = raw.map((entry) => {
    if (!entry.includes('://') && !entry.includes('/')) return entry
    try {
      return new URL(entry.includes('://') ? entry : `https://${entry}`).host
    } catch {
      return entry
    }
  })
  return fanout?.includeDomains?.length
    ? { includeDomains: normalized }
    : { excludeDomains: normalized }
}

/**
 * Explicit defaulting at the owning boundary (explicit > implicit): the base
 * URL default lands here, config passthrough stays untouched.
 */
export function resolveFirecrawlMemberOptions(
  config: FirecrawlMemberConfig,
  resolveApiKey: () => Promise<string | undefined>,
  fanout?: UnifiedSearchFanout,
): FirecrawlMemberOptions {
  return {
    apiKeyRef: config.apiKeyEnv,
    resolveApiKey,
    baseURL: config.baseURL ?? FIRECRAWL_DEFAULT_BASE_URL,
    tbs: config.tbs,
    safe: config.safe,
    location: config.location,
    country: fanout?.country,
    ...normalizeFirecrawlDomains(fanout),
    sources: config.sources || undefined,
    categories: config.categories || undefined,
  }
}

/**
 * Map a v2 search response to a normalized search result: `data.web[]` →
 * sources with `description` as the snippet (entries without a `url` are
 * dropped); no generated answer, no provider-side truncation. A 2xx envelope
 * carrying `success: false` is outside the documented wire shape and reads as
 * a bad response.
 */
export function mapFirecrawlSearchResponse(response: FirecrawlSearchResponse): WebSearchResult {
  if (response.success === false) {
    throw new DshwsError(codes.badResponse, 'Firecrawl search reported success:false on a 2xx response')
  }
  const webSources = (response.data?.web ?? [])
    .map((item): WebSearchSource | undefined => {
      if (item.url === undefined || item.url.length === 0) return undefined
      return {
        url: item.url,
        ...item.title != null && item.title.length > 0 ? { title: item.title } : {},
        ...item.description != null && item.description.length > 0 ? { snippet: item.description } : {},
      }
    })
    .filter((source): source is WebSearchSource => source !== undefined)
  // Merge order: web rows first, news rows appended (ADR-0018) — news is the
  // time-sorted supplement, not a replacement for the web ranking.
  const newsSources = (response.data?.news ?? [])
    .map((item): WebSearchSource | undefined => {
      if (item.url === undefined || item.url.length === 0) return undefined
      return {
        url: item.url,
        ...item.title != null && item.title.length > 0 ? { title: item.title } : {},
        ...item.snippet != null && item.snippet.length > 0 ? { snippet: item.snippet } : {},
        ...item.date != null && item.date.length > 0 ? { publishedAt: item.date } : {},
      }
    })
    .filter((source): source is WebSearchSource => source !== undefined)
  return { sources: [...webSources, ...newsSources], truncated: false }
}

/**
 * Map a v2 scrape response to a normalized fetch result: markdown becomes the
 * `text` body kind, the page's own status becomes the result's status code,
 * and the final URL falls back through `metadata.url` → `metadata.sourceURL` →
 * the request URL. Missing markdown is a bad response — `formats` explicitly
 * requested it.
 */
export function mapFirecrawlScrapeResponse(requestUrl: string, response: FirecrawlScrapeResponse): WebFetchResult {
  if (response.success === false) {
    throw new DshwsError(codes.badResponse, 'Firecrawl scrape reported success:false on a 2xx response')
  }
  const markdown = response.data?.markdown
  if (markdown === undefined) {
    throw new DshwsError(codes.badResponse, 'Firecrawl scrape returned no markdown though formats requested it')
  }
  const metadata = response.data?.metadata
  return {
    url: metadata?.url ?? metadata?.sourceURL ?? requestUrl,
    statusCode: metadata?.statusCode ?? 200,
    body: { kind: 'text', content: markdown },
    truncated: false,
  }
}

/**
 * The Firecrawl-backed chain member on both capability faces: one class, one
 * credential, one gate — registered with the search AND fetch registries.
 */
export class FirecrawlProvider implements WebSearchProvider, WebFetchProvider {
  readonly id = FIRECRAWL_MEMBER_ID

  constructor(private readonly options: FirecrawlMemberOptions) {}

  /** Cheap local config check (no network, no key dimension — the gate owns that). */
  available(): boolean {
    return URL.canParse(this.options.baseURL)
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    throwIfMemberAborted(codes, 'Firecrawl', signal)
    const apiKey = await this.#apiKey(signal)
    throwIfMemberAborted(codes, 'Firecrawl', signal)
    const limit = request.maxResults
    let response: Response
    try {
      response = await fetch(`${this.options.baseURL}/v2/search`, {
        method: 'POST',
        redirect: 'error',
        headers: this.#headers(apiKey),
        body: JSON.stringify({
          query: request.query,
          ...limit !== undefined ? { limit } : {},
          // The upstream default is 60s vs the chain's 30s per-member budget:
          // the explicit cap keeps the server from burning credits past our
          // client abort (the S16-P0 scrape-face fix, applied to search).
          timeout: FIRECRAWL_SEARCH_TIMEOUT_MS,
          ...this.options.sources !== undefined
            ? { sources: this.options.sources === 'news' ? [{ type: 'news' }] : [{ type: 'web' }, { type: 'news' }] }
            : {},
          ...this.options.categories !== undefined ? { categories: [{ type: this.options.categories }] } : {},
          ...this.options.tbs !== undefined ? { tbs: this.options.tbs } : {},
          ...this.options.safe === true ? { safe: true } : {},
          ...this.options.location !== undefined ? { location: this.options.location } : {},
          ...this.options.country !== undefined ? { country: this.options.country } : {},
          ...this.options.includeDomains !== undefined ? { includeDomains: [...this.options.includeDomains] } : {},
          ...this.options.excludeDomains !== undefined ? { excludeDomains: [...this.options.excludeDomains] } : {},
        }),
        ...(signal !== undefined ? { signal } : {}),
      })
    } catch (error: unknown) {
      throw memberFetchFailure(codes, 'Firecrawl', error, signal)
    }
    const payload = await this.#parse(response, signal, 'Firecrawl search')
    return mapFirecrawlSearchResponse(payload as FirecrawlSearchResponse)
  }

  async fetch(request: WebFetchRequest, signal?: AbortSignal): Promise<WebFetchResult> {
    throwIfMemberAborted(codes, 'Firecrawl', signal)
    const apiKey = await this.#apiKey(signal)
    throwIfMemberAborted(codes, 'Firecrawl', signal)
    let response: Response
    try {
      response = await fetch(`${this.options.baseURL}/v2/scrape`, {
        method: 'POST',
        redirect: 'error',
        headers: this.#headers(apiKey),
        body: JSON.stringify({
          url: request.url,
          formats: ['markdown'],
          // The upstream default is 60s, but the tool-level budget is 30s —
          // without an explicit cap the client aborts while the server keeps
          // burning credits (S16 P0-2).
          timeout: 20_000,
        }),
        ...(signal !== undefined ? { signal } : {}),
      })
    } catch (error: unknown) {
      throw memberFetchFailure(codes, 'Firecrawl', error, signal)
    }
    const payload = await this.#parse(response, signal, 'Firecrawl scrape')
    return mapFirecrawlScrapeResponse(request.url, payload as FirecrawlScrapeResponse)
  }

  /** Resolve one operation's key without retaining it; a missing key is a loud member error. */
  #apiKey(signal?: AbortSignal): Promise<string> {
    return resolveMemberApiKey({
      codes,
      label: 'Firecrawl',
      apiKeyRef: this.options.apiKeyRef,
      resolveApiKey: this.options.resolveApiKey,
      signal,
    })
  }

  #headers(apiKey: string): Record<string, string> {
    return {
      'authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
      'accept': 'application/json',
      'user-agent': USER_AGENT,
    }
  }

  /**
   * Shared response pipeline for both faces: non-2xx → HTTP error (tolerant
   * body unfold), abort mid-body → aborted, bad JSON → bad response.
   */
  async #parse(response: Response, signal: AbortSignal | undefined, label: string): Promise<unknown> {
    if (!response.ok) {
      const status = response.status
      let message = `Firecrawl API error (HTTP ${status})`
      try {
        const parsed = await response.json() as Parameters<typeof unfoldHttpErrorDetail>[0]
        const detail = unfoldHttpErrorDetail(parsed)
        if (detail !== undefined && detail.length > 0) message += `: ${detail}`
      } catch (error: unknown) {
        // An abort firing mid-body must surface as aborted, not be swallowed
        // into a generic HTTP-error message; otherwise the status is already
        // in `message` and a non-JSON error body only ever cost the richer text.
        if (signal?.aborted === true || isAbortError(error)) throw memberAborted(codes, label, signal, error)
      }
      throw new DshwsError(codes.httpError, message, { httpStatus: status })
    }
    try {
      return await response.json()
    } catch (error: unknown) {
      if (signal?.aborted === true || isAbortError(error)) throw memberAborted(codes, label, signal, error)
      throw memberBadResponse(codes, label, error)
    }
  }
}
