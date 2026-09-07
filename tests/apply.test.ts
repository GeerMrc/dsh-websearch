import { describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import type { WebSearchProvider } from '@deepseek-ai/dsh-web'
import { apply, inject, name } from '../src/index.ts'
import { fakeCtx, flushGate } from './helpers/fake-ctx.ts'

describe('apply assembly', () => {
  it('registers the chains and all seven members with ctx.web (double registration topology, S14e +fetch-search)', () => {
    const { ctx, search, fetch } = fakeCtx()
    apply(ctx as unknown as Context, { deepseek: { enabled: true } })
    expect(search).toEqual(['dshws-chain', 'dshws-tavily', 'dshws-exa', 'dshws-perplexity', 'dshws-firecrawl', 'dshws-deepseek', 'dshws-anysearch', 'dshws-fetch-search'])
    expect(fetch).toEqual(['dshws-chain-fetch', 'dshws-firecrawl'])
  })

  it('the chain is AVAILABLE with no credentials — the free fetch floor (S14e 语义变更，用户设计)', () => {
    const { ctx, providers } = fakeCtx()
    apply(ctx as unknown as Context, {})
    const chain = providers.get('dshws-chain') as WebSearchProvider
    expect(chain.available()).toBe(true)
  })

  it('an explicit PAID fallback choice with no model key keeps the chain unavailable (S14e: paid is honest)', () => {
    const { ctx, providers } = fakeCtx()
    apply(ctx as unknown as Context, { fallbackProvider: 'deepseek' })
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
    apply(ctx as unknown as Context, { deepseek: { enabled: true } })
    const chain = providers.get('dshws-chain') as WebSearchProvider

    // S14e: with the free floor the chain stays available throughout; the
    // flip is now observable via the explicit paid choice below instead.
    await flushGate()
    expect(chain.available()).toBe(true)

    configured.add('TAVILY_API_KEY')
    emitUpdated('TAVILY_API_KEY')
    await vi.waitFor(() => expect(chain.available()).toBe(true))

    configured.delete('TAVILY_API_KEY')
    emitUpdated('TAVILY_API_KEY')
    await vi.waitFor(() => expect(chain.available()).toBe(true))
  })

  it('a configured key makes the member ready after the initial prime (no event needed)', async () => {
    const { ctx, providers, configured } = fakeCtx()
    configured.add('DEEPSEEK_API_KEY')
    apply(ctx as unknown as Context, { deepseek: { enabled: true } })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await vi.waitFor(() => expect(chain.available()).toBe(true))
  })

  it('a disabled member never contributes readiness even with its key configured (S14e: 断言移到付费选择面)', async () => {
    const { ctx, providers, configured } = fakeCtx()
    configured.add('TAVILY_API_KEY')
    apply(ctx as unknown as Context, { tavily: { enabled: false }, fallbackProvider: 'deepseek' })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    // Paid floor chosen, no model key: tavily's disable must keep it unusable.
    expect(chain.available()).toBe(false)
  })

  it('an anysearch ref name outside the credential grammar fails loud at load', () => {
    const { ctx } = fakeCtx()
    expect(() => apply(ctx as unknown as Context, { anysearch: { apiKeyEnv: 'not a valid ref!' } }))
      .toThrow(TypeError)
  })

  it('the anysearch member contributes readiness through its configured primary ref', async () => {
    const { ctx, providers, configured } = fakeCtx()
    configured.add('ANYSEARCH_API_KEY')
    apply(ctx as unknown as Context, { searchChain: ['dshws-anysearch'] })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    expect(chain.available()).toBe(true)
  })

  it('skips a member whose credential ref is unconfigured and serves from the next member (gate 跳过腿 e2e)', async () => {
    const { ctx, providers, configured } = fakeCtx()
    // Only exa configured — tavily primary NOT configured (skipped).
    configured.add('EXA_API_KEY')
    apply(ctx as unknown as Context, { searchChain: ['dshws-tavily', 'dshws-exa'] })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ results: [{ url: 'https://exa.test', highlights: ['exa snippet'] }] }), { headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await chain.search({ query: 'gate' })
    // The unconfigured tavily never reached fetch; exa served.
    const [url] = fetchMock.mock.calls[0] as unknown as [string]
    expect(url).toContain('exa')
    expect(result.sources.length).toBeGreaterThan(0)
  })

  it('a ref name outside the credential grammar fails loud at load (misconfiguration)', () => {
    const { ctx } = fakeCtx()
    expect(() => apply(ctx as unknown as Context, { tavily: { apiKeyEnv: 'not a valid ref!' } }))
      .toThrow(TypeError)
  })
})

