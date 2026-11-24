# T5p probe matrix — rc.5, measured (2026-11-24)

Method: an uncommitted diagnostic build (never in git) logging to the host log (`[dshws-probe] host: …`) and to the browser's localStorage (`client: …`), swapped into the scratch profile; toggles driven from the Plugins page in the in-app browser. The scratch profile's user layer carried a seeded pin (`searchProvider: dshws-tavily`, `fetchProvider: dshws-fetch-gate`).

## Form H — hmr enabled (the `web` profile; also the desktop, see "Premise correction")

| Vector (browser online) | Host teardown | Host settings write | Client watch | User-layer pin afterwards |
|---|---|---|---|---|
| Plugins page toggle OFF | `ctx.effect` teardown fires. `ctx.on('dispose')` handlers do NOT fire | rejected: `Error: HMR transactions cannot be nested` — both a direct write and one deferred through a context bound at apply time | `watch subscribed` → `watch stopped (unsubscriber called)`; `plugin-manager/changed` never received | remains (dangling) |
| CLI `plugin remove` while enabled | not measured | — | no event is forwarded for CLI operations | remains (dangling) |

Readings from the host log, in order (toggle OFF): `effect teardown fired` → `web descriptor {"revision":3,"user":{…dshws-tavily…dshws-fetch-gate}}` → `bound callback running` → `direct mutate failed: Error: HMR transactions cannot be nested` → `bound mutate failed: Error: HMR transactions cannot be nested`.

Service ordering (client): `ctx.get('remote.pluginManager')` is `undefined` at apply; an optional inject is served 47 ms later with `listBundles`, `listPlugins`, `inspect`, `installBundle`, … on the face.

## Form N — hmr disabled by a profile patch (`- id: hmr / disabled: true`), profileContext still present

Not a shipped GUI configuration: dismissing the preview notice fails in the UI with "暂时无法保存确认状态，请重试" (settings persistence needs HMR). The handover write goes through the same persistence path. Not pursued further.

## Premise correction

rc.5 `packages/bundle/base/cordis.patch.yml` gates `plugin-manager` (line 20), `hmr` (28), `config-editor` (105) and `settings` (109) on the same expression `disabled: !!js "!ctx.get('profileContext')"`. Only the headless, sdk and acp bundles disable `hmr` in YAML; `packages/boot/hmr/README.md:27` says so. The desktop ships no hmr override of its own; its Plugins page manages bundles and its settings persist, so `profileContext` is supplied there and HMR is enabled. The plan's premise "the desktop has no HMR" (inherited from dsh-mm-resilience `docs/patterns.md` P4, itself backed only by that repo's unit tests) does not hold for rc.5.

## Consequence

On every shipped GUI host the plugin cannot run code after its own bundle is switched off: the host half is torn down inside the HMR transaction, where settings writes are rejected, and the browser half is unloaded before `plugin-manager/changed` is delivered. A disable-time handover has no plugin-side channel there. A handover can only run while the bundle is enabled.
