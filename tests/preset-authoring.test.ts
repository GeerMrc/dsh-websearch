import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ensureSearchOnlyPreset, generateSearchOnlyComposition, SEARCH_ONLY_PRESET_ID } from '../src/preset-authoring.ts'

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

describe('generateSearchOnlyComposition (S14z2)', () => {
  it('diffs exactly the tool-web fetch flag and stamps the marker', () => {
    const out = generateSearchOnlyComposition(STANDARD)
    expect(out).toContain('# dsh-websearch authored (v1)')
    expect(out).toContain("config:\n    fetch: false\n    searchTimeoutMs: 60000")
    expect(out).not.toContain('fetch: true')
    expect(out).toContain('- id: fs\n')
  })

  it('returns undefined when the shipped shape drifts (no blind rewrite)', () => {
    expect(generateSearchOnlyComposition('no tool-web row here')).toBeUndefined()
  })
})

describe('ensureSearchOnlyPreset (S14z2)', () => {
  function setup(): { home: string; standard: string } {
    const home = mkdtempSync(join(tmpdir(), 'dshws-home-'))
    const src = mkdtempSync(join(tmpdir(), 'dshws-std-'))
    writeFileSync(join(src, 'agent.cordis.yml'), STANDARD, 'utf8')
    dirs.push(home, src)
    return { home, standard: join(src, 'agent.cordis.yml') }
  }

  it('writes the preset into <home>/.agent-presets and is idempotent', () => {
    const { home, standard } = setup()
    expect(ensureSearchOnlyPreset(home, standard)).toBe(SEARCH_ONLY_PRESET_ID)
    const dir = join(home, '.agent-presets', SEARCH_ONLY_PRESET_ID)
    const first = readFileSync(join(dir, 'agent.cordis.yml'), 'utf8')
    expect(first).toContain('fetch: false')
    // Second run is a no-op returning the id.
    expect(ensureSearchOnlyPreset(home, standard)).toBe(SEARCH_ONLY_PRESET_ID)
    expect(readFileSync(join(dir, 'agent.cordis.yml'), 'utf8')).toBe(first)
  })

  it('refreshes a stale authored copy when the standard composition evolves', () => {
    const { home, standard } = setup()
    ensureSearchOnlyPreset(home, standard)
    writeFileSync(standard, STANDARD.replace('- id: fs\n', '- id: fs\n- id: extra\n'), 'utf8')
    expect(ensureSearchOnlyPreset(home, standard)).toBe(SEARCH_ONLY_PRESET_ID)
    const dir = join(home, '.agent-presets', SEARCH_ONLY_PRESET_ID)
    expect(readFileSync(join(dir, 'agent.cordis.yml'), 'utf8')).toContain('- id: extra\n')
  })

  it('never clobbers a user-authored preset under the same id', () => {
    const { home, standard } = setup()
    const dir = join(home, '.agent-presets', SEARCH_ONLY_PRESET_ID)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'preset.yml'), 'name: 用户自己的\n', 'utf8')
    expect(ensureSearchOnlyPreset(home, standard)).toBe(SEARCH_ONLY_PRESET_ID)
    expect(readFileSync(join(dir, 'preset.yml'), 'utf8')).toBe('name: 用户自己的\n')
  })

  it('a missing standard source returns undefined (caller must not touch the default)', () => {
    const home = mkdtempSync(join(tmpdir(), 'dshws-home-'))
    dirs.push(home)
    expect(ensureSearchOnlyPreset(home, join(home, 'missing.yml'))).toBeUndefined()
    expect(existsSync(join(home, '.agent-presets'))).toBe(false)
  })
})
