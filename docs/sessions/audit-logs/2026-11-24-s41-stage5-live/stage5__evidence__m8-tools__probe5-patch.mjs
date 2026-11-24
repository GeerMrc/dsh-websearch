// Stage-5 M8 diagnostic instrumentation (never committed): patches the client
// handover watch of a scratch copy of the HEAD clone so that it appends
// timestamped readings to localStorage under 'dshws-probe'.
// Usage: node probe5-patch.mjs <scratchRepoRoot>
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
const root = process.argv[2]
const file = join(root, 'src/client/handover-watch.ts')
let t = readFileSync(file, 'utf8')
const patch = (a, b) => {
  if (!t.includes(a)) throw new Error(`anchor not found: ${a.slice(0, 70)}`)
  if (t.indexOf(a) !== t.lastIndexOf(a)) throw new Error(`anchor not unique: ${a.slice(0, 70)}`)
  t = t.replace(a, () => b)
}
patch('function isRecord(value: unknown): value is Record<string, unknown> {',
  "const probe = (message: string) => {\n  try { localStorage.setItem('dshws-probe', `${localStorage.getItem('dshws-probe') ?? ''}${Date.now()} client: ${message}\\n`); } catch { /* storage unavailable */ }\n};\n\nfunction isRecord(value: unknown): value is Record<string, unknown> {")
patch('  let stopped = false;\n  ctx.inject(WATCH_FACES, (scoped) => {\n    if (stopped) return;\n',
  "  let stopped = false;\n  let received = 0;\n  const installAt = Date.now();\n  const oneShot = (ctx as unknown as { get?(name: string): unknown }).get?.('remote.pluginManager');\n  probe(`install: one-shot get(remote.pluginManager) -> ${isPluginManagerFace(oneShot) ? 'PluginManagerFace' : String(oneShot)}; watch faces requested`);\n  ctx.inject(WATCH_FACES, (scoped) => {\n    probe(`watch faces served +${Date.now() - installAt}ms; stopped=${stopped}`);\n    if (stopped) return;\n")
patch("    unsubscribe = scoped.remote.$on(PLUGIN_MANAGER_CHANGED, () => {\n      void handoverWhenDisabled(pluginManager, configForms, warn).catch((error: unknown) => {\n        warn(`handover watch failed: ${error instanceof Error ? error.message : String(error)}`);\n      });\n    });\n",
  "    unsubscribe = scoped.remote.$on(PLUGIN_MANAGER_CHANGED, () => {\n      received += 1;\n      probe(`plugin-manager/changed received (#${received}, +${Date.now() - installAt}ms)`);\n      void handoverWhenDisabled(pluginManager, configForms, warn).catch((error: unknown) => {\n        warn(`handover watch failed: ${error instanceof Error ? error.message : String(error)}`);\n      });\n    });\n    probe(`watch subscribed (+${Date.now() - installAt}ms)`);\n")
patch('    stopped = true;\n    unsubscribe?.();\n',
  "    stopped = true;\n    probe(`watch stopped (unsubscriber called, +${Date.now() - installAt}ms); received=${received}`);\n    unsubscribe?.();\n")
writeFileSync(file, t)
console.log('probe5 instrumentation applied to ' + file)
