import { describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import { BUNDLE_NAMES, PLUGIN_MANAGER_CHANGED, WATCH_FACES, installHandoverWatch } from '../../src/client/handover-watch.ts'

/**
 * Client handover watch (ADR-0024 decision 4). The Host forwards
 * `plugin-manager/changed` after every plugin-manager operation, and a Web
 * client that is still subscribed when the event arrives can act on it.
 * Measured on 0.2.2-rc.5, the watch is stopped before the event arrives in
 * most bundle switches and survives in a few, so it is a best-effort channel.
 * Both host faces are optional and are requested through an
 * inject: on rc.5 the plugin-manager Remote is served shortly AFTER this
 * plugin's apply, so a one-shot lookup would miss it. On each event the watch
 * checks whether this bundle is still enabled; once it is not, it clears the
 * seam's user-layer selections that name this plugin's providers, re-reading
 * once when the write is refused.
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
  inject: ReturnType<typeof vi.fn>
}

interface FakeOptions {
  /** What `listBundles` resolves to; a function is used as the implementation. */
  bundles?: unknown | (() => Promise<unknown>)
  /** Successive snapshots returned by `getSnapshot`. */
  snapshots?: readonly unknown[]
  /** Successive answers of `mutate`: true accepts, false refuses; a function supplies the outcome. */
  answers?: readonly (boolean | (() => Promise<boolean>))[]
  /** Serve the injected faces only when `serve` is called on the handle. */
  facesArriveLater?: boolean
  /** Never serve the plugin-manager face. */
  withoutPluginManager?: boolean
}

interface FakeHandleWithServe extends FakeHandle {
  /** Serves the injected faces to the pending inject callback. */
  serve: () => void
}

/** Hand-built client ctx stub exposing only the faces the watch touches. */
function makeCtx(options: FakeOptions = {}): FakeHandleWithServe {
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
    if (answer === undefined) throw new Error('mutate answer exhausted')
    return typeof answer === 'function' ? answer() : answer
  })
  const $on = vi.fn((_event: string, handler: () => void) => {
    handlers.add(handler)
    return () => { handlers.delete(handler) }
  })
  const scoped = {
    remote: { $on, ...(options.withoutPluginManager ? {} : { pluginManager: { listBundles } }) },
    configForms: { get: () => ({ getSnapshot, mutate }) },
  }
  let pending: ((scope: typeof scoped) => void) | undefined
  const inject = vi.fn((_deps: readonly string[], callback: (scope: typeof scoped) => void) => {
    pending = callback
    if (!options.facesArriveLater && !options.withoutPluginManager) callback(scoped)
    return { dispose: () => {} }
  })
  const ctx = { inject } as unknown as Context
  const emit = async () => {
    for (const handler of handlers) handler()
    for (let i = 0; i < 6; i++) await Promise.resolve()
  }
  return {
    ctx, emit, listBundles, getSnapshot, mutate, $on, inject,
    serve: () => { pending?.(scoped) },
  }
}

describe('installHandoverWatch', () => {
  it('requests both optional faces through one inject and subscribes once they are served', () => {
    const { ctx, inject, $on } = makeCtx()
    const unsubscribe = installHandoverWatch(ctx)
    expect(inject).toHaveBeenCalledWith(WATCH_FACES, expect.any(Function))
    expect([...WATCH_FACES].sort()).toEqual(['configForms', 'remote.pluginManager'])
    expect($on).toHaveBeenCalledWith(PLUGIN_MANAGER_CHANGED, expect.any(Function))
    expect(typeof unsubscribe).toBe('function')
  })

  it('waits for faces that the host serves only after apply (rc.5 ordering)', async () => {
    const { ctx, serve, $on, emit, mutate } = makeCtx({ facesArriveLater: true })
    installHandoverWatch(ctx)
    expect($on).not.toHaveBeenCalled()
    serve()
    expect($on).toHaveBeenCalledTimes(1)
    await emit()
    expect(mutate).toHaveBeenCalledTimes(1)
  })

  it('never subscribes when the host does not serve the plugin-manager face', async () => {
    const { ctx, $on, emit, mutate } = makeCtx({ withoutPluginManager: true })
    const unsubscribe = installHandoverWatch(ctx)
    expect(typeof unsubscribe).toBe('function')
    await emit()
    expect($on).not.toHaveBeenCalled()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('does not subscribe when it was stopped before the faces arrived', () => {
    const { ctx, serve, $on } = makeCtx({ facesArriveLater: true })
    installHandoverWatch(ctx)()
    serve()
    expect($on).not.toHaveBeenCalled()
  })

  it('stops watching when the returned function is called', async () => {
    const { ctx, emit, mutate } = makeCtx()
    installHandoverWatch(ctx)()
    await emit()
    expect(mutate).not.toHaveBeenCalled()
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
    const official = { status: 'ready', user: { searchProvider: 'deepseek-search-api', fetchProvider: 'http' }, revision: 2 }
    const { ctx, emit, mutate } = makeCtx({ snapshots: [official] })
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
})
