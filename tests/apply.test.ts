import { describe, expect, it } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import type { WebFetchProvider, WebSearchProvider } from '@deepseek-ai/dsh-web'
import { apply, inject, name } from '../src/index.ts'

interface FakeCtx {
  logger: { info: (message: string) => void }
  web: {
    registerSearchProvider: (provider: WebSearchProvider) => () => void
    registerFetchProvider: (provider: WebFetchProvider) => () => void
  }
}

function fakeCtx() {
  const search: string[] = []
  const fetch: string[] = []
  const providers = new Map<string, WebSearchProvider | WebFetchProvider>()
  const ctx: FakeCtx = {
    logger: { info: () => {} },
    web: {
      registerSearchProvider: (provider) => {
        search.push(provider.id)
        providers.set(provider.id, provider)
        return () => {}
      },
      registerFetchProvider: (provider) => {
        fetch.push(provider.id)
        providers.set(provider.id, provider)
        return () => {}
      },
    },
  }
  return { ctx, search, fetch, providers }
}

describe('apply assembly', () => {
  it('registers the search chain meta provider with ctx.web', () => {
    const { ctx, search } = fakeCtx()
    apply(ctx as unknown as Context, {})
    expect(search).toEqual(['dshws-chain'])
  })

  it('exposes the chain as unavailable while no member is registered (S03 skeleton state)', () => {
    const { ctx, providers } = fakeCtx()
    apply(ctx as unknown as Context, {})
    const chain = providers.get('dshws-chain') as WebSearchProvider
    expect(chain.available()).toBe(false)
  })

  it('reports plugin name and inject surface for the loader', () => {
    expect(name).toBe('dsh-websearch')
    expect(inject).toEqual(['web'])
  })
})
