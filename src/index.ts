/**
 * dsh-websearch node half — unified multi-provider WebSearch management plugin
 * for the DeepSeek Harness. Contributes priority-chain meta providers
 * (`dshws-chain` / `dshws-chain-fetch`) plus bundled search/fetch providers to
 * the `ctx.web` registry without modifying the host.
 *
 * `@deepseek-ai/dsh-web` is a type-only dependency (seam discipline,
 * AGENTS.md): the import below pulls in its ambient augmentation of the
 * cordis `Context` so `ctx.web` typechecks against the published types.
 * The credentials and settings seams are injected as services (`inject`
 * below); `credentialRef` comes from `@deepseek-ai/dsh-credentials`
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
import type { MemberGates } from './chain/core.ts'
import { Config, resolveConfig } from './config.ts'
import { CredentialGate } from './credentials.ts'
import { DeepSeekSearchProvider, resolveDeepSeekMemberOptions } from './providers/deepseek.ts'
import { ExaSearchProvider, resolveExaMemberOptions } from './providers/exa.ts'
import { FirecrawlProvider, resolveFirecrawlMemberOptions } from './providers/firecrawl.ts'
import { PerplexitySearchProvider, resolvePerplexityMemberOptions } from './providers/perplexity.ts'
import { TavilySearchProvider, resolveTavilyMemberOptions } from './providers/tavily.ts'
import { LiveResolvedConfig, attachSettingsSection } from './settings.ts'

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
export { LiveResolvedConfig, SETTINGS_NAMESPACE, attachSettingsSection } from './settings.ts'
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
export {
  EXA_MEMBER_ID,
  ExaSearchProvider,
  resolveExaMemberOptions,
} from './providers/exa.ts'
export {
  PERPLEXITY_MEMBER_ID,
  PerplexitySearchProvider,
  resolvePerplexityMemberOptions,
} from './providers/perplexity.ts'
export {
  FIRECRAWL_MEMBER_ID,
  FirecrawlProvider,
  resolveFirecrawlMemberOptions,
} from './providers/firecrawl.ts'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'dsh-websearch'

/** The seams this plugin binds to: provider registration, per-operation credential resolution, hot settings. */
export const inject = ['web', 'credentials']

/** Validation schema + type for the `dsh-websearch` config section. */
export { Config }

/** The bundled members, keyed by their config section. */
type MemberKey = 'tavily' | 'exa' | 'perplexity' | 'firecrawl' | 'deepseek'

/**
 * Plugin entry point: build the priority chains and the five bundled members,
 * wire the credential gate and the hot settings state, and register
 * everything with `ctx.web`. Disposal is bound to the calling fiber by the
 * seam's registration effects (including the gate's event subscription and
 * the settings section).
 */
export function apply(ctx: Context, config: Config): void {
  const live = new LiveResolvedConfig(config)
  const resolved = resolveConfig(config)
  const credentials = ctx.credentials
  const log = (message: string) => ctx.logger.info(message)

  // Validate the configured references before anything registers: a name
  // outside the credential grammar is a misconfiguration and must fail the
  // load, not surface later as a rejected priming promise. apiKeyEnv is
  // launch-static (plan D2), so the refs never change at runtime.
  const refs = {
    tavily: credentialRef(resolved.tavily.apiKeyEnv),
    exa: credentialRef(resolved.exa.apiKeyEnv),
    perplexity: credentialRef(resolved.perplexity.apiKeyEnv),
    firecrawl: credentialRef(resolved.firecrawl.apiKeyEnv),
    deepseek: credentialRef(resolved.deepseek.apiKeyEnv),
  } as const

  const gate = new CredentialGate({
    credentials,
    subscribe: (handler) => ctx.on('credentials/reference-updated', handler),
    log,
  })
  const gates = (memberKey: MemberKey, ref: CredentialRef): MemberGates => ({
    enabled: () => live.current()[memberKey].enabled,
    credentialsReady: () => gate.isReady(String(ref)),
  })

  const searchMembers = new MemberRegistry()
  const fetchMembers = new MemberRegistry<WebFetchProvider>()

  // Chain options are getter-backed on purpose: the chain shells keep the
  // options object by reference, so every run reads the live chain order and
  // timeout — a settings change reaches the next search without re-registering.
  ctx.web.registerSearchProvider(new ChainSearchProvider({
    members: searchMembers.toResolver(),
    get order() {
      return live.current().searchChain
    },
    get perMemberTimeoutMs() {
      return live.current().perMemberTimeoutMs
    },
    log,
  }))
  ctx.web.registerFetchProvider(new ChainFetchProvider({
    members: fetchMembers.toResolver(),
    get order() {
      return live.current().fetchChain
    },
    get perMemberTimeoutMs() {
      return live.current().perMemberTimeoutMs
    },
    log,
  }))

  // Bundled members in BUILT_IN_MEMBER_ORDER relative order. Member options
  // are launch-static (D2): only the chain order/timeout and the enabled
  // gates hot-apply. Every member registers twice — under its own id in
  // ctx.web for direct pinning, and in the plugin registry with its gates for
  // the chain (ADR-0002 Decision 5).
  const firecrawl = new FirecrawlProvider(
    resolveFirecrawlMemberOptions(resolved.firecrawl, () => resolveCredentialValue(credentials, refs.firecrawl)),
  )
  const members: readonly {
    provider: WebSearchProvider
    memberKey: MemberKey
    ref: CredentialRef
  }[] = [
    {
      provider: new TavilySearchProvider(
        resolveTavilyMemberOptions(resolved.tavily, () => resolveCredentialValue(credentials, refs.tavily)),
      ),
      memberKey: 'tavily',
      ref: refs.tavily,
    },
    {
      provider: new ExaSearchProvider(
        resolveExaMemberOptions(resolved.exa, () => resolveCredentialValue(credentials, refs.exa)),
      ),
      memberKey: 'exa',
      ref: refs.exa,
    },
    {
      provider: new PerplexitySearchProvider(
        resolvePerplexityMemberOptions(resolved.perplexity, () => resolveCredentialValue(credentials, refs.perplexity)),
      ),
      memberKey: 'perplexity',
      ref: refs.perplexity,
    },
    { provider: firecrawl, memberKey: 'firecrawl', ref: refs.firecrawl },
    {
      provider: new DeepSeekSearchProvider(
        resolveDeepSeekMemberOptions(resolved.deepseek, () => resolveCredentialValue(credentials, refs.deepseek)),
      ),
      memberKey: 'deepseek',
      ref: refs.deepseek,
    },
  ]
  for (const { provider, memberKey, ref } of members) {
    ctx.web.registerSearchProvider(provider)
    searchMembers.register(provider, gates(memberKey, ref))
  }
  // The scrape face shares the firecrawl instance, credential, and gate.
  ctx.web.registerFetchProvider(firecrawl)
  fetchMembers.register(firecrawl, gates('firecrawl', refs.firecrawl))

  // Hot settings section when the host has a settings service; no-op
  // (entry config authoritative) otherwise.
  attachSettingsSection(ctx, Config, config, live)

  // Fill the describe cache in the background; until it lands every member
  // reads not-ready. The refs are validated above and describe failures are
  // contained inside the gate, so this catch only keeps an unexpected bug
  // from becoming an unhandled rejection that could take the host down.
  gate.prime(Object.values(refs).map((ref) => String(ref))).catch((error: unknown) => {
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
