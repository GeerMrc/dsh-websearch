import { describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import type { WebSearchProvider } from '@deepseek-ai/dsh-web'
import { apply, inject, name } from '../src/index.ts'
import { fakeCtx, flushGate } from './helpers/fake-ctx.ts'

describe('apply assembly', () => {
  it('registers the chains and all five members with ctx.web (double registration topology)', () => {
    const { ctx, search, fetch } = fakeCtx()
    apply(ctx as unknown as Context, {})
    expect(search).toEqual(['dshws-chain', 'dshws-tavily', 'dshws-exa', 'dshws-perplexity', 'dshws-firecrawl', 'dshws-deepseek'])
    expect(fetch).toEqual(['dshws-chain-fetch', 'dshws-firecrawl'])
  })

  it('exposes the chain as unavailable while no credentials are configured', () => {
    const { ctx, providers } = fakeCtx()
    apply(ctx as unknown as Context, {})
    const chain = providers.get('dshws-chain') as WebSearchProvider
    expect(chain.available()).toBe(false)
  })

  it('reports plugin name and inject surface for the loader', () => {
    expect(name).toBe('dsh-websearch')
    expect(inject).toEqual(['web', 'credentials'])
  })
})

describe('apply credential wiring (凭据热刷新，宪法必测挂账 V-05)', () => {
  it('chain availability flips when a ref is configured, and flips back when removed', async () => {
    const { ctx, providers, configured, emitUpdated } = fakeCtx()
    apply(ctx as unknown as Context, {})
    const chain = providers.get('dshws-chain') as WebSearchProvider

    await flushGate()
    expect(chain.available()).toBe(false)

    configured.add('TAVILY_API_KEY')
    emitUpdated('TAVILY_API_KEY')
    await vi.waitFor(() => expect(chain.available()).toBe(true))

    configured.delete('TAVILY_API_KEY')
    emitUpdated('TAVILY_API_KEY')
    await vi.waitFor(() => expect(chain.available()).toBe(false))
  })

  it('a configured key makes the member ready after the initial prime (no event needed)', async () => {
    const { ctx, providers, configured } = fakeCtx()
    configured.add('DEEPSEEK_API_KEY')
    apply(ctx as unknown as Context, {})
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await vi.waitFor(() => expect(chain.available()).toBe(true))
  })

  it('a disabled member never contributes readiness even with its key configured', async () => {
    const { ctx, providers, configured } = fakeCtx()
    configured.add('TAVILY_API_KEY')
    apply(ctx as unknown as Context, { tavily: { enabled: false } })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    expect(chain.available()).toBe(false)
  })

  it('an extra pool ref alone contributes readiness when the primary is unconfigured (ADR-0008)', async () => {
    const { ctx, providers, configured } = fakeCtx()
    configured.add('TAVILY_SPARE')
    apply(ctx as unknown as Context, { tavily: { extraApiKeyEnvs: ['TAVILY_SPARE'] } })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    expect(chain.available()).toBe(true)
  })

  it('an extra pool ref name outside the credential grammar fails loud at load', () => {
    const { ctx } = fakeCtx()
    expect(() => apply(ctx as unknown as Context, { tavily: { extraApiKeyEnvs: ['not a valid ref!'] } }))
      .toThrow(TypeError)
  })

  it('the pool thunk resolves through the first ready ref, skipping an unconfigured primary', async () => {
    const { ctx, providers, configured } = fakeCtx()
    configured.add('TAVILY_SPARE')
    apply(ctx as unknown as Context, {
      tavily: { extraApiKeyEnvs: ['TAVILY_SPARE'], keySelection: 'order' },
    })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ results: [{ url: 'https://tv.test' }] }), { headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await chain.search({ query: 'q' })
    expect(result.sources).toEqual([{ url: 'https://tv.test' }])
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer fake-key')
  })

  it('a ref name outside the credential grammar fails loud at load (misconfiguration)', () => {
    const { ctx } = fakeCtx()
    expect(() => apply(ctx as unknown as Context, { tavily: { apiKeyEnv: 'not a valid ref!' } }))
      .toThrow(TypeError)
  })
})

describe('apply key-pool hot path (ADR-0008 settings 提交侧)', () => {
  it('a committed keySelection swap reaches the next search without re-registration', async () => {
    const { ctx, providers, configured, commitSettings } = fakeCtx({
      values: { TAVILY_API_KEY: 'k1', TAVILY_SPARE: 'k2' },
    })
    configured.add('TAVILY_API_KEY')
    configured.add('TAVILY_SPARE')
    apply(ctx as unknown as Context, { tavily: { extraApiKeyEnvs: ['TAVILY_SPARE'] } })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    const authOf = async (): Promise<string> => {
      const [, init] = fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit]
      return new Headers(init.headers).get('authorization')!
    }
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ results: [{ url: 'https://tv.test' }] }), { headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)

    await chain.search({ query: 'a' })
    await chain.search({ query: 'b' })
    expect(await authOf()).toBe('Bearer k1')

    commitSettings({ tavily: { extraApiKeyEnvs: ['TAVILY_SPARE'], keySelection: 'round-robin' } })
    // The cursor starts at 0 over the ready sequence in pool order: primary
    // first, then the spare — the second post-swap search pins the policy.
    await chain.search({ query: 'c' })
    expect(await authOf()).toBe('Bearer k1')
    await chain.search({ query: 'd' })
    expect(await authOf()).toBe('Bearer k2')
  })

  it('a pool ref added by a settings commit is primed without an event (pre-stored key)', async () => {
    const { ctx, providers, configured, commitSettings } = fakeCtx({ values: { TAVILY_SPARE: 'spare' } })
    configured.add('TAVILY_SPARE')
    apply(ctx as unknown as Context, {})
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    expect(chain.available()).toBe(false)

    commitSettings({ tavily: { extraApiKeyEnvs: ['TAVILY_SPARE'] } })
    await vi.waitFor(() => expect(chain.available()).toBe(true))
  })

  it('a pool ref removed by a settings commit stops contributing readiness', async () => {
    const { ctx, providers, configured, commitSettings } = fakeCtx()
    configured.add('TAVILY_SPARE')
    apply(ctx as unknown as Context, { tavily: { extraApiKeyEnvs: ['TAVILY_SPARE'] } })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    expect(chain.available()).toBe(true)

    commitSettings({ tavily: { extraApiKeyEnvs: [] } })
    await vi.waitFor(() => expect(chain.available()).toBe(false))
  })
})

