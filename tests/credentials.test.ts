import { describe, expect, it, vi } from 'vitest'
import type { CredentialInfo, CredentialProvider, CredentialRef } from '@deepseek-ai/dsh-credentials'
import { CredentialGate } from '../src/credentials.ts'

/** Minimal credentials seam fake: presence set + describe spy; values never exist here. */
function fakeCredentials(configured: Set<string>) {
  return {
    describe: vi.fn(async (ref: CredentialRef): Promise<CredentialInfo> => ({
      configured: configured.has(String(ref)),
      writable: true,
      ...(configured.has(String(ref)) ? { source: 'env' } : {}),
    })),
  }
}

/** Event-bus fake mirroring the `credentials/reference-updated` fan-out shape. */
function fakeSubscribe() {
  const handlers = new Set<(ref: CredentialRef) => void>()
  const subscribe = (handler: (ref: CredentialRef) => void) => {
    handlers.add(handler)
    return () => handlers.delete(handler)
  }
  const emit = (ref: string) => {
    for (const handler of handlers) handler(ref as CredentialRef)
  }
  return { subscribe, emit }
}

describe('CredentialGate', () => {
  it('prime fills the cache: configured refs ready, unconfigured refs not', async () => {
    const credentials = fakeCredentials(new Set(['TAVILY_API_KEY']))
    const { subscribe } = fakeSubscribe()
    const gate = new CredentialGate({ credentials: credentials as unknown as CredentialProvider, subscribe })
    await gate.prime(['TAVILY_API_KEY', 'DEEPSEEK_API_KEY'])
    expect(gate.isReady('TAVILY_API_KEY')).toBe(true)
    expect(gate.isReady('DEEPSEEK_API_KEY')).toBe(false)
  })

  it('an unknown ref (never primed) is not ready — no describe fact, no readiness', () => {
    const credentials = fakeCredentials(new Set(['TAVILY_API_KEY']))
    const { subscribe } = fakeSubscribe()
    const gate = new CredentialGate({ credentials: credentials as unknown as CredentialProvider, subscribe })
    expect(gate.isReady('TAVILY_API_KEY')).toBe(false)
  })

  it('a reference-updated event refreshes the cache: configure flips ready, unconfigure flips back', async () => {
    const configured = new Set<string>()
    const credentials = fakeCredentials(configured)
    const { subscribe, emit } = fakeSubscribe()
    const gate = new CredentialGate({ credentials: credentials as unknown as CredentialProvider, subscribe })
    await gate.prime(['TAVILY_API_KEY'])
    expect(gate.isReady('TAVILY_API_KEY')).toBe(false)

    configured.add('TAVILY_API_KEY')
    emit('TAVILY_API_KEY')
    await vi.waitFor(() => expect(gate.isReady('TAVILY_API_KEY')).toBe(true))

    configured.delete('TAVILY_API_KEY')
    emit('TAVILY_API_KEY')
    await vi.waitFor(() => expect(gate.isReady('TAVILY_API_KEY')).toBe(false))
  })

  it('an event for an unwatched ref leaves the cache untouched', async () => {
    const configured = new Set(['OTHER_REF'])
    const credentials = fakeCredentials(configured)
    const { subscribe, emit } = fakeSubscribe()
    const gate = new CredentialGate({ credentials: credentials as unknown as CredentialProvider, subscribe })
    await gate.prime(['TAVILY_API_KEY'])
    emit('OTHER_REF')
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(credentials.describe).not.toHaveBeenCalledWith('OTHER_REF')
    expect(gate.isReady('OTHER_REF')).toBe(false)
  })

  it('a describe failure reads as not-ready, logs, and still resolves prime', async () => {
    const log = vi.fn()
    const credentials = {
      describe: vi.fn(async () => {
        throw new Error('credentials service unreachable')
      }),
    }
    const { subscribe } = fakeSubscribe()
    const gate = new CredentialGate({
      credentials: credentials as unknown as CredentialProvider,
      subscribe,
      log,
    })
    await expect(gate.prime(['TAVILY_API_KEY'])).resolves.toBeUndefined()
    expect(gate.isReady('TAVILY_API_KEY')).toBe(false)
    expect(log).toHaveBeenCalledWith(expect.stringContaining('credential describe failed'))
  })

  it('prime rejects on a ref name outside the credential grammar (misconfiguration fails loud)', async () => {
    const credentials = fakeCredentials(new Set())
    const { subscribe } = fakeSubscribe()
    const gate = new CredentialGate({ credentials: credentials as unknown as CredentialProvider, subscribe })
    await expect(gate.prime(['not a valid ref!'])).rejects.toThrow(TypeError)
  })
})
