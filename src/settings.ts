/**
 * Settings live-state: the hot-readable resolved configuration behind the
 * chains and member gates. The loader's cordis.yml config is the initial
 * state; when the host's settings service is present, the plugin's section
 * (`dsh-websearch`) becomes the authoritative source and every committed
 * change re-runs `resolveConfig` — chains read order/timeout through getters
 * at call time, so a settings change reaches the next search without a
 * restart (architecture §5; the upstream web-search-deepseek wiring pattern).
 *
 * The hot subset observable at runtime is the chain order, the per-member
 * timeout, the per-member enabled flag, the key pools (pool refs and
 * selection policy, ADR-0008), and — since S17 D1 — every member option
 * field (base URLs, models, result counts, and the P1 parameter batch):
 * member options resolve through the live config on every read, so a
 * committed settings change reaches the next search.
 *
 * @module dsh-websearch/settings
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-settings'
import z from '@deepseek-ai/schemastery'
import { resolveConfig, validateUnifiedDomainRule } from './config.ts'
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
 * Post-commit hook: runs after `live.refresh()` inside the settings onChange,
 * with the refreshed config in effect. The credential gate re-primes its
 * watched set here — prime is additive-idempotent, so a pool ref added by the
 * commit starts being observed (key-first-then-pool ordering included; the
 * reference-updated event cannot cover a ref that was unwatched at store
 * time).
 */
export interface SettingsCommitHooks {
  readonly onCommitted?: () => void
}

/**
 * Attach the plugin's settings section when the settings service is present;
 * a no-op (the entry config stays authoritative) otherwise — the plugin must
 * not fail to load where the host has no settings service. Mirrors the
 * upstream web-search-deepseek wiring: the hooks hand the live config the
 * authoritative source and recompute on every committed change; disposal is
 * bound to the calling fiber by the service's own effects.
 */
export function attachSettingsSection(ctx: Context, schema: z<Config>, entry: Config, live: LiveResolvedConfig, commitHooks?: SettingsCommitHooks): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.installSection(ctx, SETTINGS_NAMESPACE, schema, entry, {
      // Runs inside the host write queue BEFORE persist: an invalid committed
      // value is rejected and the error surfaced to the committer — the loud
      // half of the ADR-0018 domain exclusivity rule (the quiet danger of a
      // resolveConfig throw on this path is documented on the validator).
      validate: (value) => { validateUnifiedDomainRule(value) },
      setSource: (source) => {
        live.setSource(source as () => Config)
      },
      // The registration's resolved value is re-read through the source thunk;
      // a committed change only needs the recompute, no re-registration. The
      // commit-side hook runs after the refresh so it sees the new config.
      onChange: () => {
        live.refresh()
        commitHooks?.onCommitted?.()
      },
    })
  })
}
