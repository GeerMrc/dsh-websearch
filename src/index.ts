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
import type { WebFetchProvider, WebSearchProvider } from '@deepseek-ai/dsh-web'
import type {} from '@deepseek-ai/dsh-web'
import { ChainFetchProvider, ChainSearchProvider, MemberRegistry } from './chain/core.ts'
import type { MemberGates } from './chain/core.ts'
import { Config, resolveConfig } from './config.ts'
import { CredentialGate } from './credentials.ts'
import { KeyPool } from './keys.ts'
import { MEMBER_ERROR_CODES } from './errors.ts'
import { AnysearchSearchProvider, resolveAnysearchMemberOptions } from './providers/anysearch.ts'
import { DeepSeekSearchProvider, resolveDeepSeekMemberOptions } from './providers/deepseek.ts'
import { DEEPSEEK_FALLBACK_MEMBER_ID, ORDERABLE_SEARCH_MEMBER_ORDER } from './config.ts'
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
  ANYSEARCH_MEMBER_ID,
  AnysearchSearchProvider,
  resolveAnysearchMemberOptions,
} from './providers/anysearch.ts'
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
type MemberKey = 'tavily' | 'exa' | 'perplexity' | 'firecrawl' | 'deepseek' | 'anysearch'

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

  // Build each member's key pool (ADR-0008): the primary ref plus any
  // configured extras. Entry-config names outside the credential grammar
  // fail the load here; settings-sourced names are grammar-checked at resolve
  // time and re-primed on every settings commit (see attachSettingsSection).
  for (const member of [resolved.tavily, resolved.exa, resolved.perplexity, resolved.firecrawl, resolved.deepseek, resolved.anysearch]) {
    credentialRef(member.apiKeyEnv)
  }

  const gate = new CredentialGate({
    credentials,
    subscribe: (handler) => ctx.on('credentials/reference-updated', handler),
    log,
  })

  // The pool ports read the LIVE config per call (settings hot, same
  // discipline as the chain order getters) — a committed pool change reaches
  // the next search and the next gate read without re-registration.
  const keyPool = (
    memberKey: MemberKey,
    label: string,
    codes: (typeof MEMBER_ERROR_CODES)[keyof typeof MEMBER_ERROR_CODES],
  ): KeyPool =>
    new KeyPool({
      ref: () => live.current()[memberKey].apiKeyEnv,
      selection: () => live.current()[memberKey].keySelection ?? 'round-robin',
      isReady: (ref) => gate.isReady(ref),
      resolve: async (ref) => (await credentials.resolve(credentialRef(ref)))?.value,
      label,
      codes,
    })

  const pools = {
    tavily: keyPool('tavily', 'Tavily', MEMBER_ERROR_CODES.tavily),
    exa: keyPool('exa', 'Exa', MEMBER_ERROR_CODES.exa),
    perplexity: keyPool('perplexity', 'Perplexity', MEMBER_ERROR_CODES.perplexity),
    firecrawl: keyPool('firecrawl', 'Firecrawl', MEMBER_ERROR_CODES.firecrawl),
    deepseek: keyPool('deepseek', 'DeepSeek', MEMBER_ERROR_CODES.deepseek),
    anysearch: keyPool('anysearch', 'Anysearch', MEMBER_ERROR_CODES.anysearch),
  } as const

  const gates = (memberKey: MemberKey, pool: KeyPool): MemberGates => ({
    enabled: () =>
      // The deepseek member's chain membership is governed SOLELY by the
      // ADR-0014 participation guard (designated + at most one ready tool +
      // key armed) — its legacy enabled flag must not veto a guarded tail.
      memberKey === 'deepseek' ? true : live.current()[memberKey].enabled,
    credentialsReady: () => pool.ready(),
    // S14r: same-member key redraw only helps when the pool holds >1 key.
    multiKeyPool: () => pool.hasMultiKeyPool(),
  })

  const searchMembers = new MemberRegistry()
  const fetchMembers = new MemberRegistry<WebFetchProvider>()

  /**
   * Ready TOOL members (ADR-0014): enabled five-tool members whose key gate is
   * armed, read live per call. DeepSeek is excluded BY SPEC — the paid floor's
   * eligibility rule counts only the tools it would back up, so 'one ready
   * tool + selected DeepSeek' stays eligible instead of counting itself to 2.
   */
  const readyToolMemberCount = (): number => {
    const current = live.current()
    return ORDERABLE_SEARCH_MEMBER_ORDER.filter((id) => {
      const key = id.replace('dshws-', '') as MemberKey
      return current[key].enabled && pools[key].ready()
    }).length
  }

  // Chain options are getter-backed on purpose: the chain shells keep the
  // options object by reference, so every run reads the live chain order and
  // timeout — a settings change reaches the next search without re-registering.
  ctx.web.registerSearchProvider(new ChainSearchProvider({
    members: searchMembers.toResolver(),
    get order() {
      const current = live.current()
      const chain = [...current.searchChain]
      // DeepSeek paid-floor participation (ADR-0014): the INTENT is
      // `fallbackMember` naming it; the ELIGIBILITY is runtime state — at most
      // one ready TOOL member (DeepSeek never counts itself: 'one tool plus a
      // selected DeepSeek' must stay eligible) and its key gate armed.
      // Credential facts are invisible to resolveConfig, so this single hot
      // rule lives in the getter; it only APPENDS, never replaces — the
      // static chain (with the designated tool member already pinned at the
      // tail) is authoritative for everything else.
      if (current.fallbackMember === DEEPSEEK_FALLBACK_MEMBER_ID
        && readyToolMemberCount() <= 1
        && pools.deepseek.ready()) {
        chain.push(DEEPSEEK_FALLBACK_MEMBER_ID)
      }
      return chain
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
    resolveFirecrawlMemberOptions(resolved.firecrawl, () => pools.firecrawl.resolveApiKey()),
  )
  const anysearch = new AnysearchSearchProvider(
    resolveAnysearchMemberOptions(resolved.anysearch, () => pools.anysearch.resolveApiKey()),
  )
  const members: readonly {
    provider: WebSearchProvider
    memberKey: MemberKey
    pool: KeyPool
  }[] = [
    {
      provider: new TavilySearchProvider(
        resolveTavilyMemberOptions(resolved.tavily, () => pools.tavily.resolveApiKey()),
      ),
      memberKey: 'tavily',
      pool: pools.tavily,
    },
    {
      provider: new ExaSearchProvider(
        resolveExaMemberOptions(resolved.exa, () => pools.exa.resolveApiKey()),
      ),
      memberKey: 'exa',
      pool: pools.exa,
    },
    {
      provider: new PerplexitySearchProvider(
        resolvePerplexityMemberOptions(resolved.perplexity, () => pools.perplexity.resolveApiKey()),
      ),
      memberKey: 'perplexity',
      pool: pools.perplexity,
    },
    { provider: firecrawl, memberKey: 'firecrawl', pool: pools.firecrawl },
    {
      provider: new DeepSeekSearchProvider(
        resolveDeepSeekMemberOptions(resolved.deepseek, () => pools.deepseek.resolveApiKey()),
      ),
      memberKey: 'deepseek',
      pool: pools.deepseek,
    },
    {
      provider: anysearch,
      memberKey: 'anysearch',
      pool: pools.anysearch,
    },
  ]
  for (const { provider, memberKey, pool } of members) {
    ctx.web.registerSearchProvider(provider)
    searchMembers.register(provider, gates(memberKey, pool))
  }
  // The scrape face shares the firecrawl instance, key pool, and gate.
  ctx.web.registerFetchProvider(firecrawl)
  fetchMembers.register(firecrawl, gates('firecrawl', pools.firecrawl))

  // Hot settings section when the host has a settings service; no-op
  // (entry config authoritative) otherwise. A committed change re-primes the
  // gate AFTER the refresh so newly added pool refs start being observed
  // (prime is additive-idempotent; ADR-0008).
  attachSettingsSection(ctx, Config, config, live, {
    onCommitted: () => {
      void gate.prime(Object.values(pools).flatMap((pool) => pool.refs())).catch((error: unknown) => {
        log(`[dshws-websearch] credential gate re-priming failed unexpectedly: ${String(error)}`)
      })
    },
  })

  // Fill the describe cache in the background; until it lands every member
  // reads not-ready. The refs are validated above and describe failures are
  // contained inside the gate, so this catch only keeps an unexpected bug
  // from becoming an unhandled rejection that could take the host down.
  gate.prime(Object.values(pools).flatMap((pool) => pool.refs())).catch((error: unknown) => {
    log(`[dshws-websearch] credential gate priming failed unexpectedly: ${String(error)}`)
  })
}
