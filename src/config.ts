/**
 * Plugin configuration: the schemastery schema the loader validates against,
 * plus `resolveConfig`, which turns the all-optional user config into a fully
 * defaulted specification. Defaulting lives here explicitly — the schema never
 * injects defaults (explicit > implicit at the owning boundary).
 *
 * @module dsh-websearch/config
 */
import z from '@deepseek-ai/schemastery'

/**
 * Orderable search members (S14c, user ruling): the five tool members users may
 * reorder; DeepSeek is NOT orderable — it is the paid fallback pinned to the
 * chain tail (see {@link DEEPSEEK_FALLBACK_MEMBER_ID}).
 */
export const ORDERABLE_SEARCH_MEMBER_ORDER: readonly string[] = [
  'dshws-tavily',
  'dshws-exa',
  'dshws-perplexity',
  'dshws-firecrawl',
  'dshws-anysearch',
]

/**
 * The DeepSeek member id, pinned to the search-chain tail regardless of any
 * pinned order (S14c/ADR-0004 D3 注记：固定链尾兜底，不参与排序). A pinned
 * chain that still names it (pre-S14c settings) is filtered and re-appended.
 */
export const DEEPSEEK_FALLBACK_MEMBER_ID = 'dshws-deepseek'

/**
 * The keyless DuckDuckGo scrape member (S14e): the FREE side of the fallback
 * choice — no credential ref, its gate is always ready.
 */
export const FETCH_FALLBACK_MEMBER_ID = 'dshws-fetch-search'

/** The fallback choice (S14e): which member serves as the chain-tail floor. */
export type FallbackProvider = 'deepseek' | 'fetch' | 'auto'

/**
 * Effective built-in search order: the orderable five, then the DeepSeek
 * fallback tail (ADR-0004 中立开箱默认序, S14c 形态). Fetch chains use the
 * orderable five only — DeepSeek is not a fetch member.
 */
export const BUILT_IN_MEMBER_ORDER: readonly string[] = [...ORDERABLE_SEARCH_MEMBER_ORDER, DEEPSEEK_FALLBACK_MEMBER_ID]

/**
 * S14e: the chain tail is the CHOSEN fallback member. `auto` resolves at the
 * chain-consumption seam (the key gate is runtime state, not config); here we
 * keep `auto` symbolic so the live getter can decide per request.
 */
export function fallbackMemberId(choice: FallbackProvider | undefined): string {
  if (choice === 'fetch') return FETCH_FALLBACK_MEMBER_ID
  // 'deepseek' and the unset default both name the paid floor; 'auto' is
  // resolved by the caller (live getter) before the chain sees it.
  return DEEPSEEK_FALLBACK_MEMBER_ID
}

/** Strip both fallback ids from the orderable span and append the chosen tail. */
export function withFallbackTail(chain: readonly string[], choice: FallbackProvider | undefined): string[] {
  const span = chain.filter((id) => id !== DEEPSEEK_FALLBACK_MEMBER_ID && id !== FETCH_FALLBACK_MEMBER_ID)
  return [...span, fallbackMemberId(choice)]
}

/** Per-member timeout budget applied when the config omits one (ADR-0002). */
export const DEFAULT_PER_MEMBER_TIMEOUT_MS = 30000

/** How one member picks a key from its pool each search (ADR-0008). */
export type KeySelection = 'order' | 'round-robin' | 'random'

/** DeepSeek member settings (`dshws-deepseek`). */
export interface DeepSeekSettings {
  /**
   * Client-facing switch, `false` unless set. Since S14u this flag no longer
   * governs chain membership — the fallback member is named solely by
   * `fallbackProvider` — it only feeds the settings-page snapshot.
   */
  enabled?: boolean
  /** Credential-ref env name resolved through the credentials service. Defaults to `DEEPSEEK_API_KEY`. */
  apiKeyEnv?: string
  /** API endpoint base; provider default applies when omitted (S04). Launch-static: a settings change applies at next launch. */
  baseURL?: string
  /** Chat model powering the web_search server tool; provider default applies when omitted (S04). Launch-static: a settings change applies at next launch. */
  model?: string
  /** Response token cap; provider default applies when omitted (S04). Launch-static: a settings change applies at next launch. */
  maxTokens?: number
  /**
   * Server-tool search budget per request (S14c, host parity — the host
   * `web-search-deepseek` knob of the same name/semantic/default). Launch-static.
   */
  maxUses?: number
  /** Pool selection policy; defaults to `round-robin` (ADR-0011). Hot: settings changes apply to the next search. */
  keySelection?: KeySelection
}

