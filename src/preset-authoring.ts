/**
 * Install-time web_fetch removal (S14z2, user ruling "装即接管，预设方式对
 * 交付不专业"): the web_fetch TOOL is registered by the agent preset, so the
 * takeover authors a standard-equal preset with tool-web's fetch face off —
 * regenerated at load from the INSTALLED shipped standard (zero drift), written
 * into the harness-home user root, and set as the roster default THROUGH THE
 * SETTINGS SERVICE only after the write succeeded (a missing default id makes
 * session creation throw, so the default is never pointed before the preset
 * exists). The default is only switched away from `standard`: a user who has
 * chosen their own default is never overridden.
 *
 * Residue (honest trade-off vs ADR-0013's auto-restore): uninstalling the
 * plugin leaves the settings default and the authored preset directory in
 * place — sessions keep composing a fully working standard-minus-web_fetch
 * preset. Recovery is one picker action (switch to 标准模式) or deleting
 * `$DSH_HOME/.agent-presets/dshws-search-only`.
 *
 * @module dsh-websearch/preset-authoring
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'

/** Preset id = directory name in the user root. */
export const SEARCH_ONLY_PRESET_ID = 'dshws-search-only'

/** Bump when the generation rules change; a copy WITHOUT the marker is user-authored and never clobbered. */
const PRESET_VERSION = 1

const MARKER = `# dsh-websearch authored (v${PRESET_VERSION})`

const PRESET_YML = `${MARKER}
name: 标准·仅插件搜索
description: 标准模式全量能力；web_fetch 不注册——网页信息入口仅 dsh-websearch 接管的 web_search（多工具/多 key/兜底链）。由 dsh-websearch 插件维护。
order: 2
`

/** Resolve the installed shipped-preset root via the harness's own package. */
function shippedStandardPath(): string | undefined {
  try {
    const require = createRequire(import.meta.url)
    const pkg = require.resolve('@deepseek-ai/dsh-agent-presets/package.json')
    return join(pkg, '..', 'presets', 'standard', 'agent.cordis.yml')
  } catch {
    return undefined
  }
}

/**
 * Standard composition with the single takeover diff: tool-web's fetch face
 * off. Generated from the shipped file so the copy tracks the installed
 * harness; returns undefined when the shipped preset cannot be read.
 *
 * @param standardYml - the shipped standard agent.cordis.yml content.
 */
export function generateSearchOnlyComposition(standardYml: string): string | undefined {
  const needle = "- id: tool-web\n  name: '@deepseek-ai/dsh-tool-web'\n  config:\n    fetch: true"
  if (!standardYml.includes(needle)) return undefined
  return `${MARKER}\n# Generated from the installed standard preset (single diff: tool-web fetch -> false).\n${standardYml.replace(needle, "- id: tool-web\n  name: '@deepseek-ai/dsh-tool-web'\n  config:\n    fetch: false")}`
}

/** Resolve the harness home the same way shipped plugins do: `$DSH_HOME` or `~/.dsh`. */
function dshHome(): string {
  return process.env.DSH_HOME ?? join(homedir(), '.dsh')
}

/**
 * Ensure the search-only preset exists and is current in the user root.
 *
 * @param home - overrides home resolution (tests).
 * @param standardPath - overrides the shipped-standard file location (tests).
 * @returns the preset id when the root holds a current authored copy;
 *   undefined when generation or the write failed (the caller must then NOT
 *   touch the roster default).
 */
export function ensureSearchOnlyPreset(home: string = dshHome(), standardPath: string | undefined = shippedStandardPath()): string | undefined {
  if (standardPath === undefined) return undefined
  let standardYml: string
  try {
    standardYml = readFileSync(standardPath, 'utf8')
  } catch {
    return undefined
  }
  const composition = generateSearchOnlyComposition(standardYml)
  if (composition === undefined) return undefined
  const dir = join(home, '.agent-presets', SEARCH_ONLY_PRESET_ID)
  const presetPath = join(dir, 'preset.yml')
  const agentPath = join(dir, 'agent.cordis.yml')
  try {
    const existing = existsSync(presetPath) ? readFileSync(presetPath, 'utf8') : ''
    if (existing.trim().length > 0 && !existing.includes(`authored (v`)) {
      // User-authored territory under our id — never clobber.
      return SEARCH_ONLY_PRESET_ID
    }
    if (existing === PRESET_YML && existsSync(agentPath) && readFileSync(agentPath, 'utf8') === composition) {
      return SEARCH_ONLY_PRESET_ID
    }
    mkdirSync(dir, { recursive: true })
    writeFileSync(presetPath, PRESET_YML, 'utf8')
    writeFileSync(agentPath, composition, 'utf8')
    return SEARCH_ONLY_PRESET_ID
  } catch {
    return undefined
  }
}
