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
    expect(headers['user-agent']).toBe('dsh-websearch/0.1.0')
    expect(JSON.parse(init.body as string)).toEqual({ query: 'hello', limit: 5 })
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
    expect(JSON.parse(init.body as string)).toEqual({ url: 'https://a.test', formats: ['markdown'] })
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
