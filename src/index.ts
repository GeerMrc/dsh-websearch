/**
 * dsh-websearch node half — unified multi-provider WebSearch management plugin
 * for the DeepSeek Harness. Contributes priority-chain meta providers
 * (`dshws-chain` / `dshws-chain-fetch`) plus bundled search/fetch providers to
 * the `ctx.web` registry without modifying the host.
 *
 * `@deepseek-ai/dsh-web` is a type-only dependency (seam discipline,
 * AGENTS.md): the import below pulls in its ambient augmentation of the
 * cordis `Context` so `ctx.web` typechecks against the published types.
 *
 * @module dsh-websearch
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-web'
import { ChainSearchProvider, MemberRegistry } from './chain/core.ts'
import { Config, resolveConfig } from './config.ts'

export { BUILT_IN_MEMBER_ORDER, DEFAULT_PER_MEMBER_TIMEOUT_MS } from './config.ts'
export type {
  DeepSeekSettings,
  ExaSettings,
  FirecrawlSettings,
  PerplexitySettings,
  ResolvedWebSearchConfig,
  TavilySettings,
} from './config.ts'
export { CHAIN_ERROR_CODES, DshwsError, MEMBER_ERROR_CODES } from './errors.ts'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'dsh-websearch'

/** The web seam this plugin registers its providers into. */
export const inject = ['web']

/** Validation schema + type for the `dsh-websearch` config section. */
export { Config }

/**
 * Plugin entry point: build the priority chains from the resolved config and
 * register them with `ctx.web`. Disposal is bound to the calling fiber by the
 * seam's registration effect. Bundled members register themselves with the
 * shared registry and `ctx.web` as they land (S04/S05a); until then both
 * chains report unavailable and the host never selects them.
 */
export function apply(ctx: Context, config: Config): void {
  const resolved = resolveConfig(config)
  const registry = new MemberRegistry()
  const log = (message: string) => ctx.logger.info(message)
  ctx.web.registerSearchProvider(new ChainSearchProvider({
    members: registry.toResolver(),
    order: resolved.searchChain,
    perMemberTimeoutMs: resolved.perMemberTimeoutMs,
    log,
  }))
}
