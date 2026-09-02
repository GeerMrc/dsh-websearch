import { describe, expect, it } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import { Config } from '../src/config.ts'
import { SETTINGS_NAMESPACE, LiveResolvedConfig, attachSettingsSection } from '../src/settings.ts'

describe('LiveResolvedConfig', () => {
  it('starts as the resolved loader config', () => {
    const live = new LiveResolvedConfig({ searchChain: ['dshws-tavily'], perMemberTimeoutMs: 5000 })
    expect(live.current().searchChain).toEqual(['dshws-tavily'])
    expect(live.current().perMemberTimeoutMs).toBe(5000)
    // Explicit defaulting applies to anything the config omits.
    expect(live.current().tavily.enabled).toBe(true)
  })

  it('setSource swaps the authoritative source and recomputes (settings attach semantics)', () => {
    const live = new LiveResolvedConfig({})
    live.setSource(() => ({ searchChain: ['dshws-deepseek', 'dshws-tavily'], perMemberTimeoutMs: 1234 }))
    expect(live.current().searchChain).toEqual(['dshws-deepseek', 'dshws-tavily'])
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
    expect(live.current().searchChain).toEqual(['dshws-deepseek', 'dshws-tavily'])
  })

  it('applies explicit defaulting to settings-sourced sections too', () => {
    const live = new LiveResolvedConfig({})
    live.setSource(() => ({}))
    expect(live.current().perMemberTimeoutMs).toBe(30000)
    expect(live.current().perplexity.enabled).toBe(true)
    expect(live.current().fetchChain).toEqual(['dshws-tavily', 'dshws-exa', 'dshws-perplexity', 'dshws-firecrawl', 'dshws-deepseek'])
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
    captured.hooks!.setSource(() => ({ searchChain: ['dshws-deepseek'] }))
    captured.hooks!.onChange()
    expect(live.current().searchChain).toEqual(['dshws-deepseek'])
    // A committed settings change re-runs onChange with the same source thunk.
    captured.hooks!.onChange()
    expect(live.current().searchChain).toEqual(['dshws-deepseek'])
  })
})
