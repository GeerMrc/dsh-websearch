/**
 * dsh-websearch client half entry (S06, ADR-0006 form): contributes the
 * 「网页搜索」settings section to the web settings dialog. The ModuleLoader
 * banner around this bundle calls `apply` with the client ctx after the
 * services named in {@link inject} are available — the fine-grained
 * `remote.*` entries are mandatory (the runtime fails loud without them,
 * spike H1 finding 4).
 *
 * Type-only imports of host client packages carry the `ctx.slots` /
 * `ctx.locale` / `ctx.remote` faces; value imports stay limited to
 * `@deepseek-ai/dsh-client-ui-primitives` (declared in `dsh.client.external`).
 *
 * @module dsh-websearch/client
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { WebSearchSettingsController } from './controller.ts'
import type { WebSearchSettingsPorts } from './controller.ts'
import { mountKeyCountsRemote } from './key-counts-remote.ts'
import type { KeyCountsNamespace } from './key-counts-remote.ts'
import { en, NS, zh } from './locales.ts'
import { bindWebSearchSettingsSection } from './section.tsx'
import { WebFetchToolviewRow } from './fetch-row.tsx'
import { WebSearchToolviewRow } from './websearch-row.tsx'

/** Client services this bundle binds; `remote.*` faces are individually gated. */
export const inject = ['slots', 'locale', 'remote', 'remote.settings', 'remote.credentials']

/**
 * Register the locale dictionaries, the `settings.section` slot, and the
 * `web_search`/`web_fetch` toolview takeovers (ADR-0010; fetch sibling S28).
 * The settings controller lives
 * inside the injection effect so uninjecting the slot also detaches its event
 * subscription; `init()` fills the first snapshot in the background and every
 * refresh re-derives it (controller contract). The toolview entry registers at
 * priority -1: a keyed cell renders the lowest priority and the shipped WebRow
 * sits at the default 0 — the same key at the same priority throws — so the
 * takeover must carry an explicit lower value, and unregistering restores the
 * host row with no extra state.
 */
export function apply(ctx: Context): void {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }))
  ctx.slots.inject('settings.section', () => {
    const controller = new WebSearchSettingsController(adaptRemote(ctx))
    void controller.init()
    const unregister = ctx.slots.register(
      {
        name: 'settings.section',
        id: 'dsh-websearch',
        order: 16,
        label: () => t('nav'),
        locale: NS,
      },
      bindWebSearchSettingsSection(controller),
    )
    return () => {
      controller.dispose()
      unregister()
    }
  })
  ctx.slots.inject('tool.call.toolview', () =>
    ctx.slots.register(
      { name: 'tool.call.toolview', key: 'web_search', priority: -1, locale: NS },
      WebSearchToolviewRow,
    ),
  )
  ctx.slots.inject('tool.call.toolview', () =>
    ctx.slots.register(
      { name: 'tool.call.toolview', key: 'web_fetch', priority: -1, locale: NS },
      WebFetchToolviewRow,
    ),
  )
}

/** Adapt the injected `ctx.remote` namespaces onto the controller's port face. */
function adaptRemote(ctx: Context): WebSearchSettingsPorts {
  const remote = ctx.remote
  // Lazy mount of the plugin-owned key-count namespace: the first count fetch
  // mounts it in this fiber; a host without the service leaves every call
  // `ok: false` (counts stay undefined, the badge stays hidden).
  let keyCounts: Promise<KeyCountsNamespace> | undefined
  const keyCountsRemote = (): Promise<KeyCountsNamespace> =>
    (keyCounts ??= mountKeyCountsRemote(ctx))
  return {
    describeSettings: () => remote.settings.describe(),
    updateSettings: (ns, patch, expectedRevision) =>
      // The controller describes the patch as a plain record; the remote face
      // types it JSON-valued (its own JsonValue union, which a client bundle
      // must not import at type level) — one cast at this boundary.
      remote.settings.update(ns, patch as Parameters<typeof remote.settings.update>[1], expectedRevision),
    describeCredentials: (refs) => remote.credentials.describe([...refs]),
    describeKeyCounts: async (refs) => {
      try {
        return await (await keyCountsRemote()).describeKeyCounts([...refs])
      } catch {
        // Mount or transport failure: no counts, not a settings-page error.
        return { ok: false, error: new Error('dshws key-count remote unavailable') }
      }
    },
    setCredential: (ref, value) => remote.credentials.set(ref, value),
    unsetCredential: (ref) => remote.credentials.unset(ref),
    onReferenceUpdated: (handler) =>
      remote.$on('credentials/reference-updated', (ref: unknown) => handler(String(ref))),
  }
}

/** Dictionary re-export for consumers introspecting the section's strings. */
export { en, zh }
