// Temporary diagnostic instrumentation for the rc.5 probe. Never committed; reverted with git checkout.
import { readFileSync, writeFileSync } from 'node:fs'
const root = process.argv[2]
const patch = (file, pairs) => {
  let t = readFileSync(`${root}/${file}`, 'utf8')
  for (const [a, b] of pairs) { if (!t.includes(a)) throw new Error(`${file}: anchor not found: ${a.slice(0, 50)}`); t = t.replace(a, b) }
  writeFileSync(`${root}/${file}`, t)
}
const P = "const probe = (message: string) => console.error(`[dshws-probe] ${message}`);\n"
patch('src/client/handover-watch.ts', [
  ["export function installHandoverWatch(ctx: WatchHost, warn: (message: string) => void = warnToConsole): () => void {\n  const pluginManager = ctx.get(PLUGIN_MANAGER_FACE);\n  const forms = ctx.get(CONFIG_FORMS);\n",
   P + "export function installHandoverWatch(ctx: WatchHost, warn: (message: string) => void = warnToConsole): () => void {\n  const pluginManager = ctx.get(PLUGIN_MANAGER_FACE);\n  const forms = ctx.get(CONFIG_FORMS);\n  probe(`client: install pluginManager=${isPluginManagerFace(pluginManager)} forms=${isConfigFormsFace(forms)}`);\n"],
  ["  return ctx.remote.$on(PLUGIN_MANAGER_CHANGED, () => {\n    void handoverWhenDisabled(pluginManager, forms, warn).catch((error: unknown) => {\n      warn(`handover watch failed: ${error instanceof Error ? error.message : String(error)}`);\n    });\n  });",
   "  return ctx.remote.$on(PLUGIN_MANAGER_CHANGED, () => {\n    probe('client: plugin-manager/changed received');\n    void handoverWhenDisabled(pluginManager, forms, warn).then(() => probe('client: handover pass finished')).catch((error: unknown) => {\n      probe(`client: handover watch failed: ${error instanceof Error ? error.message : String(error)}`);\n      warn(`handover watch failed: ${error instanceof Error ? error.message : String(error)}`);\n    });\n  });"],
  ["  if ((await bundleState(pluginManager)) !== 'disabled') return;\n  const form = forms.get(WEB_NAMESPACE);\n",
   "  const state = await bundleState(pluginManager);\n  probe(`client: bundle state ${state}`);\n  if (state !== 'disabled') return;\n  const form = forms.get(WEB_NAMESPACE);\n  probe(`client: form snapshot ${JSON.stringify(form.getSnapshot())}`);\n"],
])
patch('src/index.ts', [
  ["export function apply(ctx: Context, config: ConfigRuntime): void {\n",
   "const probeHost = (message: string) => console.error(`[dshws-probe] host: ${message}`);\n\nexport function apply(ctx: Context, config: ConfigRuntime): void {\n  probeHost('apply');\n  ctx.inject(['settings'], (settingsCtx) => {\n    const settings = settingsCtx.settings as unknown as import('./handover.ts').HandoverSettings;\n    const bound = AsyncResource.bind(() => {\n      probeHost('bound callback running');\n      settings.mutate('web', [{ op: 'unset', path: ['fetchProvider'] }]).then(() => probeHost('bound mutate ok'), (e: unknown) => probeHost(`bound mutate failed: ${String(e)}`));\n    });\n    ctx.on('dispose', () => {\n      probeHost('host dispose fired');\n      try { const d = settings.describe().find((e) => e.ns === 'web'); probeHost(`web descriptor ${JSON.stringify({ revision: d?.revision, user: d?.user })}`); } catch (e) { probeHost(`describe failed: ${String(e)}`); }\n      settings.mutate('web', [{ op: 'unset', path: ['searchProvider'] }]).then(() => probeHost('direct mutate ok'), (e: unknown) => probeHost(`direct mutate failed: ${String(e)}`));\n      bound();\n    });\n  });\n"],
])
patch('src/index.ts', [
  ["import { Context } from '@deepseek-ai/cordis'", "import { Context } from '@deepseek-ai/cordis'\nimport { AsyncResource } from 'node:async_hooks'"],
])
console.log('probe instrumentation applied')
