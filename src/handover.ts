/**
 * Symmetric handover of the seam's provider selection (ADR-0024).
 *
 * While this bundle is enabled, its patch layer pins `web.searchProvider` and
 * `web.fetchProvider`. A selection saved from the official settings page lands
 * in the profile's user layer instead, which outranks every bundle layer: once
 * the bundle is disabled or uninstalled, such a selection names providers that
 * no longer exist and every search and fetch fails with
 * `WEB_PROVIDER_CONFIGURED_MISSING`. The handover clears exactly those
 * user-layer keys — only the ones naming a provider this plugin registered — so
 * the official defaults take over again. It is best effort: a failure is
 * reported through the caller's `warn` and never thrown.
 *
 * @module dsh-websearch/handover
 */
import type { SettingsPathOp } from '@deepseek-ai/dsh-settings'

/** Loader entry id of the seam whose provider selection the takeover pins. */
export const WEB_NAMESPACE = 'web'

/** The seam's two selection fields. A patch replaces the row's whole `config`, so they are cleared together. */
const SELECTION_KEYS = ['searchProvider', 'fetchProvider'] as const

/** Prefix of every provider id this plugin registers (ADR-0003). */
const PLUGIN_PROVIDER_PREFIX = 'dshws-'

/**
 * The settings faces the handover reads and writes. The host `settings` service
 * satisfies it; tests pass a structural stand-in.
 */
export interface HandoverSettings {
  /** Live descriptors of every configurable entry; only `ns`, `revision` and `user` are read. */
  describe(): readonly { ns: string; revision: number; user?: unknown }[]
  /** Applies path edits to the user section of one namespace. */
  mutate(ns: string, ops: readonly SettingsPathOp[], expectedRevision?: number): Promise<void>
}

/**
 * Whether a value is the id of a provider this plugin registered.
 * @param value - A candidate provider id read from configuration.
 * @returns True when `value` is a string carrying the plugin prefix.
 */
export function isPluginProviderId(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(PLUGIN_PROVIDER_PREFIX)
}

/**
 * Plan the edits that stop a user-layer selection from naming this plugin's providers.
 * Only the user layer is consulted: a selection that comes from the bundle layer
 * leaves with the bundle and needs no handover.
 * @param user - The user section of the seam's settings descriptor.
 * @returns One `unset` per selection key whose user value names a plugin provider, in field order.
 */
export function planHandoverOps(user: unknown): SettingsPathOp[] {
  if (typeof user !== 'object' || user === null) return []
  const section = user as Record<string, unknown>
  return SELECTION_KEYS
    .filter((key) => isPluginProviderId(section[key]))
    .map((key) => ({ op: 'unset', path: [key] }))
}

/** Default reporter; callers with a host or client logger pass their own. */
function warnToConsole(message: string): void {
  console.warn(`[dshws] ${message}`)
}

/**
 * Clear the seam's user-layer selections that name this plugin's providers.
 * Writes nothing when there is no such selection, when the seam publishes no
 * settings descriptor, or when no settings service is available.
 * @param settings - The settings service to write through, or undefined when the host has none.
 * @param warn - Receives the reason when the descriptor read or the write fails.
 * @returns A promise that always fulfills; a failure is reported, never thrown.
 */
export async function revertHandover(settings: HandoverSettings | undefined, warn: (message: string) => void = warnToConsole): Promise<void> {
  if (settings === undefined) return
  try {
    const descriptor = settings.describe().find((entry) => entry.ns === WEB_NAMESPACE)
    const ops = planHandoverOps(descriptor?.user)
    if (ops.length === 0) return
    await settings.mutate(WEB_NAMESPACE, ops, descriptor?.revision)
  } catch (error) {
    warn(`handover skipped: ${error instanceof Error ? error.message : String(error)}`)
  }
}
