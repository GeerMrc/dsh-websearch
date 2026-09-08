import { describe, expect, it } from 'vitest'
import { en, NS, zh } from '../../src/client/locales.ts'
import type { DshWsLocaleKey } from '../../src/client/locales.ts'

// Runtime mirror of the compile-time parity the typed dictionaries enforce
// (Record<DshWsLocaleKey, string> on both dicts): if a key lands on one side
// only, the type error fires at build and this guard keeps an `as any`-style
// escape from shipping silently.
describe('client locales', () => {
  it('NS matches the plugin settings namespace', () => {
    expect(NS).toBe('dsh-websearch')
  })

  it('zh and en dictionaries carry exactly the same key set', () => {
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort())
  })

  it('every dictionary entry is a non-empty string on both sides', () => {
    const keys = Object.keys(en) as DshWsLocaleKey[]
    expect(keys.length).toBeGreaterThan(0)
    for (const key of keys) {
      expect(en[key].length).toBeGreaterThan(0)
      expect(zh[key].length).toBeGreaterThan(0)
    }
  })

  it('carries the S07 reorder and chain-state keys on both sides', () => {
    expect(en.moveUp).toBe('Move up')
    expect(en.moveDown).toBe('Move down')
    expect(en.chainPinned).toBe('Pinned (overrides default)')
    expect(zh.moveUp).toBe('上移')
    expect(zh.moveDown).toBe('下移')
    expect(zh.chainPinned).toBe('已钉死（覆盖默认序）')
  })

  it('carries the S14u floor notes on both sides (假警告清偿)', () => {
    expect(en.chainFloorFetchNote).toContain('free fetch fallback')
    expect(zh.chainFloorFetchNote).toContain('免费 fetch 兜底')
    expect(en.chainFloorDeepseekNote).toContain('DeepSeek fallback')
    expect(zh.chainFloorDeepseekNote).toContain('DeepSeek 兜底')
  })
})
