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

describe('selection-level skips (必测②③)', () => {
  it('skips an unregistered member without consuming a call', async () => {
    const calls: string[] = []
    const chain = new ChainSearchProvider({
      members: resolver({ 'dshws-present': { provider: trackingProvider('dshws-present', calls) } }),
      order: ['dshws-ghost', 'dshws-present'],
      perMemberTimeoutMs: 1000,
    })
    await chain.search({ query: 'q' })
    expect(calls).toEqual(['dshws-present'])
  })

  it('skips a disabled member without calling it', async () => {
    const calls: string[] = []
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-off': { provider: trackingProvider('dshws-off', calls), enabled: false },
        'dshws-on': { provider: trackingProvider('dshws-on', calls) },
      }),
      order: ['dshws-off', 'dshws-on'],
      perMemberTimeoutMs: 1000,
    })
    await chain.search({ query: 'q' })
    expect(calls).toEqual(['dshws-on'])
  })

  it('skips a member whose credentials are not configured', async () => {
    const calls: string[] = []
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-nokey': { provider: trackingProvider('dshws-nokey', calls), credentialsReady: false },
        'dshws-keyed': { provider: trackingProvider('dshws-keyed', calls) },
      }),
      order: ['dshws-nokey', 'dshws-keyed'],
      perMemberTimeoutMs: 1000,
    })
    await chain.search({ query: 'q' })
    expect(calls).toEqual(['dshws-keyed'])
  })

  it('skips a member whose own available() is false', async () => {
    const calls: string[] = []
    const unavailable: WebSearchProvider = {
      id: 'dshws-down',
      available: () => false,
      search: async () => {
        calls.push('dshws-down')
        return fakeResult()
      },
    }
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-down': { provider: unavailable },
        'dshws-up': { provider: trackingProvider('dshws-up', calls) },
      }),
      order: ['dshws-down', 'dshws-up'],
      perMemberTimeoutMs: 1000,
    })
    await chain.search({ query: 'q' })
    expect(calls).toEqual(['dshws-up'])
  })

  it('fails loud with DSHWS_NO_MEMBER_CONFIGURED when every member is selection-skipped', async () => {
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-off': { provider: trackingProvider('dshws-off', []), enabled: false },
        'dshws-nokey': { provider: trackingProvider('dshws-nokey', []), credentialsReady: false },
      }),
      order: ['dshws-off', 'dshws-nokey'],
      perMemberTimeoutMs: 1000,
    })
    await expect(chain.search({ query: 'q' })).rejects.toMatchObject({
      code: 'DSHWS_NO_MEMBER_CONFIGURED',
    })
  })

  it('names the configured chain in the no-member error message', async () => {
    const chain = new ChainSearchProvider({
      members: resolver({}),
      order: ['dshws-ghost-a', 'dshws-ghost-b'],
      perMemberTimeoutMs: 1000,
    })
    await expect(chain.search({ query: 'q' })).rejects.toThrow(/dshws-ghost-a, dshws-ghost-b/)
  })
})

describe('chain availability (链自身 available())', () => {
  it('is false when every enabled member lacks credentials', () => {
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-a': { provider: trackingProvider('dshws-a', []), credentialsReady: false },
        'dshws-b': { provider: trackingProvider('dshws-b', []), credentialsReady: false },
      }),
      order: ['dshws-a', 'dshws-b'],
      perMemberTimeoutMs: 1000,
    })
    expect(chain.available()).toBe(false)
  })

  it('is true when at least one enabled member has credentials ready', () => {
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-a': { provider: trackingProvider('dshws-a', []), credentialsReady: false },
        'dshws-b': { provider: trackingProvider('dshws-b', []) },
      }),
      order: ['dshws-a', 'dshws-b'],
      perMemberTimeoutMs: 1000,
    })
    expect(chain.available()).toBe(true)
  })

  it('is false when every member on the order is unregistered or disabled', () => {
    const chain = new ChainSearchProvider({
      members: resolver({
        'dshws-off': { provider: trackingProvider('dshws-off', []), enabled: false },
      }),
      order: ['dshws-ghost', 'dshws-off'],
      perMemberTimeoutMs: 1000,
    })
    expect(chain.available()).toBe(false)
  })
})
