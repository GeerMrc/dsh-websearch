/**
 * Install-time web_fetch removal (S14z2 → S15a, user ruling "装即接管"):
 * the web_fetch TOOL is registered by the agent preset, so the takeover
 * authors search-only copies of every shipped preset that carries tool-web
 * with fetch enabled (standard/ptc/cordis; minimal has none). Each copy is
 * regenerated at load from the INSTALLED shipped preset (zero drift), written
 * into the harness-home user root, and the roster default is switched THROUGH
 * THE SETTINGS SERVICE only after the standard copy's write succeeded.
 *
 * S15a additions over S14z2: (a) multi-preset coverage — ptc and cordis also
 * get copies, with cordis's skills/ directory carried along (the composition
 * references it relatively); (b) explicit clear() for the settings toggle's
 * OFF path; (c) standard's copy id stays `dshws-search-only` (zero migration
 * from S14z2 installs — the review's M4 ruling).
 *
 * Residue (honest trade-off vs ADR-0013's auto-restore): uninstalling the
 * plugin leaves the settings default and the authored preset directories in
 * place — sessions keep composing fully working search-only presets. Recovery
 * is one picker action or deleting `$DSH_HOME/.agent-presets/dshws-*-search-only`.
 *
 * @module dsh-websearch/preset-authoring
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'

/** Standard's copy id — unchanged from S14z2 so existing installs need no migration. */
export const SEARCH_ONLY_PRESET_ID = 'dshws-search-only'

/** The shipped presets that carry tool-web with fetch enabled; minimal has none. */
const SHIPPED_PRESETS_WITH_FETCH = ['standard', 'ptc', 'cordis'] as const

/** Map shipped preset id → authored copy id (standard keeps its S14z2 id). */
function copyIdFor(shippedId: string): string {
  return shippedId === 'standard' ? SEARCH_ONLY_PRESET_ID : `dshws-${shippedId}-search-only`
}

/** Map shipped preset id → display name for the copy's preset.yml. */
function copyNameFor(shippedId: string): string {
  const names: Record<string, string> = {
    standard: '标准·仅插件搜索',
    ptc: 'PTC·仅插件搜索',
    cordis: '创造·仅插件搜索',
  }
  return names[shippedId] ?? `${shippedId}·仅插件搜索`
}

/** Display order in the picker: after every shipped preset (they are 1-4). */
const COPY_ORDER = 10

/** Bump when the generation rules change; a copy WITHOUT the marker is user-authored and never clobbered. */
const PRESET_VERSION = 2

const MARKER = `# dsh-websearch authored (v${PRESET_VERSION})`

/** Resolve the installed shipped-preset root via the harness's own package. */
function shippedPresetRoot(): string | undefined {
  try {
    const require = createRequire(import.meta.url)
    const pkg = require.resolve('@deepseek-ai/dsh-agent-presets/package.json')
    return join(pkg, '..', 'presets')
  } catch {
    return undefined
  }
}

/**
 * One composition with the single takeover diff: tool-web's fetch face off.
 * Generated from the shipped file so the copy tracks the installed harness;
 * returns undefined when the shipped preset cannot be read or has no
 * fetch-enabled tool-web row to diff.
 *
 * @param shippedYml - the shipped preset's agent.cordis.yml content.
 */
export function generateSearchOnlyComposition(shippedYml: string): string | undefined {
  const needle = "- id: tool-web\n  name: '@deepseek-ai/dsh-tool-web'\n  config:\n    fetch: true"
  if (!shippedYml.includes(needle)) return undefined
  return `${MARKER}\n# Generated from the installed preset (single diff: tool-web fetch -> false).\n${shippedYml.replace(needle, "- id: tool-web\n  name: '@deepseek-ai/dsh-tool-web'\n  config:\n    fetch: false")}`
}

/** Resolve the harness home the same way shipped plugins do: `$DSH_HOME` or `~/.dsh`. */
function dshHome(): string {
  return process.env.DSH_HOME ?? join(homedir(), '.dsh')
}

