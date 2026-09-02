/**
 * dsh-websearch node half — unified multi-provider WebSearch management plugin
 * for the DeepSeek Harness. Contributes priority-chain meta providers
 * (`dshws-chain` / `dshws-chain-fetch`) plus bundled search/fetch providers to
 * the `ctx.web` registry without modifying the host.
 *
 * `@deepseek-ai/dsh-web` is a type-only dependency (seam discipline,
 * AGENTS.md): the import below pulls in its ambient augmentation of the
 * cordis `Context` so `ctx.web` typechecks against the published types.
 * The credentials seam is injected as a service (`inject` below); the
 * `credentialRef` constructor comes from `@deepseek-ai/dsh-credentials`
 * (peer, anysearch precedent) for its reference-grammar validation.
 *
 * @module dsh-websearch
 */
import type { Context } from '@deepseek-ai/cordis'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import type { CredentialProvider, CredentialRef } from '@deepseek-ai/dsh-credentials'
import type { WebFetchProvider, WebSearchProvider } from '@deepseek-ai/dsh-web'
import type {} from '@deepseek-ai/dsh-web'
import { ChainFetchProvider, ChainSearchProvider, MemberRegistry } from './chain/core.ts'
import { Config, resolveConfig } from './config.ts'
import { CredentialGate } from './credentials.ts'
import { DeepSeekSearchProvider, resolveDeepSeekMemberOptions } from './providers/deepseek.ts'
import { TavilySearchProvider, resolveTavilyMemberOptions } from './providers/tavily.ts'

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
export { CredentialGate } from './credentials.ts'
export {
  DEEPSEEK_MEMBER_ID,
  DeepSeekSearchProvider,
  resolveDeepSeekMemberOptions,
} from './providers/deepseek.ts'
export {
  TAVILY_MEMBER_ID,
  TavilySearchProvider,
  resolveTavilyMemberOptions,
} from './providers/tavily.ts'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'dsh-websearch'

/** The seams this plugin binds to: provider registration plus per-operation credential resolution. */
export const inject = ['web', 'credentials']

/** Validation schema + type for the `dsh-websearch` config section. */
export { Config }

/**
 * Plugin entry point: build the priority chains and the S04 members, wire the
 * credential gate, and register everything with `ctx.web`. Disposal is bound
 * to the calling fiber by the seam's registration effects (including the
 * gate's event subscription). Exa/Perplexity/Firecrawl members land in S05a;
 * until then the chains simply skip their ids.
 */
export function apply(ctx: Context, config: Config): void {
  const resolved = resolveConfig(config)
  const credentials = ctx.credentials
  const log = (message: string) => ctx.logger.info(message)

  // Validate the configured references before anything registers: a name
  // outside the credential grammar is a misconfiguration and must fail the
  // load, not surface later as a rejected priming promise.
  const tavilyRef = credentialRef(resolved.tavily.apiKeyEnv)
  const deepseekRef = credentialRef(resolved.deepseek.apiKeyEnv)

  const gate = new CredentialGate({
    credentials,
    subscribe: (handler) => ctx.on('credentials/reference-updated', handler),
    log,
  })

  const searchMembers = new MemberRegistry()
  const fetchMembers = new MemberRegistry<WebFetchProvider>()
  ctx.web.registerSearchProvider(new ChainSearchProvider({
    members: searchMembers.toResolver(),
    order: resolved.searchChain,
    perMemberTimeoutMs: resolved.perMemberTimeoutMs,
    log,
  }))
  ctx.web.registerFetchProvider(new ChainFetchProvider({
    members: fetchMembers.toResolver(),
    order: resolved.fetchChain,
    perMemberTimeoutMs: resolved.perMemberTimeoutMs,
    log,
  }))

  // Double registration (ADR-0002 Decision 5): each member also lives in
  // ctx.web under its own id so a pinned selection scalar reaches it directly,
  // bypassing the chain. Gates read at call time, so a settings change (S05a)
  // or a credential event reaches the next call without a restart.
  const members: readonly { provider: WebSearchProvider; ref: CredentialRef; enabled: boolean }[] = [
    {
      provider: new TavilySearchProvider(
        resolveTavilyMemberOptions(resolved.tavily, () => resolveCredentialValue(credentials, tavilyRef)),
      ),
      ref: tavilyRef,
      enabled: resolved.tavily.enabled,
    },
    {
      provider: new DeepSeekSearchProvider(
        resolveDeepSeekMemberOptions(resolved.deepseek, () => resolveCredentialValue(credentials, deepseekRef)),
      ),
      ref: deepseekRef,
      enabled: resolved.deepseek.enabled,
    },
  ]
  for (const { provider, ref, enabled } of members) {
    ctx.web.registerSearchProvider(provider)
    searchMembers.register(provider, {
      enabled: () => enabled,
      credentialsReady: () => gate.isReady(String(ref)),
    })
  }

  // Fill the describe cache in the background; until it lands every member
  // reads not-ready. The refs are validated above and describe failures are
  // contained inside the gate, so this catch only keeps an unexpected bug
  // from becoming an unhandled rejection that could take the host down.
  gate.prime([String(tavilyRef), String(deepseekRef)]).catch((error: unknown) => {
    log(`[dshws-websearch] credential gate priming failed unexpectedly: ${String(error)}`)
  })
}

/** Per-operation key resolution through the credentials service (values are never cached). */
async function resolveCredentialValue(
  credentials: CredentialProvider,
  ref: CredentialRef,
): Promise<string | undefined> {
  return (await credentials.resolve(ref))?.value
}
