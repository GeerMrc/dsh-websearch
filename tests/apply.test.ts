import { describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import type { WebFetchProvider, WebSearchProvider } from '@deepseek-ai/dsh-web'
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

  it('a ref name outside the credential grammar fails loud at load (misconfiguration)', () => {
    const { ctx } = fakeCtx()
    expect(() => apply(ctx as unknown as Context, { tavily: { apiKeyEnv: 'not a valid ref!' } }))
      .toThrow(TypeError)
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