/** Tavily member settings (`dshws-tavily`). */
export interface TavilySettings {
  /** Defaults to `true`. Hot: settings changes apply to the next search. */
  enabled?: boolean
  /** Defaults to `TAVILY_API_KEY`. Launch-static: a settings change applies at next launch (keys are configured through the credentials service, not this field). */
  apiKeyEnv?: string
  /** API endpoint base; provider default applies when omitted (S04). Launch-static: a settings change applies at next launch. */
  baseURL?: string
  /** Default result count; provider default applies when omitted (S04). Launch-static: a settings change applies at next launch. */
  maxResults?: number
  /** Pool selection policy; defaults to `round-robin` (ADR-0011). Hot: settings changes apply to the next search. */
  keySelection?: KeySelection
}

/** Firecrawl member settings (`dshws-firecrawl`). */
export interface FirecrawlSettings {
  /** Defaults to `true`. Hot: settings changes apply to the next search. */
  enabled?: boolean
  /** Defaults to `FIRECRAWL_API_KEY`. Launch-static: a settings change applies at next launch (keys are configured through the credentials service, not this field). */
  apiKeyEnv?: string
  /** API endpoint base; provider default applies when omitted (S05a). Launch-static: a settings change applies at next launch. */
  baseURL?: string
  /** Pool selection policy; defaults to `round-robin` (ADR-0011). Hot: settings changes apply to the next search. */
  keySelection?: KeySelection
}

/** Exa member settings (`dshws-exa`). */
export interface ExaSettings {
  /** Defaults to `true`. Hot: settings changes apply to the next search. */
  enabled?: boolean
  /** Defaults to `EXA_API_KEY`. Launch-static: a settings change applies at next launch (keys are configured through the credentials service, not this field). */
  apiKeyEnv?: string
  /** API endpoint base; provider default applies when omitted (S05a). Launch-static: a settings change applies at next launch. */
  baseURL?: string
  /** Default result count; provider default applies when omitted (S05a). Launch-static: a settings change applies at next launch. */
  numResults?: number
  /** Pool selection policy; defaults to `round-robin` (ADR-0011). Hot: settings changes apply to the next search. */
  keySelection?: KeySelection
}

/** Perplexity member settings (`dshws-perplexity`). */
export interface PerplexitySettings {
  /** Defaults to `true`. Hot: settings changes apply to the next search. */
  enabled?: boolean
  /** Defaults to `PERPLEXITY_API_KEY`. Launch-static: a settings change applies at next launch (keys are configured through the credentials service, not this field). */
  apiKeyEnv?: string
  /** API endpoint base; provider default applies when omitted (S05a). Launch-static: a settings change applies at next launch. */
  baseURL?: string
  /** Sonar model; provider default applies when omitted (S05a). Launch-static: a settings change applies at next launch. */
  model?: string
  /** Pool selection policy; defaults to `round-robin` (ADR-0011). Hot: settings changes apply to the next search. */
  keySelection?: KeySelection
}

/** Anysearch member settings (`dshws-anysearch`, ADR-0009). */
export interface AnysearchSettings {
  /** Defaults to `true`. Hot: settings changes apply to the next search. */
  enabled?: boolean
  /** Defaults to `ANYSEARCH_API_KEY`. Launch-static: a settings change applies at next launch (keys are configured through the credentials service, not this field). */
  apiKeyEnv?: string
  /** API endpoint base; provider default applies when omitted. Launch-static: a settings change applies at next launch. */
  baseURL?: string
  /** Regional zone passed through to the request body; omitted = not sent. Launch-static. */
  zone?: 'cn' | 'intl'
  /** Pool selection policy; defaults to `round-robin` (ADR-0011). Hot: settings changes apply to the next search. */
  keySelection?: KeySelection
}

/** User-facing plugin configuration; every field is optional and defaulted by {@link resolveConfig}. */
export interface Config {
  /** Search priority chain by member id. Empty = {@link BUILT_IN_MEMBER_ORDER}. Unknown ids are skipped at call time. Hot: settings changes apply to the next search. */
  searchChain?: string[]
  /** Fetch priority chain by member id. Empty = {@link BUILT_IN_MEMBER_ORDER}. Hot: settings changes apply to the next search. */
  fetchChain?: string[]
  /** Timeout budget per chain member per call, in milliseconds. Defaults to {@link DEFAULT_PER_MEMBER_TIMEOUT_MS}. Hot: settings changes apply to the next search. */
  perMemberTimeoutMs?: number
  /**
   * The chain-tail fallback choice (S14e): `'deepseek'` (paid, needs the
   * Models-page key), `'fetch'` (free DuckDuckGo scrape), or `'auto'` (default —
   * deepseek when its key is configured, else fetch). Hot.
   */
  fallbackProvider?: FallbackProvider
  /** DeepSeek member settings. */
  deepseek?: DeepSeekSettings
  /** Tavily member settings. */
  tavily?: TavilySettings
  /** Firecrawl member settings. */
  firecrawl?: FirecrawlSettings
  /** Exa member settings. */
  exa?: ExaSettings
  /** Perplexity member settings. */
  perplexity?: PerplexitySettings
  /** Anysearch member settings (ADR-0009). */
  anysearch?: AnysearchSettings
}