describe('apply settings wiring (热改链序/超时/启停，S05a)', () => {
  it('hot-applies a chain reorder: the NEXT search walks members in the new order', async () => {
    const { ctx, providers, configured, commitSettings } = fakeCtx()
    configured.add('TAVILY_API_KEY')
    configured.add('DEEPSEEK_API_KEY')
    apply(ctx as unknown as Context, {})
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()

    // Every member fails with HTTP 500, so the exhausted summary records the
    // walk order: built-in order puts tavily before deepseek.
    vi.stubGlobal('fetch', vi.fn(async (_url: string | URL | Request) =>
      new Response('server error', { status: 500 })))
    const first = await chain.search({ query: 'q' }).then(() => null, (error: unknown) => error as Error)
    expect(first).toBeDefined()
    const tavilyLine = '- dshws-tavily:'
    const deepseekLine = '- dshws-deepseek:'
    expect(first!.message.indexOf(tavilyLine)).toBeGreaterThan(-1)
    expect(first!.message.indexOf(tavilyLine)).toBeLessThan(first!.message.indexOf(deepseekLine))

    commitSettings({ searchChain: ['dshws-deepseek', 'dshws-tavily'] })
    const second = await chain.search({ query: 'q' }).then(() => null, (error: unknown) => error as Error)
    expect(second).toBeDefined()
    expect(second!.message.indexOf(deepseekLine)).toBeGreaterThan(-1)
    expect(second!.message.indexOf(deepseekLine)).toBeLessThan(second!.message.indexOf(tavilyLine))
  })

  it('hot-applies the timeout budget: a raised budget lets a slow member win the next search', async () => {
    const { ctx, providers, configured, commitSettings } = fakeCtx()
    configured.add('TAVILY_API_KEY')
    configured.add('DEEPSEEK_API_KEY')
    apply(ctx as unknown as Context, { perMemberTimeoutMs: 30 })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()

    // Tavily (first in the built-in order) hangs past the 30ms budget; the
    // chain times it out and degrades to deepseek.
    let tavilyHangs = true
    vi.stubGlobal('fetch', vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const target = String(url)
      if (target.includes('api.tavily.com') && tavilyHangs) {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        })
      }
      if (target.includes('/messages')) {
        return new Response(JSON.stringify({
          content: [{ type: 'web_search_tool_result', content: [{ type: 'web_search_result', url: 'https://ds.test' }] }],
        }), { headers: { 'content-type': 'application/json' } })
      }
      return new Response(JSON.stringify({ results: [{ url: 'https://tv.test' }] }), { headers: { 'content-type': 'application/json' } })
    }))

    const degraded = await chain.search({ query: 'q' })
    expect(degraded.sources).toEqual([{ url: 'https://ds.test' }])

    // Raising the budget through settings lets the same slow tavily answer in time.
    tavilyHangs = false
    const slowDelay = new Promise((resolve) => setTimeout(resolve, 60))
    commitSettings({ perMemberTimeoutMs: 5000 })
    vi.stubGlobal('fetch', vi.fn(async (url: string | URL | Request) => {
      if (String(url).includes('api.tavily.com')) {
        await slowDelay
        return new Response(JSON.stringify({ results: [{ url: 'https://tv.test' }] }), { headers: { 'content-type': 'application/json' } })
      }
      throw new TypeError('unexpected member call')
    }))
    const warmed = await chain.search({ query: 'q' })
    expect(warmed.sources).toEqual([{ url: 'https://tv.test' }])
  })

  it('hot-applies a member disable: the disabled member stops contributing readiness', async () => {
    const { ctx, providers, configured, commitSettings } = fakeCtx()
    configured.add('TAVILY_API_KEY')
    apply(ctx as unknown as Context, {})
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await vi.waitFor(() => expect(chain.available()).toBe(true))

    commitSettings({ tavily: { enabled: false } })
    expect(chain.available()).toBe(false)
    const caught = await chain.search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(caught).toMatchObject({ code: 'DSHWS_NO_MEMBER_CONFIGURED' })
  })

  it('works without a settings service: the entry config stays authoritative', async () => {
    const { ctx, providers, configured } = fakeCtx({ withSettings: false })
    configured.add('TAVILY_API_KEY')
    apply(ctx as unknown as Context, { searchChain: ['dshws-tavily', 'dshws-deepseek'] })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    expect(chain.available()).toBe(true)
  })
})
