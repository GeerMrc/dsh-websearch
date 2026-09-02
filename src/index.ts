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

/** Compile-time probe: published `@deepseek-ai/dsh-web` types augment the cordis `Context` with `web`. */
type ContextHasWebRuntime = Context['web'] extends object ? true : never

/** Cordis plugin name used by loader diagnostics. */
export const name = 'dsh-websearch'

/** The web seam this plugin registers its providers into. */
export const inject = ['web']

/** Plugin entry point; chain/provider registration lands with the chain core. */
export function apply(_ctx: Context): void {}
