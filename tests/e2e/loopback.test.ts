// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import type { WebSearchProvider } from '@deepseek-ai/dsh-web'
import { apply } from '../../src/index.ts'
import { fakeCtx, flushGate } from '../helpers/fake-ctx.ts'
import type { FakeCtxHandle } from '../helpers/fake-ctx.ts'
import { closedPort, startLoopback } from './helpers/loopback-server.ts'
import type { LoopbackBehavior, LoopbackServer } from './helpers/loopback-server.ts'

/**
 * Loopback e2e (plan 008): the full assembly — entry config through the real
 * `apply()` into the real chain — driven against real HTTP round trips to a
 * scripted loopback server. The three REST search members (tavily/exa/
 * firecrawl, on demand) carry every scenario; chain semantics themselves are member
 * independent (S03 fake tier). Failure assertions read the observable faces:
 * the chain's logger degrade lines (reason = the member's message) and, where
 * an error object exists (exhaustion, direct pin), the error's `code`.
 *
 * Each scenario owns one server (D1) and closes it in a finally-style hook,
 * so a failing assertion cannot leak sockets into the next scenario.
 */

const MEMBERS = ['dshws-tavily', 'dshws-exa', 'dshws-firecrawl'] as const
const REFS = ['TAVILY_API_KEY', 'EXA_API_KEY'] as const

interface Assembly {
  server: LoopbackServer
  chain: WebSearchProvider
  handle: FakeCtxHandle
}

interface AssembleOverrides {
  perMemberTimeoutMs?: number
  searchChain?: string[]
  tavilyBaseURL?: string
  exaEnabled?: boolean
  withAnysearch?: boolean
  tavilyKeySelection?: 'order' | 'round-robin' | 'random'
  /** Pin the fallback choice (S14u: keep the chain tail loopback-controlled). */
  fallbackProvider?: 'deepseek'
  /** Designate the fallback member (ADR-0014 canonical field). */
  fallbackMember?: 'auto' | 'dshws-tavily' | 'dshws-exa' | 'dshws-firecrawl' | 'dshws-anysearch' | 'dshws-deepseek'
  /** Point the deepseek member at THIS scenario's loopback server (the caller cannot know the ephemeral port). */
  deepseekAtLoopback?: boolean
  /** Point the firecrawl member at THIS scenario's loopback server (S14w primary/standby scenario). */
  firecrawlAtLoopback?: boolean
  /** Explicit configured-ref set (defaults: the three primaries). */
  configuredRefs?: string[]
  /** Per-ref credential values (defaults keep 'fake-key' for every ref). */
  values?: Record<string, string>
}

async function assemble(
  behavior: Record<string, LoopbackBehavior>,
  overrides?: AssembleOverrides,
): Promise<Assembly> {
  const server = await startLoopback(behavior)
  try {
    const handle = fakeCtx({ withSettings: false, values: overrides?.values })
    const configured = overrides?.configuredRefs
      ?? [...REFS, ...(overrides?.withAnysearch ? ['ANYSEARCH_API_KEY'] : [])]
    for (const ref of configured) handle.configured.add(ref)
    apply(handle.ctx as unknown as Context, {
      ...(overrides?.fallbackProvider !== undefined ? { fallbackProvider: overrides.fallbackProvider } : {}),
      ...(overrides?.fallbackMember !== undefined ? { fallbackMember: overrides.fallbackMember } : {}),
      searchChain: overrides?.searchChain ?? [...MEMBERS],
      perMemberTimeoutMs: overrides?.perMemberTimeoutMs ?? 30000,
      tavily: {
        baseURL: overrides?.tavilyBaseURL ?? `http://127.0.0.1:${server.port}/tavily`,
        ...(overrides?.tavilyKeySelection !== undefined ? { keySelection: overrides.tavilyKeySelection } : {}),
      },
      exa: { baseURL: `http://127.0.0.1:${server.port}/exa`, ...(overrides?.exaEnabled === false ? { enabled: false } : {}) },
      ...(overrides?.withAnysearch ? { anysearch: { baseURL: `http://127.0.0.1:${server.port}/anysearch` } } : {}),
      ...(overrides?.firecrawlAtLoopback ? { firecrawl: { baseURL: `http://127.0.0.1:${server.port}/firecrawl` } } : {}),
      ...(overrides?.deepseekAtLoopback ? { deepseek: { baseURL: `http://127.0.0.1:${server.port}/deepseek` } } : {}),
    })
    const chain = handle.providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    expect(chain.available()).toBe(true)
    return { server, chain, handle }
  } catch (error: unknown) {
    // A failure inside assembly must not leak the scenario server: the caller
    // never receives it, so its finally could not close it (stage 4/5 🟡-1).
    await server.close()
    throw error
  }
}

