import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TavilyMemberConfig } from '../../src/config.ts'
import { MEMBER_ERROR_CODES } from '../../src/errors.ts'
import {
  TAVILY_DEFAULT_BASE_URL,
  TAVILY_MEMBER_ID,
  TavilySearchProvider,
  mapTavilyResponse,
  resolveTavilyMemberOptions,
} from '../../src/providers/tavily.ts'

const codes = MEMBER_ERROR_CODES.tavily

const options = resolveTavilyMemberOptions(
  { enabled: true, apiKeyEnv: 'TAVILY_API_KEY'  } satisfies TavilyMemberConfig,
  async () => 'tvly-key',
)

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('dshws-tavily option resolution', () => {
  it('fills the default base URL explicitly and passes apiKeyEnv through', () => {
    const resolved = resolveTavilyMemberOptions({ enabled: true, apiKeyEnv: 'TAVILY_API_KEY'  }, async () => undefined)
    expect(resolved.baseURL).toBe(TAVILY_DEFAULT_BASE_URL)
    expect(resolved.apiKeyRef).toBe('TAVILY_API_KEY')
    expect(resolved.maxResults).toBeUndefined()
    // S17 D4: the answer feature is on by default at the basic tier.
    expect(resolved.includeAnswer).toBe('basic')
    expect(resolved.topic).toBeUndefined()
    expect(resolved.timeRange).toBeUndefined()
    expect(resolved.searchDepth).toBeUndefined()
  })

  it('passes explicit baseURL/maxResults through untouched', () => {
    const resolved = resolveTavilyMemberOptions(
      { enabled: true, apiKeyEnv: 'MY_KEY', baseURL: 'https://proxy.test', maxResults: 7  },
      async () => undefined,
    )
    expect(resolved.baseURL).toBe('https://proxy.test')
    expect(resolved.maxResults).toBe(7)
    expect(resolved.apiKeyRef).toBe('MY_KEY')
  })
})

describe('dshws-tavily availability (local checks only)', () => {
  it('registers under the dshws- prefixed member id', () => {
    expect(new TavilySearchProvider(options).id).toBe(TAVILY_MEMBER_ID)
  })

  it('is available with a parseable baseURL and, when set, a positive maxResults', () => {
    expect(new TavilySearchProvider(options).available()).toBe(true)
    expect(new TavilySearchProvider({ ...options, baseURL: 'not a url' }).available()).toBe(false)
    expect(new TavilySearchProvider({ ...options, maxResults: 0 }).available()).toBe(false)
  })
})

