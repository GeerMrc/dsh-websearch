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
import { ConfigLegacy, materializeConfig, resolveConfig, validateExaSectionFilterRule, validateFirecrawlTbsRule, validateUnifiedDomainRule } from './config.ts'
import type { Config, ConfigRuntime, ResolvedWebSearchConfig } from './config.ts'

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
  #volatile = false

  constructor(config: Config) {
    this.#source = () => config
    this.#current = resolveConfig(config)
  }

  /** The currently authoritative resolved state (chain getters read per call). */
  current(): ResolvedWebSearchConfig {
    // Volatile mode (0.1.7+ hosts, ADR-0021): every read re-evaluates the
    // source — the handles inside it read the live configuration — so a
    // committed settings change reaches the next `current()` with no event.
    if (this.#volatile) this.#recompute()
    return this.#current
  }

  /** Swap the authoritative source and recompute — the `setSource` hook. */
  setSource(source: () => Config): void {
    this.#source = source
    this.#volatile = false
    this.#recompute()
  }

  /**
   * Adopt read-time evaluation — the 0.1.7+ volatile hook: the source thunk
   * unwraps live handles on every call, so `current()` stays fresh without
   * commit events.
   */
  setVolatileSource(source: () => Config): void {
    this.#source = source
    this.#volatile = true
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
 * The 0.1.5/0.1.6 settings-service face this plugin drives on legacy hosts
 * (ADR-0021): `installSection` was deleted upstream in 0.1.7 in favor of
 * volatile forms, so the legacy method is typed structurally here instead of
 * importing a service class the new devDeps no longer export.
 */
interface LegacySettingsService {
  installSection(owner: Context, ns: string, schema: z, entry: unknown, hooks: {
    validate?: (value: unknown) => void
    setSource?: (source: () => unknown) => void
    onChange?: () => void
  }): void
}

/**
 * Attach the plugin's settings section on the host's settings model
 * (ADR-0021 dual path):
 *
 * - 0.1.5/0.1.6 — the service exposes `installSection`; the hooks hand the
 *   live config the authoritative source and recompute on every committed
 *   change, and the custom validators (ADR-0018 domain exclusivity, Firecrawl
 *   tbs, Exa section filter) reject invalid writes before persist.
 * - 0.1.7+ — no `installSection`; the volatile-marked Config registers the
 *   namespace as a live form by itself. The live config adopts read-time
 *   evaluation (handles unwrap the live configuration per read), and the
 *   commit-side hook rides `settings/document-updated` for this namespace —
 *   schema-level validation is the host's, so the plugin's custom validators
 *   degrade to resolve-time loud failures on this path.
 *
 * Without a settings service at all, a no-op: the entry config stays
 * authoritative and the plugin must not fail to load. Disposal is bound to
 * the calling fiber by the surrounding effects.
 */
export function attachSettingsSection(ctx: Context, entry: ConfigRuntime, live: LiveResolvedConfig, commitHooks?: SettingsCommitHooks): void {
  ctx.inject(['settings'], (settingsCtx) => {
    const legacy = (settingsCtx.settings as Partial<LegacySettingsService>).installSection
    if (typeof legacy === 'function') {
      legacy.call(settingsCtx.settings, ctx, SETTINGS_NAMESPACE, ConfigLegacy, materializeConfig(entry), {
        // Runs inside the host write queue BEFORE persist: an invalid committed
        // value is rejected and the error surfaced to the committer — the loud
        // half of the ADR-0018 domain exclusivity rule (the quiet danger of a
        // resolveConfig throw on this path is documented on the validator).
        // The legacy face is structurally typed, so the section is cast once
        // here at the boundary — the host guarantees schema-shaped input.
        validate: (value) => {
          const section = value as Config
          validateUnifiedDomainRule(section)
          validateExaSectionFilterRule(section)
          validateFirecrawlTbsRule(section)
        },
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
      return
    }
    // 0.1.7+ volatile forms: read-time evaluation plus a commit listener.
    live.setVolatileSource(() => materializeConfig(entry))
    ctx.on('settings/document-updated', (ns: string) => {
      if (ns === SETTINGS_NAMESPACE) commitHooks?.onCommitted?.()
    })
  })
}
