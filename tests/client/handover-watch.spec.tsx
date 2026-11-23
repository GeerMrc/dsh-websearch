import { describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import { BUNDLE_NAMES, PLUGIN_MANAGER_CHANGED, installHandoverWatch } from '../../src/client/handover-watch.ts'

/**
 * Client handover watch (ADR-0024 decision 4). The Host forwards
 * `plugin-manager/changed` after every plugin-manager operation and the Web
 * client stays alive across a bundle switch, which is the only channel on
 * hosts without HMR. On each event the watch checks whether this bundle is
 * still enabled; once it is not, it clears the seam's user-layer selections
 * that name this plugin's providers, re-reading once when the write is refused.
 */

const UNSET_SEARCH = { op: 'unset', path: ['searchProvider'] }
const UNSET_FETCH = { op: 'unset', path: ['fetchProvider'] }
const PINNED = { searchProvider: 'dshws-tavily', fetchProvider: 'dshws-fetch-gate' }

interface FakeHandle {
  ctx: Context
  /** Triggers the registered `plugin-manager/changed` handler and lets its promise settle. */
  emit: () => Promise<void>
  listBundles: ReturnType<typeof vi.fn>
  getSnapshot: ReturnType<typeof vi.fn>
  mutate: ReturnType<typeof vi.fn>
  $on: ReturnType<typeof vi.fn>
  get: ReturnType<typeof vi.fn>
}

interface FakeOptions {
  /** What `listBundles` resolves to; a function is used as the implementation. */
  bundles?: unknown | (() => Promise<unknown>)
  /** Successive snapshots returned by `getSnapshot`. */
  snapshots?: readonly unknown[]
  /** Successive answers of `mutate`: true accepts, false refuses; a function supplies the outcome. */
  answers?: readonly (boolean | (() => Promise<boolean>))[]
  withoutPluginManager?: boolean
  withoutConfigForms?: boolean
}

/** Hand-built client ctx stub exposing only the faces the watch touches. */
function makeCtx(options: FakeOptions = {}): FakeHandle {
  const handlers = new Set<() => void>()
  const snapshots = [...(options.snapshots ?? [{ status: 'ready', user: PINNED, revision: 4 }])]
  const answers = [...(options.answers ?? [true])]
  const source = options.bundles
  const listBundles = vi.fn(() => (typeof source === 'function'
    ? (source as () => Promise<unknown>)()
    : Promise.resolve(source ?? [{ name: 'dsh-websearch', enabled: false }])))
  const getSnapshot = vi.fn(() => (snapshots.length > 1 ? snapshots.shift() : snapshots[0]))
  const mutate = vi.fn(async (): Promise<boolean> => {
    const answer = answers.length > 1 ? answers.shift() : answers[0]
    if (answer !== true && answer !== false) {
      if (answer === undefined) throw new Error('mutate answer exhausted')
      return answer()
    }
    return answer
  })
  const $on = vi.fn((event: string, handler: () => void) => {
    handlers.add(handler)
    return () => { handlers.delete(handler) }
  })
  const get = vi.fn((name: string) => {
    if (name === 'remote.pluginManager') return options.withoutPluginManager ? undefined : { listBundles }
    if (name === 'configForms') return options.withoutConfigForms ? undefined : { get: () => ({ getSnapshot, mutate }) }
    return undefined
  })
  const ctx = { get, remote: { $on } } as unknown as Context
  const emit = async () => {
    for (const handler of handlers) handler()
    for (let i = 0; i < 6; i++) await Promise.resolve()
  }
  return { ctx, emit, listBundles, getSnapshot, mutate, $on, get }
}

describe('installHandoverWatch', () => {
  it('subscribes to plugin-manager/changed and returns the unsubscribe function', () => {
    const { ctx, $on } = makeCtx()
    const unsubscribe = installHandoverWatch(ctx)
    expect($on).toHaveBeenCalledWith(PLUGIN_MANAGER_CHANGED, expect.any(Function))
    unsubscribe()
    expect($on.mock.results[0]?.value).toBe(unsubscribe)
  })

  it('looks the two optional faces up through ctx.get', () => {
    const { ctx, get } = makeCtx()
    installHandoverWatch(ctx)
    expect(get).toHaveBeenCalledWith('remote.pluginManager')
    expect(get).toHaveBeenCalledWith('configForms')
  })

  it.each([
    ['remote.pluginManager', { withoutPluginManager: true }],
    ['configForms', { withoutConfigForms: true }],
  ])('does not subscribe when the host exposes no %s', (_face, options) => {
    const { ctx, $on } = makeCtx(options)
    expect(typeof installHandoverWatch(ctx)).toBe('function')
    expect($on).not.toHaveBeenCalled()
  })

  it('leaves the selection alone while the bundle is still enabled', async () => {
    const { ctx, emit, mutate } = makeCtx({ bundles: [{ name: 'dsh-websearch', enabled: true }] })
    installHandoverWatch(ctx)
    await emit()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('clears the plugin selections once the bundle is disabled, fenced by the snapshot revision', async () => {
    const { ctx, emit, mutate } = makeCtx()
    installHandoverWatch(ctx)
    await emit()
    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith([UNSET_SEARCH, UNSET_FETCH], 4)
  })

  it('also hands over once the bundle has been uninstalled and is no longer listed', async () => {
    const { ctx, emit, mutate } = makeCtx({ bundles: [{ name: '@deepseek-ai/dsh-experimental-voice-input-bundle', enabled: true }] })
    installHandoverWatch(ctx)
    await emit()
    expect(mutate).toHaveBeenCalledTimes(1)
  })

  it.each(BUNDLE_NAMES)('recognizes the bundle under the name %s', async (name) => {
    const { ctx, emit, mutate } = makeCtx({ bundles: [{ name, enabled: false }] })
    installHandoverWatch(ctx)
    await emit()
    expect(mutate).toHaveBeenCalledTimes(1)
  })

  it('accepts a Remote-style bundle list', async () => {
    const { ctx, emit, mutate } = makeCtx({ bundles: { ok: true, value: [{ name: 'dsh-websearch', enabled: false }] } })
    installHandoverWatch(ctx)
    await emit()
    expect(mutate).toHaveBeenCalledTimes(1)
  })

  it('does not write when the user layer names no plugin provider', async () => {
    const { ctx, emit, mutate } = makeCtx({ snapshots: [{ status: 'ready', user: { searchProvider: 'deepseek-search-api', fetchProvider: 'http' }, revision: 2 }] })
    installHandoverWatch(ctx)
    await emit()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('does not write without a revision to fence the write', async () => {
    const { ctx, emit, mutate } = makeCtx({ snapshots: [{ status: 'loading', user: PINNED, revision: undefined }] })
    installHandoverWatch(ctx)
    await emit()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('does not write when the bundle list cannot be recognised', async () => {
    const { ctx, emit, mutate } = makeCtx({ bundles: { ok: false } })
    installHandoverWatch(ctx)
    await emit()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('re-reads and retries once when the first write is refused', async () => {
    const stale = { status: 'ready', user: PINNED, revision: 4 }
    const fresh = { status: 'ready', user: PINNED, revision: 9 }
    const { ctx, emit, mutate, getSnapshot } = makeCtx({ snapshots: [stale, fresh], answers: [false, true] })
    installHandoverWatch(ctx)
    await emit()
    expect(getSnapshot).toHaveBeenCalledTimes(2)
    expect(mutate).toHaveBeenCalledTimes(2)
    expect(mutate).toHaveBeenLastCalledWith([UNSET_SEARCH, UNSET_FETCH], 9)
  })

  it('stops retrying when the fresh snapshot no longer names a plugin provider', async () => {
    const stale = { status: 'ready', user: PINNED, revision: 4 }
    const cleared = { status: 'ready', user: {}, revision: 9 }
    const { ctx, emit, mutate } = makeCtx({ snapshots: [stale, cleared], answers: [false, true] })
    installHandoverWatch(ctx)
    await emit()
    expect(mutate).toHaveBeenCalledTimes(1)
  })

  it('reports a twice-refused write without throwing', async () => {
    const warn = vi.fn()
    const { ctx, emit, mutate } = makeCtx({ answers: [false] })
    installHandoverWatch(ctx, warn)
    await emit()
    expect(mutate).toHaveBeenCalledTimes(2)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('reports a failing bundle list without throwing', async () => {
    const warn = vi.fn()
    const { ctx, emit, mutate } = makeCtx({ bundles: () => Promise.reject(new Error('remote gone')) })
    installHandoverWatch(ctx, warn)
    await emit()
    expect(mutate).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/remote gone/)
  })

  it('reports a rejecting write without throwing', async () => {
    const warn = vi.fn()
    const { ctx, emit } = makeCtx({ answers: [() => Promise.reject(new Error('transport failed'))] })
    installHandoverWatch(ctx, warn)
    await emit()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/transport failed/)
  })

  it('reports a write that throws synchronously without throwing', async () => {
    const warn = vi.fn()
    const { ctx, emit } = makeCtx({ answers: [() => { throw new TypeError('form disposed') }] })
    installHandoverWatch(ctx, warn)
    await emit()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/form disposed/)
  })

  it('stops watching after the returned function is called', async () => {
    const { ctx, emit, mutate } = makeCtx()
    installHandoverWatch(ctx)()
    await emit()
    expect(mutate).not.toHaveBeenCalled()
  })
})
