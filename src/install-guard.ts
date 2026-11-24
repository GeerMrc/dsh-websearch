/**
 * Install-form guard (v0.2.2, PC6/M1): profile installs under the scoped npm
 * name silently lose the client half on current dsh hosts — the browser-side
 * loader does not adopt a third-party plugin's client modules when the
 * package manifest name is scoped, no matter what identity the bundled patch
 * insert row carries (M1, 2026-11-25: insert row id+name and manifest all
 * scoped, still no adoption). The host half loads and searches fine, so the
 * broken install is easy to miss; this guard turns it into a loud startup
 * warning instead. Only the two working forms stay quiet: the bare-name
 * tarball (manifest name is the plugin id) and a source checkout (`.git`
 * present — the dev form, where the client loads through the dev pipeline).
 *
 * @module dsh-websearch/install-guard
 */
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

/** The logger face the guard needs — every cordis ctx logger provides `warn`. */
export interface GuardLogger {
  warn: (message: string) => void
}

/**
 * Resolve a plugin-entry module URL to its package root: both the built form
 * (`lib/index.js`) and the source form (`src/index.ts`) sit one level below
 * the directory that holds `package.json`.
 * @param moduleUrl - `import.meta.url` of the plugin entry module.
 * @returns the package root directory.
 */
export function packageRootOf(moduleUrl: string): string {
  return dirname(dirname(fileURLToPath(moduleUrl)))
}

/**
 * The loud warning for the scoped-install form, or `undefined` for the
 * working forms. Reads `<pkgRoot>/package.json`; throws when the manifest is
 * unreadable (the probe stays strict — {@link warnInstallForm} decides to
 * swallow).
 * @param pkgRoot - the installed package's root directory.
 * @returns the warning line, or `undefined` when the install form is known to
 * load the full plugin.
 */
export function installFormWarning(pkgRoot: string): string | undefined {
  const manifest = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8')) as { name?: string }
  const name = manifest.name ?? ''
  // Bare-name tarball: manifest name is the plugin id — full function.
  if (!name.startsWith('@')) return undefined
  // Source checkout: the dev form — the client half loads through the dev
  // pipeline, and tarballs never carry `.git` (npm pack excludes it).
  if (existsSync(join(pkgRoot, '.git'))) return undefined
  return `dsh-websearch: installed as "${name}" — current dsh hosts do not load this plugin's settings section and tool badges under a scoped package name (the search chain itself keeps working). Reinstall with the bare-name tarball from https://github.com/GeerMrc/dsh-websearch/releases for the full UI.`
}

/**
 * Probe the install form at plugin startup and warn loudly on the scoped
 * npm form, through BOTH channels: `ctx.logger.warn` (hosts that attach a
 * console exporter — rc.5 web/desktop attach none) and the plugin-owned
 * file log (`<dshHome>/logs/dsh-websearch.log`, the one channel every host
 * form surfaces — see chain-log.ts). Best-effort diagnostics: an unreadable
 * manifest leaves the guard silent rather than failing the plugin — the
 * host half must always load.
 * @param ctx - any context exposing a `logger.warn`.
 * @param fileLog - the plugin's chain-file sink (append one line).
 * @param moduleUrl - `import.meta.url` of the plugin entry module.
 */
export function warnInstallForm(ctx: { logger: GuardLogger }, fileLog: (line: string) => void, moduleUrl: string): void {
  let warning: string | undefined
  try {
    warning = installFormWarning(packageRootOf(moduleUrl))
  } catch {
    // Diagnostics only — see the JSDoc: never block apply on the probe.
    return
  }
  if (warning === undefined) return
  ctx.logger.warn(warning)
  fileLog(`[dshws-install] ${warning}`)
}