function presetYmlFor(shippedId: string): string {
  return `${MARKER}
name: ${copyNameFor(shippedId)}
description: ${copyNameFor(shippedId)}——web_fetch 不注册，网页信息入口仅 dsh-websearch 接管的 web_search（多工具/多 key/兜底链）。由 dsh-websearch 插件维护；切换回官方行为请在设置页关闭「接管 web_fetch」。
order: ${COPY_ORDER}
`
}

/**
 * Ensure one preset copy exists and is current in the user root.
 *
 * @param shippedId - the shipped preset to copy from.
 * @param home - the harness home (tests override).
 * @param presetRoot - the shipped presets root directory (tests override).
 * @returns the copy's preset id when the user root holds a current copy;
 *   undefined when generation or the write failed.
 */
function ensureOneCopy(shippedId: string, home: string, presetRoot: string): string | undefined {
  const sourceDir = join(presetRoot, shippedId)
  let shippedYml: string
  try {
    shippedYml = readFileSync(join(sourceDir, 'agent.cordis.yml'), 'utf8')
  } catch {
    return undefined
  }
  const composition = generateSearchOnlyComposition(shippedYml)
  if (composition === undefined) return undefined
  const id = copyIdFor(shippedId)
  const dir = join(home, '.agent-presets', id)
  const presetPath = join(dir, 'preset.yml')
  const agentPath = join(dir, 'agent.cordis.yml')
  try {
    const existing = existsSync(presetPath) ? readFileSync(presetPath, 'utf8') : ''
    if (existing.trim().length > 0 && !existing.includes(`authored (v`)) {
      // User-authored territory under our id — never clobber.
      return id
    }
    const desiredYml = presetYmlFor(shippedId)
    if (existing === desiredYml && existsSync(agentPath) && readFileSync(agentPath, 'utf8') === composition) {
      return id
    }
    mkdirSync(dir, { recursive: true })
    writeFileSync(presetPath, desiredYml, 'utf8')
    writeFileSync(agentPath, composition, 'utf8')
    // Cordis carries a skills/ directory its composition references relatively
    // (S15a review M5): copy it alongside so the preset's self-referencing
    // skill-filesystem row keeps working.
    const skillsSource = join(sourceDir, 'skills')
    if (existsSync(skillsSource)) {
      cpSync(skillsSource, join(dir, 'skills'), { recursive: true })
    }
    return id
  } catch {
    return undefined
  }
}

/**
 * Ensure ALL search-only preset copies exist and are current (S15a). The
 * standard copy's id is the return value callers use for the default switch;
 * the other copies exist for picker selection but do not change any default.
 *
 * @param home - overrides home resolution (tests).
 * @param presetRoot - overrides the shipped-preset root (tests).
 * @returns the STANDARD copy's id when that copy was ensured; undefined when
 *   the standard copy failed (the caller must then NOT touch the default —
 *   other copies may still have succeeded, they are harmless additions).
 */
export function ensureAllSearchOnlyPresets(home: string = dshHome(), presetRoot: string | undefined = shippedPresetRoot()): string | undefined {
  if (presetRoot === undefined) return undefined
  let standardOk: string | undefined
  for (const shippedId of SHIPPED_PRESETS_WITH_FETCH) {
    const result = ensureOneCopy(shippedId, home, presetRoot)
    if (shippedId === 'standard') standardOk = result
  }
  return standardOk
}

/**
 * Remove ALL plugin-authored preset copies and any auxiliary files (S15a
 * toggle OFF path). Only directories carrying our version marker are touched;
 * user-authored content under the same ids is left alone. The caller MUST
 * restore the roster default BEFORE calling this — a default pointing at a
 * deleted preset makes session creation throw.
 *
 * @param home - overrides home resolution (tests).
 * @returns the ids actually removed.
 */
export function clearAllSearchOnlyPresets(home: string = dshHome()): readonly string[] {
  const removed: string[] = []
  const root = join(home, '.agent-presets')
  if (!existsSync(root)) return removed
  try {
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const presetPath = join(root, entry.name, 'preset.yml')
      if (!existsSync(presetPath)) continue
      const content = readFileSync(presetPath, 'utf8')
      if (!content.includes(`authored (v`)) continue
      rmSync(join(root, entry.name), { recursive: true, force: true })
      removed.push(entry.name)
    }
  } catch {
    // Partial removal is acceptable: leftover copies are inert roster rows.
  }
  return removed
}
