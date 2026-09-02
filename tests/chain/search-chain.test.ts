import { describe, expect, it } from 'vitest'
import type { WebSearchProvider, WebSearchResult } from '@deepseek-ai/dsh-web'
import type { ChainMemberResolver } from '../../src/chain/core.ts'
import { ChainSearchProvider } from '../../src/chain/core.ts'

function fakeResult(content?: string): WebSearchResult {
  return { content, sources: [], truncated: false }
}

function trackingProvider(id: string, calls: string[]): WebSearchProvider {
  return {
    id,
    available: () => true,
    search: async () => {
      calls.push(id)
      return fakeResult(`answer from ${id}`)
    },
  }
}

interface FakeMember {
  enabled?: boolean
  credentialsReady?: boolean
  provider: WebSearchProvider
}

function resolver(members: Record<string, FakeMember>): ChainMemberResolver {
  return {
    resolve: (id) => {
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

describe('search chain ordering (必测①)', () => {
  it('serves from the first usable member in configured order and touches no later member', async () => {
    const calls: string[] = []
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-first': { provider: trackingProvider('dshws-first', calls) },
        'dshws-second': { provider: trackingProvider('dshws-second', calls) },
      }),
      order: ['dshws-first', 'dshws-second'],
      perMemberTimeoutMs: 1000,
    })
    const result = await chain.search({ query: 'q' })
    expect(calls).toEqual(['dshws-first'])
    expect(result.truncated).toBe(false)
    expect(result.sources).toEqual([])
  })

  it('follows the configured order, not member construction order', async () => {
    const calls: string[] = []
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-alpha': { provider: trackingProvider('dshws-alpha', calls) },
        'dshws-beta': { provider: trackingProvider('dshws-beta', calls) },
      }),
      order: ['dshws-beta', 'dshws-alpha'],
      perMemberTimeoutMs: 1000,
    })
    await chain.search({ query: 'q' })
    expect(calls).toEqual(['dshws-beta'])
  })
})
