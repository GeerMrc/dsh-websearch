import { describe, expect, it } from 'vitest'
import type { WebSearchProvider, WebSearchResult } from '@deepseek-ai/dsh-web'
import { MemberRegistry } from '../../src/chain/core.ts'
import { DshwsError } from '../../src/errors.ts'

function trackingProvider(id: string, calls: string[]): WebSearchProvider {
  return {
    id,
    available: () => true,
    search: async () => {
      calls.push(id)
      const result: WebSearchResult = { sources: [], truncated: false }
      return result
    },
  }
}

describe('member registry (必测⑧ 直连面)', () => {
  it('registers a member under its own id and hands back a working disposer', () => {
    const registry = new MemberRegistry()
    const member = trackingProvider('dshws-tavily', [])
    const dispose = registry.register(member)
    expect(registry.toResolver().resolve('dshws-tavily')?.provider).toBe(member)
    dispose()
    expect(registry.toResolver().resolve('dshws-tavily')).toBeUndefined()
  })

  it('resolves only registered ids', () => {
    const registry = new MemberRegistry()
    registry.register(trackingProvider('dshws-known', []))
    expect(registry.toResolver().resolve('dshws-unknown')).toBeUndefined()
  })

  it('reports gate state at resolve time, replacing the S03 constant-true facade', () => {
    const registry = new MemberRegistry()
    registry.register(trackingProvider('dshws-gated', []), {
      enabled: () => false,
      credentialsReady: () => true,
    })
    const member = registry.toResolver().resolve('dshws-gated')
    expect(member?.enabled).toBe(false)
    expect(member?.credentialsReady).toBe(true)
  })

  it('reads gates hot: a gate flip is visible on the next resolve without re-registering', () => {
    const registry = new MemberRegistry()
    let ready = false
    registry.register(trackingProvider('dshws-hot', []), {
      credentialsReady: () => ready,
    })
    const resolver = registry.toResolver()
    expect(resolver.resolve('dshws-hot')?.credentialsReady).toBe(false)
    ready = true
    expect(resolver.resolve('dshws-hot')?.credentialsReady).toBe(true)
  })

  it('defaults to enabled and credentials-ready for gate-less members (credential-free stubs)', () => {
    const registry = new MemberRegistry()
    registry.register(trackingProvider('dshws-plain', []))
    const member = registry.toResolver().resolve('dshws-plain')
    expect(member?.enabled).toBe(true)
    expect(member?.credentialsReady).toBe(true)
  })

  it('drops the gates together with the member on dispose', () => {
    const registry = new MemberRegistry()
    const dispose = registry.register(trackingProvider('dshws-doomed', []), {
      enabled: () => false,
    })
    dispose()
    expect(registry.toResolver().resolve('dshws-doomed')).toBeUndefined()
  })

  it('a directly resolved member propagates its raw error, unwrapped by the chain', async () => {
    const registry = new MemberRegistry()
    const rawError = new Error('raw member failure')
    registry.register({
      id: 'dshws-direct',
      available: () => true,
      search: async () => {
        throw rawError
      },
    })
    const direct = registry.toResolver().resolve('dshws-direct')?.provider
    expect(direct).toBeDefined()
    const caught = await direct!.search({ query: 'q' }).then(
      () => null,
      (error: unknown) => error,
    )
    expect(caught).toBe(rawError)
    expect(caught).not.toBeInstanceOf(DshwsError)
  })
})