describe('apply key-pool hot path (ADR-0011 单槽逗号值)', () => {
  it('a committed keySelection swap reaches the next search without re-registration', async () => {
    const { ctx, providers, configured, commitSettings } = fakeCtx({
      values: { TAVILY_API_KEY: 'k1,k2' },
    })
    configured.add('TAVILY_API_KEY')
    apply(ctx as unknown as Context, { tavily: { keySelection: 'order' } })
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

    commitSettings({ tavily: { keySelection: 'round-robin' } })
    // Cursor starts at 0 over the split key sequence: k1 first, then k2 —
    // the second post-swap search pins the policy.
    await chain.search({ query: 'c' })
    expect(await authOf()).toBe('Bearer k1')
    await chain.search({ query: 'd' })
    expect(await authOf()).toBe('Bearer k2')
  })

  it('storing a value by a settings commit flips readiness without an event (gate prime)', async () => {
    const { ctx, providers, configured, commitSettings } = fakeCtx({ values: { TAVILY_API_KEY: 'late-key' } })
    apply(ctx as unknown as Context, { deepseek: { enabled: true }, fallbackProvider: 'deepseek' })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    expect(chain.available()).toBe(false)

    configured.add('TAVILY_API_KEY')
    commitSettings({})
    await vi.waitFor(() => expect(chain.available()).toBe(true))
  })

  it('a committed member disable stops contributing readiness', async () => {
    const { ctx, providers, configured, commitSettings } = fakeCtx()
    configured.add('TAVILY_API_KEY')
    apply(ctx as unknown as Context, { tavily: { keySelection: 'order' }, fallbackProvider: 'deepseek' })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    expect(chain.available()).toBe(true)

    commitSettings({ tavily: { enabled: false }, fallbackProvider: 'deepseek' })
    await vi.waitFor(() => expect(chain.available()).toBe(false))
  })
})

describe('apply settings wiring (热改链序/超时/启停，S05a)', () => {
  it('hot-applies a chain reorder: the NEXT search walks members in the new order', async () => {
    const { ctx, providers, configured, commitSettings } = fakeCtx()
    configured.add('TAVILY_API_KEY')
    configured.add('DEEPSEEK_API_KEY')
    apply(ctx as unknown as Context, { deepseek: { enabled: true } })
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

    // S14c: deepseek left the orderable domain — a pinned chain naming it first
    // (pre-S14c shape) is filtered and re-appended as the fixed tail, so the
    // walk order stays tavily → deepseek. Reordering the orderable span still
    // hot-applies on the next search.
    commitSettings({ searchChain: ['dshws-deepseek', 'dshws-tavily'], deepseek: { enabled: true } })
    const second = await chain.search({ query: 'q' }).then(() => null, (error: unknown) => error as Error)
    expect(second).toBeDefined()
    expect(second!.message.indexOf(tavilyLine)).toBeGreaterThan(-1)
    expect(second!.message.indexOf(tavilyLine)).toBeLessThan(second!.message.indexOf(deepseekLine))
  })

  it('hot-applies the timeout budget: a raised budget lets a slow member win the next search', async () => {
    const { ctx, providers, configured, commitSettings } = fakeCtx()
    configured.add('TAVILY_API_KEY')
    configured.add('DEEPSEEK_API_KEY')
    apply(ctx as unknown as Context, { perMemberTimeoutMs: 30, deepseek: { enabled: true } })
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
    apply(ctx as unknown as Context, { deepseek: { enabled: true }, fallbackProvider: 'deepseek' })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await vi.waitFor(() => expect(chain.available()).toBe(true))

    commitSettings({ tavily: { enabled: false }, fallbackProvider: 'deepseek' })
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
