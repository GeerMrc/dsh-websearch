import { afterEach, describe, expect, it, vi } from 'vitest'
import type { WebSearchResult } from '@deepseek-ai/dsh-web'
import type { DeepSeekMemberConfig } from '../../src/config.ts'
import {
  DEEPSEEK_API_VERSION,
  DEEPSEEK_DEFAULT_BASE_URL,
  DEEPSEEK_DEFAULT_MAX_TOKENS,
  DEEPSEEK_DEFAULT_MODEL,
  DEEPSEEK_DEFAULT_MAX_USES,
  DEEPSEEK_MEMBER_ID,
  DeepSeekSearchProvider,
  mapDeepSeekResponse,
  resolveDeepSeekMemberOptions,
} from '../../src/providers/deepseek.ts'
import { MEMBER_ERROR_CODES } from '../../src/errors.ts'

const codes = MEMBER_ERROR_CODES.deepseek

const options = resolveDeepSeekMemberOptions(
  { enabled: true, apiKeyEnv: 'DEEPSEEK_API_KEY'  } satisfies DeepSeekMemberConfig,
  async () => 'dk-key',
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

describe('dshws-deepseek option resolution', () => {
  it('fills provider defaults explicitly for omitted baseURL/model/maxTokens', () => {
    const resolved = resolveDeepSeekMemberOptions({ enabled: true, apiKeyEnv: 'DEEPSEEK_API_KEY'  }, async () => undefined)
    expect(resolved.baseURL).toBe(DEEPSEEK_DEFAULT_BASE_URL)
    expect(resolved.model).toBe(DEEPSEEK_DEFAULT_MODEL)
    expect(resolved.maxTokens).toBe(DEEPSEEK_DEFAULT_MAX_TOKENS)
    expect(resolved.apiKeyRef).toBe('DEEPSEEK_API_KEY')
  })

  it('passes explicit baseURL/model/maxTokens through untouched', () => {
    const resolved = resolveDeepSeekMemberOptions(
      { enabled: true, apiKeyEnv: 'MY_KEY', baseURL: 'https://proxy.test/v1', model: 'm1', maxTokens: 128  },
      async () => undefined,
    )
    expect(resolved.baseURL).toBe('https://proxy.test/v1')
    expect(resolved.model).toBe('m1')
    expect(resolved.maxTokens).toBe(128)
    expect(resolved.apiKeyRef).toBe('MY_KEY')
  })
})

describe('dshws-deepseek availability (local checks only)', () => {
  it('registers under the dshws- prefixed member id', () => {
    expect(new DeepSeekSearchProvider(options).id).toBe(DEEPSEEK_MEMBER_ID)
  })

  it('is available with a parseable baseURL and a positive maxTokens', () => {
    expect(new DeepSeekSearchProvider(options).available()).toBe(true)
    expect(new DeepSeekSearchProvider({ ...options, baseURL: 'not a url' }).available()).toBe(false)
    expect(new DeepSeekSearchProvider({ ...options, maxTokens: 0 }).available()).toBe(false)
  })
})

describe('dshws-deepseek request mapping', () => {
  it('sends the Messages request with native web_search tool and dual auth headers', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ content: [{ type: 'web_search_tool_result', content: [] }] }))
    vi.stubGlobal('fetch', fetchMock)

    await new DeepSeekSearchProvider(options).search({ query: 'hello' })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${DEEPSEEK_DEFAULT_BASE_URL}/messages`)
    expect(init).toMatchObject({ method: 'POST', redirect: 'error' })
    const headers = init.headers as Record<string, string>
    expect(headers['x-api-key']).toBe('dk-key')
    expect(headers['authorization']).toBe('Bearer dk-key')
    expect(headers['anthropic-version']).toBe(DEEPSEEK_API_VERSION)
    expect(headers['content-type']).toBe('application/json')
    expect(headers['user-agent']).toBe('dsh-websearch/0.7.1')
    expect(JSON.parse(init.body as string)).toEqual({
      model: DEEPSEEK_DEFAULT_MODEL,
      max_tokens: DEEPSEEK_DEFAULT_MAX_TOKENS,
      messages: [{
        role: 'user',
        content: [{ type: 'text', text: 'Perform a web search for the query: hello' }],
      }],
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: DEEPSEEK_DEFAULT_MAX_USES }],
    })
  })
})

describe('dshws-deepseek response mapping', () => {
  it('maps result blocks to sources, joins citation snippets, dedupes by url, omits content', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({
      content: [
        { type: 'text', text: 'answer text', citations: [{ url: 'https://a.test', cited_text: 'snippet a' }] },
        {
          type: 'web_search_tool_result',
          content: [
            { type: 'web_search_result', url: 'https://a.test', title: 'A', page_age: '2026-01-01' },
            { type: 'web_search_result', url: 'https://b.test' },
          ],
        },
        { type: 'web_search_tool_result', content: [{ type: 'web_search_result', url: 'https://a.test' }] },
      ],
    }))
    vi.stubGlobal('fetch', fetchMock)

    const result: WebSearchResult = await new DeepSeekSearchProvider(options).search({ query: 'q' })

    expect(result.content).toBeUndefined()
    expect(result.truncated).toBe(false)
    expect(result.sources).toEqual([
      { url: 'https://a.test', title: 'A', snippet: 'snippet a', publishedAt: '2026-01-01' },
      { url: 'https://b.test' },
    ])
  })

  it('throws DSHWS_DEEPSEEK_BAD_RESPONSE when no web_search_tool_result block came back', () => {
    expect(() => mapDeepSeekResponse({ content: [{ type: 'text', text: 'no search happened' }] }))
      .toThrow(expect.objectContaining({ code: codes.badResponse }))
  })
})

describe('dshws-deepseek failure modes (mock HTTP)', () => {
  it('maps HTTP 429 with a non-JSON body to DSHWS_DEEPSEEK_HTTP_ERROR carrying the status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse('rate limited', 429)))
    const caught = await new DeepSeekSearchProvider(options).search({ query: 'q' }).then(
      () => null,
      (error: unknown) => error,
    )
    expect(caught).toMatchObject({ code: codes.httpError })
    expect((caught as Error).message).toContain('429')
  })

  it('unfolds a JSON error body into the HTTP error message when present', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: { message: 'quota exceeded' } }, 429)))
    const caught = await new DeepSeekSearchProvider(options).search({ query: 'q' }).then(
      () => null,
      (error: unknown) => error,
    )
    expect(caught).toMatchObject({ code: codes.httpError })
    expect((caught as Error).message).toContain('quota exceeded')
  })

  it('maps a network failure to DSHWS_DEEPSEEK_REQUEST_FAILED', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('network down')
    }))
    await expect(new DeepSeekSearchProvider(options).search({ query: 'q' }))
      .rejects.toMatchObject({ code: codes.requestFailed })
  })

  it('maps caller cancellation to DSHWS_DEEPSEEK_ABORTED (provider honors the signal)', async () => {
    const controller = new AbortController()
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })))
    const pending = new DeepSeekSearchProvider(options).search({ query: 'q' }, controller.signal)
    controller.abort()
    await expect(pending).rejects.toMatchObject({ code: codes.aborted })
  })

  it('throws DSHWS_DEEPSEEK_CREDENTIAL_MISSING without calling the wire when no key resolves', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const provider = new DeepSeekSearchProvider(
      resolveDeepSeekMemberOptions({ enabled: true, apiKeyEnv: 'DEEPSEEK_API_KEY'  }, async () => undefined),
    )
    const caught = await provider.search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.credentialMissing })
    expect((caught as Error).message).toContain('DEEPSEEK_API_KEY')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps a credential-resolution rejection to DSHWS_DEEPSEEK_REQUEST_FAILED', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const provider = new DeepSeekSearchProvider(
      resolveDeepSeekMemberOptions(
        { enabled: true, apiKeyEnv: 'DEEPSEEK_API_KEY'  },
        async () => {
          throw new Error('credentials service unreachable')
        },
      ),
    )
    const caught = await provider.search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.requestFailed })
    expect((caught as Error).message).toContain('credential resolution failed')
  })

  it('maps an unprocessable JSON success body to DSHWS_DEEPSEEK_BAD_RESPONSE', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse('not json at all')))
    const caught = await new DeepSeekSearchProvider(options).search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: codes.badResponse })
  })
})


describe('maxUses configuration (S14c, host parity)', () => {
  it('defaults to 10 and flows a configured value into the wire max_uses', async () => {
    const base = resolveDeepSeekMemberOptions(
      { enabled: true, apiKeyEnv: 'DEEPSEEK_API_KEY' },
      async () => 'sk-test',
    )
    expect(base.maxUses).toBe(10)
    const custom = resolveDeepSeekMemberOptions(
      { enabled: true, apiKeyEnv: 'DEEPSEEK_API_KEY', maxUses: 2 },
      async () => 'sk-test',
    )
    expect(custom.maxUses).toBe(2)
  })
})
