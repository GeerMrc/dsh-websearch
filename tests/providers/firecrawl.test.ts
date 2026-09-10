import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FirecrawlMemberConfig } from '../../src/config.ts'
import { MEMBER_ERROR_CODES } from '../../src/errors.ts'
import {
  FIRECRAWL_DEFAULT_BASE_URL,
  FIRECRAWL_MEMBER_ID,
  FirecrawlProvider,
  mapFirecrawlSearchResponse,
  resolveFirecrawlMemberOptions,
} from '../../src/providers/firecrawl.ts'

const codes = MEMBER_ERROR_CODES.firecrawl

const options = resolveFirecrawlMemberOptions(
  { enabled: true, apiKeyEnv: 'FIRECRAWL_API_KEY'  } satisfies FirecrawlMemberConfig,
  async () => 'fc-key',
)

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function searchProvider(): FirecrawlProvider {
  return new FirecrawlProvider(options)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('dshws-firecrawl option resolution', () => {
  it('fills the default base URL explicitly and passes apiKeyEnv through', () => {
    const resolved = resolveFirecrawlMemberOptions({ enabled: true, apiKeyEnv: 'FIRECRAWL_API_KEY'  }, async () => undefined)
    expect(resolved.baseURL).toBe(FIRECRAWL_DEFAULT_BASE_URL)
    expect(resolved.apiKeyRef).toBe('FIRECRAWL_API_KEY')
    // S17 P1 defaults: no time filter, no geo location.
    expect(resolved.tbs).toBeUndefined()
    expect(resolved.location).toBeUndefined()
  })

  it('passes explicit baseURL through untouched', () => {
    const resolved = resolveFirecrawlMemberOptions(
      { enabled: true, apiKeyEnv: 'MY_KEY', baseURL: 'https://proxy.test'  },
      async () => undefined,
    )
    expect(resolved.baseURL).toBe('https://proxy.test')
    expect(resolved.apiKeyRef).toBe('MY_KEY')
  })
})

describe('dshws-firecrawl S17 P1 parameter wire', () => {
  it('configured tbs and location land on the search wire under native names', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ success: true, data: { web: [] } }))
    vi.stubGlobal('fetch', fetchMock)
    const resolved = resolveFirecrawlMemberOptions(
      { enabled: true, apiKeyEnv: 'FIRECRAWL_API_KEY', tbs: 'qdr:w', location: 'Beijing,China' } satisfies FirecrawlMemberConfig,
      async () => 'fc-key',
    )
    await new FirecrawlProvider(resolved).search({ query: 'q' })
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body.tbs).toBe('qdr:w')
    expect(body.location).toBe('Beijing,China')
  })

  it('S22 T3: tbs combo values land verbatim; legacy qdr values stay legal', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ data: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const resolved = resolveFirecrawlMemberOptions(
      { enabled: true, apiKeyEnv: 'FIRECRAWL_API_KEY', tbs: 'sbd:1,qdr:w' } satisfies FirecrawlMemberConfig,
      async () => 'fc-key',
    )
    await new FirecrawlProvider(resolved).search({ query: 'q' })
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string).tbs).toBe('sbd:1,qdr:w')
  })

  it('S22 T3: custom date range tbs (cdr) lands; safe lands when true and stays absent by default', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ data: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const resolved = resolveFirecrawlMemberOptions(
      { enabled: true, apiKeyEnv: 'FIRECRAWL_API_KEY', tbs: 'cdr:1,cd_min:01/01/2026,cd_max:06/30/2026', safe: true } satisfies FirecrawlMemberConfig,
      async () => 'fc-key',
    )
    await new FirecrawlProvider(resolved).search({ query: 'q' })
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const body = JSON.parse(init.body as string)
    expect(body.tbs).toBe('cdr:1,cd_min:01/01/2026,cd_max:06/30/2026')
    expect(body.safe).toBe(true)
  })

  it('unset tbs/location stay absent from the wire', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ success: true, data: { web: [] } }))
    vi.stubGlobal('fetch', fetchMock)
    await searchProvider().search({ query: 'q' })
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body).not.toHaveProperty('tbs')
    expect(body).not.toHaveProperty('location')
  })

  it('S20 T4: sources — default omits the key; news/web+news fan out; news results map with publishedAt (web first, news appended)', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ success: true, data: {
      web: [{ url: 'https://w.test', title: 'W', description: 'wd' }],
      news: [{ title: 'N', snippet: 'nd', url: 'https://n.test', date: '2026-09-01', imageUrl: 'https://img.test' }],
    } }))
    vi.stubGlobal('fetch', fetchMock)
    await searchProvider().search({ query: 'q' })
    let body = JSON.parse((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body as string)
    expect(body).not.toHaveProperty('sources')

    const newsOnly = resolveFirecrawlMemberOptions(
      { enabled: true, apiKeyEnv: 'FIRECRAWL_API_KEY', sources: 'news'  } satisfies FirecrawlMemberConfig,
      async () => 'k',
    )
    const result = await new FirecrawlProvider(newsOnly).search({ query: 'q' })
    body = JSON.parse((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body as string)
    expect(body.sources).toEqual([{ type: 'news' }])
    // Merge order: web rows first, news rows appended; date → publishedAt.
    expect(result.sources).toEqual([
      { url: 'https://w.test', title: 'W', snippet: 'wd' },
      { url: 'https://n.test', title: 'N', snippet: 'nd', publishedAt: '2026-09-01' },
    ])

    const both = resolveFirecrawlMemberOptions(
      { enabled: true, apiKeyEnv: 'FIRECRAWL_API_KEY', sources: 'web+news'  } satisfies FirecrawlMemberConfig,
      async () => 'k',
    )
    await new FirecrawlProvider(both).search({ query: 'q' })
    body = JSON.parse((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body as string)
    expect(body.sources).toEqual([{ type: 'web' }, { type: 'news' }])
  })

  it('S20 T4: categories land as [{type}]; search face carries an explicit 20s timeout (chain-budget cap)', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ success: true, data: { web: [] } }))
    vi.stubGlobal('fetch', fetchMock)
    const configured = resolveFirecrawlMemberOptions(
      { enabled: true, apiKeyEnv: 'FIRECRAWL_API_KEY', categories: 'research'  } satisfies FirecrawlMemberConfig,
      async () => 'k',
    )
    await new FirecrawlProvider(configured).search({ query: 'q' })
    const body = JSON.parse((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body as string)
    expect(body.categories).toEqual([{ type: 'research' }])
    // The upstream default is 60s vs the chain's 30s per-member budget — the
    // explicit cap keeps the server from burning credits past our abort.
    expect(body.timeout).toBe(20_000)
    await searchProvider().search({ query: 'q' })
    const bare = JSON.parse((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body as string)
    expect(bare.timeout).toBe(20_000)
    expect(bare).not.toHaveProperty('categories')
  })

  it('S20 T1: unified domain list fan-out — hostname normalize, wildcard skips the member entirely, single-list only', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ success: true, data: { web: [] } }))
    vi.stubGlobal('fetch', fetchMock)
    // URL-like inputs collapse to their host; bare hostnames pass through.
    const withDomains = resolveFirecrawlMemberOptions(
      { enabled: true, apiKeyEnv: 'FIRECRAWL_API_KEY'  },
      async () => 'fc-key',
      { includeDomains: ['https://example.com/docs/page', 'foo.org'] },
    )
    await new FirecrawlProvider(withDomains).search({ query: 'q' })
    let body = JSON.parse((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body as string)
    expect(body.includeDomains).toEqual(['example.com', 'foo.org'])

    // Wildcards are an Exa capability; Firecrawl is hostname-only — any wildcard
    // skips the domain fan-out for this member entirely (400 guard, ADR-0018).
    const withWildcard = resolveFirecrawlMemberOptions(
      { enabled: true, apiKeyEnv: 'FIRECRAWL_API_KEY'  },
      async () => 'fc-key',
      { includeDomains: ['example.com', '*.foo.org'] },
    )
    await new FirecrawlProvider(withWildcard).search({ query: 'q' })
    body = JSON.parse((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body as string)
    expect(body).not.toHaveProperty('includeDomains')

    // An exclude-only list (the only other legal single-list state) still fans out.
    const excludeOnly = resolveFirecrawlMemberOptions(
      { enabled: true, apiKeyEnv: 'FIRECRAWL_API_KEY'  },
      async () => 'fc-key',
      { excludeDomains: ['spam.test'] },
    )
    await new FirecrawlProvider(excludeOnly).search({ query: 'q' })
    body = JSON.parse((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body as string)
    expect(body.excludeDomains).toEqual(['spam.test'])
  })

  it('S17 T6: unified country fans out to the search wire; absent → not sent', async () => {
    const withCountry = resolveFirecrawlMemberOptions(
      { enabled: true, apiKeyEnv: 'FIRECRAWL_API_KEY'  },
      async () => 'fc-key',
      { country: 'CN' },
    )
    const fetchMock = vi.fn(async () => jsonResponse({ success: true, data: { web: [] } }))
    vi.stubGlobal('fetch', fetchMock)
    await new FirecrawlProvider(withCountry).search({ query: 'q' })
    let body = JSON.parse((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body as string)
    expect(body.country).toBe('CN')

    await searchProvider().search({ query: 'q' })
    body = JSON.parse((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body as string)
    expect(body).not.toHaveProperty('country')
  })
})

describe('dshws-firecrawl availability and id (local checks only)', () => {
  it('registers under the dshws- prefixed member id on both capability faces', () => {
    const provider = searchProvider()
    expect(provider.id).toBe(FIRECRAWL_MEMBER_ID)
    expect(provider.id).toBe('dshws-firecrawl')
  })

  it('is available with a parseable baseURL', () => {
    expect(searchProvider().available()).toBe(true)
    expect(new FirecrawlProvider({ ...options, baseURL: 'not a url' }).available()).toBe(false)
  })
})

describe('dshws-firecrawl search face (mock HTTP)', () => {
  it('sends query and bearer auth to the v2 search endpoint', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ success: true, data: { web: [] } }))
    vi.stubGlobal('fetch', fetchMock)

    await searchProvider().search({ query: 'hello', maxResults: 5 })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${FIRECRAWL_DEFAULT_BASE_URL}/v2/search`)
    expect(init).toMatchObject({ method: 'POST', redirect: 'error' })
    const headers = init.headers as Record<string, string>
    expect(headers['authorization']).toBe('Bearer fc-key')
    expect(headers['content-type']).toBe('application/json')
    expect(headers['user-agent']).toBe('dsh-websearch/0.8.0')
    expect(JSON.parse(init.body as string)).toEqual({ query: 'hello', limit: 5, timeout: 20_000 })
  })

  it('omits limit when the request carries no maxResults', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ success: true, data: { web: [] } }))
    vi.stubGlobal('fetch', fetchMock)
    await searchProvider().search({ query: 'q' })
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string)).not.toHaveProperty('limit')
  })

  it('maps data.web entries to sources with description as snippet', () => {
    const result = mapFirecrawlSearchResponse({
      success: true,
      data: {
        web: [
          { url: 'https://a.test', title: 'A', description: 'about a', position: 1 },
          { url: 'https://b.test' },
          { title: 'no url', position: 3 },
        ],
      },
    })
    expect(result.content).toBeUndefined()
    expect(result.truncated).toBe(false)
    expect(result.sources).toEqual([
      { url: 'https://a.test', title: 'A', snippet: 'about a' },
      { url: 'https://b.test' },
    ])
  })

  it('tolerates a missing data.web array and rejects success:false on a 2xx', () => {
    expect(mapFirecrawlSearchResponse({ success: true, data: {} }).sources).toEqual([])
    expect(() => mapFirecrawlSearchResponse({ success: false }))
      .toThrow(expect.objectContaining({ code: codes.badResponse }))
  })

  it('maps HTTP 429 with a non-JSON body to DSHWS_FIRECRAWL_HTTP_ERROR carrying the status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse('rate limited', 429)))
    const caught = await searchProvider().search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.httpError })
    expect((caught as Error).message).toContain('429')
  })

  it('unfolds a JSON error body into the HTTP error message when present', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: 'payment required to access this resource' }, 402)))
    const caught = await searchProvider().search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.httpError })
    expect((caught as Error).message).toContain('payment required')
  })

  it('maps a network failure to DSHWS_FIRECRAWL_REQUEST_FAILED', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('network down')
    }))
    await expect(searchProvider().search({ query: 'q' })).rejects.toMatchObject({ code: codes.requestFailed })
  })

  it('maps caller cancellation to DSHWS_FIRECRAWL_ABORTED (provider honors the signal)', async () => {
    const controller = new AbortController()
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })))
    const pending = searchProvider().search({ query: 'q' }, controller.signal)
    controller.abort()
    await expect(pending).rejects.toMatchObject({ code: codes.aborted })
  })

  it('throws DSHWS_FIRECRAWL_CREDENTIAL_MISSING without calling the wire when no key resolves', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const provider = new FirecrawlProvider(
      resolveFirecrawlMemberOptions({ enabled: true, apiKeyEnv: 'FIRECRAWL_API_KEY'  }, async () => undefined),
    )
    const caught = await provider.search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.credentialMissing })
    expect((caught as Error).message).toContain('FIRECRAWL_API_KEY')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps a credential-resolution rejection to DSHWS_FIRECRAWL_REQUEST_FAILED', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const provider = new FirecrawlProvider(
      resolveFirecrawlMemberOptions(
        { enabled: true, apiKeyEnv: 'FIRECRAWL_API_KEY'  },
        async () => {
          throw new Error('credentials service unreachable')
        },
      ),
    )
    const caught = await provider.search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.requestFailed })
    expect((caught as Error).message).toContain('credential resolution failed')
  })

  it('maps an unprocessable success body to DSHWS_FIRECRAWL_BAD_RESPONSE', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse('not json at all')))
    const caught = await searchProvider().search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.badResponse })
  })
})

describe('dshws-firecrawl fetch face (mock HTTP)', () => {
  it('sends the scrape request with markdown format and bearer auth', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({
      success: true,
      data: { markdown: '# page', metadata: { url: 'https://a.test/final', statusCode: 200 } },
    }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await searchProvider().fetch({ url: 'https://a.test' })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${FIRECRAWL_DEFAULT_BASE_URL}/v2/scrape`)
    expect(init).toMatchObject({ method: 'POST', redirect: 'error' })
    const headers = init.headers as Record<string, string>
    expect(headers['authorization']).toBe('Bearer fc-key')
    expect(JSON.parse(init.body as string)).toEqual({ url: 'https://a.test', formats: ['markdown'], timeout: 20_000 })
    expect(result).toEqual({
      url: 'https://a.test/final',
      statusCode: 200,
      body: { kind: 'text', content: '# page' },
      truncated: false,
    })
  })

  it('falls back through metadata url → sourceURL → request url and defaults the status code', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({
      success: true,
      data: { markdown: 'content', metadata: { sourceURL: 'https://a.test/orig' } },
    }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await searchProvider().fetch({ url: 'https://a.test' })
    expect(result.url).toBe('https://a.test/orig')
    expect(result.statusCode).toBe(200)
  })

  it('maps a network failure and cancellation on the fetch face like the search face', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('network down')
    }))
    await expect(searchProvider().fetch({ url: 'https://a.test' })).rejects.toMatchObject({ code: codes.requestFailed })

    const controller = new AbortController()
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })))
    const pending = searchProvider().fetch({ url: 'https://a.test' }, controller.signal)
    controller.abort()
    await expect(pending).rejects.toMatchObject({ code: codes.aborted })
  })

  it('rejects success:false on a 2xx and an unprocessable body on the fetch face', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ success: false })))
    await expect(searchProvider().fetch({ url: 'https://a.test' })).rejects.toMatchObject({ code: codes.badResponse })

    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse('not json at all')))
    await expect(searchProvider().fetch({ url: 'https://a.test' })).rejects.toMatchObject({ code: codes.badResponse })
  })
})
