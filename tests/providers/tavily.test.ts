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
  { enabled: true, apiKeyEnv: 'TAVILY_API_KEY' } satisfies TavilyMemberConfig,
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
    const resolved = resolveTavilyMemberOptions({ enabled: true, apiKeyEnv: 'TAVILY_API_KEY' }, async () => undefined)
    expect(resolved.baseURL).toBe(TAVILY_DEFAULT_BASE_URL)
    expect(resolved.apiKeyRef).toBe('TAVILY_API_KEY')
    expect(resolved.maxResults).toBeUndefined()
  })

  it('passes explicit baseURL/maxResults through untouched', () => {
    const resolved = resolveTavilyMemberOptions(
      { enabled: true, apiKeyEnv: 'MY_KEY', baseURL: 'https://proxy.test', maxResults: 7 },
      async () => undefined,
    )
    expect(resolved.baseURL).toBe('https://proxy.test')
    expect(resolved.maxResults).toBe(7)
    expect(resolved.apiKeyRef).toBe('MY_KEY')
  })
})

describe('dshws-tavily availability (local checks only)', () => {
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
    expect(headers['user-agent']).toBe('dsh-websearch/0.1.0')
    expect(JSON.parse(init.body as string)).toEqual({ query: 'hello', max_results: 5 })
  })

  it('falls back to the configured maxResults when a request omits it (passthrough, no clamp)', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    await new TavilySearchProvider({ ...options, maxResults: 7 }).search({ query: 'q' })
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toEqual({ query: 'q', max_results: 7 })
  })

  it('omits max_results when neither the request nor the config sets one', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    await new TavilySearchProvider(options).search({ query: 'q' })
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string)).not.toHaveProperty('max_results')
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
    expect(caught).toMatchObject({ code: codes.httpError })
    expect((caught as Error).message).toContain('429')
  })

  it('unfolds a JSON error body into the HTTP error message when present', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ detail: 'invalid api key' }, 401)))
    const caught = await new TavilySearchProvider(options).search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.httpError })
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
      resolveTavilyMemberOptions({ enabled: true, apiKeyEnv: 'TAVILY_API_KEY' }, async () => undefined),
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
        { enabled: true, apiKeyEnv: 'TAVILY_API_KEY' },
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