/** Validation schema the cordis loader applies to the `dsh-websearch` config section. */
export const Config: z<Config> = z.object({
  searchChain: z.array(z.string()),
  fallbackProvider: z.union(['deepseek', 'fetch', 'auto']),
  fetchChain: z.array(z.string()),
  perMemberTimeoutMs: z.number().step(1).min(1),
  deepseek: z.object({
    enabled: z.boolean(),
    apiKeyEnv: z.string(),
    baseURL: z.string(),
    model: z.string(),
    maxTokens: z.number().step(1).min(1),
    maxUses: z.number().step(1).min(1),
    keySelection: z.union(['order', 'round-robin', 'random']),
  }),
  tavily: z.object({
    enabled: z.boolean(),
    apiKeyEnv: z.string(),
    baseURL: z.string(),
    maxResults: z.number().step(1).min(1),
    keySelection: z.union(['order', 'round-robin', 'random']),
  }),
  firecrawl: z.object({
    enabled: z.boolean(),
    apiKeyEnv: z.string(),
    baseURL: z.string(),
    keySelection: z.union(['order', 'round-robin', 'random']),
  }),
  exa: z.object({
    enabled: z.boolean(),
    apiKeyEnv: z.string(),
    baseURL: z.string(),
    numResults: z.number().step(1).min(1),
    keySelection: z.union(['order', 'round-robin', 'random']),
  }),
  perplexity: z.object({
    enabled: z.boolean(),
    apiKeyEnv: z.string(),
    baseURL: z.string(),
    model: z.string(),
    keySelection: z.union(['order', 'round-robin', 'random']),
  }),
  anysearch: z.object({
    enabled: z.boolean(),
    apiKeyEnv: z.string(),
    baseURL: z.string(),
    zone: z.union(['cn', 'intl']),
    keySelection: z.union(['order', 'round-robin', 'random']),
  }),
})

/** Fully defaulted settings for one member. */
export interface DeepSeekMemberConfig extends Required<Pick<DeepSeekSettings, 'enabled' | 'apiKeyEnv'>> {
  baseURL?: string
  model?: string
  maxTokens?: number
  /** Server-tool search budget per request (S14c, host parity). */
  maxUses?: number
  /** Pool selection policy; resolveConfig defaults to 'round-robin' (ADR-0011). */
  keySelection?: KeySelection
}

/** Fully defaulted settings for one member. */
export interface TavilyMemberConfig extends Required<Pick<TavilySettings, 'enabled' | 'apiKeyEnv'>> {
  baseURL?: string
  maxResults?: number
  /** Pool selection policy; resolveConfig defaults to 'round-robin' (ADR-0011). */
  keySelection?: KeySelection
}

/** Fully defaulted settings for one member. */
export interface FirecrawlMemberConfig extends Required<Pick<FirecrawlSettings, 'enabled' | 'apiKeyEnv'>> {
  baseURL?: string
  /** Pool selection policy; resolveConfig defaults to 'round-robin' (ADR-0011). */
  keySelection?: KeySelection
}

/** Fully defaulted settings for one member. */
export interface ExaMemberConfig extends Required<Pick<ExaSettings, 'enabled' | 'apiKeyEnv'>> {
  baseURL?: string
  numResults?: number
  /** Pool selection policy; resolveConfig defaults to 'round-robin' (ADR-0011). */
  keySelection?: KeySelection
}

/** Fully defaulted settings for one member. */
export interface AnysearchMemberConfig extends Required<Pick<AnysearchSettings, 'enabled' | 'apiKeyEnv'>> {
  baseURL?: string
  /** Regional zone passed to the request body; absent = not sent. */
  zone?: 'cn' | 'intl'
  /** Pool selection policy; resolveConfig defaults to 'round-robin' (ADR-0011). */
  keySelection?: KeySelection
}

/** Fully defaulted settings for one member. */
export interface PerplexityMemberConfig extends Required<Pick<PerplexitySettings, 'enabled' | 'apiKeyEnv'>> {
  baseURL?: string
  model?: string
  /** Pool selection policy; resolveConfig defaults to 'round-robin' (ADR-0011). */
  keySelection?: KeySelection
}

