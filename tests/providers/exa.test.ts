import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ExaMemberConfig } from '../../src/config.ts'
import { MEMBER_ERROR_CODES } from '../../src/errors.ts'
import {
  EXA_DEFAULT_BASE_URL,
  EXA_MEMBER_ID,
  ExaSearchProvider,
  mapExaResponse,
  mapExaResult,
  resolveExaMemberOptions,
} from '../../src/providers/exa.ts'

const codes = MEMBER_ERROR_CODES.exa

const options = resolveExaMemberOptions(
  { enabled: true, apiKeyEnv: 'EXA_API_KEY'  } satisfies ExaMemberConfig,
  async () => 'exa-key',
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

describe('dshws-exa option resolution', () => {
  it('fills the default base URL explicitly and passes apiKeyEnv through', () => {
    const resolved = resolveExaMemberOptions({ enabled: true, apiKeyEnv: 'EXA_API_KEY'  }, async () => undefined)
    expect(resolved.baseURL).toBe(EXA_DEFAULT_BASE_URL)
    expect(resolved.apiKeyRef).toBe('EXA_API_KEY')
    expect(resolved.numResults).toBeUndefined()
  })

  it('passes explicit baseURL/numResults through untouched', () => {
    const resolved = resolveExaMemberOptions(
      { enabled: true, apiKeyEnv: 'MY_KEY', baseURL: 'https://proxy.test', numResults: 8  },
      async () => undefined,
    )
    expect(resolved.baseURL).toBe('https://proxy.test')
    expect(resolved.numResults).toBe(8)
    expect(resolved.apiKeyRef).toBe('MY_KEY')
  })
})

describe('dshws-exa availability (local checks only)', () => {
  it('registers under the dshws- prefixed member id', () => {
    expect(new ExaSearchProvider(options).id).toBe(EXA_MEMBER_ID)
  })

  it('is available with a parseable baseURL', () => {
    expect(new ExaSearchProvider(options).available()).toBe(true)
    expect(new ExaSearchProvider({ ...options, baseURL: 'not a url' }).available()).toBe(false)
  })
})

describe('dshws-exa request mapping', () => {
  it('sends query, auto type, highlights and bearer auth to the search endpoint', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)

    await new ExaSearchProvider(options).search({ query: 'hello', maxResults: 5 })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${EXA_DEFAULT_BASE_URL}/search`)
    expect(init).toMatchObject({ method: 'POST', redirect: 'error' })
    const headers = init.headers as Record<string, string>
    expect(headers['authorization']).toBe('Bearer exa-key')
    expect(headers['content-type']).toBe('application/json')
    expect(headers['user-agent']).toBe('dsh-websearch/0.2.2')
    expect(JSON.parse(init.body as string)).toEqual({
      query: 'hello',
      type: 'auto',
      contents: { highlights: { query: 'hello', maxCharacters: 400 } },
      numResults: 5,
    })
  })

  it('falls back to the configured numResults when a request omits maxResults', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    await new ExaSearchProvider({ ...options, numResults: 7 }).search({ query: 'q' })
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toMatchObject({ numResults: 7 })
  })

  it('omits numResults when neither the request nor the config sets one', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    await new ExaSearchProvider(options).search({ query: 'q' })
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string)).not.toHaveProperty('numResults')
  })
})

describe('dshws-exa response mapping', () => {
  it('drops entries without a usable highlight and maps the rest', () => {
    const result = mapExaResponse({
      results: [
        { url: 'https://a.test', title: 'A', publishedDate: '2026-01-01', highlights: ['salient', 'second'] },
        { url: 'https://b.test', title: 'B', highlights: [] },
        { url: 'https://c.test', highlights: ['  '] },
      ],
    })
    expect(result.content).toBeUndefined()
    expect(result.truncated).toBe(false)
    expect(result.sources).toEqual([
      { url: 'https://a.test', title: 'A', snippet: 'salient', publishedAt: '2026-01-01' },
    ])
  })

  it('maps a single result entry, keeping the first non-blank highlight', () => {
    expect(mapExaResult({ url: 'https://a.test', highlights: ['  ', 'first real'] }))
      .toEqual({ url: 'https://a.test', snippet: 'first real' })
    expect(mapExaResult({ url: 'https://a.test', highlights: [] })).toBeUndefined()
  })

  it('tolerates a missing results array', () => {
    expect(mapExaResponse({}).sources).toEqual([])
  })
})

describe('dshws-exa failure modes (mock HTTP)', () => {
  it('maps HTTP 429 with a non-JSON body to DSHWS_EXA_HTTP_ERROR carrying the status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse('rate limited', 429)))
    const caught = await new ExaSearchProvider(options).search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.httpError })
    expect((caught as Error).message).toContain('429')
  })

  it('unfolds a JSON error body into the HTTP error message when present', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: 'quota exceeded' }, 429)))
    const caught = await new ExaSearchProvider(options).search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.httpError, httpStatus: 429 })
    expect((caught as Error).message).toContain('Exa API error (HTTP 429): quota exceeded')
  })

  it('maps a network failure to DSHWS_EXA_REQUEST_FAILED', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('network down')
    }))
    await expect(new ExaSearchProvider(options).search({ query: 'q' }))
      .rejects.toMatchObject({ code: codes.requestFailed })
  })

  it('maps caller cancellation to DSHWS_EXA_ABORTED (provider honors the signal)', async () => {
    const controller = new AbortController()
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })))
    const pending = new ExaSearchProvider(options).search({ query: 'q' }, controller.signal)
    controller.abort()
    await expect(pending).rejects.toMatchObject({ code: codes.aborted })
  })

  it('throws DSHWS_EXA_CREDENTIAL_MISSING without calling the wire when no key resolves', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const provider = new ExaSearchProvider(
      resolveExaMemberOptions({ enabled: true, apiKeyEnv: 'EXA_API_KEY'  }, async () => undefined),
    )
    const caught = await provider.search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.credentialMissing })
    expect((caught as Error).message).toContain('EXA_API_KEY')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps a credential-resolution rejection to DSHWS_EXA_REQUEST_FAILED', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const provider = new ExaSearchProvider(
      resolveExaMemberOptions(
        { enabled: true, apiKeyEnv: 'EXA_API_KEY'  },
        async () => {
          throw new Error('credentials service unreachable')
        },
      ),
    )
    const caught = await provider.search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.requestFailed })
    expect((caught as Error).message).toContain('credential resolution failed')
  })

  it('maps an unprocessable success body to DSHWS_EXA_BAD_RESPONSE', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse('not json at all')))
    const caught = await new ExaSearchProvider(options).search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.badResponse })
  })
})
