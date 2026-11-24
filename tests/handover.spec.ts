import { describe, expect, it, vi } from 'vitest'
import { isPluginProviderId, pinnedSelections, planHandoverOps, revertHandover, WEB_NAMESPACE } from '../src/handover.ts'
import type { HandoverSettings, SeamPin } from '../src/handover.ts'

/**
 * Handover contract (ADR-0024 decisions 3–4): when the bundle goes away, the
 * seam's user-layer selection must stop pointing at providers this plugin
 * registered. Only user-layer values with the plugin prefix are cleared, both
 * selection keys are cleared together, and every failure is reported without
 * throwing — a handover must never break a toggle, a startup or a shutdown.
 */
const UNSET_SEARCH = { op: 'unset', path: ['searchProvider'] }
const UNSET_FETCH = { op: 'unset', path: ['fetchProvider'] }

type MutateBehaviour = 'resolve' | 'reject' | 'throw'

interface FakeHandle {
  settings: HandoverSettings
  describe: ReturnType<typeof vi.fn>
  mutate: ReturnType<typeof vi.fn>
}

/** Structural stand-in for the host settings service; `behaviour` drives what `mutate` does. */
function fakeSettings(descriptors: readonly unknown[], behaviour: MutateBehaviour = 'resolve'): FakeHandle {
  const describe = vi.fn(() => descriptors)
  const mutate = vi.fn()
  if (behaviour === 'reject') mutate.mockImplementation(async () => { throw new Error('revision conflict') })
  if (behaviour === 'throw') mutate.mockImplementation(() => { throw new TypeError('web field is not volatile') })
  return { settings: { describe, mutate } as unknown as HandoverSettings, describe, mutate }
}

const PINNED = [{ ns: WEB_NAMESPACE, revision: 7, user: { searchProvider: 'dshws-tavily', fetchProvider: 'dshws-fetch-gate' } }]

describe('planHandoverOps', () => {
  it('plans an unset for a user-layer search selection that names a plugin provider', () => {
    expect(planHandoverOps({ searchProvider: 'dshws-chain' })).toEqual([UNSET_SEARCH])
  })

  it('plans an unset for a user-layer fetch selection that names a plugin provider', () => {
    expect(planHandoverOps({ fetchProvider: 'dshws-fetch-gate' })).toEqual([UNSET_FETCH])
  })

  it('clears both selection keys together when both name plugin providers', () => {
    expect(planHandoverOps({ searchProvider: 'dshws-tavily', fetchProvider: 'dshws-fetch-gate' }))
      .toEqual([UNSET_SEARCH, UNSET_FETCH])
  })

  it('leaves official and third-party selections alone', () => {
    expect(planHandoverOps({ searchProvider: 'deepseek-search-api', fetchProvider: 'http' })).toEqual([])
    expect(planHandoverOps({ searchProvider: 'exa', fetchProvider: 'deepseek-fetch-api' })).toEqual([])
  })

  it('plans nothing when the user layer carries no selection', () => {
    expect(planHandoverOps(undefined)).toEqual([])
    expect(planHandoverOps({})).toEqual([])
    expect(planHandoverOps('dshws-chain')).toEqual([])
    expect(planHandoverOps({ searchProvider: undefined, fetchProvider: null })).toEqual([])
  })

  it('recognizes plugin providers by the dshws- prefix only', () => {
    expect(isPluginProviderId('dshws-')).toBe(true)
    expect(isPluginProviderId('dshws-chain')).toBe(true)
    expect(isPluginProviderId('dshws')).toBe(false)
    expect(isPluginProviderId('deepseek-official')).toBe(false)
    expect(isPluginProviderId('')).toBe(false)
    expect(isPluginProviderId(42)).toBe(false)
  })
})

describe('revertHandover', () => {
  it('clears the plugin selections through the host settings service at the descriptor revision', async () => {
    const { settings, describe, mutate } = fakeSettings(PINNED)
    await revertHandover(settings)
    expect(describe).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate).toHaveBeenCalledWith(WEB_NAMESPACE, [UNSET_SEARCH, UNSET_FETCH], 7)
  })

  it('reads the user layer, not the effective value', async () => {
    // The bundle layer alone pins the seam: the effective value names a plugin
    // provider, yet nothing in the user layer does, so there is nothing to clear.
    const pinned = [{ ns: WEB_NAMESPACE, revision: 2, base: { searchProvider: 'dshws-chain' }, value: { searchProvider: 'dshws-chain' }, user: {} }]
    const { settings, mutate } = fakeSettings(pinned)
    await revertHandover(settings)
    expect(mutate).not.toHaveBeenCalled()
  })

  it('does not write when the user layer only names official providers', async () => {
    const official = [{ ns: WEB_NAMESPACE, revision: 3, user: { searchProvider: 'deepseek-search-api', fetchProvider: 'http' } }]
    const { settings, mutate } = fakeSettings(official)
    await revertHandover(settings)
    expect(mutate).not.toHaveBeenCalled()
  })

  it('does not write when the seam publishes no settings descriptor', async () => {
    const { settings, mutate } = fakeSettings([{ ns: 'dsh-websearch', revision: 1, user: {} }])
    await revertHandover(settings)
    expect(mutate).not.toHaveBeenCalled()
  })

  it('is a no-op without a settings service', async () => {
    await expect(revertHandover(undefined)).resolves.toBeUndefined()
  })

  it('reports a throwing descriptor read without throwing', async () => {
    const warn = vi.fn()
    const settings = {
      describe: () => {
        throw new Error('describe failed')
      },
      mutate: vi.fn(),
    } as unknown as HandoverSettings
    await expect(revertHandover(settings, warn)).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/handover.*describe failed/)
  })

  it('reports a rejected write without throwing', async () => {
    const warn = vi.fn()
    const { settings } = fakeSettings(PINNED, 'reject')
    await expect(revertHandover(settings, warn)).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/handover.*revision conflict/)
  })

  it('reports a write that throws synchronously without throwing', async () => {
    const warn = vi.fn()
    const { settings } = fakeSettings(PINNED, 'throw')
    await expect(revertHandover(settings, warn)).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/handover.*not volatile/)
  })
})

describe('pinnedSelections', () => {
  it('lists each user-layer selection that names a plugin provider with its field and value', () => {
    expect(pinnedSelections({ searchProvider: 'dshws-tavily', fetchProvider: 'dshws-fetch-gate' }))
      .toEqual<SeamPin[]>([
        { field: 'searchProvider', value: 'dshws-tavily' },
        { field: 'fetchProvider', value: 'dshws-fetch-gate' },
      ])
  })

  it('lists one side alone and skips official or third-party ids', () => {
    expect(pinnedSelections({ fetchProvider: 'dshws-fetch-gate' })).toEqual<SeamPin[]>([{ field: 'fetchProvider', value: 'dshws-fetch-gate' }])
    expect(pinnedSelections({ searchProvider: 'deepseek-search-api', fetchProvider: 'http' })).toEqual<SeamPin[]>([])
  })

  it('plans nothing for a missing or non-object user layer', () => {
    expect(pinnedSelections(undefined)).toEqual<SeamPin[]>([])
    expect(pinnedSelections({})).toEqual<SeamPin[]>([])
    expect(pinnedSelections('dshws-chain')).toEqual<SeamPin[]>([])
  })

  it('agrees with planHandoverOps: one unset per listed pin, in the same field order', () => {
    const user = { searchProvider: 'dshws-tavily', fetchProvider: 'dshws-fetch-gate' }
    expect(planHandoverOps(user)).toEqual(pinnedSelections(user).map((pin) => ({ op: 'unset', path: [pin.field] })))
  })
})
