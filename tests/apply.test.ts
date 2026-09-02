import { describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import type { CredentialInfo, CredentialRef } from '@deepseek-ai/dsh-credentials'
import type { WebFetchProvider, WebSearchProvider } from '@deepseek-ai/dsh-web'
import { apply, inject, name } from '../src/index.ts'

interface FakeCtx {
  logger: { info: (message: string) => void }
  web: {
    registerSearchProvider: (provider: WebSearchProvider) => () => void
    registerFetchProvider: (provider: WebFetchProvider) => () => void
  }
  credentials: {
    describe: (ref: CredentialRef) => Promise<CredentialInfo>
    resolve: (ref: CredentialRef) => Promise<{ value: string; source: string } | undefined>
  }
  on: (event: string, handler: (ref: CredentialRef) => void) => () => void
}

function fakeCtx() {
  const search: string[] = []
  const fetch: string[] = []
  const providers = new Map<string, WebSearchProvider | WebFetchProvider>()
  const configured = new Set<string>()
  const eventHandlers = new Set<(ref: CredentialRef) => void>()
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
    credentials: {
      describe: async (ref) => ({
        configured: configured.has(String(ref)),
        writable: true,
        ...(configured.has(String(ref)) ? { source: 'env' } : {}),
      }),
      resolve: async (ref) => configured.has(String(ref)) ? { value: 'fake-key', source: 'env' } : undefined,
    },
    on: (event, handler) => {
      if (event === 'credentials/reference-updated') eventHandlers.add(handler)
      return () => eventHandlers.delete(handler)
    },
  }
  const emitUpdated = (ref: string) => {
    for (const handler of eventHandlers) handler(ref as CredentialRef)
  }
  return { ctx, search, fetch, providers, configured, emitUpdated }
}

async function flushGate(): Promise<void> {
  await vi.waitFor(() => {})
}

describe('apply assembly', () => {
  it('registers the chains and the S04 members with ctx.web (double registration topology)', () => {
    const { ctx, search, fetch } = fakeCtx()
    apply(ctx as unknown as Context, {})
    expect(search).toEqual(['dshws-chain', 'dshws-tavily', 'dshws-deepseek'])
    expect(fetch).toEqual(['dshws-chain-fetch'])
  })

  it('exposes the chain as unavailable while no credentials are configured', () => {
    const { ctx, providers } = fakeCtx()
    apply(ctx as unknown as Context, {})
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
    apply(ctx as unknown as Context, {})
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await vi.waitFor(() => expect(chain.available()).toBe(true))
  })

  it('a disabled member never contributes readiness even with its key configured', async () => {
    const { ctx, providers, configured } = fakeCtx()
    configured.add('TAVILY_API_KEY')
    apply(ctx as unknown as Context, { tavily: { enabled: false } })
    const chain = providers.get('dshws-chain') as WebSearchProvider
    await flushGate()
    expect(chain.available()).toBe(false)
  })

  it('a ref name outside the credential grammar fails loud at load (misconfiguration)', () => {
    const { ctx } = fakeCtx()
    expect(() => apply(ctx as unknown as Context, { tavily: { apiKeyEnv: 'not a valid ref!' } }))
      .toThrow(TypeError)
  })
})
