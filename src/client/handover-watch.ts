/**
 * Client handover watch (ADR-0024 decision 4).
 *
 * The Host forwards `plugin-manager/changed` after every plugin-manager
 * operation, and the Web client stays alive across a bundle switch — the only
 * channel on hosts without HMR, where switching a bundle off does not unload
 * its fibers. On each event the watch asks whether this bundle is still
 * enabled; once it is not, it clears the seam's user-layer selections that name
 * this plugin's providers (see `../handover.ts`), re-reading once when the Host
 * refuses the write. Both host faces are optional: a host without the
 * plugin-manager Remote or the settings forms gets no watch.
 *
 * @module dsh-websearch/client/handover-watch
 */
import { planHandoverOps, WEB_NAMESPACE } from '../handover.ts'
import type { SelectionUnset } from '../handover.ts'

/** The names this bundle can carry: the bare registration id and the scoped npm name. */
export const BUNDLE_NAMES = ['dsh-websearch', '@maricgeer/dsh-websearch'] as const

/** Event the Host forwards after every plugin-manager operation. */
export const PLUGIN_MANAGER_CHANGED = 'plugin-manager/changed'

/** Optional host faces, looked up through `ctx.get` so their absence is not an error. */
const PLUGIN_MANAGER_FACE = 'remote.pluginManager'
const CONFIG_FORMS = 'configForms'

/** A refused write is retried once against a fresh snapshot. */
const WRITE_ATTEMPTS = 2

/** The plugin-manager Remote face the watch reads. */
interface PluginManagerFace {
  listBundles(): Promise<unknown>;
}

/** The seam's configuration form as the client settings service exposes it. */
interface SeamForm {
  getSnapshot(): { user?: unknown; revision?: number };
  mutate(ops: readonly SelectionUnset[], expectedRevision?: number): Promise<boolean>;
}

/** Client settings forms, keyed by Loader entry id. */
interface ConfigFormsFace {
  get(ns: string): SeamForm;
}

/** The client context faces the watch touches. */
interface WatchHost {
  get(name: string): unknown;
  remote: { $on(event: string, handler: () => void): () => void };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPluginManagerFace(value: unknown): value is PluginManagerFace {
  return isRecord(value) && typeof value.listBundles === 'function';
}

function isConfigFormsFace(value: unknown): value is ConfigFormsFace {
  return isRecord(value) && typeof value.get === 'function';
}

function warnToConsole(message: string): void {
  console.warn(`[dshws] ${message}`);
}

/** Whether this bundle is enabled, disabled or uninstalled, or could not be determined. */
async function bundleState(pluginManager: PluginManagerFace): Promise<'enabled' | 'disabled' | 'unknown'> {
  const result = await pluginManager.listBundles();
  // The Remote answers either with the list itself or with a `{ ok, value }` envelope.
  const list = Array.isArray(result)
    ? result
    : isRecord(result) && Array.isArray(result.value) ? result.value : undefined;
  if (list === undefined) return 'unknown';
  const own = list.find((entry) => isRecord(entry) && (BUNDLE_NAMES as readonly unknown[]).includes(entry.name));
  return own !== undefined && isRecord(own) && own.enabled === true ? 'enabled' : 'disabled';
}

async function handoverWhenDisabled(
  pluginManager: PluginManagerFace,
  forms: ConfigFormsFace,
  warn: (message: string) => void,
): Promise<void> {
  if ((await bundleState(pluginManager)) !== 'disabled') return;
  const form = forms.get(WEB_NAMESPACE);
  for (let attempt = 0; attempt < WRITE_ATTEMPTS; attempt++) {
    const snapshot = form.getSnapshot();
    const ops = planHandoverOps(snapshot.user);
    const revision = snapshot.revision;
    // Without a revision the write has no fence; the next event retries.
    if (ops.length === 0 || revision === undefined) return;
    if (await form.mutate(ops, revision)) return;
  }
  warn(`handover refused ${WRITE_ATTEMPTS} times: the ${WEB_NAMESPACE} selection still names a plugin provider`);
}

/**
 * Start watching plugin-manager operations and hand the seam's selection back
 * once this bundle is no longer enabled.
 * @param ctx - The client context of this plugin's browser half.
 * @param warn - Receives the reason when the bundle list, the form or the write fails.
 * @returns The function that stops the watch; a no-op when the host lacks either face.
 */
export function installHandoverWatch(ctx: WatchHost, warn: (message: string) => void = warnToConsole): () => void {
  const pluginManager = ctx.get(PLUGIN_MANAGER_FACE);
  const forms = ctx.get(CONFIG_FORMS);
  if (!isPluginManagerFace(pluginManager) || !isConfigFormsFace(forms)) {
    // Nothing to watch on this host: a host without the two faces gets an inert unsubscriber.
    return () => {};
  }
  return ctx.remote.$on(PLUGIN_MANAGER_CHANGED, () => {
    void handoverWhenDisabled(pluginManager, forms, warn).catch((error: unknown) => {
      warn(`handover watch failed: ${error instanceof Error ? error.message : String(error)}`);
    });
  });
}
