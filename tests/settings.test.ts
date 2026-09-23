import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { SETTINGS_NAMESPACE, LiveResolvedConfig, attachSettingsSection } from '../src/settings.ts'

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
    attachSettingsSection(ctx, entry, live)

    expect(captured.ns).toBe(SETTINGS_NAMESPACE)
    expect(SETTINGS_NAMESPACE).toBe('dsh-websearch')
    // ADR-0021: the legacy branch hands the service a materialized snapshot
    // of the runtime entry, not the runtime object itself.
    expect(captured.entry).toStrictEqual(entry)
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
    attachSettingsSection(ctx, {}, live)
    const hooks = captured.hooks as { validate?: (value: unknown) => void }
    expect(hooks.validate).toBeTypeOf('function')
    const validate = hooks.validate!
    // The legal single-list states pass; both-at-once is the rejected state.
    expect(() => validate({ searchIncludeDomains: 'a.test' })).not.toThrow()
    expect(() => validate({ searchExcludeDomains: 'b.test' })).not.toThrow()
    expect(() => validate({ searchIncludeDomains: 'a.test', searchExcludeDomains: 'b.test' })).toThrow(/mutually exclusive/)
  })

  it('S22 T3: the Firecrawl tbs guard rides the same validate hook (rejects before persist)', () => {
    const { ctx, captured } = fakeSettingsCtx()
    const live = new LiveResolvedConfig({})
    attachSettingsSection(ctx, {}, live)
    const hooks = captured.hooks as { validate?: (value: unknown) => void }
    const validate = hooks.validate!
    expect(() => validate({ firecrawl: { tbs: 'banana' } })).toThrow(/tbs/)
    expect(() => validate({ firecrawl: { tbs: 'sbd:1' } })).not.toThrow()
  })

  it('S22 T2: the Exa section-filter guard rides the same validate hook (rejects before persist)', () => {
    const { ctx, captured } = fakeSettingsCtx()
    const live = new LiveResolvedConfig({})
    attachSettingsSection(ctx, {}, live)
    const hooks = captured.hooks as { validate?: (value: unknown) => void }
    const validate = hooks.validate!
    expect(() => validate({ exa: { includeSections: 'body' } })).toThrow(/maxAgeHours/)
    expect(() => validate({ exa: { includeSections: 'body', maxAgeHours: 0 } })).not.toThrow()
    expect(() => validate({ exa: { excludeSections: 'header', maxAgeHours: -1 } })).not.toThrow()
  })
})

describe('attachSettingsSection dual-path dispatch (S32, ADR-0021)', () => {
  /**
   * A 0.1.7+ settings service face: no `installSection` (deleted upstream in
   * favor of volatile forms). Captures the `settings/document-updated`
   * subscription the C path registers for commit-side re-prime.
   */
  function volatileHostCtx() {
    const events: { name?: string, listener?: (...args: unknown[]) => void } = {}
    const ctx = {
      inject: (_names: readonly string[], cb: (sctx: { settings: Record<string, never> }) => void) => {
        cb({ settings: {} })
      },
      on: (name: string, listener: (...args: unknown[]) => void) => {
        events.name = name
        events.listener = listener
        return () => {}
      },
    }
    return { ctx: ctx as unknown as Context, events }
  }

  it('adopts read-time evaluation when the host settings service has no installSection (0.1.7+ volatile path)', () => {
    const { ctx } = volatileHostCtx()
    // A volatile-shaped runtime config: each field arrives as a handle that
    // re-reads its backing store on every .get(), like the host's Volatile
    // wrappers on 0.1.7+.
    let chain: unknown = ['dshws-tavily']
    const entry = { searchChain: { get: () => chain } }
    const live = new LiveResolvedConfig({ searchChain: ['dshws-firecrawl'] })
    attachSettingsSection(ctx, entry as never, live)

    // The volatile source takes over immediately…
    expect(live.current().searchChain).toEqual(['dshws-tavily'])
    // …and every read re-evaluates: a committed change (new backing value)
    // reaches current() with NO refresh() call — the 0.1.7 hot path.
    chain = ['dshws-exa']
    expect(live.current().searchChain).toEqual(['dshws-exa'])
  })

  it('registers settings/document-updated for the plugin namespace and re-primes on own-ns commits only (C path)', () => {
    const { ctx, events } = volatileHostCtx()
    const committed: number[] = []
    const live = new LiveResolvedConfig({})
    attachSettingsSection(ctx, {} as never, live, { onCommitted: () => committed.push(1) })

    expect(events.name).toBe('settings/document-updated')
    events.listener!(SETTINGS_NAMESPACE, 7)
    expect(committed).toHaveLength(1)
    // Foreign namespaces do not re-prime the credential gate.
    events.listener!('llm-deepseek', 8)
    expect(committed).toHaveLength(1)
  })

  it('plain runtime values pass through the volatile source unchanged (0.1.5/0.1.6 never enter this branch)', () => {
    const { ctx } = volatileHostCtx()
    const live = new LiveResolvedConfig({})
    attachSettingsSection(ctx, { searchChain: ['dshws-exa'] } as never, live)
    expect(live.current().searchChain).toEqual(['dshws-exa'])
  })
})