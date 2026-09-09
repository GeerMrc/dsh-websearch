import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { clearAllSearchOnlyPresets, ensureAllSearchOnlyPresets, generateSearchOnlyComposition, SEARCH_ONLY_PRESET_ID } from '../src/preset-authoring.ts'

let dirs: string[] = []
afterEach(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true })
  dirs = []
})

const STANDARD = `groups:
  - id: shell
- id: tool-web
  name: '@deepseek-ai/dsh-tool-web'
  config:
    fetch: true
    searchTimeoutMs: 60000
- id: fs
`

describe('generateSearchOnlyComposition (S15a)', () => {
  it('diffs exactly the tool-web fetch flag and stamps the marker', () => {
    const out = generateSearchOnlyComposition(STANDARD)
    expect(out).toContain('# dsh-websearch authored (v2)')
    expect(out).toContain("config:\n    fetch: false\n    searchTimeoutMs: 60000")
    expect(out).not.toContain('fetch: true')
    expect(out).toContain('- id: fs\n')
  })

  it('returns undefined when the shipped shape drifts (no blind rewrite)', () => {
    expect(generateSearchOnlyComposition('no tool-web row here')).toBeUndefined()
  })
})

describe('ensureAllSearchOnlyPresets (S15a)', () => {
  /** Build a fake shipped-preset ROOT with the three fetch presets. */
  function setup(): { home: string; presetRoot: string } {
    const home = mkdtempSync(join(tmpdir(), 'dshws-home-'))
    const presetRoot = mkdtempSync(join(tmpdir(), 'dshws-std-'))
    for (const id of ['standard', 'ptc', 'cordis']) {
      mkdirSync(join(presetRoot, id), { recursive: true })
      writeFileSync(join(presetRoot, id, 'agent.cordis.yml'), STANDARD, 'utf8')
    }
    dirs.push(home, presetRoot)
    return { home, presetRoot }
  }

  it('writes the standard copy and is idempotent, returning the standard id', () => {
    const { home, presetRoot } = setup()
    expect(ensureAllSearchOnlyPresets(home, presetRoot)).toBe(SEARCH_ONLY_PRESET_ID)
    const dir = join(home, '.agent-presets', SEARCH_ONLY_PRESET_ID)
    const first = readFileSync(join(dir, 'agent.cordis.yml'), 'utf8')
    expect(first).toContain('fetch: false')
    // Second run is a no-op returning the id.
    expect(ensureAllSearchOnlyPresets(home, presetRoot)).toBe(SEARCH_ONLY_PRESET_ID)
    expect(readFileSync(join(dir, 'agent.cordis.yml'), 'utf8')).toBe(first)
  })

  it('also writes ptc and cordis copies alongside the standard one', () => {
    const { home, presetRoot } = setup()
    ensureAllSearchOnlyPresets(home, presetRoot)
    expect(existsSync(join(home, '.agent-presets', 'dshws-ptc-search-only', 'agent.cordis.yml'))).toBe(true)
    expect(existsSync(join(home, '.agent-presets', 'dshws-cordis-search-only', 'agent.cordis.yml'))).toBe(true)
  })

  it('refreshes a stale authored copy when the standard composition evolves', () => {
    const { home, presetRoot } = setup()
    ensureAllSearchOnlyPresets(home, presetRoot)
    writeFileSync(join(presetRoot, 'standard', 'agent.cordis.yml'), STANDARD.replace('- id: fs\n', '- id: fs\n- id: extra\n'), 'utf8')
    expect(ensureAllSearchOnlyPresets(home, presetRoot)).toBe(SEARCH_ONLY_PRESET_ID)
    const dir = join(home, '.agent-presets', SEARCH_ONLY_PRESET_ID)
    expect(readFileSync(join(dir, 'agent.cordis.yml'), 'utf8')).toContain('- id: extra\n')
  })

  it('never clobbers a user-authored preset under the same id', () => {
    const { home, presetRoot } = setup()
    const dir = join(home, '.agent-presets', SEARCH_ONLY_PRESET_ID)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'preset.yml'), 'name: 用户自己的\n', 'utf8')
    expect(ensureAllSearchOnlyPresets(home, presetRoot)).toBe(SEARCH_ONLY_PRESET_ID)
    expect(readFileSync(join(dir, 'preset.yml'), 'utf8')).toBe('name: 用户自己的\n')
  })

  it('a missing preset root returns undefined (caller must not touch the default)', () => {
    const home = mkdtempSync(join(tmpdir(), 'dshws-home-'))
    dirs.push(home)
    expect(ensureAllSearchOnlyPresets(home, join(home, 'missing-root'))).toBeUndefined()
  })
})

describe('clearAllSearchOnlyPresets (S15a toggle OFF)', () => {
  it('removes only plugin-authored directories, leaving user content alone', () => {
    const home = mkdtempSync(join(tmpdir(), 'dshws-home-'))
    const presetRoot = mkdtempSync(join(tmpdir(), 'dshws-std-'))
    for (const id of ['standard', 'ptc', 'cordis']) {
      mkdirSync(join(presetRoot, id), { recursive: true })
      writeFileSync(join(presetRoot, id, 'agent.cordis.yml'), STANDARD, 'utf8')
    }
    dirs.push(home, presetRoot)
    ensureAllSearchOnlyPresets(home, presetRoot)
    // Plant a user-authored preset in the same root.
    const userDir = join(home, '.agent-presets', 'my-own-preset')
    mkdirSync(userDir, { recursive: true })
    writeFileSync(join(userDir, 'preset.yml'), 'name: 我的\n', 'utf8')

    const removed = clearAllSearchOnlyPresets(home)
    expect(removed).toContain(SEARCH_ONLY_PRESET_ID)
    expect(removed).toContain('dshws-ptc-search-only')
    expect(removed).toContain('dshws-cordis-search-only')
    expect(removed).not.toContain('my-own-preset')
    expect(existsSync(userDir)).toBe(true)
    expect(existsSync(join(home, '.agent-presets', SEARCH_ONLY_PRESET_ID))).toBe(false)
  })

  it('is a no-op on a root with no authored presets', () => {
    const home = mkdtempSync(join(tmpdir(), 'dshws-home-'))
    dirs.push(home)
    expect(clearAllSearchOnlyPresets(home)).toEqual([])
  })
})
