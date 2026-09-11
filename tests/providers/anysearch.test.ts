import { afterEach, describe, expect, it, vi } from 'vitest'
import { MEMBER_ERROR_CODES } from '../../src/errors.ts'
import {
  ANYSEARCH_DEFAULT_BASE_URL,
  AnysearchSearchProvider,
  mapAnysearchResponse,
  resolveAnysearchMemberOptions,
} from '../../src/providers/anysearch.ts'

const codes = MEMBER_ERROR_CODES.anysearch

/**
 * Mock-HTTP unit face for the `dshws-anysearch` member (S04/S05a pattern):
 * `vi.stubGlobal('fetch')` stands in for the wire, so every envelope shape
 * and failure mode is deterministic. Wire-level and envelope-through-chain
 * coverage lives in the loopback e2e tier.
 */
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

function makeProvider(overrides: Record<string, unknown> = {}): AnysearchSearchProvider {
  return new AnysearchSearchProvider(resolveAnysearchMemberOptions(
    {
      enabled: true,
      apiKeyEnv: 'ANYSEARCH_API_KEY',
      keySelection: 'order',
      ...overrides,
    },
    async () => 'anysearch-fake-key',
  ))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('S22 T4: unified searchLanguage fans out to AnySearch (BCP-47)', () => {
  it('zh maps to the zh-CN default region; an already-regional lower-case value is upper-cased, not re-mapped', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ code: 0, data: { results: [] } }))
    vi.stubGlobal('fetch', fetchMock)
    const provider = new AnysearchSearchProvider(resolveAnysearchMemberOptions(
      { enabled: true, apiKeyEnv: 'ANYSEARCH_API_KEY', keySelection: 'order' },
      async () => 'anysearch-fake-key',
      { language: 'zh' },
    ))
    await provider.search({ query: 'q' })
    let [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string).language).toBe('zh-CN')

    const regional = new AnysearchSearchProvider(resolveAnysearchMemberOptions(
      { enabled: true, apiKeyEnv: 'ANYSEARCH_API_KEY', keySelection: 'order' },
      async () => 'anysearch-fake-key',
      { language: 'zh-tw' },
    ))
    await regional.search({ query: 'q' })
    ;[, init] = fetchMock.mock.calls[1] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string).language).toBe('zh-TW')
  })

  it('a region-less non-zh language passes through; no fan-out language = not sent', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ code: 0, data: { results: [] } }))
    vi.stubGlobal('fetch', fetchMock)
    const provider = new AnysearchSearchProvider(resolveAnysearchMemberOptions(
      { enabled: true, apiKeyEnv: 'ANYSEARCH_API_KEY', keySelection: 'order' },
      async () => 'anysearch-fake-key',
      { language: 'en' },
    ))
    await provider.search({ query: 'q' })
    let [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string).language).toBe('en')

    const bare = new AnysearchSearchProvider(resolveAnysearchMemberOptions(
      { enabled: true, apiKeyEnv: 'ANYSEARCH_API_KEY', keySelection: 'order' },
      async () => 'anysearch-fake-key',
    ))
    await bare.search({ query: 'q' })
    ;[, init] = fetchMock.mock.calls[1] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string)).not.toHaveProperty('language')
  })
})

describe('dshws-anysearch mapping', () => {
  it('maps envelope results to normalized sources', () => {
    const result = mapAnysearchResponse({
      results: [{ url: 'https://a.test/1', title: 'A', snippet: 'first' }],
    })
    expect(result).toEqual({
      sources: [{ url: 'https://a.test/1', title: 'A', snippet: 'first' }],
      truncated: false,
    })
  })

  it('prefers snippet when both snippet and content exist (priority locked)', () => {
    const result = mapAnysearchResponse({
      results: [{ url: 'https://a.test/2', title: 'B', snippet: 'the snippet', content: 'the long content' }],
    })
    expect(result.sources[0]).toEqual({ url: 'https://a.test/2', title: 'B', snippet: 'the snippet' })
  })

  it('falls back to content as snippet when snippet is absent (official mapping gap)', () => {
    const result = mapAnysearchResponse({
      results: [{ url: 'https://a.test/3', title: 'C', content: 'content fallback' }],
    })
    expect(result.sources[0]).toEqual({ url: 'https://a.test/3', title: 'C', snippet: 'content fallback' })
  })

  it('drops entries without a url', () => {
    const result = mapAnysearchResponse({
      results: [{ title: 'no url' }, { url: 'https://a.test/4' }],
    })
    expect(result.sources).toEqual([{ url: 'https://a.test/4' }])
  })
})

