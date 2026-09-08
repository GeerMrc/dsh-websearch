/**
 * `dshws-fetch-search`: the FREE fetch-based search fallback (S14e, user
 * ruling). The host `web_fetch` tool only retrieves a known URL, so "free
 * fetch websearch" is implemented here as a keyless scrape of DuckDuckGo's
 * HTML endpoint (`html.duckduckgo.com/html/?q=…` — no key, no login, stable
 * result markup). This member carries no credential ref: its gate is always
 * ready; availability is decided per request by network reachability. When
 * the endpoint is unreachable the member fails like any other and the chain
 * ends fail-loud — there is no lower floor (honest limit, plan 014e D5).
 *
 * @module dsh-websearch/providers/fetchsearch
 */
import { DshwsError, MEMBER_ERROR_CODES } from '../errors.ts'
export { FETCH_FALLBACK_MEMBER_ID } from '../config.ts'
import type { WebSearchProvider, WebSearchRequest, WebSearchResult } from '@deepseek-ai/dsh-web'

/** Stable id under `dshws-` discipline. */
export const FETCH_SEARCH_MEMBER_ID = 'dshws-fetch-search'

/** Keyless HTML endpoint base; the query is form-encoded onto `?q=`. */
const DDG_HTML_ENDPOINT = 'https://html.duckduckgo.com/html/'

/** Member error family (fetch face of the generic bucket). */
const codes = MEMBER_ERROR_CODES.fetchsearch

/**
 * Decode a DDG redirect hop (`//duckduckgo.com/l/?uddg=<encoded>`) into the
 * real result URL; direct hrefs pass through untouched.
 */
export function decodeDdgHref(href: string): string {
  const marker = 'uddg='
  const at = href.indexOf(marker)
  if (at === -1) return href
  const encoded = href.slice(at + marker.length).split('&')[0] ?? ''
  try {
    return decodeURIComponent(encoded)
  } catch {
    // Malformed percent-encoding: keep the raw tail rather than crashing.
    return encoded
  }
}

/**
 * Parse the DDG HTML result list into sources: each result block anchors a
 * `result__a` link (title + href) optionally followed by a `result__snippet`.
 * Snippet markup tags are stripped to plain text.
 */
export function parseDdgHtml(html: string, maxResults: number): WebSearchResult {
  const sources: { url: string; title?: string; snippet?: string; publishedAt?: string }[] = []
  const block = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>([\s\S]*?)(?=<a[^>]*class="[^"]*result__a|<\/div>\s*<\/div>\s*<\/body>|$)/g
  for (const match of html.matchAll(block)) {
    if (sources.length >= maxResults) break
    const url = decodeDdgHref(match[1] ?? '')
    const title = (match[2] ?? '').replace(/<[^>]+>/g, '').trim()
    const snippetRaw = /class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/.exec(match[3] ?? '')
    const snippet = snippetRaw ? snippetRaw[1]!.replace(/<[^>]+>/g, '').trim() : undefined
    if (url.length === 0 || !/^https?:\/\//.test(url)) continue
    sources.push({
      url,
      ...(title.length > 0 ? { title } : {}),
      ...(snippet !== undefined && snippet.length > 0 ? { snippet } : {}),
    })
  }
  return { sources, truncated: false }
}

/** The keyless free-search fallback member. */
export class FetchSearchProvider implements WebSearchProvider {
  readonly id = FETCH_SEARCH_MEMBER_ID

  /** Local URL check only — readiness is per-request network reachability. */
  available(): boolean {
    return true
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    const query = request.query.trim()
    if (query.length === 0) {
      throw new DshwsError(codes.credentialMissing, 'Fetch search received an empty query')
    }
    const url = `${DDG_HTML_ENDPOINT}?q=${encodeURIComponent(query)}`
    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: `q=${encodeURIComponent(query)}`,
        redirect: 'error',
        signal,
      })
    } catch (error) {
      if (signal?.aborted) throw new DshwsError(codes.aborted, 'Fetch search aborted', { cause: error })
      throw new DshwsError(codes.requestFailed, `Fetch search request failed: ${String(error)}`)
    }
    if (!response.ok) {
      throw new DshwsError(codes.requestFailed, `Fetch search HTTP ${response.status}`)
    }
    const html = await response.text()
    const result = parseDdgHtml(html, request.maxResults ?? 8)
    if (result.sources.length === 0) {
      throw new DshwsError(codes.badResponse, 'Fetch search parsed no results from the HTML endpoint')
    }
    return result
  }
}