/** Fully defaulted plugin configuration; the chain providers consume this, not the raw `Config`. */
export interface ResolvedWebSearchConfig {
  /** Search priority chain; never empty after resolution. */
  readonly fallbackProvider: FallbackProvider
  readonly searchChain: readonly string[]
  /** Fetch priority chain; never empty after resolution. */
  readonly fetchChain: readonly string[]
  /** Timeout budget per member per call, in milliseconds. */
  readonly perMemberTimeoutMs: number
  readonly deepseek: DeepSeekMemberConfig
  readonly tavily: TavilyMemberConfig
  readonly firecrawl: FirecrawlMemberConfig
  readonly exa: ExaMemberConfig
  readonly perplexity: PerplexityMemberConfig
  readonly anysearch: AnysearchMemberConfig
}

/**
 * Apply every default explicitly: empty chains become the built-in member
 * order, a missing timeout budget becomes 30s, and each member section gets
 * `enabled: true` plus its credential-ref env name. Provider-specific option
 * defaults (base URLs, models, result counts) stay with the provider
 * implementations (S04/S05a); their values pass through untouched.
 */
export function resolveConfig(config: Config): ResolvedWebSearchConfig {
  return {
    searchChain: withFallbackTail(
      config.searchChain?.length ? [...config.searchChain] : ORDERABLE_SEARCH_MEMBER_ORDER,
      config.fallbackProvider,
    ),
    fallbackProvider: config.fallbackProvider ?? 'auto',
    fetchChain: config.fetchChain?.length
      ? [...config.fetchChain].filter((id) => id !== DEEPSEEK_FALLBACK_MEMBER_ID)
      : [...ORDERABLE_SEARCH_MEMBER_ORDER],
    perMemberTimeoutMs: config.perMemberTimeoutMs ?? DEFAULT_PER_MEMBER_TIMEOUT_MS,
    deepseek: {
      // S14d (user ruling): the paid fallback is OPT-IN — default off keeps the
      // install at zero paid reach until the user chooses it in the settings.
      enabled: config.deepseek?.enabled ?? false,
      apiKeyEnv: config.deepseek?.apiKeyEnv ?? 'DEEPSEEK_API_KEY',
      keySelection: config.deepseek?.keySelection ?? 'round-robin',
      baseURL: config.deepseek?.baseURL?.trim() === '' ? undefined : config.deepseek?.baseURL,
      model: config.deepseek?.model,
      maxTokens: config.deepseek?.maxTokens,
      maxUses: config.deepseek?.maxUses,
    },
    tavily: {
      enabled: config.tavily?.enabled ?? true,
      apiKeyEnv: config.tavily?.apiKeyEnv ?? 'TAVILY_API_KEY',
      keySelection: config.tavily?.keySelection ?? 'round-robin',
      baseURL: config.tavily?.baseURL?.trim() === '' ? undefined : config.tavily?.baseURL,
      maxResults: config.tavily?.maxResults,
    },
    firecrawl: {
      enabled: config.firecrawl?.enabled ?? true,
      apiKeyEnv: config.firecrawl?.apiKeyEnv ?? 'FIRECRAWL_API_KEY',
      keySelection: config.firecrawl?.keySelection ?? 'round-robin',
      baseURL: config.firecrawl?.baseURL?.trim() === '' ? undefined : config.firecrawl?.baseURL,
    },
    exa: {
      enabled: config.exa?.enabled ?? true,
      apiKeyEnv: config.exa?.apiKeyEnv ?? 'EXA_API_KEY',
      keySelection: config.exa?.keySelection ?? 'round-robin',
      baseURL: config.exa?.baseURL?.trim() === '' ? undefined : config.exa?.baseURL,
      numResults: config.exa?.numResults,
    },
    perplexity: {
      enabled: config.perplexity?.enabled ?? true,
      apiKeyEnv: config.perplexity?.apiKeyEnv ?? 'PERPLEXITY_API_KEY',
      keySelection: config.perplexity?.keySelection ?? 'round-robin',
      baseURL: config.perplexity?.baseURL?.trim() === '' ? undefined : config.perplexity?.baseURL,
      model: config.perplexity?.model,
    },
    anysearch: {
      enabled: config.anysearch?.enabled ?? true,
      apiKeyEnv: config.anysearch?.apiKeyEnv ?? 'ANYSEARCH_API_KEY',
      baseURL: config.anysearch?.baseURL?.trim() === '' ? undefined : config.anysearch?.baseURL,
      zone: config.anysearch?.zone,
      keySelection: config.anysearch?.keySelection ?? 'round-robin',
    },
  }
}
