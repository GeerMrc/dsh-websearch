import { describe, expect, it, vi } from 'vitest'
import { WebSearchSettingsController } from '../../src/client/controller.ts'
import type { WebSearchSettingsPorts } from '../../src/client/controller.ts'
import type { CredentialInfo } from '@deepseek-ai/dsh-credentials'
import type {
  SettingsDescribeValue,
  SettingsNamespaceView,
} from '@deepseek-ai/dsh-settings/types'

/**
 * Fake of the remote face the controller consumes: an in-memory settings
 * namespace plus a credential ref table, recording every mutating call so the
 * behavior tests assert the wire actions (set/unset/update arguments), not
 * just local state flips.
 */
class FakeRemote {
  nsValue: Record<string, unknown> = {}
  revision = 0
  creds = new Map<string, CredentialInfo>()
  readonly setCalls: [string, string][] = []
  readonly unsetCalls: string[] = []
  readonly describeCalls: string[][] = []
  readonly updateCalls: { ns: string; patch: Record<string, unknown>; expectedRevision: number | undefined }[] = []
  failNextSet = false
  failNextUpdate = false
  #referenceHandler?: (ref: string) => void

  describeSettings(): Promise<{ ok: true; value: SettingsDescribeValue } | { ok: false; error: unknown }> {
    const namespaces = [
      {
        ns: 'dsh-websearch',
        schema: {},
        value: this.nsValue,
        applies: 'live',
        secrets: [],
        revision: this.revision,
      },
    ]
    // Test fake: the section value is built as a plain record; the host type
    // wraps it in JsonValue, which this local shape satisfies structurally.
    return Promise.resolve({ ok: true, value: { writable: true, hasDocument: false, namespaces } as SettingsDescribeValue })
  }

  updateSettings(
    ns: string,
    patch: Record<string, unknown>,
    expectedRevision: number | undefined,
  ): Promise<{ ok: true; value: SettingsNamespaceView } | { ok: false; error: unknown }> {
    this.updateCalls.push({ ns, patch, expectedRevision })
    if (this.failNextUpdate) return Promise.resolve({ ok: false, error: { code: 'settings/conflict' } })
    this.nsValue = { ...this.nsValue, ...(patch as Record<string, unknown>) }
    this.revision += 1
    // Same fake simplification as describeSettings: local shape cast to the
    // host view type once, at the fake's edge.
    return Promise.resolve({
      ok: true,
      value: { ns, schema: {}, value: this.nsValue, applies: 'live', secrets: [], revision: this.revision } as SettingsNamespaceView,
    })
  }

  describeCredentials(
    refs: readonly string[],
  ): Promise<{ ok: true; value: Record<string, CredentialInfo> } | { ok: false; error: unknown }> {
    this.describeCalls.push([...refs])
    const out: Record<string, CredentialInfo> = {}
    for (const ref of refs) {
      const info = this.creds.get(ref)
      if (info) out[ref] = info
    }
    return Promise.resolve({ ok: true, value: out })
  }

  setCredential(ref: string, value: string): Promise<{ ok: true; value: void } | { ok: false; error: unknown }> {
    this.setCalls.push([ref, value])
    if (this.failNextSet) return Promise.resolve({ ok: false, error: { code: 'credential/rejected' } })
    this.creds.set(ref, { configured: true, source: 'file', writable: true })
    return Promise.resolve({ ok: true, value: undefined })
  }

  unsetCredential(ref: string): Promise<{ ok: true; value: void } | { ok: false; error: unknown }> {
    this.unsetCalls.push(ref)
    this.creds.set(ref, { configured: false, writable: true })
    return Promise.resolve({ ok: true, value: undefined })
  }

  onReferenceUpdated(handler: (ref: string) => void): () => void {
    this.#referenceHandler = handler
    return () => {
      this.#referenceHandler = undefined
    }
  }

  emitReferenceUpdated(ref: string): void {
    this.#referenceHandler?.(ref)
  }
}

function makePorts(remote: FakeRemote): WebSearchSettingsPorts {
  return {
    describeSettings: () => remote.describeSettings(),
    updateSettings: (ns, patch, expectedRevision) => remote.updateSettings(ns, patch, expectedRevision),
    describeCredentials: (refs) => remote.describeCredentials(refs),
    setCredential: (ref, value) => remote.setCredential(ref, value),
    unsetCredential: (ref) => remote.unsetCredential(ref),
    onReferenceUpdated: (handler) => remote.onReferenceUpdated(handler),
  }
}

