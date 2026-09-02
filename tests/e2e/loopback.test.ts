// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import type { WebSearchProvider } from '@deepseek-ai/dsh-web'
import { apply } from '../../src/index.ts'
import { fakeCtx, flushGate } from '../helpers/fake-ctx.ts'
import type { FakeCtxHandle } from '../helpers/fake-ctx.ts'
import { closedPort, startLoopback } from './helpers/loopback-server.ts'
import type { LoopbackServer } from './helpers/loopback-server.ts'

/**
 * Loopback e2e (plan 008): the full assembly — entry config through the real
 * `apply()` into the real chain — driven against real HTTP round trips to a
 * scripted loopback server. The three REST search members (tavily/exa/
 * perplexity) carry every scenario; chain semantics themselves are member
 * independent (S03 fake tier). Failure assertions read the observable faces:
 * the chain's logger degrade lines (reason = the member's message) and, where
 * an error object exists (exhaustion, direct pin), the error's `code`.
 *
 * Each scenario owns one server (D1) and closes it in a finally-style hook,
 * so a failing assertion cannot leak sockets into the next scenario.
 */

const MEMBERS = ['dshws-tavily', 'dshws-exa', 'dshws-perplexity'] as const
const REFS = ['TAVILY_API_KEY', 'EXA_API_KEY', 'PERPLEXITY_API_KEY'] as const

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
}

async function assemble(
  behavior: Record<string, import('./helpers/loopback-server.ts').LoopbackBehavior>,
  overrides?: AssembleOverrides,
): Promise<Assembly> {
  const server = await startLoopback(behavior)
  try {
    const handle = fakeCtx({ withSettings: false })
    for (const ref of REFS) handle.configured.add(ref)
    apply(handle.ctx as unknown as Context, {
      searchChain: overrides?.searchChain ?? [...MEMBERS],
      perMemberTimeoutMs: overrides?.perMemberTimeoutMs ?? 30000,
      tavily: { baseURL: overrides?.tavilyBaseURL ?? `http://127.0.0.1:${server.port}/tavily` },
      exa: { baseURL: `http://127.0.0.1:${server.port}/exa`, ...(overrides?.exaEnabled === false ? { enabled: false } : {}) },
      perplexity: { baseURL: `http://127.0.0.1:${server.port}/perplexity` },
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
        '/perplexity/chat/completions': { kind: 'destroy' },
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
      expect(degrade!).toContain('DSHWS_MEMBER_TIMEOUT: no result within 150ms')
      expect(handle.logLines).toContain('[dshws-chain] served-by: dshws-exa')
      expect(server.arrivals).toEqual(['POST /tavily/search', 'POST /exa/search'])
    } finally {
      await server.close()
    }
  })

  it('walks the configured order across failures to the winner (顺序保持)', async () => {
    const { server, chain, handle } = await assemble(
      {
        '/tavily/search': { kind: 'status', status: 429 },
        '/exa/search': { kind: 'destroy' },
        '/perplexity/chat/completions': {
          kind: 'success',
          body: { choices: [{ message: { content: 'loopback answer' } }], citations: ['https://pplx.test/a'] },
        },
      },
    )
    try {
      const result = await chain.search({ query: 'loopback order' })
      // The arrival log is the sequence source: exactly the config order, one
      // request per member until the winner answers.
      expect(server.arrivals).toEqual([
        'POST /tavily/search',
        'POST /exa/search',
        'POST /perplexity/chat/completions',
      ])
      // Perplexity carries content, so the signature is a first line over body text.
      expect(result.content).toBe('[served-by: dshws-perplexity]\nloopback answer')
      expect(handle.logLines).toContain('[dshws-chain] served-by: dshws-perplexity')
    } finally {
      await server.close()
    }
  })

  it('skips a disabled member without producing an arrival record (skip 成员不计序)', async () => {
    const { server, chain } = await assemble(
      {
        '/tavily/search': { kind: 'status', status: 429 },
        '/exa/search': { kind: 'destroy' },
        '/perplexity/chat/completions': {
          kind: 'success',
          body: { choices: [{ message: { content: 'answer' } }], citations: ['https://pplx.test/a'] },
        },
      },
      { exaEnabled: false },
    )
    try {
      const result = await chain.search({ query: 'loopback skip' })
      // exa sits in the chain but its selection gate skips it: no arrival, no
      // entry in the walk — selection skips are not sequence entries.
      expect(server.arrivals).toEqual(['POST /tavily/search', 'POST /perplexity/chat/completions'])
      expect(result.content).toBe('[served-by: dshws-perplexity]\nanswer')
    } finally {
      await server.close()
    }
  })

  it('reports terminal exhaustion with the per-member summary and the deepest cause (全败报错)', async () => {
    const { server, chain } = await assemble(
      {
        '/tavily/search': { kind: 'status', status: 429 },
        '/exa/search': { kind: 'destroy' },
        '/perplexity/chat/completions': { kind: 'status', status: 500, body: { detail: 'backend down' } },
      },
    )
    try {
      const exhausted = await chain.search({ query: 'loopback all-fail' }).then(() => null, (error: unknown) => error as Error)
      expect(exhausted).not.toBeNull()
      const failure = exhausted as unknown as { code: string; message: string; cause?: { code?: string } }
      expect(failure.code).toBe('DSHWS_CHAIN_EXHAUSTED')
      // One summary line per member, in walk order.
      const message = failure.message
      const tavilyAt = message.indexOf('- dshws-tavily:')
      const exaAt = message.indexOf('- dshws-exa:')
      const perplexityAt = message.indexOf('- dshws-perplexity:')
      expect(tavilyAt).toBeGreaterThan(-1)
      expect(exaAt).toBeGreaterThan(tavilyAt)
      expect(perplexityAt).toBeGreaterThan(exaAt)
      expect(message).toContain('HTTP 429')
      expect(message).toContain('all 3 configured chain members failed')
      // The last member's thrown error rides as cause (ADR-0002 Decision 3).
      expect(failure.cause?.code).toBe('DSHWS_PERPLEXITY_HTTP_ERROR')
      expect(server.arrivals).toEqual([
        'POST /tavily/search',
        'POST /exa/search',
        'POST /perplexity/chat/completions',
      ])
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
