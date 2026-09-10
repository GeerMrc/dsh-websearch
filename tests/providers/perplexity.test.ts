import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PerplexityMemberConfig } from '../../src/config.ts'
import { MEMBER_ERROR_CODES } from '../../src/errors.ts'
import {
  PERPLEXITY_DEFAULT_BASE_URL,
  PERPLEXITY_DEFAULT_MODEL,
  PERPLEXITY_MEMBER_ID,
  PerplexitySearchProvider,
  mapPerplexityResponse,
  resolvePerplexityMemberOptions,
} from '../../src/providers/perplexity.ts'

const codes = MEMBER_ERROR_CODES.perplexity

const options = resolvePerplexityMemberOptions(
  { enabled: true, apiKeyEnv: 'PERPLEXITY_API_KEY'  } satisfies PerplexityMemberConfig,
  async () => 'pplx-key',
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

describe('dshws-perplexity option resolution', () => {
  it('fills the default base URL and model explicitly, passes apiKeyEnv through', () => {
    const resolved = resolvePerplexityMemberOptions(
      { enabled: true, apiKeyEnv: 'PERPLEXITY_API_KEY'  },
      async () => undefined,
    )
    expect(resolved.baseURL).toBe(PERPLEXITY_DEFAULT_BASE_URL)
    expect(resolved.model).toBe(PERPLEXITY_DEFAULT_MODEL)
    expect(resolved.apiKeyRef).toBe('PERPLEXITY_API_KEY')
    // S17 P1 defaults: the explicit 1024 token cap stays; filters absent until set.
    expect(resolved.maxTokens).toBe(1024)
    expect(resolved.searchRecencyFilter).toBeUndefined()
    expect(resolved.searchContextSize).toBeUndefined()
  })

  it('passes explicit baseURL/model through untouched', () => {
    const resolved = resolvePerplexityMemberOptions(
      { enabled: true, apiKeyEnv: 'MY_KEY', baseURL: 'https://proxy.test', model: 'sonar-pro'  },
      async () => undefined,
    )
    expect(resolved.baseURL).toBe('https://proxy.test')
    expect(resolved.model).toBe('sonar-pro')
    expect(resolved.apiKeyRef).toBe('MY_KEY')
  })
})

describe('dshws-perplexity availability (local checks only)', () => {
  it('registers under the dshws- prefixed member id', () => {
    expect(new PerplexitySearchProvider(options).id).toBe(PERPLEXITY_MEMBER_ID)
  })

  it('is available with a parseable baseURL', () => {
    expect(new PerplexitySearchProvider(options).available()).toBe(true)
    expect(new PerplexitySearchProvider({ ...options, baseURL: 'not a url' }).available()).toBe(false)
  })
})

describe('dshws-perplexity request mapping', () => {
  it('sends the Agent API request with the prefixed model, input, and the web_search tool always on', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ output: [] }))
    vi.stubGlobal('fetch', fetchMock)

    await new PerplexitySearchProvider(options).search({ query: 'hello' })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${PERPLEXITY_DEFAULT_BASE_URL}/v1/agent`)
    expect(init).toMatchObject({ method: 'POST', redirect: 'error' })
    const headers = init.headers as Record<string, string>
    expect(headers['authorization']).toBe('Bearer pplx-key')
    expect(headers['content-type']).toBe('application/json')
    expect(headers['user-agent']).toBe('dsh-websearch/0.3.0')
    expect(JSON.parse(init.body as string)).toEqual({
      model: 'perplexity/sonar',
      input: 'hello',
      max_output_tokens: 1024,
      // web_search is OPT-IN on the Agent API — the tool rides along on every
      // request or the member answers from parametric memory (S18 D1).
      tools: [{ type: 'web_search' }],
    })
  })

  it('S18: configured maxTokens lands as max_output_tokens (1024 腰斩修复 = 可配)', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ output: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const resolved = resolvePerplexityMemberOptions(
      { enabled: true, apiKeyEnv: 'PERPLEXITY_API_KEY', maxTokens: 4096 } satisfies PerplexityMemberConfig,
      async () => 'pplx-key',
    )
    await new PerplexitySearchProvider(resolved).search({ query: 'q' })
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body.max_output_tokens).toBe(4096)
    expect(body).not.toHaveProperty('max_tokens')
  })

  it('S18: recency nests INSIDE the web_search tool filters; context size sits on the tool top level', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ output: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const resolved = resolvePerplexityMemberOptions(
      { enabled: true, apiKeyEnv: 'PERPLEXITY_API_KEY', searchRecencyFilter: 'week', searchContextSize: 'high' } satisfies PerplexityMemberConfig,
      async () => 'pplx-key',
    )
    await new PerplexitySearchProvider(resolved).search({ query: 'q' })
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body.tools).toEqual([{
      type: 'web_search',
      filters: { search_recency_filter: 'week' },
      search_context_size: 'high',
    }])
    expect(body).not.toHaveProperty('search_recency_filter')
    expect(body).not.toHaveProperty('web_search_options')
  })

  it('S18: neither filter set → the web_search tool carries only its type', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ output: [] }))
    vi.stubGlobal('fetch', fetchMock)
    await new PerplexitySearchProvider(options).search({ query: 'q' })
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body.tools).toEqual([{ type: 'web_search' }])
    expect(body.messages).toBeUndefined()
  })

  it('S18: unified country joins the web_search tool user_location; language lands as top-level language_preference', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ output: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const resolved = resolvePerplexityMemberOptions(
      { enabled: true, apiKeyEnv: 'PERPLEXITY_API_KEY', searchContextSize: 'high' } satisfies PerplexityMemberConfig,
      async () => 'pplx-key',
      { country: 'CN', language: 'zh' },
    )
    await new PerplexitySearchProvider(resolved).search({ query: 'q' })
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(body.tools).toEqual([{
      type: 'web_search',
      search_context_size: 'high',
      user_location: { country: 'CN' },
    }])
    expect(body.language_preference).toBe('zh')
  })

  it('S18: bare model names gain the perplexity/ prefix; already-prefixed names pass through', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ output: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const bare = resolvePerplexityMemberOptions(
      { enabled: true, apiKeyEnv: 'PERPLEXITY_API_KEY', model: 'sonar-pro' } satisfies PerplexityMemberConfig,
      async () => 'pplx-key',
    )
    await new PerplexitySearchProvider(bare).search({ query: 'q' })
    let body = JSON.parse((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body as string)
    expect(body.model).toBe('perplexity/sonar-pro')

    const prefixed = resolvePerplexityMemberOptions(
      { enabled: true, apiKeyEnv: 'PERPLEXITY_API_KEY', model: 'perplexity/sonar-deep-research' } satisfies PerplexityMemberConfig,
      async () => 'pplx-key',
    )
    await new PerplexitySearchProvider(prefixed).search({ query: 'q' })
    body = JSON.parse((fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit])[1].body as string)
    expect(body.model).toBe('perplexity/sonar-deep-research')
  })
})

describe('dshws-perplexity response mapping', () => {
  it('prefers structured search_results and carries the generated answer as content', () => {
    const result = mapPerplexityResponse({
      choices: [{ message: { content: 'generated answer' } }],
      search_results: [
        { url: 'https://a.test', title: 'A', snippet: 'salient', date: '2026-01-01' },
        { url: 'https://b.test' },
      ],
    })
    expect(result.content).toBe('generated answer')
    expect(result.truncated).toBe(false)
    expect(result.sources).toEqual([
      { url: 'https://a.test', title: 'A', snippet: 'salient', publishedAt: '2026-01-01' },
      { url: 'https://b.test' },
    ])
  })

  it('falls back to URL-only citations only when search_results is absent', () => {
    const withCitations = mapPerplexityResponse({
      choices: [{ message: { content: 'answer' } }],
      citations: ['https://c.test', 'https://d.test'],
    })
    expect(withCitations.sources).toEqual([{ url: 'https://c.test' }, { url: 'https://d.test' }])

    const searchResultsPresent = mapPerplexityResponse({
      choices: [{ message: { content: 'answer' } }],
      citations: ['https://c.test'],
      search_results: [{ url: 'https://a.test' }],
    })
    expect(searchResultsPresent.sources).toEqual([{ url: 'https://a.test' }])
  })

  it('omits content when the answer is empty and tolerates a missing choices array', () => {
    expect(mapPerplexityResponse({ choices: [{ message: { content: '' } }] }).content).toBeUndefined()
    expect(mapPerplexityResponse({}).content).toBeUndefined()
    expect(mapPerplexityResponse({}).sources).toEqual([])
  })
})

describe('dshws-perplexity failure modes (mock HTTP)', () => {
  it('maps HTTP 429 with a non-JSON body to DSHWS_PERPLEXITY_HTTP_ERROR carrying the status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse('rate limited', 429)))
    const caught = await new PerplexitySearchProvider(options).search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.httpError })
    expect((caught as Error).message).toContain('429')
  })

  it('unfolds a JSON error body into the HTTP error message when present', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: { message: 'quota exceeded' } }, 429)))
    const caught = await new PerplexitySearchProvider(options).search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.httpError })
    expect((caught as Error).message).toContain('quota exceeded')
  })

  it('maps a network failure to DSHWS_PERPLEXITY_REQUEST_FAILED', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('network down')
    }))
    await expect(new PerplexitySearchProvider(options).search({ query: 'q' }))
      .rejects.toMatchObject({ code: codes.requestFailed })
  })

  it('maps caller cancellation to DSHWS_PERPLEXITY_ABORTED (provider honors the signal)', async () => {
    const controller = new AbortController()
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })))
    const pending = new PerplexitySearchProvider(options).search({ query: 'q' }, controller.signal)
    controller.abort()
    await expect(pending).rejects.toMatchObject({ code: codes.aborted })
  })

  it('throws DSHWS_PERPLEXITY_CREDENTIAL_MISSING without calling the wire when no key resolves', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const provider = new PerplexitySearchProvider(
      resolvePerplexityMemberOptions({ enabled: true, apiKeyEnv: 'PERPLEXITY_API_KEY'  }, async () => undefined),
    )
    const caught = await provider.search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.credentialMissing })
    expect((caught as Error).message).toContain('PERPLEXITY_API_KEY')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps a credential-resolution rejection to DSHWS_PERPLEXITY_REQUEST_FAILED', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const provider = new PerplexitySearchProvider(
      resolvePerplexityMemberOptions(
        { enabled: true, apiKeyEnv: 'PERPLEXITY_API_KEY'  },
        async () => {
          throw new Error('credentials service unreachable')
        },
      ),
    )
    const caught = await provider.search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.requestFailed })
    expect((caught as Error).message).toContain('credential resolution failed')
  })

  it('maps an unprocessable success body to DSHWS_PERPLEXITY_BAD_RESPONSE', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse('not json at all')))
    const caught = await new PerplexitySearchProvider(options).search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.badResponse })
  })
})