describe('dshws-tavily request mapping', () => {
  it('sends query and bearer auth to the search endpoint', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)

    await new TavilySearchProvider(options).search({ query: 'hello', maxResults: 5 })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${TAVILY_DEFAULT_BASE_URL}/search`)
    expect(init).toMatchObject({ method: 'POST', redirect: 'error' })
    const headers = init.headers as Record<string, string>
    expect(headers['authorization']).toBe('Bearer tvly-key')
    expect(headers['content-type']).toBe('application/json')
    expect(headers['user-agent']).toBe('dsh-websearch/0.5.0')
    expect(JSON.parse(init.body as string)).toEqual({ query: 'hello', max_results: 5, include_answer: 'basic' })
  })

  it('falls back to the configured maxResults when a request omits it (passthrough, no clamp)', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    await new TavilySearchProvider({ ...options, maxResults: 7 }).search({ query: 'q' })
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toEqual({ query: 'q', max_results: 7, include_answer: 'basic' })
  })

  it('omits max_results when neither the request nor the config sets one', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    await new TavilySearchProvider(options).search({ query: 'q' })
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string)).not.toHaveProperty('max_results')
  })
})

describe('dshws-tavily S17 P1 parameter wire', () => {
  it('defaults: include_answer basic always sent; topic/time_range/search_depth absent (S17 D4)', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    await new TavilySearchProvider(options).search({ query: 'q' })
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toEqual({ query: 'q', include_answer: 'basic' })
  })

  it('configured topic/timeRange/searchDepth land on the wire under native names', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const resolved = resolveTavilyMemberOptions(
      { enabled: true, apiKeyEnv: 'TAVILY_API_KEY', topic: 'news', timeRange: 'week', searchDepth: 'ultra-fast' } satisfies TavilyMemberConfig,
      async () => 'tvly-key',
    )
    await new TavilySearchProvider(resolved).search({ query: 'q' })
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toEqual({
      query: 'q',
      include_answer: 'basic',
      topic: 'news',
      time_range: 'week',
      search_depth: 'ultra-fast',
    })
  })

  it('includeAnswer advanced overrides the default (S17 D4)', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const resolved = resolveTavilyMemberOptions(
      { enabled: true, apiKeyEnv: 'TAVILY_API_KEY', includeAnswer: 'advanced' } satisfies TavilyMemberConfig,
      async () => 'tvly-key',
    )
    await new TavilySearchProvider(resolved).search({ query: 'q' })
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string).include_answer).toBe('advanced')
  })

  it('response answer maps to result content; blank answer stays omitted', () => {
    expect(mapTavilyResponse({ answer: 'A synthesized answer.', results: [{ url: 'https://a.test' }] }).content)
      .toBe('A synthesized answer.')
    expect(mapTavilyResponse({ answer: '   ', results: [{ url: 'https://a.test' }] }).content).toBeUndefined()
    expect(mapTavilyResponse({ results: [{ url: 'https://a.test' }] }).content).toBeUndefined()
  })

  it('S20 stage-5 F-1: any wildcard entry skips the whole Tavily domain fan-out (no official wildcard support)', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const withWildcard = resolveTavilyMemberOptions(
      { enabled: true, apiKeyEnv: 'TAVILY_API_KEY'  },
      async () => 'k',
      { includeDomains: ['example.com', '*.foo.org'] },
    )
    await new TavilySearchProvider(withWildcard).search({ query: 'q' })
    const body = JSON.parse((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body as string)
    expect(body).not.toHaveProperty('include_domains')
    expect(body).not.toHaveProperty('exclude_domains')
  })

  it('S20 T2: chunksPerSource lands when set; suppressed under ultra-fast depth (official constraint)', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const configured = resolveTavilyMemberOptions(
      { enabled: true, apiKeyEnv: 'TAVILY_API_KEY', chunksPerSource: 1  } satisfies TavilyMemberConfig,
      async () => 'k',
    )
    await new TavilySearchProvider(configured).search({ query: 'q' })
    let body = JSON.parse((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body as string)
    expect(body.chunks_per_source).toBe(1)

    const ultraFast = resolveTavilyMemberOptions(
      { enabled: true, apiKeyEnv: 'TAVILY_API_KEY', chunksPerSource: 2, searchDepth: 'ultra-fast'  } satisfies TavilyMemberConfig,
      async () => 'k',
    )
    await new TavilySearchProvider(ultraFast).search({ query: 'q' })
    body = JSON.parse((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body as string)
    expect(body).not.toHaveProperty('chunks_per_source')

    await new TavilySearchProvider(options).search({ query: 'q' })
    body = JSON.parse((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body as string)
    expect(body).not.toHaveProperty('chunks_per_source')
  })

  it('S20 T2: filterByLanguage lands only when the unified language is set; includeDomainsMode only with an include list', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const withBoth = resolveTavilyMemberOptions(
      { enabled: true, apiKeyEnv: 'TAVILY_API_KEY', filterByLanguage: true, includeDomainsMode: 'boost'  } satisfies TavilyMemberConfig,
      async () => 'k',
      { language: 'zh', includeDomains: ['example.com'] },
    )
    await new TavilySearchProvider(withBoth).search({ query: 'q' })
    let body = JSON.parse((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body as string)
    expect(body.filter_by_language).toBe(true)
    expect(body.include_domains_mode).toBe('boost')

    // Guards: no unified language → filter_by_language suppressed; no include list → mode suppressed.
    const noLanguage = resolveTavilyMemberOptions(
      { enabled: true, apiKeyEnv: 'TAVILY_API_KEY', filterByLanguage: true, includeDomainsMode: 'boost'  } satisfies TavilyMemberConfig,
      async () => 'k',
    )
    await new TavilySearchProvider(noLanguage).search({ query: 'q' })
    body = JSON.parse((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body as string)
    expect(body).not.toHaveProperty('filter_by_language')
    expect(body).not.toHaveProperty('include_domains_mode')
  })

  it('S20 T1: unified domain lists fan out as include_domains/exclude_domains arrays', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const resolved = resolveTavilyMemberOptions(
      { enabled: true, apiKeyEnv: 'TAVILY_API_KEY'  },
      async () => 'tvly-key',
      { includeDomains: ['example.com', 'foo.org'], excludeDomains: [] },
    )
    await new TavilySearchProvider(resolved).search({ query: 'q' })
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body.include_domains).toEqual(['example.com', 'foo.org'])
    expect(body).not.toHaveProperty('exclude_domains')
  })

  it('S17 T6: unified language fans out to the wire; country is NOT sent to Tavily in v1 (ADR-0015 格式不匹配防御)', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const resolved = resolveTavilyMemberOptions(
      { enabled: true, apiKeyEnv: 'TAVILY_API_KEY'  },
      async () => 'tvly-key',
      { country: 'CN', language: 'zh' },
    )
    await new TavilySearchProvider(resolved).search({ query: 'q' })
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body.language).toBe('zh')
    expect(body).not.toHaveProperty('country')
  })
})

describe('dshws-tavily response mapping', () => {
  it('maps results to sources with tolerant optional fields and no generated content', async () => {
    const result = mapTavilyResponse({
      results: [
        { url: 'https://a.test', title: 'A', content: 'snippet a', score: 0.9, published_date: '2026-01-01' },
        { url: 'https://b.test', title: 'B' },
        { url: 'https://c.test', content: '   ' },
      ],
    })
    expect(result.content).toBeUndefined()
    expect(result.truncated).toBe(false)
    expect(result.sources).toEqual([
      { url: 'https://a.test', title: 'A', snippet: 'snippet a', publishedAt: '2026-01-01' },
      { url: 'https://b.test', title: 'B' },
      { url: 'https://c.test' },
    ])
  })

  it('tolerates a missing results array', () => {
    expect(mapTavilyResponse({}).sources).toEqual([])
  })

  it('drops entries without a url (a source always has a url)', () => {
    expect(mapTavilyResponse({ results: [{ title: 'no url' }, { url: 'https://a.test' }] }).sources)
      .toEqual([{ url: 'https://a.test' }])
  })
})

describe('dshws-tavily failure modes (mock HTTP)', () => {
  it('maps HTTP 429 with a non-JSON body to DSHWS_TAVILY_HTTP_ERROR carrying the status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse('rate limited', 429)))
    const caught = await new TavilySearchProvider(options).search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.httpError, httpStatus: 429 })
    expect((caught as Error).message).toContain('429')
  })

  it('unfolds a JSON error body into the HTTP error message when present', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ detail: 'invalid api key' }, 401)))
    const caught = await new TavilySearchProvider(options).search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.httpError, httpStatus: 401 })
    expect((caught as Error).message).toContain('invalid api key')
  })

  it('maps a network failure to DSHWS_TAVILY_REQUEST_FAILED', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('network down')
    }))
    await expect(new TavilySearchProvider(options).search({ query: 'q' }))
      .rejects.toMatchObject({ code: codes.requestFailed })
  })

  it('maps caller cancellation to DSHWS_TAVILY_ABORTED (provider honors the signal)', async () => {
    const controller = new AbortController()
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })))
    const pending = new TavilySearchProvider(options).search({ query: 'q' }, controller.signal)
    controller.abort()
    await expect(pending).rejects.toMatchObject({ code: codes.aborted })
  })

  it('throws DSHWS_TAVILY_CREDENTIAL_MISSING without calling the wire when no key resolves', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const provider = new TavilySearchProvider(
      resolveTavilyMemberOptions({ enabled: true, apiKeyEnv: 'TAVILY_API_KEY'  }, async () => undefined),
    )
    const caught = await provider.search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.credentialMissing })
    expect((caught as Error).message).toContain('TAVILY_API_KEY')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps a credential-resolution rejection to DSHWS_TAVILY_REQUEST_FAILED', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const provider = new TavilySearchProvider(
      resolveTavilyMemberOptions(
        { enabled: true, apiKeyEnv: 'TAVILY_API_KEY'  },
        async () => {
          throw new Error('credentials service unreachable')
        },
      ),
    )
    const caught = await provider.search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.requestFailed })
    expect((caught as Error).message).toContain('credential resolution failed')
  })
})
describe('S21 T2: Tavily extract face (web_fetch member)', () => {
  const fetchFace = () => new TavilySearchProvider(options)

  it('posts the single URL to /extract with markdown format and maps raw_content to a text body', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({
      results: [{ url: 'https://a.test', raw_content: '# Page Title\n\nBody text.' }],
      failed_results: [],
    }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchFace().fetch({ url: 'https://a.test' })

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${TAVILY_DEFAULT_BASE_URL}/extract`)
    expect(JSON.parse(init.body as string)).toEqual({ urls: ['https://a.test'], format: 'markdown' })
    expect(result).toEqual({
      url: 'https://a.test',
      statusCode: 200,
      body: { kind: 'text', content: '# Page Title\n\nBody text.' },
      truncated: false,
    })
  })

  it('a failed_results entry maps to a member error (chain degradation, not a fake success)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({
      results: [],
      failed_results: [{ url: 'https://b.test', error: '404' }],
    })))
    const caught = await fetchFace().fetch({ url: 'https://b.test' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.httpError })
    expect((caught as Error).message).toContain('b.test')
  })

  it('an empty results array with no failed entry is a bad response (fail-loud)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ results: [], failed_results: [] })))
    await expect(fetchFace().fetch({ url: 'https://c.test' }))
      .rejects.toMatchObject({ code: codes.badResponse })
  })

  it('implements the WebFetchProvider interface alongside search', () => {
    const provider = fetchFace() as { fetch?: (request: { url: string }) => Promise<unknown> }
    expect(typeof provider.fetch).toBe('function')
  })
})