describe('dshws-anysearch wire behavior (mock HTTP)', () => {
  it('posts the envelope query with bearer auth and zone only when configured', async () => {
    const zoned = makeProvider({ baseURL: 'https://anysearch.example', zone: 'cn' })
    const fetchMock = vi.fn(async () => jsonResponse({ code: 0, data: { results: [{ url: 'https://a.test/z' }] } }))
    vi.stubGlobal('fetch', fetchMock)
    await zoned.search({ query: 'hello' })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://anysearch.example/v1/search')
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer anysearch-fake-key')
    expect(new Headers(init.headers).get('user-agent')).toBe('dsh-websearch/0.8.2')
    expect(JSON.parse(String(init.body))).toEqual({ query: 'hello', zone: 'cn' })

    const unzoned = makeProvider()
    const fetchMock2 = vi.fn(async () => jsonResponse({ code: 0, data: { results: [{ url: 'https://a.test/z' }] } }))
    vi.stubGlobal('fetch', fetchMock2)
    await unzoned.search({ query: 'hello' })
    const [, init2] = fetchMock2.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(String(init2.body))).not.toHaveProperty('zone')
  })

  it('returns normalized sources on a code-0 envelope', async () => {
    const provider = makeProvider()
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({
      code: 0,
      message: 'ok',
      data: { results: [{ url: 'https://a.test/ok', title: 'OK', snippet: 's' }] },
      request_id: 'req-1',
    })))
    const result = await provider.search({ query: 'q' })
    expect(result.sources).toEqual([{ url: 'https://a.test/ok', title: 'OK', snippet: 's' }])
    expect(result.content).toBeUndefined()
  })

  it('maps a business-error envelope (HTTP 200, code !== 0) to the http error code', async () => {
    const provider = makeProvider()
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({
      code: 1001,
      message: 'quota exhausted',
      request_id: 'req-42',
    })))
    const thrown = await provider.search({ query: 'q' }).then(() => null, (error: unknown) => error as Error)
    expect((thrown as unknown as { code: string }).code).toBe('DSHWS_ANYSEARCH_HTTP_ERROR')
    expect(thrown!.message).toContain('1001')
    expect(thrown!.message).toContain('quota exhausted')
    expect(thrown!.message).toContain('req-42')
  })

  it('maps HTTP 429 to the http error code with the status literal', async () => {
    const provider = makeProvider()
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({}, 429)))
    const thrown = await provider.search({ query: 'q' }).then(() => null, (error: unknown) => error as Error)
    expect((thrown as unknown as { code: string }).code).toBe('DSHWS_ANYSEARCH_HTTP_ERROR')
    expect(thrown!.message).toContain('429')
  })

  it('maps a network refusal to the request-failure code', async () => {
    const provider = makeProvider()
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('fetch failed')
    }))
    const thrown = await provider.search({ query: 'q' }).then(() => null, (error: unknown) => error as Error)
    expect((thrown as unknown as { code: string }).code).toBe('DSHWS_ANYSEARCH_REQUEST_FAILED')
  })

  it('maps a hung request aborted by the caller budget to the aborted code', async () => {
    const provider = makeProvider({ perMemberTimeoutMs: undefined })
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })))
    const controller = new AbortController()
    const pending = provider.search({ query: 'q' }, controller.signal).then(() => null, (error: unknown) => error as Error)
    controller.abort()
    const thrown = await pending
    expect((thrown as unknown as { code: string }).code).toBe('DSHWS_ANYSEARCH_ABORTED')
  })

  it('maps a non-JSON success body to the bad-response code', async () => {
    const provider = makeProvider()
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not json', { headers: { 'content-type': 'application/json' } })))
    const thrown = await provider.search({ query: 'q' }).then(() => null, (error: unknown) => error as Error)
    expect((thrown as unknown as { code: string }).code).toBe('DSHWS_ANYSEARCH_BAD_RESPONSE')
  })
})

describe('dshws-anysearch availability and anchors', () => {
  it('is available when the base URL parses and unavailable otherwise', () => {
    expect(makeProvider().available()).toBe(true)
    expect(new AnysearchSearchProvider(resolveAnysearchMemberOptions(
      { enabled: true, apiKeyEnv: 'ANYSEARCH_API_KEY', baseURL: 'not a url'  },
      async () => 'k',
    )).available()).toBe(false)
  })

  it('keeps the documented endpoint anchor', () => {
    expect(ANYSEARCH_DEFAULT_BASE_URL).toBe('https://api.anysearch.com')
  })
})
describe('S21 T3: AnySearch extract face (web_fetch member, probe-backed contract)', () => {
  it('posts the single URL to /v1/extract and maps data.content to a text body (markdown)', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({
      code: 0, message: 'success', request_id: 'r1',
      data: { url: 'https://a.test', title: 'A', content: '# Extracted\n\nBody.' },
    }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await makeProvider().fetch({ url: 'https://a.test' })

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${ANYSEARCH_DEFAULT_BASE_URL}/v1/extract`)
    expect(JSON.parse(init.body as string)).toEqual({ url: 'https://a.test' })
    expect(result).toEqual({
      url: 'https://a.test',
      statusCode: 200,
      body: { kind: 'text', content: '# Extracted\n\nBody.' },
      truncated: false,
    })
  })

  it('content at the ~50k probe cap maps truncated: true (defensive band 49900)', async () => {
    const big = 'x'.repeat(49_934)
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({
      code: 0, message: 'success',
      data: { url: 'https://a.test', content: big },
    })))
    const result = await makeProvider().fetch({ url: 'https://a.test' })
    expect(result.truncated).toBe(true)
  })

  it('business error code!==0 maps to the member error (chain degradation): extract_failed', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({
      code: -1, message: 'Unable to extract content from the URL.', error_code: 'extract_failed',
    })))
    const caught = await makeProvider().fetch({ url: 'https://b.test' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.httpError })
    expect((caught as Error).message).toContain('Unable to extract')
  })

  it('missing data.content on code 0 is a bad response (fail-loud)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ code: 0, message: 'success', data: {} })))
    await expect(makeProvider().fetch({ url: 'https://c.test' }))
      .rejects.toMatchObject({ code: codes.badResponse })
  })
})

