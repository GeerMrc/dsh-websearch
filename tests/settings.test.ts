import { describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { SettingsProvider } from '@deepseek-ai/dsh-settings'
import type { SettingsNamespace } from '@deepseek-ai/dsh-settings'
import { Config } from '../src/config.ts'
import { SETTINGS_NAMESPACE, LiveResolvedConfig, attachSettingsSection } from '../src/settings.ts'

/**
 * Minimal real SettingsProvider subclass (upstream settings.spec.ts fixture
 * pattern): storage is an in-memory document, so the real installSection
 * attach → commit → detach lifecycle drives the plugin wiring here. Fields
 * stay public on purpose — cordis proxies plugin classes, and true `#private`
 * members are unreachable through the proxy.
 */
class MemorySettings extends SettingsProvider {
  doc: Record<string, unknown>

  constructor(ctx: ConstructorParameters<typeof SettingsProvider>[0], options?: { doc?: Record<string, unknown> }) {
    super(ctx)
    this.doc = structuredClone(options?.doc ?? {})
  }

  get writable(): boolean {
    return true
  }

  protected load(): Promise<Record<string, unknown>> {
    return Promise.resolve(structuredClone(this.doc))
  }

  protected persist(ns: SettingsNamespace, section: Record<string, unknown>): Promise<void> {
    this.doc[ns] = structuredClone(section)
    return Promise.resolve()
  }
}

describe('LiveResolvedConfig', () => {
  it('starts as the resolved loader config', () => {
    const live = new LiveResolvedConfig({ searchChain: ['dshws-tavily'], perMemberTimeoutMs: 5000 })
    // ADR-0014: nothing is appended — the last ready member IS the fallback.
    expect(live.current().searchChain).toEqual(['dshws-tavily'])
    expect(live.current().perMemberTimeoutMs).toBe(5000)
    // Explicit defaulting applies to anything the config omits.
    expect(live.current().tavily.enabled).toBe(true)
  })

  it('setSource swaps the authoritative source and recomputes (settings attach semantics)', () => {
    const live = new LiveResolvedConfig({})
    live.setSource(() => ({ searchChain: ['dshws-deepseek', 'dshws-tavily'], perMemberTimeoutMs: 1234 }))
    // ADR-0014: the dead deepseek id is stripped from the span, not re-appended.
    expect(live.current().searchChain).toEqual(['dshws-tavily'])
    expect(live.current().perMemberTimeoutMs).toBe(1234)
    expect(live.current().perMemberTimeoutMs).toBe(1234)
  })

  it('refresh recomputes from the current source (settings onChange semantics)', () => {
    let section: Record<string, unknown> = { searchChain: ['dshws-tavily'] }
    const live = new LiveResolvedConfig({})
    live.setSource(() => section as never)
    expect(live.current().searchChain).toEqual(['dshws-tavily'])

    // The settings service's scope.get() thunk re-reads the committed section;
    // a committed change re-runs onChange with the SAME source thunk.
    section = { searchChain: ['dshws-deepseek', 'dshws-tavily'] }
    live.refresh()
    expect(live.current().searchChain).toEqual(['dshws-tavily'])
  })

  it('applies explicit defaulting to settings-sourced sections too', () => {
    const live = new LiveResolvedConfig({})
    live.setSource(() => ({}))
    expect(live.current().perMemberTimeoutMs).toBe(30000)
    expect(live.current().firecrawl.enabled).toBe(true)
    expect(live.current().fetchChain).toEqual(['dshws-firecrawl', 'dshws-tavily', 'dshws-anysearch'])
  })
})

describe('attachSettingsSection', () => {
  function fakeSettingsCtx() {
    const captured: {
      ns?: string
      entry?: unknown
      hooks?: {
        setSource: (source: () => unknown) => void
        onChange: () => void
      }
    } = {}
    const ctx = {
      inject: (_names: readonly string[], cb: (sctx: { settings: { installSection: (...args: never[]) => void } }) => void) => {
        cb({
          settings: {
            installSection: (_owner: unknown, ns: string, _schema: unknown, entry: unknown, hooks: never) => {
              captured.ns = ns
              captured.entry = entry
              captured.hooks = hooks
            },
          },
        })
      },
    }
    return { ctx: ctx as unknown as Context, captured }
  }

  it('attaches the plugin namespace with the Config schema and drives the live config through the service hooks', () => {
    const { ctx, captured } = fakeSettingsCtx()
    const entry = { searchChain: ['dshws-tavily'] }
    const live = new LiveResolvedConfig(entry)
    attachSettingsSection(ctx, Config, entry, live)

    expect(captured.ns).toBe(SETTINGS_NAMESPACE)
    expect(SETTINGS_NAMESPACE).toBe('dsh-websearch')
    expect(captured.entry).toBe(entry)
    // installSection calls setSource(scope.get) then onChange() at attach time;
    // driving them in service order must move the live state.
    captured.hooks!.setSource(() => ({ searchChain: ['dshws-deepseek', 'dshws-tavily'] }))
    captured.hooks!.onChange()
    // The dead deepseek id is stripped (ADR-0014); the span survives verbatim.
    expect(live.current().searchChain).toEqual(['dshws-tavily'])
    // A committed settings change re-runs onChange with the same source thunk.
    captured.hooks!.onChange()
    expect(live.current().searchChain).toEqual(['dshws-tavily'])
  })

  it('S20 T1: the domain exclusivity validator rides the validate hook (rejects before persist, ADR-0018)', () => {
    const { ctx, captured } = fakeSettingsCtx()
    const live = new LiveResolvedConfig({})
    attachSettingsSection(ctx, Config, {}, live)
    const hooks = captured.hooks as { validate?: (value: unknown) => void }
    expect(hooks.validate).toBeTypeOf('function')
    const validate = hooks.validate!
    // The legal single-list states pass; both-at-once is the rejected state.
    expect(() => validate({ searchIncludeDomains: 'a.test' })).not.toThrow()
    expect(() => validate({ searchExcludeDomains: 'b.test' })).not.toThrow()
    expect(() => validate({ searchIncludeDomains: 'a.test', searchExcludeDomains: 'b.test' })).toThrow(/mutually exclusive/)
  })
})

describe('attachSettingsSection against the real settings service (S-1 真实 seam)', () => {
  it('drives the live state through attach, a live commit, and detach fallback', async () => {
    const ctx = new Context()
    const entry = { searchChain: ['dshws-tavily'] }
    const live = new LiveResolvedConfig(entry)
    attachSettingsSection(ctx, Config, entry, live)

    // No settings service mounted: nothing ran, the entry stays authoritative.
    expect(live.current().searchChain).toEqual(['dshws-tavily'])

    const fiber = ctx.plugin(MemorySettings, { doc: { 'dsh-websearch': { searchChain: ['dshws-deepseek', 'dshws-tavily'] } } })
    await fiber
    // The committed pre-S14c shape drops the dead deepseek id (ADR-0014).
    await vi.waitFor(() => expect(live.current().searchChain).toEqual(['dshws-tavily']))

    await ctx.settings.update('dsh-websearch', { searchChain: ['dshws-exa'] })
    await vi.waitFor(() => expect(live.current().searchChain).toEqual(['dshws-exa']))

    // Provider detach falls back to the entry config.
    await fiber.dispose()
    await vi.waitFor(() => expect(live.current().searchChain).toEqual(['dshws-tavily']))
  })
})
