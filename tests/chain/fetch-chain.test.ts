import { describe, expect, it, vi } from 'vitest'
import type { WebFetchProvider, WebFetchResult } from '@deepseek-ai/dsh-web'
import { ChainFetchProvider } from '../../src/chain/core.ts'

function fakeFetchResult(content = 'page body'): WebFetchResult {
  return { url: 'https://example.test/a', statusCode: 200, body: { kind: 'text', content }, truncated: false }
}

function trackingFetchProvider(id: string, calls: string[]): WebFetchProvider {
  return {
    id,
    available: () => true,
    fetch: async () => {
      calls.push(id)
      return fakeFetchResult(`body from ${id}`)
    },
  }
}

interface FakeMember {
  enabled?: boolean
  credentialsReady?: boolean
  provider: WebFetchProvider
}

function resolver(members: Record<string, FakeMember>) {
  return {
    resolve: (id: string) => {
      const member = members[id]
      if (!member) return undefined
      return {
        id,
        provider: member.provider,
        enabled: member.enabled ?? true,
        credentialsReady: member.credentialsReady ?? true,
      }
    },
  }
}

describe('fetch chain (dshws-chain-fetch 同构)', () => {
  it('serves from the first usable fetch member in configured order', async () => {
    const calls: string[] = []
    const chain = new ChainFetchProvider({
      members: resolver({
        'dshws-first': { provider: trackingFetchProvider('dshws-first', calls) },
        'dshws-second': { provider: trackingFetchProvider('dshws-second', calls) },
      }),
      order: ['dshws-first', 'dshws-second'],
      perMemberTimeoutMs: 1000,
    })
    const result = await chain.fetch({ url: 'https://example.test/a' })
    expect(calls).toEqual(['dshws-first'])
    expect(result.statusCode).toBe(200)
  })

  it('degrades to the next member when one fetch member throws', async () => {
    const calls: string[] = []
    const failing: WebFetchProvider = {
      id: 'dshws-broken',
      available: () => true,
      fetch: async () => {
        calls.push('dshws-broken')
        throw new Error('fetch failed')
      },
    }
    const chain = new ChainFetchProvider({
      members: resolver({
        'dshws-broken': { provider: failing },
        'dshws-works': { provider: trackingFetchProvider('dshws-works', calls) },
      }),
      order: ['dshws-broken', 'dshws-works'],
      perMemberTimeoutMs: 1000,
    })
    const result = await chain.fetch({ url: 'https://example.test/a' })
    expect(calls).toEqual(['dshws-broken', 'dshws-works'])
    expect(result.body).toEqual({ kind: 'text', content: '[served-by: dshws-works]\nbody from dshws-works' })
  })

  it('throws DSHWS_CHAIN_EXHAUSTED when every fetch member fails', async () => {
    const calls: string[] = []
    const failing: WebFetchProvider = {
      id: 'dshws-broken',
      available: () => true,
      fetch: async () => {
        calls.push('dshws-broken')
        throw new Error('fetch failed')
      },
    }
    const chain = new ChainFetchProvider({
      members: resolver({ 'dshws-broken': { provider: failing } }),
      order: ['dshws-broken'],
      perMemberTimeoutMs: 1000,
    })
    await expect(chain.fetch({ url: 'https://example.test/a' })).rejects.toMatchObject({
      code: 'DSHWS_CHAIN_EXHAUSTED',
    })
  })

  it('degrades with DSHWS_MEMBER_TIMEOUT when a fetch member hangs past its budget', async () => {
    vi.useFakeTimers()
    try {
      const calls: string[] = []
      const logs: string[] = []
      const hanging: WebFetchProvider = {
        id: 'dshws-hang',
        available: () => true,
        fetch: async () =>
          new Promise<WebFetchResult>(() => {
            calls.push('dshws-hang')
          }),
      }
      const chain = new ChainFetchProvider({
        members: resolver({
          'dshws-hang': { provider: hanging },
          'dshws-fast': { provider: trackingFetchProvider('dshws-fast', calls) },
        }),
        order: ['dshws-hang', 'dshws-fast'],
        perMemberTimeoutMs: 1000,
        log: (message) => logs.push(message),
      })
      const settled = chain.fetch({ url: 'https://example.test/a' })
      await vi.advanceTimersByTimeAsync(1000)
      await settled
      expect(calls).toEqual(['dshws-hang', 'dshws-fast'])
      expect(logs.some((line) => line.includes('DSHWS_MEMBER_TIMEOUT') && line.includes('dshws-hang'))).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('attributes with a head signature line that survives head-preserving truncation (S28)', async () => {
    const logs: string[] = []
    const chain = new ChainFetchProvider({
      members: resolver({ 'dshws-lone': { provider: trackingFetchProvider('dshws-lone', []) } }),
      order: ['dshws-lone'],
      perMemberTimeoutMs: 1000,
      log: (message) => logs.push(message),
    })
    const result = await chain.fetch({ url: 'https://example.test/a' })
    // D3 (log-only attribution) is superseded by S28: the badge needs a
    // client-readable carrier, and the head is the only position that survives
    // the host's head-preserving truncation layers (review verdict).
    expect(result.body).toEqual({ kind: 'text', content: '[served-by: dshws-lone]\nbody from dshws-lone' })
    expect(logs.some((line) => line.includes('served-by') && line.includes('dshws-lone'))).toBe(true)
  })
})
