import { describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import type { WebSearchProvider } from '@deepseek-ai/dsh-web'
import { apply, inject, name } from '../src/index.ts'
import { fakeCtx, flushGate } from './helpers/fake-ctx.ts'

describe('apply assembly', () => {
  it('registers the chains and all six members with ctx.web (double registration topology, ADR-0014 −fetch-search)', () => {
    const { ctx, search, fetch } = fakeCtx()
    apply(ctx as unknown as Context, { deepseek: { enabled: true } })
    expect(search).toEqual(['dshws-chain', 'dshws-tavily', 'dshws-exa', 'dshws-perplexity', 'dshws-firecrawl', 'dshws-deepseek', 'dshws-anysearch'])
    expect(fetch).toEqual(['dshws-chain-fetch', 'dshws-firecrawl'])
  })

  it('a model key alone grants NO paid reach — the floor joins only when designated (ADR-0014, was the S14u auto quadrant)', async () => {
    // Pre-0.2 the auto default silently enabled the paid floor once the
    // Models-page key existed; ADR-0014 moves participation behind an explicit
    // designation, so the DEFAULT chain stays tool-members-only.
    const { ctx, providers, configured } = fakeCtx()
    configured.add('DEEPSEEK_API_KEY')
    apply(ctx as unknown as Context, {})
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    expect(chain.available()).toBe(false)
    const exhausted = await chain.search({ query: 'q' }).then(() => null, (error: unknown) => error)
    expect(exhausted).toMatchObject({ code: 'DSHWS_NO_MEMBER_CONFIGURED' })
  })

  it('zero credentials: the chain is honestly unavailable and says what to do (ADR-0014 breaking pin)', async () => {
    const { ctx, providers } = fakeCtx()
    apply(ctx as unknown as Context, {})
    const chain = providers.get('dshws-chain') as WebSearchProvider
    expect(chain.available()).toBe(false)
    const caught = await chain.search({ query: 'q' }).then(() => null, (error: unknown) => error as Error)
    expect(caught).toMatchObject({ code: 'DSHWS_NO_MEMBER_CONFIGURED' })
    expect(caught!.message).toContain('select the DeepSeek paid fallback')
  })

  it('designated DeepSeek with no model key keeps the chain unavailable (paid is honest)', () => {
    const { ctx, providers } = fakeCtx()
    apply(ctx as unknown as Context, { fallbackMember: 'dshws-deepseek' })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    expect(chain.available()).toBe(false)
  })

  it('legacy fallbackProvider: deepseek designates the paid floor; the other alias values mean auto (ADR-0014)', async () => {
    const { ctx, providers, configured } = fakeCtx()
    configured.add('DEEPSEEK_API_KEY')
    apply(ctx as unknown as Context, { fallbackProvider: 'deepseek' })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    await vi.waitFor(() => expect(chain.available()).toBe(true))

    // 'fetch' named the deleted free floor — it normalizes to auto, no floor.
    const { ctx: ctx2, providers: providers2, configured: configured2 } = fakeCtx()
    configured2.add('DEEPSEEK_API_KEY')
    apply(ctx2 as unknown as Context, { fallbackProvider: 'fetch' })
    const chain2 = providers2.get('dshws-chain') as WebSearchProvider
    await flushGate()
    expect(chain2.available()).toBe(false)
  })

  it('reports plugin name and inject surface for the loader', () => {
    expect(name).toBe('dsh-websearch')
    expect(inject).toEqual(['web', 'credentials'])
  })
})

describe('ADR-0014 fallback participation (quadrant pins)', () => {
  const allFail = () => vi.fn(async (_url: string | URL | Request) =>
    new Response('server error', { status: 500 }))

  async function exhaustedError(chain: WebSearchProvider): Promise<Error> {
    return await chain.search({ query: 'q' }).then(
      () => {
        throw new Error('expected the chain to reject')
      },
      (error: unknown) => error as Error,
    )
  }

  it('④ self-exclusion: one ready tool + selected keyed DeepSeek stays ELIGIBLE (readyCount never counts DeepSeek)', async () => {
    const { ctx, providers, configured } = fakeCtx()
    configured.add('TAVILY_API_KEY')
    configured.add('DEEPSEEK_API_KEY')
    // deepseek.enabled=true pins the harshest variant: a regressed counter
    // that counts every ENABLED member (not just the five tools) would count
    // DeepSeek itself → 2 → the floor vanishes. The probe for this exact
    // regression must stay red (stage-4/5 Y-2 清偿).
    apply(ctx as unknown as Context, { fallbackMember: 'dshws-deepseek', deepseek: { enabled: true } })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    // If the guard counted DeepSeek itself, readyCount would be 2 and the
    // floor would vanish — the exact suicide hole the ADR pins shut.
    await vi.waitFor(() => expect(chain.available()).toBe(true))
    vi.stubGlobal('fetch', allFail())
    const error = await exhaustedError(chain)
    expect(error.message).toContain('- dshws-deepseek:')
  })

  it('⑤ the enabled face: a disabled keyed tool does NOT consume the one-tool slot', async () => {
    const { ctx, providers, configured } = fakeCtx()
    configured.add('TAVILY_API_KEY')
    configured.add('EXA_API_KEY')
    configured.add('DEEPSEEK_API_KEY')
    apply(ctx as unknown as Context, { fallbackMember: 'dshws-deepseek', tavily: { enabled: false } })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    // Ready tools = exa only (tavily disabled) → count 1 → the floor joins.
    await vi.waitFor(() => expect(chain.available()).toBe(true))
    vi.stubGlobal('fetch', allFail())
    const error = await exhaustedError(chain)
    expect(error.message).toContain('- dshws-deepseek:')
    expect(error.message).not.toContain('- dshws-tavily:')
  })

  it('⑥ the key clause: designated + eligible count but NO key → auto chain, no floor', async () => {
    const { ctx, providers, configured } = fakeCtx()
    configured.add('TAVILY_API_KEY')
    apply(ctx as unknown as Context, { fallbackMember: 'dshws-deepseek' })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    vi.stubGlobal('fetch', allFail())
    const error = await exhaustedError(chain)
    expect(error).toMatchObject({ code: 'DSHWS_CHAIN_EXHAUSTED' })
    expect(error.message).toContain('- dshws-tavily:')
    expect(error.message).not.toContain('- dshws-deepseek:')
  })

  it('① two-plus ready tools: the paid floor is GONE even when designated and keyed (user rule)', async () => {
    const { ctx, providers, configured } = fakeCtx()
    configured.add('TAVILY_API_KEY')
    configured.add('EXA_API_KEY')
    configured.add('DEEPSEEK_API_KEY')
    apply(ctx as unknown as Context, { fallbackMember: 'dshws-deepseek' })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    vi.stubGlobal('fetch', allFail())
    const error = await exhaustedError(chain)
    expect(error).toMatchObject({ code: 'DSHWS_CHAIN_EXHAUSTED' })
    expect(error.message).toContain('all 2 configured chain members failed')
    expect(error.message).not.toContain('- dshws-deepseek:')
  })

  it('hot-switch: a second tool key landing revokes the floor on the NEXT search (intent degrades to auto)', async () => {
    const { ctx, providers, configured, emitUpdated } = fakeCtx()
    configured.add('TAVILY_API_KEY')
    configured.add('DEEPSEEK_API_KEY')
    apply(ctx as unknown as Context, { fallbackMember: 'dshws-deepseek' })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    vi.stubGlobal('fetch', allFail())
    expect((await exhaustedError(chain)).message).toContain('- dshws-deepseek:')

    configured.add('EXA_API_KEY')
    emitUpdated('EXA_API_KEY')
    // The gate refresh is async; wait until a search's exhaustion summary
    // actually reflects the revoked floor (no deepseek line) — the wait
    // condition IS the assertion, not a fire-and-forget probe.
    await vi.waitFor(async () => {
      const error = await exhaustedError(chain)
      expect(error.message).not.toContain('- dshws-deepseek:')
    })
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
    apply(ctx as unknown as Context, { fallbackMember: 'dshws-deepseek' })
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
    apply(ctx as unknown as Context, { fallbackMember: 'dshws-deepseek' })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()

    // One ready tool + designated + keyed DeepSeek = the floor is eligible and
    // appended after the span. Every member fails with HTTP 500, so the
    // exhausted summary records the walk order: tavily before deepseek.
    vi.stubGlobal('fetch', vi.fn(async (_url: string | URL | Request) =>
      new Response('server error', { status: 500 })))
    const first = await chain.search({ query: 'q' }).then(() => null, (error: unknown) => error as Error)
    expect(first).toBeDefined()
    const tavilyLine = '- dshws-tavily:'
    const deepseekLine = '- dshws-deepseek:'
    expect(first!.message.indexOf(tavilyLine)).toBeGreaterThan(-1)
    expect(first!.message.indexOf(tavilyLine)).toBeLessThan(first!.message.indexOf(deepseekLine))

    // A pinned chain naming the deepseek tail first (pre-S14c shape) is
    // stripped; the guard re-appends it when eligible, so the walk order
    // stays tavily → deepseek. Reordering the orderable span still
    // hot-applies on the next search.
    commitSettings({ searchChain: ['dshws-deepseek', 'dshws-tavily'], fallbackMember: 'dshws-deepseek' })
    const second = await chain.search({ query: 'q' }).then(() => null, (error: unknown) => error as Error)
    expect(second).toBeDefined()
    expect(second!.message.indexOf(tavilyLine)).toBeGreaterThan(-1)
    expect(second!.message.indexOf(tavilyLine)).toBeLessThan(second!.message.indexOf(deepseekLine))
  })

  it('hot-applies the timeout budget: a raised budget lets a slow member win the next search', async () => {
    const { ctx, providers, configured, commitSettings } = fakeCtx()
    configured.add('TAVILY_API_KEY')
    configured.add('DEEPSEEK_API_KEY')
    apply(ctx as unknown as Context, { perMemberTimeoutMs: 30, fallbackMember: 'dshws-deepseek' })
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
