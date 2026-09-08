import { describe, expect, it, vi } from 'vitest'
import { FETCH_SEARCH_MEMBER_ID, FetchSearchProvider, decodeDdgHref, parseDdgHtml } from '../../src/providers/fetchsearch.ts'

/** Fixture mirroring html.duckduckgo.com/html result markup (trimmed). */
const FIXTURE = `
<div class="results">
  <div class="result results_links">
    <h2 class="result__title"><a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fa&amp;rut=abc">Example <b>Title</b></a></h2>
    <a class="result__snippet" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fa">First <b>snippet</b> text</a>
  </div>
  <div class="result">
    <h2 class="result__title"><a class="result__a" href="https://direct.example/b">Direct Link</a></h2>
  </div>
  <div class="result">
    <h2 class="result__title"><a class="result__a" href="javascript:void(0)">Bad scheme</a></h2>
  </div>
</div>`

describe('parseDdgHtml (S14e D1)', () => {
  it('decodes uddg redirect hops and passes direct hrefs through', () => {
    expect(decodeDdgHref('//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fa&rut=x')).toBe('https://example.com/a')
    expect(decodeDdgHref('https://direct.example/b')).toBe('https://direct.example/b')
  })

  it('parses titles and snippets, strips markup, drops non-http schemes', () => {
    const result = parseDdgHtml(FIXTURE, 8)
    expect(result.sources).toEqual([
      { url: 'https://example.com/a', title: 'Example Title', snippet: 'First snippet text' },
      { url: 'https://direct.example/b', title: 'Direct Link' },
    ])
  })

  it('caps at maxResults', () => {
    expect(parseDdgHtml(FIXTURE, 1).sources).toHaveLength(1)
  })
})

describe('FetchSearchProvider (S14e D1)', () => {
  it('is always available and carries the dshws- id (keyless gate)', () => {
    const provider = new FetchSearchProvider()
    expect(provider.available()).toBe(true)
    expect(provider.id).toBe(FETCH_SEARCH_MEMBER_ID)
    expect(provider.id).toBe('dshws-fetch-search')
  })

  it('rejects an empty query and parses fetched HTML into sources', async () => {
    const provider = new FetchSearchProvider()
    await expect(provider.search({ query: '  ' })).rejects.toMatchObject({ code: 'DSHWS_FETCHSEARCH_CREDENTIAL_MISSING' })

    const fetchMock = vi.fn(async () => new Response(FIXTURE, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await provider.search({ query: 'hello', maxResults: 8 })
    expect(result.sources[0]!.url).toBe('https://example.com/a')
    expect(fetchMock).toHaveBeenCalledOnce()
    vi.unstubAllGlobals()
  })

  it('fails loud on HTTP errors and on zero parsed results', async () => {
    const provider = new FetchSearchProvider()
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 503 })))
    await expect(provider.search({ query: 'x' })).rejects.toMatchObject({ code: 'DSHWS_FETCHSEARCH_REQUEST_FAILED' })
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>empty</html>', { status: 200 })))
    await expect(provider.search({ query: 'x' })).rejects.toMatchObject({ code: 'DSHWS_FETCHSEARCH_BAD_RESPONSE' })
    vi.unstubAllGlobals()
  })

  it('names the anti-bot challenge shell separately from a genuine empty page (S14v T1)', async () => {
    // Observed live (2026-09-08): DuckDuckGo answers suspected-bot egress IPs
    // with HTTP 202 plus a bare homepage shell — no result markup at all.
    // That is an endpoint-level block, not a parse defect; the two cases must
    // not share one "parsed no results" message.
    const provider = new FetchSearchProvider()
    const shell = '<!DOCTYPE html><html><head><title>DuckDuckGo HTML: Private Search Without JavaScript</title></head><body></body></html>'
    vi.stubGlobal('fetch', vi.fn(async () => new Response(shell, { status: 202 })))
    const blocked = await provider.search({ query: 'x' }).then(() => null, (error: unknown) => error as Error)
    expect(blocked).toMatchObject({ code: 'DSHWS_FETCHSEARCH_BAD_RESPONSE' })
    expect(blocked.message).toContain('anti-bot challenge shell (HTTP 202)')
    expect(blocked.message).toContain('unavailable in this network')
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>genuinely empty result page</html>', { status: 200 })))
    const empty = await provider.search({ query: 'x' }).then(() => null, (error: unknown) => error as Error)
    expect(empty).toMatchObject({ code: 'DSHWS_FETCHSEARCH_BAD_RESPONSE' })
    expect(empty.message).not.toContain('anti-bot')
    expect(empty.message).toContain('parsed no results')
    vi.unstubAllGlobals()
  })

  it('sends a desktop browser user-agent with the form POST (S14v T2)', async () => {
    const provider = new FetchSearchProvider()
    const fetchMock = vi.fn(async () => new Response(FIXTURE, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await provider.search({ query: 'x' })
    const init = fetchMock.mock.calls[0]![1] as { headers: Record<string, string> }
    expect(init.headers['user-agent']).toMatch(/Mozilla\/5\.0/)
    vi.unstubAllGlobals()
  })
})