const DEFAULT_REF = 'TAVILY_API_KEY'

describe('WebSearchSettingsController', () => {
  it('init derives client defaults from an empty section value', async () => {
    const remote = new FakeRemote()
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()

    const snapshot = controller.snapshot()
    expect(snapshot.members.map((member) => member.key)).toEqual([
      'tavily',
      'exa',
      'perplexity',
      'firecrawl',
      'deepseek',
    ])
    for (const member of snapshot.members) {
      expect(member.enabled).toBe(true)
    }
    expect(snapshot.members.find((member) => member.key === 'tavily')?.refName).toBe(DEFAULT_REF)
    expect(snapshot.searchChain).toEqual([
      'dshws-tavily',
      'dshws-exa',
      'dshws-perplexity',
      'dshws-firecrawl',
      'dshws-deepseek',
    ])
    expect(snapshot.fetchChain).toEqual(snapshot.searchChain)
    expect(snapshot.timeoutMs).toBe(30000)
  })

  it('init honors described settings values over client defaults', async () => {
    const remote = new FakeRemote()
    remote.nsValue = {
      searchChain: ['dshws-exa'],
      perMemberTimeoutMs: 5000,
      tavily: { apiKeyEnv: 'TAVILY_KEY_CUSTOM' },
      deepseek: { enabled: false },
    }
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()

    const snapshot = controller.snapshot()
    expect(snapshot.searchChain).toEqual(['dshws-exa'])
    expect(snapshot.timeoutMs).toBe(5000)
    expect(snapshot.members.find((member) => member.key === 'tavily')?.refName).toBe('TAVILY_KEY_CUSTOM')
    expect(snapshot.members.find((member) => member.key === 'deepseek')?.enabled).toBe(false)
  })

  it('init maps described credential facts onto member cards', async () => {
    const remote = new FakeRemote()
    remote.creds.set(DEFAULT_REF, { configured: true, source: 'file', writable: true })
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()

    const tavily = controller.snapshot().members.find((member) => member.key === 'tavily')
    expect(tavily?.configured).toBe(true)
    expect(tavily?.source).toBe('file')
    const exa = controller.snapshot().members.find((member) => member.key === 'exa')
    expect(exa?.configured).toBe(false)
  })

  it('setKey writes the credential ref then refreshes the fact', async () => {
    const remote = new FakeRemote()
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()

    const result = await controller.setKey('tavily', DEFAULT_REF, 'sk-fake-tavily')
    expect(result.ok).toBe(true)
    expect(remote.setCalls).toEqual([[DEFAULT_REF, 'sk-fake-tavily']])
    expect(controller.snapshot().members.find((member) => member.key === 'tavily')?.configured).toBe(true)
  })

  it('setKey failure leaves the fact unchanged and reports not-ok', async () => {
    const remote = new FakeRemote()
    remote.failNextSet = true
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()

    const result = await controller.setKey('tavily', DEFAULT_REF, 'sk-fake')
    expect(result.ok).toBe(false)
    expect(controller.snapshot().members.find((member) => member.key === 'tavily')?.configured).toBe(false)
  })

  it('clearKey unsets the credential ref then refreshes the fact', async () => {
    const remote = new FakeRemote()
    remote.creds.set(DEFAULT_REF, { configured: true, source: 'file', writable: true })
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()

    const result = await controller.clearKey('tavily', DEFAULT_REF)
    expect(result.ok).toBe(true)
    expect(remote.unsetCalls).toEqual([DEFAULT_REF])
    expect(controller.snapshot().members.find((member) => member.key === 'tavily')?.configured).toBe(false)
  })

  it('setEnabled patches the settings namespace with the current revision', async () => {
    const remote = new FakeRemote()
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()

    const result = await controller.setEnabled('tavily', false)
    expect(result.ok).toBe(true)
    expect(remote.updateCalls).toEqual([
      { ns: 'dsh-websearch', patch: { tavily: { enabled: false } }, expectedRevision: 0 },
    ])
    expect(controller.snapshot().members.find((member) => member.key === 'tavily')?.enabled).toBe(false)
    expect(controller.snapshot().revision).toBe(1)
  })

  it('setEnabled conflict reports not-ok and keeps the described state', async () => {
    const remote = new FakeRemote()
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()
    remote.failNextUpdate = true

    const result = await controller.setEnabled('tavily', false)
    expect(result.ok).toBe(false)
    expect(controller.snapshot().members.find((member) => member.key === 'tavily')?.enabled).toBe(true)
  })

  it('moveSearchChainEntry patches the full materialized order with the current revision', async () => {
    const remote = new FakeRemote()
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()

    const result = await controller.moveSearchChainEntry('dshws-exa', -1)
    expect(result.ok).toBe(true)
    expect(remote.updateCalls).toEqual([
      {
        ns: 'dsh-websearch',
        patch: {
          searchChain: ['dshws-exa', 'dshws-tavily', 'dshws-perplexity', 'dshws-firecrawl', 'dshws-deepseek'],
        },
        expectedRevision: 0,
      },
    ])
    expect(controller.snapshot().searchChain[0]).toBe('dshws-exa')
    expect(controller.snapshot().revision).toBe(1)
  })

  it('moving on the built-in order materializes the explicit chain and flips the pinned flag', async () => {
    const remote = new FakeRemote()
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()
    expect(controller.snapshot().searchChainPinned).toBe(false)
    expect(controller.snapshot().fetchChainPinned).toBe(false)

    const result = await controller.moveSearchChainEntry('dshws-tavily', 1)
    expect(result.ok).toBe(true)
    expect(controller.snapshot().searchChainPinned).toBe(true)
    expect(controller.snapshot().fetchChainPinned).toBe(false)
    expect(controller.snapshot().searchChain[0]).toBe('dshws-exa')
  })

  it('the pinned flags mark exactly the chains the section explicitly sets', async () => {
    const remote = new FakeRemote()
    remote.nsValue = { searchChain: ['dshws-deepseek'] }
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()

    expect(controller.snapshot().searchChainPinned).toBe(true)
    expect(controller.snapshot().fetchChainPinned).toBe(false)
  })

  it('a boundary move reports not-ok without calling the remote', async () => {
    const remote = new FakeRemote()
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()

    const result = await controller.moveSearchChainEntry('dshws-tavily', -1)
    expect(result.ok).toBe(false)
    expect(remote.updateCalls).toEqual([])
  })

  it('a move of an unknown member id reports not-ok without calling the remote', async () => {
    const remote = new FakeRemote()
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()

    const result = await controller.moveSearchChainEntry('dshws-unknown', 1)
    expect(result.ok).toBe(false)
    expect(remote.updateCalls).toEqual([])
  })

  it('snapshots extra pool refs with their credential facts', async () => {
    const remote = new FakeRemote()
    remote.nsValue = { tavily: { extraApiKeyEnvs: ['TAVILY_SPARE'] } }
    remote.creds.set('TAVILY_SPARE', { configured: true, source: 'file', writable: true })
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()

    const tavily = controller.snapshot().members.find((member) => member.key === 'tavily')
    expect(tavily?.extraRefs).toEqual([{ ref: 'TAVILY_SPARE', configured: true, writable: true }])
    const exa = controller.snapshot().members.find((member) => member.key === 'exa')
    expect(exa?.extraRefs).toEqual([])
  })

  it('describes the whole pool, not just the primary ref', async () => {
    const remote = new FakeRemote()
    remote.nsValue = { tavily: { extraApiKeyEnvs: ['TAVILY_SPARE', 'TAVILY_SPARE_2'] } }
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()

    const described = remote.describeCalls.at(-1)!
    expect(described).toContain('TAVILY_API_KEY')
    expect(described).toContain('TAVILY_SPARE')
    expect(described).toContain('TAVILY_SPARE_2')
  })

  it('setKey writes through an explicit extra pool ref', async () => {
    const remote = new FakeRemote()
    remote.nsValue = { tavily: { extraApiKeyEnvs: ['TAVILY_SPARE'] } }
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()

    const result = await controller.setKey('tavily', 'TAVILY_SPARE', 'sk-spare')
    expect(result.ok).toBe(true)
    expect(remote.setCalls).toEqual([['TAVILY_SPARE', 'sk-spare']])
  })

  it('setKey rejects a ref outside the member pool', async () => {
    const remote = new FakeRemote()
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()

    const result = await controller.setKey('tavily', 'EXA_API_KEY', 'sk-x')
    expect(result.ok).toBe(false)
    expect(remote.setCalls).toEqual([])
  })

  it('clearKey unsets an explicit extra pool ref', async () => {
    const remote = new FakeRemote()
    remote.nsValue = { tavily: { extraApiKeyEnvs: ['TAVILY_SPARE'] } }
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()

    const result = await controller.clearKey('tavily', 'TAVILY_SPARE')
    expect(result.ok).toBe(true)
    expect(remote.unsetCalls).toEqual(['TAVILY_SPARE'])
  })

  it('addExtraKey patches the whole extras array with the current revision', async () => {
    const remote = new FakeRemote()
    remote.nsValue = { tavily: { extraApiKeyEnvs: ['TAVILY_SPARE'] } }
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()

    const result = await controller.addExtraKey('tavily', 'TAVILY_SPARE_2')
    expect(result.ok).toBe(true)
    expect(remote.updateCalls).toEqual([
      { ns: 'dsh-websearch', patch: { tavily: { extraApiKeyEnvs: ['TAVILY_SPARE', 'TAVILY_SPARE_2'] } }, expectedRevision: 0 },
    ])
    expect(controller.snapshot().members.find((member) => member.key === 'tavily')?.extraRefs.map((extra) => extra.ref))
      .toEqual(['TAVILY_SPARE', 'TAVILY_SPARE_2'])
  })

  it('addExtraKey rejects empty and duplicate ref names without calling the remote', async () => {
    const remote = new FakeRemote()
    remote.nsValue = { tavily: { extraApiKeyEnvs: ['TAVILY_SPARE'] } }
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()

    expect((await controller.addExtraKey('tavily', '')).ok).toBe(false)
    expect((await controller.addExtraKey('tavily', 'TAVILY_SPARE')).ok).toBe(false)
    expect((await controller.addExtraKey('tavily', 'TAVILY_API_KEY')).ok).toBe(false)
    expect(remote.updateCalls).toEqual([])
  })

  it('removeExtraKey patches the filtered extras array', async () => {
    const remote = new FakeRemote()
    remote.nsValue = { tavily: { extraApiKeyEnvs: ['TAVILY_SPARE', 'TAVILY_SPARE_2'] } }
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()

    const result = await controller.removeExtraKey('tavily', 'TAVILY_SPARE')
    expect(result.ok).toBe(true)
    expect(remote.updateCalls).toEqual([
      { ns: 'dsh-websearch', patch: { tavily: { extraApiKeyEnvs: ['TAVILY_SPARE_2'] } }, expectedRevision: 0 },
    ])
  })

  it('a move conflict reports not-ok and keeps the described order', async () => {
    const remote = new FakeRemote()
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()
    remote.failNextUpdate = true

    const result = await controller.moveSearchChainEntry('dshws-tavily', 1)
    expect(result.ok).toBe(false)
    expect(controller.snapshot().searchChain).toEqual([
      'dshws-tavily',
      'dshws-exa',
      'dshws-perplexity',
      'dshws-firecrawl',
      'dshws-deepseek',
    ])
    expect(controller.snapshot().searchChainPinned).toBe(false)
  })

  it('a credentials/reference-updated event re-describes and notifies', async () => {
    const remote = new FakeRemote()
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()
    const listener = vi.fn()
    controller.subscribe(listener)

    remote.creds.set(DEFAULT_REF, { configured: true, source: 'file', writable: true })
    remote.emitReferenceUpdated(DEFAULT_REF)
    await Promise.resolve()
    await Promise.resolve()

    expect(controller.snapshot().members.find((member) => member.key === 'tavily')?.configured).toBe(true)
    expect(listener).toHaveBeenCalled()
  })

  it('dispose detaches the reference-updated subscription', async () => {
    const remote = new FakeRemote()
    const controller = new WebSearchSettingsController(makePorts(remote))
    await controller.init()
    controller.dispose()

    remote.creds.set(DEFAULT_REF, { configured: true, source: 'file', writable: true })
    remote.emitReferenceUpdated(DEFAULT_REF)
    await Promise.resolve()
    await Promise.resolve()

    expect(controller.snapshot().members.find((member) => member.key === 'tavily')?.configured).toBe(false)
  })
})
