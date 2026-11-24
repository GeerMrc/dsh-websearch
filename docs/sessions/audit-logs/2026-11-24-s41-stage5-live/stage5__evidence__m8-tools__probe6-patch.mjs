// Stage-5 M8 diagnostic instrumentation, second revision (never committed).
// Differs from probe5: writes to sessionStorage (per tab, so readings from other
// open tabs of the same origin cannot interleave or overwrite each other), tags
// each line with a random per-context id, and also logs inside the handover pass.
// Usage: node probe6-patch.mjs <scratchRepoRoot>   (expects a pristine src/client/handover-watch.ts)
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
const root = process.argv[2]
const file = join(root, 'src/client/handover-watch.ts')
let t = readFileSync(file, 'utf8')
if (t.includes('dshws-probe')) throw new Error('file already instrumented; restore it first')
const patch = (a, b) => {
  if (!t.includes(a)) throw new Error(`anchor not found: ${a.slice(0, 70)}`)
  if (t.indexOf(a) !== t.lastIndexOf(a)) throw new Error(`anchor not unique: ${a.slice(0, 70)}`)
  t = t.replace(a, () => b)
}
patch('function isRecord(value: unknown): value is Record<string, unknown> {',
  "const PROBE_KEY = 'dshws-probe6';\nconst PROBE_TAG = Math.random().toString(36).slice(2, 8);\nconst probe = (message: string) => {\n  try { sessionStorage.setItem(PROBE_KEY, `${sessionStorage.getItem(PROBE_KEY) ?? ''}${Date.now()} ${PROBE_TAG} client: ${message}\\n`); } catch { /* storage unavailable */ }\n};\n\nfunction isRecord(value: unknown): value is Record<string, unknown> {")
patch("  if ((await bundleState(pluginManager)) !== 'disabled') return;\n  const form = forms.get(WEB_NAMESPACE);\n  for (let attempt = 0; attempt < WRITE_ATTEMPTS; attempt++) {\n    const snapshot = form.getSnapshot();\n    const ops = planHandoverOps(snapshot.user);\n    const revision = snapshot.revision;\n",
  "  const state = await bundleState(pluginManager);\n  probe(`handover pass: bundle state ${state}`);\n  if (state !== 'disabled') return;\n  const form = forms.get(WEB_NAMESPACE);\n  for (let attempt = 0; attempt < WRITE_ATTEMPTS; attempt++) {\n    const snapshot = form.getSnapshot();\n    const ops = planHandoverOps(snapshot.user);\n    const revision = snapshot.revision;\n    probe(`handover pass: snapshot ${JSON.stringify({ status: snapshot.status, revision, user: snapshot.user })}; ops=${JSON.stringify(ops)}`);\n")
patch("    if (await form.mutate(ops, revision)) return;\n",
  "    const accepted = await form.mutate(ops, revision);\n    probe(`handover pass: mutate accepted=${accepted}`);\n    if (accepted) return;\n")
patch('  let stopped = false;\n  ctx.inject(WATCH_FACES, (scoped) => {\n    if (stopped) return;\n',
  "  let stopped = false;\n  let received = 0;\n  const installAt = Date.now();\n  const oneShot = (ctx as unknown as { get?(name: string): unknown }).get?.('remote.pluginManager');\n  probe(`install: one-shot get(remote.pluginManager) -> ${isPluginManagerFace(oneShot) ? 'PluginManagerFace' : String(oneShot)}; watch faces requested`);\n  ctx.inject(WATCH_FACES, (scoped) => {\n    probe(`watch faces served +${Date.now() - installAt}ms; stopped=${stopped}`);\n    if (stopped) return;\n")
patch("    unsubscribe = scoped.remote.$on(PLUGIN_MANAGER_CHANGED, () => {\n      void handoverWhenDisabled(pluginManager, configForms, warn).catch((error: unknown) => {\n        warn(`handover watch failed: ${error instanceof Error ? error.message : String(error)}`);\n      });\n    });\n",
  "    unsubscribe = scoped.remote.$on(PLUGIN_MANAGER_CHANGED, () => {\n      received += 1;\n      probe(`plugin-manager/changed received (#${received}, +${Date.now() - installAt}ms)`);\n      void handoverWhenDisabled(pluginManager, configForms, warn).then(() => probe('handover pass finished')).catch((error: unknown) => {\n        probe(`handover watch failed: ${error instanceof Error ? error.message : String(error)}`);\n        warn(`handover watch failed: ${error instanceof Error ? error.message : String(error)}`);\n      });\n    });\n    probe(`watch subscribed (+${Date.now() - installAt}ms)`);\n")
patch('    stopped = true;\n    unsubscribe?.();\n',
  "    stopped = true;\n    probe(`watch stopped (unsubscriber called, +${Date.now() - installAt}ms); received=${received}`);\n    unsubscribe?.();\n")
writeFileSync(file, t)
console.log('probe6 instrumentation applied to ' + file)
