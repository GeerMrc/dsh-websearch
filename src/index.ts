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
// Type-only: pulls the `tools`, `systemPrompt`, and agent lifecycle event
// declarations into this program via module augmentation (dsh-agent's
// `agent/created` payload, dsh-tools' `ctx.tools`, dsh-system-prompt's
// `ctx.systemPrompt`).
import type {} from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-system-prompt'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import type { WebSearchProvider } from '@deepseek-ai/dsh-web'
import type {} from '@deepseek-ai/dsh-web'
import { ChainSearchProvider, MemberRegistry } from './chain/core.ts'
import { createChainFileLog } from './chain-log.ts'
import { clearAllSearchOnlyPresets } from './preset-authoring.ts'
import { FetchGateProvider } from './fetch-gate.ts'
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

  /**
   * Hot-backed member options (S17 D1): every property read re-resolves
   * through the live config, so a committed settings change reaches the next
   * search without re-registration — the chain-order getter precedent
   * (below) applied to the member option objects. `build` may read any slice
   * of the live snapshot (the member section and, from the S17 unified
   * language/region entry, root fields as well); it stays a pure resolution,
   * cheap to re-run per read. Providers hold this object by reference and
   * read fields per call, so delegation through the proxy is invisible to
   * them.
   */
  const hotMemberOptions = <T extends object>(build: () => T): T =>
    new Proxy({} as T, {
      get: (_target, property, receiver) => Reflect.get(build(), property, receiver),
    })

  const credentials = ctx.credentials
  const fileLog = createChainFileLog(config.chainLogFile !== false)
  // S15c (user ruling "complete takeover, zero errors"): hide web_fetch from
  // every agent's tool list through the OFFICIAL tools.restrict() API — the
  // same mechanism the subagent system uses to control tool visibility
  // (child-agent.ts:217 precedent). Combined with a scoped same-name empty
  // system-prompt section that shadows tool-web's guidance text, the model
  // never sees web_fetch at all: no schema, no prompt mention, no execution,
  // no errors. Works for every preset (standard/PTC/creative/minimal/custom).
  const fetchTakeoverActive = (): boolean => live.current().fetchTakeover !== false
  ctx.web.registerFetchProvider(new FetchGateProvider(fetchTakeoverActive))
  ctx.on('agent/created', ({ agent }) => {
    if (!fetchTakeoverActive()) return
    // The named tool vanishes from the agent's tool list AND refuses
    // execution — one call covers both (tools/index.ts restrict semantics).
    agent.ctx.tools.restrict({ deny: ['web_fetch'] })
    // Shadow tool-web's `tool:web_fetch` guidance section with an empty
    // text; renderPrompt drops zero-length sections, so the model reads
    // nothing about web_fetch (system-prompt scoped shadowing semantics).
    agent.ctx.systemPrompt.section({ name: 'tool:web_fetch', order: 2100, text: '' })
  })

  // S15b (user ruling): gate-only takeover — no preset copies, no default
  // switching. The settings inject exists solely for the ONE-TIME migration:
  // an S15a install may hold authored preset copies and a switched default;
  // this removes them and restores `standard` so the plugin's footprint is
  // exactly the gate. Swallowed failures: a read-only home or unreachable
  // settings store leave the old copies in place — inert, the gate works.
  ctx.inject(['settings'], (settingsCtx) => {
    const presets = settingsCtx.settings.describe().find((descriptor) => descriptor.ns === 'agent-presets')
    const current = (presets?.value as { default?: string } | undefined)?.default ?? 'standard'
    if (current === 'dshws-search-only') {
      void settingsCtx.settings.update('agent-presets', { default: 'standard' })
        .then(() => { clearAllSearchOnlyPresets() })
        .catch(() => {})
    } else {
      clearAllSearchOnlyPresets()
    }
  })
  const log = (message: string) => {
    ctx.logger.info(message)
    fileLog(message)
  }

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

  // Draw-level trace (S14z): wraps each member's key thunk so every draw
  // logs which key served it — last 4 chars only, enough to follow rotation
  // without logging secrets. The pool itself returns the whole comma value;
  // the SELECTION is only observable here, at the member boundary.
  const tracedPool = (memberKey: MemberKey, pool: KeyPool) => ({
    resolveApiKey: async (): Promise<string | undefined> => {
      const key = await pool.resolveApiKey()
      if (key !== undefined) log(`[dsh-websearch] key draw dshws-${memberKey} …${key.slice(-4)}`)
      return key
    },
    ready: () => pool.ready(),
    hasMultiKeyPool: () => pool.hasMultiKeyPool(),
  })

  const pools = {
    tavily: keyPool('tavily', 'Tavily', MEMBER_ERROR_CODES.tavily),
    exa: keyPool('exa', 'Exa', MEMBER_ERROR_CODES.exa),
    perplexity: keyPool('perplexity', 'Perplexity', MEMBER_ERROR_CODES.perplexity),
    firecrawl: keyPool('firecrawl', 'Firecrawl', MEMBER_ERROR_CODES.firecrawl),
    deepseek: keyPool('deepseek', 'DeepSeek', MEMBER_ERROR_CODES.deepseek),
    anysearch: keyPool('anysearch', 'Anysearch', MEMBER_ERROR_CODES.anysearch),
  } as const

  const traced = {
    tavily: tracedPool('tavily', pools.tavily),
    exa: tracedPool('exa', pools.exa),
    perplexity: tracedPool('perplexity', pools.perplexity),
    firecrawl: tracedPool('firecrawl', pools.firecrawl),
    deepseek: tracedPool('deepseek', pools.deepseek),
    anysearch: tracedPool('anysearch', pools.anysearch),
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
  // S14z (user ruling): the plugin's fetch chain is RETIRED — web_fetch is
  // removed at the preset layer and the seam keeps the official http provider,
  // so this half of the takeover never serves. Nothing registers here.

  // Bundled members in BUILT_IN_MEMBER_ORDER relative order. Member options
  // resolve through the live config per read (S17 D1 hot options): every
  // option field — chain order/timeout, enabled gates, base URLs, models,
  // result counts, and the P1 parameter batch — reaches the next search. Every
  // member registers twice — under its own id in ctx.web for direct pinning,
  // and in the plugin registry with its gates for the chain (ADR-0002
  // Decision 5).
  const firecrawl = new FirecrawlProvider(
    hotMemberOptions(() => resolveFirecrawlMemberOptions(live.current().firecrawl, () => traced.firecrawl.resolveApiKey())),
  )
  const anysearch = new AnysearchSearchProvider(
    hotMemberOptions(() => resolveAnysearchMemberOptions(live.current().anysearch, () => traced.anysearch.resolveApiKey())),
  )
  const members: readonly {
    provider: WebSearchProvider
    memberKey: MemberKey
    pool: KeyPool
  }[] = [
    {
      provider: new TavilySearchProvider(
        hotMemberOptions(() => resolveTavilyMemberOptions(live.current().tavily, () => traced.tavily.resolveApiKey())),
      ),
      memberKey: 'tavily',
      pool: pools.tavily,
    },
    {
      provider: new ExaSearchProvider(
        hotMemberOptions(() => resolveExaMemberOptions(live.current().exa, () => traced.exa.resolveApiKey())),
      ),
      memberKey: 'exa',
      pool: pools.exa,
    },
    {
      provider: new PerplexitySearchProvider(
        hotMemberOptions(() => resolvePerplexityMemberOptions(live.current().perplexity, () => traced.perplexity.resolveApiKey())),
      ),
      memberKey: 'perplexity',
      pool: pools.perplexity,
    },
    { provider: firecrawl, memberKey: 'firecrawl', pool: pools.firecrawl },
    {
      provider: new DeepSeekSearchProvider(
        hotMemberOptions(() => resolveDeepSeekMemberOptions(live.current().deepseek, () => traced.deepseek.resolveApiKey())),
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
  // S14z: the firecrawl scrape face is retired with the fetch chain — the
  // instance below still serves its SEARCH face through the search registry.

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
