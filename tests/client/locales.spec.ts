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

  it('carries the 12a formatted key field note on both sides (反馈②)', () => {
    expect(en.keyFieldNote).toBe('Multiple keys: {APIKEY1,APIKEY2,...} (max 10)')
    expect(zh.keyFieldNote).toBe('多把 key：{APIKEY1,APIKEY2,...}（最多 10 把）')
    // The example key is gone from the union (checked without tripping TS2339).
    expect('keyFieldNoteExample' in en).toBe(false)
    expect('keyFieldNoteExample' in zh).toBe(false)
  })

  it('carries the S07 reorder and chain-state keys on both sides', () => {
    expect(en.moveUp).toBe('Move up')
    expect(en.moveDown).toBe('Move down')
    expect(en.chainDefault).toBe('Built-in default order')
    expect(en.chainPinned).toBe('Pinned (overrides default)')
    expect(zh.moveUp).toBe('上移')
    expect(zh.moveDown).toBe('下移')
    expect(zh.chainDefault).toBe('内置默认序')
    expect(zh.chainPinned).toBe('已钉死（覆盖默认序）')
  })
})