describe('loopback e2e — full assembly through the chain (plan 008)', () => {
  it('network refusal on the first member degrades to the second (断网降级)', async () => {
    const dead = await closedPort()
    const { server, chain, handle } = await assemble(
      {
        '/exa/search': { kind: 'success', body: { results: [{ url: 'https://exa.test/a', title: 'Exa page', highlights: ['exa snippet a'] }] } },
      },
      { tavilyBaseURL: `http://127.0.0.1:${dead}/tavily` },
    )
    try {
      const result = await chain.search({ query: 'loopback refusal' })
      expect(result.sources).toEqual([{ url: 'https://exa.test/a', title: 'Exa page', snippet: 'exa snippet a' }])
      // Attribution: exa yields no content, so the served-by line stands alone.
      expect(result.content).toBe('[served-by: dshws-exa]')
      // Observable failure face: the degrade line names the member and its reason.
      const degrade = handle.logLines.find((line) => line.includes('dshws-tavily failed'))
      expect(degrade).toBeDefined()
      expect(degrade!).toMatch(/^.*member dshws-tavily failed \(Tavily search request failed:/)
      expect(handle.logLines).toContain('[dshws-chain] served-by: dshws-exa')
      // The dead member never reached the stub; the winner did, exactly once.
      expect(server.arrivals).toEqual(['POST /exa/search'])
    } finally {
      await server.close()
    }
  })

  it('an HTTP 429 on the first member degrades to the second (429 降级)', async () => {
    const { server, chain, handle } = await assemble(
      {
        // Detail-free body: unfoldHttpErrorDetail must not replace the message,
        // so the reason keeps the literal status (plan 008 D4).
        '/tavily/search': { kind: 'status', status: 429 },
        '/exa/search': { kind: 'success', body: { results: [{ url: 'https://exa.test/b', highlights: ['exa snippet b'] }] } },
      },
    )
    try {
      const result = await chain.search({ query: 'loopback 429' })
      expect(result.sources).toEqual([{ url: 'https://exa.test/b', snippet: 'exa snippet b' }])
      expect(result.content).toBe('[served-by: dshws-exa]')
      const degrade = handle.logLines.find((line) => line.includes('dshws-tavily failed'))
      expect(degrade).toBeDefined()
      expect(degrade!).toContain('HTTP 429')
      expect(server.arrivals).toEqual(['POST /tavily/search', 'POST /exa/search'])
    } finally {
      await server.close()
    }
  })

  it('a hung first member hits its timeout budget and degrades (超时降级)', async () => {
    const { server, chain, handle } = await assemble(
      {
        '/tavily/search': { kind: 'hang' },
        '/exa/search': { kind: 'success', body: { results: [{ url: 'https://exa.test/c', highlights: ['exa snippet c'] }] } },
      },
      { perMemberTimeoutMs: 150 },
    )
    try {
      const startedAt = Date.now()
      const result = await chain.search({ query: 'loopback timeout' })
      const elapsed = Date.now() - startedAt
      expect(result.sources).toEqual([{ url: 'https://exa.test/c', snippet: 'exa snippet c' }])
      expect(result.content).toBe('[served-by: dshws-exa]')
      // Lower-bound style: the chain must NOT wait out the hang (the handler
      // never answers); the 150ms budget plus loopback RTT keeps this loose.
      expect(elapsed).toBeLessThan(5000)
      const degrade = handle.logLines.find((line) => line.includes('dshws-tavily failed'))
      expect(degrade).toBeDefined()
      expect(degrade!).toContain('DSHWS_MEMBER_TIMEOUT: no result within the member budget of 150ms')
      expect(handle.logLines).toContain('[dshws-chain] served-by: dshws-exa')
      expect(server.arrivals).toEqual(['POST /tavily/search', 'POST /exa/search'])
    } finally {
      await server.close()
    }
  })

  it('walks the configured order across failures to the winner (顺序保持)', async () => {
    const { server, chain } = await assemble(
      {
        '/tavily/search': { kind: 'status', status: 429 },
        '/exa/search': { kind: 'destroy' },
        '/firecrawl/v2/search': {
          kind: 'success',
          body: { success: true, data: { web: [{ url: 'https://fc.test/a', title: 'A', description: 'sd' }] } },
        },
      },
      { firecrawlAtLoopback: true, configuredRefs: ['TAVILY_API_KEY', 'EXA_API_KEY', 'FIRECRAWL_API_KEY'] },
    )
    try {
      const result = await chain.search({ query: 'loopback order' })
      // The arrival log is the sequence source: exactly the config order, one
      // request per member until the winner answers.
      expect(server.arrivals).toEqual([
        'POST /tavily/search',
        'POST /exa/search',
        'POST /firecrawl/v2/search',
      ])
      expect(result.sources).toEqual([{ url: 'https://fc.test/a', title: 'A', snippet: 'sd' }])
    } finally {
      await server.close()
    }
  })

  it('skips a disabled member without producing an arrival record (skip 成员不计序)', async () => {
    const { server, chain } = await assemble(
      {
        '/tavily/search': { kind: 'status', status: 429 },
        '/exa/search': { kind: 'destroy' },
        '/firecrawl/v2/search': {
          kind: 'success',
          body: { success: true, data: { web: [{ url: 'https://fc.test/a' }] } },
        },
      },
      { exaEnabled: false, firecrawlAtLoopback: true, configuredRefs: ['TAVILY_API_KEY', 'FIRECRAWL_API_KEY'] },
    )
    try {
      const result = await chain.search({ query: 'loopback skip' })
      // exa sits in the chain but its selection gate skips it: no arrival, no
      // entry in the walk — selection skips are not sequence entries.
      expect(server.arrivals).toEqual(['POST /tavily/search', 'POST /firecrawl/v2/search'])
      expect(result.sources).toEqual([{ url: 'https://fc.test/a' }])
    } finally {
      await server.close()
    }
  })

  it('reports terminal exhaustion with the per-member summary and the deepest cause (全败报错 + ADR-0014 ①号钉子)', async () => {
    const { server, chain } = await assemble(
      {
        '/tavily/search': { kind: 'status', status: 429 },
        '/exa/search': { kind: 'destroy' },
        '/firecrawl/v2/search': { kind: 'status', status: 500, body: { error: 'backend down' } },
        '/deepseek/messages': { kind: 'status', status: 500, body: { error: { message: 'quota' } } },
      },
      // THREE ready tools + a designated, keyed, loopback-wired DeepSeek: the
      // legacy 'deepseek' alias designates it, and the ADR-0014 rule STILL
      // keeps it out (two-plus ready tools → the paid floor is gone). The
      // deepseek endpoint is wired so any violation would surface as an
      // arrival; the walk stays entirely on the loopback server.
      {
        fallbackProvider: 'deepseek',
        deepseekAtLoopback: true,
        firecrawlAtLoopback: true,
        configuredRefs: ['TAVILY_API_KEY', 'EXA_API_KEY', 'FIRECRAWL_API_KEY', 'DEEPSEEK_API_KEY'],
      },
    )
    try {
      const exhausted = await chain.search({ query: 'loopback all-fail' }).then(() => null, (error: unknown) => error as Error)
      expect(exhausted).not.toBeNull()
      const failure = exhausted as unknown as { code: string; message: string; cause?: { code?: string; httpStatus?: number } }
      expect(failure.code).toBe('DSHWS_CHAIN_EXHAUSTED')
      // One summary line per member, in walk order — the three tools only.
      const message = failure.message
      const tavilyAt = message.indexOf('- dshws-tavily:')
      const exaAt = message.indexOf('- dshws-exa:')
      const firecrawlAt = message.indexOf('- dshws-firecrawl:')
      expect(tavilyAt).toBeGreaterThan(-1)
      expect(exaAt).toBeGreaterThan(tavilyAt)
      expect(firecrawlAt).toBeGreaterThan(exaAt)
      expect(message).toContain('HTTP 429')
      expect(message).toContain('all 3 configured chain members failed')
      // ADR-0014: no paid floor with three ready tools — no summary line, no arrival.
      expect(message).not.toContain('- dshws-deepseek:')
      expect(server.arrivals).not.toContain('POST /deepseek/messages')
      // The last member's thrown error rides as cause (ADR-0002 Decision 3).
      expect(failure.cause?.code).toBe('DSHWS_FIRECRAWL_HTTP_ERROR')
      expect(failure.cause?.httpStatus).toBe(500)
      expect(server.arrivals).toEqual([
        'POST /tavily/search',
        'POST /exa/search',
        'POST /firecrawl/v2/search',
      ])
    } finally {
      await server.close()
    }
  })

  it('a round-robin pool rotates through every key on the wire (多 key 轮换)', async () => {
    const { server, chain } = await assemble(
      { '/tavily/search': { kind: 'success', body: { results: [{ url: 'https://tv.test/rr' }] } } },
      {
        searchChain: ['dshws-tavily'],
        tavilyKeySelection: 'round-robin',
        values: { TAVILY_API_KEY: 'k1,k2,k3' },
      },
    )
    try {
      for (let index = 0; index < 3; index += 1) await chain.search({ query: `rr-${index}` })
      // Wire-level rotation proof: each search carried a different key, in pool order.
      expect(server.auths).toEqual(['Bearer k1', 'Bearer k2', 'Bearer k3'])
    } finally {
      await server.close()
    }
  })

  it('a primary member exhausts its multi-key draws, then the standby member takes over (主备模式正本, S14w)', async () => {
    // The machine-readable definition of the primary/standby pattern: tavily
    // is PRIMARY (first in the chain order) and retries only across its OWN
    // key pool (3 draws, one key each); only after that budget is spent does
    // the standby (firecrawl, second in the order) serve the request. The
    // wire-level auths prove the key rotation happened inside the primary.
    const { server, chain } = await assemble(
      {
        // Phase 1 (warm-up): tavily healthy — the primary serves. Phase 2:
        // every draw 429s, so the primary exhausts its key pool and the
        // standby takes over.
        '/tavily/search': {
          kind: 'sequence',
          steps: [
            { kind: 'success', body: { results: [{ url: 'https://tv.test/primary', title: 'Primary answer' }] } },
            { kind: 'status', status: 429 },
            { kind: 'status', status: 429 },
            { kind: 'status', status: 429 },
          ],
        },
        '/firecrawl/v2/search': {
          kind: 'success',
          body: { success: true, data: { web: [{ url: 'https://fc.test/standby', title: 'Standby answer', description: 'standby snippet' }] } },
        },
      },
      {
        searchChain: ['dshws-tavily', 'dshws-firecrawl'],
        firecrawlAtLoopback: true,
        configuredRefs: ['TAVILY_API_KEY', 'FIRECRAWL_API_KEY'],
        values: { TAVILY_API_KEY: 'k1,k2,k3', FIRECRAWL_API_KEY: 'fk1' },
      },
    )
    try {
      // Warm-up: the healthy primary serves (this also arms the multi-key
      // pool gate — it reads the pool size only after the first key draw).
      const warmup = await chain.search({ query: 'warm' })
      expect(warmup.content).toBe('[served-by: dshws-tavily]')
      // Probe: the primary exhausts its OWN key pool first (k2 → k3 → k1,
      // round-robin), and only then does the standby serve the request.
      const result = await chain.search({ query: 'primary-standby' })
      expect(result.content).toBe('[served-by: dshws-firecrawl]')
      expect(result.sources[0]?.url).toBe('https://fc.test/standby')
      expect(server.arrivals).toEqual([
        'POST /tavily/search',
        'POST /tavily/search',
        'POST /tavily/search',
        'POST /tavily/search',
        'POST /firecrawl/v2/search',
      ])
      expect(server.auths).toEqual(['Bearer k1', 'Bearer k2', 'Bearer k3', 'Bearer k1', 'Bearer fk1'])
    } finally {
      await server.close()
    }
  })

  it('one ready tool + selected keyed DeepSeek joins as the paid floor (ADR-0014 ④号场景, e2e)', async () => {
    const { server, chain } = await assemble(
      {
        '/tavily/search': { kind: 'status', status: 429 },
        '/deepseek/messages': {
          kind: 'success',
          body: { content: [{ type: 'web_search_tool_result', content: [{ type: 'web_search_result', url: 'https://ds.test/floor' }] }] },
        },
      },
      {
        fallbackMember: 'dshws-deepseek',
        deepseekAtLoopback: true,
        searchChain: ['dshws-tavily'],
        configuredRefs: ['TAVILY_API_KEY', 'DEEPSEEK_API_KEY'],
      },
    )
    try {
      const result = await chain.search({ query: 'single-tool paid floor' })
      expect(result.content).toBe('[served-by: dshws-deepseek]')
      expect(result.sources[0]?.url).toBe('https://ds.test/floor')
      expect(server.arrivals).toEqual(['POST /tavily/search', 'POST /deepseek/messages'])
    } finally {
      await server.close()
    }
  })

  it('a designated tool member is stripped from the rotation and pinned at the tail (ADR-0014 strip-to-tail)', async () => {
    const { server, chain } = await assemble(
      {
        '/tavily/search': { kind: 'status', status: 429 },
        '/firecrawl/v2/search': { kind: 'status', status: 429 },
        '/exa/search': { kind: 'status', status: 429 },
      },
      {
        // Designate exa: the walk must be tavily → firecrawl → exa (exa last),
        // no matter where exa sits in the configured order.
        fallbackMember: 'dshws-exa',
        firecrawlAtLoopback: true,
        searchChain: ['dshws-exa', 'dshws-tavily', 'dshws-firecrawl'],
        configuredRefs: ['TAVILY_API_KEY', 'EXA_API_KEY', 'FIRECRAWL_API_KEY'],
      },
    )
    try {
      const exhausted = await chain.search({ query: 'strip-to-tail' }).then(() => null, (error: unknown) => error as Error)
      expect(exhausted).toMatchObject({ code: 'DSHWS_CHAIN_EXHAUSTED' })
      expect(server.arrivals).toEqual([
        'POST /tavily/search',
        'POST /firecrawl/v2/search',
        'POST /exa/search',
      ])
      const message = (exhausted as Error).message
      expect(message.indexOf('- dshws-tavily:')).toBeLessThan(message.indexOf('- dshws-firecrawl:'))
      expect(message.indexOf('- dshws-firecrawl:')).toBeLessThan(message.indexOf('- dshws-exa:'))
    } finally {
      await server.close()
    }
  })

  it('a mixed key pool heals: the dead key 401s, the next key serves the SAME member (S14y 本案 wire 钉子)', async () => {
    const { server, chain } = await assemble(
      {
        // First draw hits the dead key (401, credential-level), second draw
        // rotates to the live key and succeeds — wire-level proof that one
        // expired key no longer poisons the pool.
        '/tavily/search': {
          kind: 'sequence',
          steps: [
            { kind: 'status', status: 401, body: { detail: 'Invalid API key.' } },
            { kind: 'success', body: { results: [{ url: 'https://tv.test/healed', title: 'Healed' }] } },
          ],
        },
      },
      {
        searchChain: ['dshws-tavily'],
        configuredRefs: ['TAVILY_API_KEY'],
        values: { TAVILY_API_KEY: 'dead-key,live-key' },
      },
    )
    try {
      const result = await chain.search({ query: 'mixed-pool heal' })
      expect(result.content).toBe('[served-by: dshws-tavily]')
      expect(result.sources[0]?.url).toBe('https://tv.test/healed')
      expect(server.auths).toEqual(['Bearer dead-key', 'Bearer live-key'])
    } finally {
      await server.close()
    }
  })

  it('skips a member whose credential ref is unconfigured and serves from the next member (gate 跳过腿)', async () => {
    const { server, chain } = await assemble(
      {
        // Tavily primary NOT configured (omitted from configuredRefs): the chain skips it.
        '/exa/search': { kind: 'success', body: { results: [{ url: 'https://exa.test/gate', highlights: ['gate snippet'] }] } },
      },
      { configuredRefs: ['TAVILY_API_KEY', 'EXA_API_KEY'].slice(1) },
    )
    try {
      const result = await chain.search({ query: 'a' })
      await chain.search({ query: 'b' })
      // The unconfigured member never reaches the stub; the ready one serves both.
      expect(server.arrivals).toEqual(['POST /exa/search', 'POST /exa/search'])
      expect(result.content).toBe('[served-by: dshws-exa]')
    } finally {
      await server.close()
    }
  })

  it('a random pool always draws from the ready set (random 冒烟)', async () => {
    const keys = new Set(['k1', 'k2', 'k3'])
    const { server, chain } = await assemble(
      { '/tavily/search': { kind: 'success', body: { results: [{ url: 'https://tv.test/rand' }] } } },
      {
        searchChain: ['dshws-tavily'],
        tavilyKeySelection: 'random',
        values: { TAVILY_API_KEY: 'k1,k2,k3' },
      },
    )
    try {
      for (let index = 0; index < 6; index += 1) {
        await chain.search({ query: `rand-${index}` })
        // Membership only — the distribution is not an asserted contract.
        expect(keys.has(server.auths.at(-1)!.replace('Bearer ', ''))).toBe(true)
      }
      expect(server.auths).toHaveLength(6)
    } finally {
      await server.close()
    }
  })

  it('an anysearch envelope success flows through the chain with attribution (信封场景)', async () => {
    const { server, chain } = await assemble(
      {
        '/anysearch/v1/search': {
          kind: 'success',
          body: { code: 0, message: 'ok', data: { results: [{ url: 'https://as.test/1', title: 'AS', content: 'envelope body text' }] } },
        },
      },
      { searchChain: ['dshws-anysearch'], withAnysearch: true },
    )
    try {
      const result = await chain.search({ query: 'envelope' })
      // The content field falls back to the snippet (official mapping gap, ADR-0009).
      expect(result.sources).toEqual([{ url: 'https://as.test/1', title: 'AS', snippet: 'envelope body text' }])
      expect(result.content).toBe('[served-by: dshws-anysearch]')
      expect(server.auths[0]).toBe('Bearer fake-key')
      expect(server.arrivals).toEqual(['POST /anysearch/v1/search'])
    } finally {
      await server.close()
    }
  })

  it('a directly pinned member fails loud with its own code and no chain involvement (钉死直连不降级)', async () => {
    const { server, handle } = await assemble(
      {
        // The pinned member's endpoint fails hard; the other members would
        // succeed if the chain were (wrongly) on the call path.
        '/tavily/search': { kind: 'status', status: 500 },
        '/exa/search': { kind: 'success', body: { results: [{ url: 'https://exa.test/pinned', highlights: ['x'] }] } },
      },
    )
    try {
      // The host's selection scalar pins `dshws-tavily`: the member instance
      // from the ctx.web registry IS the chain member (double registration,
      // one instance) — calling it directly is the pinned path.
      const pinned = handle.providers.get('dshws-tavily') as WebSearchProvider
      const thrown = await pinned.search({ query: 'pinned direct' }).then(() => null, (error: unknown) => error as Error)
      expect(thrown).not.toBeNull()
      const failure = thrown as unknown as { code: string; message: string }
      // Exact member code: unwrapped, no DSHWS_CHAIN_EXHAUSTED in sight.
      expect(failure.code).toBe('DSHWS_TAVILY_HTTP_ERROR')
      expect(failure.code).not.toContain('CHAIN')
      // No degradation: the failing pin ends the call; the next member is untouched.
      expect(server.arrivals).toEqual(['POST /tavily/search'])
      // The chain is not on the call path: zero chain log lines.
      expect(handle.logLines.filter((line) => line.includes('[dshws-chain]'))).toEqual([])
    } finally {
      await server.close()
    }
  })
})
