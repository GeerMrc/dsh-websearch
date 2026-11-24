// Temporary diagnostic instrumentation for the rc.5 probe (uncommitted; dropped with git checkout).
import { readFileSync, writeFileSync } from 'node:fs'
const root = process.argv[2]
const patch = (file, pairs) => {
  let t = readFileSync(`${root}/${file}`, 'utf8')
  for (const [a, b] of pairs) { if (!t.includes(a)) throw new Error(`${file}: anchor not found: ${a.slice(0, 60)}`); t = t.replace(a, b) }
  writeFileSync(`${root}/${file}`, t)
}
patch('src/client/handover-watch.ts', [
  ["function isRecord(value: unknown): value is Record<string, unknown> {",
   "const probe = (message: string) => {\n  try { localStorage.setItem('dshws-probe', `${localStorage.getItem('dshws-probe') ?? ''}${Date.now()} client: ${message}\\n`); } catch { /* storage unavailable */ }\n};\n\nfunction isRecord(value: unknown): value is Record<string, unknown> {"],
  ["    unsubscribe = scoped.remote.$on(PLUGIN_MANAGER_CHANGED, () => {\n",
   "    probe('watch subscribed');\n    unsubscribe = scoped.remote.$on(PLUGIN_MANAGER_CHANGED, () => {\n      probe('plugin-manager/changed received');\n"],
  ["  if ((await bundleState(pluginManager)) !== 'disabled') return;\n",
   "  const state = await bundleState(pluginManager);\n  probe(`bundle state ${state}`);\n  if (state !== 'disabled') return;\n"],
  ["    const snapshot = form.getSnapshot();\n",
   "    const snapshot = form.getSnapshot();\n    probe(`snapshot ${JSON.stringify({ status: snapshot.status, revision: snapshot.revision, user: snapshot.user })}`);\n"],
  ["    if (await form.mutate(ops, revision)) return;\n",
   "    const accepted = await form.mutate(ops, revision);\n    probe(`mutate accepted=${accepted}`);\n    if (accepted) return;\n"],
  ["    stopped = true;\n    unsubscribe?.();\n",
   "    stopped = true;\n    probe('watch stopped (unsubscriber called)');\n    unsubscribe?.();\n"],
])
patch('src/index.ts', [
  ["export function apply(ctx: Context, config: ConfigRuntime): void {\n",
   "const probeHost = (message: string) => console.error(`[dshws-probe] host: ${message}`);\n\nexport function apply(ctx: Context, config: ConfigRuntime): void {\n  probeHost('apply');\n  ctx.inject(['settings'], (settingsCtx) => {\n    const settings = settingsCtx.settings as unknown as import('./handover.ts').HandoverSettings;\n    probeHost('settings injected; registering effect-teardown probes');\n    const bound = AsyncResource.bind(() => {\n      probeHost('bound callback running');\n      settings.mutate('web', [{ op: 'unset', path: ['fetchProvider'] }]).then(() => probeHost('bound mutate ok'), (e: unknown) => probeHost(`bound mutate failed: ${String(e)}`));\n    });\n    settingsCtx.effect(() => () => {\n      probeHost('effect teardown fired');\n      try { const d = settings.describe().find((e) => e.ns === 'web'); probeHost(`web descriptor ${JSON.stringify({ revision: d?.revision, user: d?.user })}`); } catch (e) { probeHost(`describe failed: ${String(e)}`); }\n      settings.mutate('web', [{ op: 'unset', path: ['searchProvider'] }]).then(() => probeHost('direct mutate ok'), (e: unknown) => probeHost(`direct mutate failed: ${String(e)}`));\n      bound();\n    });\n  });\n"],
  ["import type { Context } from '@deepseek-ai/cordis'\n",
   "import type { Context } from '@deepseek-ai/cordis'\nimport { AsyncResource } from 'node:async_hooks'\n"],
])
console.log('probe4 instrumentation applied')
