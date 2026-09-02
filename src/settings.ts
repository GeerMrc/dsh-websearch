/**
 * Settings live-state: the hot-readable resolved configuration behind the
 * chains and member gates. The loader's cordis.yml config is the initial
 * state; when the host's settings service is present, the plugin's section
 * (`dsh-websearch`) becomes the authoritative source and every committed
 * change re-runs `resolveConfig` — chains read order/timeout through getters
 * at call time, so a settings change reaches the next search without a
 * restart (architecture §5; the upstream web-search-deepseek wiring pattern).
 *
 * Only the hot subset (chain order, per-member timeout, per-member enabled)
 * is observable at runtime; member option fields stay launch-static (plan D2)
 * and are documented as such in the Config JSDoc.
 *
 * @module dsh-websearch/settings
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'
import { resolveConfig } from './config.ts'
import type { Config, ResolvedWebSearchConfig } from './config.ts'

/** The plugin's settings namespace (lowercase kebab, seam grammar). */
export const SETTINGS_NAMESPACE = 'dsh-websearch'

/**
 * One hot state holder. `setSource` swaps the authoritative source and
 * recomputes (the service's attach/detach hook); `refresh` recomputes from
 * the current source (the committed-change hook, whose source thunk re-reads
 * the section). Every recompute runs `resolveConfig`, so settings-sourced
 * sections get the same explicit defaulting as cordis.yml config.
 */
export class LiveResolvedConfig {
  #source: () => Config
  #current: ResolvedWebSearchConfig

  constructor(config: Config) {
    this.#source = () => config
    this.#current = resolveConfig(config)
  }

  /** The currently authoritative resolved state (chain getters read per call). */
  current(): ResolvedWebSearchConfig {
    return this.#current
  }

  /** Swap the authoritative source and recompute — the `setSource` hook. */
  setSource(source: () => Config): void {
    this.#source = source
    this.#recompute()
  }

  /** Recompute from the current source — the `onChange` hook. */
  refresh(): void {
    this.#recompute()
  }

  #recompute(): void {
    this.#current = resolveConfig(this.#source())
  }
}

/**
 * Attach the plugin's settings section when the settings service is present;
 * a no-op (the entry config stays authoritative) otherwise — the plugin must
 * not fail to load where the host has no settings service. Mirrors the
 * upstream web-search-deepseek wiring: the hooks hand the live config the
 * authoritative source and recompute on every committed change; disposal is
 * bound to the calling fiber by the service's own effects.
 */
export function attachSettingsSection(ctx: Context, schema: z<Config>, entry: Config, live: LiveResolvedConfig): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.installSection(ctx, SETTINGS_NAMESPACE, schema, entry, {
      setSource: (source) => {
        live.setSource(source as () => Config)
      },
      // The registration's resolved value is re-read through the source thunk;
      // a committed change only needs the recompute, no re-registration.
      onChange: () => {
        live.refresh()
      },
    })
  })
}
