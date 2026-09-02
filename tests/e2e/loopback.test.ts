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

async function assemble(
  behavior: Record<string, import('./helpers/loopback-server.ts').LoopbackBehavior>,
  overrides?: { perMemberTimeoutMs?: number; searchChain?: string[]; tavilyBaseURL?: string },
): Promise<Assembly> {
  const server = await startLoopback(behavior)
  const handle = fakeCtx({ withSettings: false })
  for (const ref of REFS) handle.configured.add(ref)
  apply(handle.ctx as unknown as Context, {
    searchChain: overrides?.searchChain ?? [...MEMBERS],
    perMemberTimeoutMs: overrides?.perMemberTimeoutMs ?? 30000,
    tavily: { baseURL: overrides?.tavilyBaseURL ?? `http://127.0.0.1:${server.port}/tavily` },
    exa: { baseURL: `http://127.0.0.1:${server.port}/exa` },
    perplexity: { baseURL: `http://127.0.0.1:${server.port}/perplexity` },
  })
  const chain = handle.providers.get('dshws-chain') as WebSearchProvider
  await flushGate()
  expect(chain.available()).toBe(true)
  return { server, chain, handle }
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
})
