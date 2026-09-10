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
  'dshws-firecrawl',
  'dshws-anysearch',
]

/**
 * The DeepSeek member id — the paid fallback candidate (ADR-0014). It is not
 * orderable and joins the chain only when designated AND eligible (see the
 * participation guard in src/index.ts: at most one ready tool member).
 */
export const DEEPSEEK_FALLBACK_MEMBER_ID = 'dshws-deepseek'

/**
 * The designated fallback role (ADR-0014): `'auto'` (default — the last
 * position of the chain order IS the fallback), one of the five tool member
 * ids (pinned tail, stripped from the normal rotation), or the paid DeepSeek
 * floor (participation is runtime-guarded, never static).
 */
export type FallbackMember =
  | 'auto'
  | 'dshws-tavily'
  | 'dshws-exa'
  | 'dshws-firecrawl'
  | 'dshws-anysearch'
  | typeof DEEPSEEK_FALLBACK_MEMBER_ID

/**
 * Legacy fallbackMember value naming the REMOVED `dshws-perplexity` member
 * (S19, ADR-0017): kept in the input schema so stored sections still load;
 * `resolveConfig` normalizes it to `'auto'` (degrading to the chain-order tail,
 * the same intent the dead member held as a designated tool fallback).
 */
export type LegacyFallbackMember = 'dshws-perplexity'

/**
 * Legacy pre-0.2 fallback field values (ADR-0014): kept in the input schema so
 * stored sections from older versions still load; `resolveConfig` normalizes
 * them into {@link FallbackMember} ('deepseek' names the paid floor, the rest
 * — including the deleted free floor — mean 'auto'). The GUI never writes it.
 */
export type LegacyFallbackProvider = 'deepseek' | 'none' | 'auto' | 'fetch'

/**
 * Effective built-in search order (ADR-0014): the orderable five only — the
 * chain's last ready member is the fallback; no member is appended by default.
 */
export const BUILT_IN_MEMBER_ORDER: readonly string[] = [...ORDERABLE_SEARCH_MEMBER_ORDER]

/**
 * Effective built-in fetch order (S21, ADR-0019): the fetch-capable members
 * only — Exa has no upstream URL-fetch capability and never joins this chain.
 */
export const FETCH_CHAIN_DEFAULT_ORDER: readonly string[] = [
  'dshws-firecrawl',
  'dshws-tavily',
  'dshws-anysearch',
]

/**
 * Compose the search chain for the designated fallback (ADR-0014): a
 * designated TOOL member is stripped from the orderable span and pinned at
 * the tail — its only role is fallback. `'auto'` keeps the span as ordered;
 * designating DeepSeek does NOT statically append it — its participation is
 * a runtime eligibility rule (order getter in src/index.ts), so the static
 * layer yields the span and the guard appends when eligible.
 */
export function withDesignatedFallback(chain: readonly string[], fallbackMember: FallbackMember): string[] {
  // Dead ids from older formats never reach the chain: pre-S14c pinned orders
  // naming the deepseek tail, and the deleted free member ('dshws-fetch-search',
  // never orderable but a pinned order could name it via fallbackProvider: 'fetch').
  const span = chain.filter((id) => id !== DEEPSEEK_FALLBACK_MEMBER_ID && id !== 'dshws-fetch-search')
  if (fallbackMember === 'auto' || fallbackMember === DEEPSEEK_FALLBACK_MEMBER_ID) return span
  return [...span.filter((id) => id !== fallbackMember), fallbackMember]
}

/** Per-member timeout budget applied when the config omits one (ADR-0002). */
export const DEFAULT_PER_MEMBER_TIMEOUT_MS = 30000

/** How one member picks a key from its pool each search (ADR-0008). */
export type KeySelection = 'order' | 'round-robin' | 'random'

/** DeepSeek member settings (`dshws-deepseek`). */
export interface DeepSeekSettings {
  /**
   * Client-facing switch, `false` unless set. Since ADR-0014 this flag no
   * longer governs chain membership — the fallback role is named solely by
   * `fallbackMember` — it only feeds the settings-page snapshot.
   */
  enabled?: boolean
  /** Credential-ref env name resolved through the credentials service. Defaults to `DEEPSEEK_API_KEY`. */
  apiKeyEnv?: string
  /** API endpoint base; provider default applies when omitted (S04). Hot: a settings change applies to the next search (S17 D1). */
  baseURL?: string
  /** Chat model powering the web_search server tool; provider default applies when omitted (S04). Hot: a settings change applies to the next search (S17 D1). */
  model?: string
  /** Response token cap; provider default applies when omitted (S04). Hot: a settings change applies to the next search (S17 D1). */
  maxTokens?: number
  /**
   * Server-tool search budget per request (S14c, host parity — the host
   * `web-search-deepseek` knob of the same name/semantic/default). Hot (S17 D1).
   */
  maxUses?: number
  /** Pool selection policy; defaults to `round-robin` (ADR-0011). Hot: settings changes apply to the next search. */
  keySelection?: KeySelection
}

/** Tavily member settings (`dshws-tavily`). */
export interface TavilySettings {
  /** Defaults to `true`. Hot: settings changes apply to the next search. */
  enabled?: boolean
  /** Defaults to `TAVILY_API_KEY`. Hot: a settings change applies to the next search (S17 D1; keys are configured through the credentials service, not this field). */
  apiKeyEnv?: string
  /** API endpoint base; provider default applies when omitted (S04). Hot: a settings change applies to the next search (S17 D1). */
  baseURL?: string
  /** Default result count; provider default applies when omitted (S04). Hot: a settings change applies to the next search (S17 D1). */
  maxResults?: number
  /**
   * Search category (S17 P1, official 3-value enum): `general` (default — omitted = not sent),
   * `news` (carries `published_date`), `finance`. Hot.
   */
  topic?: 'general' | 'news' | 'finance' | ''
  /** Publication-recency filter (S17 P1, official enum; omitted = not sent). Hot. */
  timeRange?: 'day' | 'week' | 'month' | 'year' | ''
  /**
   * Search depth tier (S17 P1, official 4-value enum; omitted = `basic` API default). `advanced`
   * costs 2 credits per search, the rest 1. Hot.
   */
  searchDepth?: 'basic' | 'advanced' | 'fast' | 'ultra-fast' | ''
  /**
   * Generated-answer tier (S17 P1; the boolean form evolved into the `basic`/`advanced` enum).
   * Defaults to `'basic'` — the answer is free per the official docs and becomes the result's
   * `content` (D4). Hot.
   */
  includeAnswer?: 'basic' | 'advanced'
  /**
   * Content chunks per source (S20 P2, 1-3; omitted = API default 3). Suppressed at the wire when
   * `searchDepth` is `ultra-fast` (that depth ignores the parameter). Hot.
   */
  chunksPerSource?: number
  /**
   * Hard language filter (S20 P2; default false = language stays a ranking boost). Only sent when
   * the unified `searchLanguage` is set — the API 400s on the bare flag (official constraint). Hot.
   */
  filterByLanguage?: boolean
  /**
   * Include-list semantics (S20 P2): `filter` (default) or `boost` (weight, still searches the whole
   * web). Only sent when the unified include-domain list is non-empty. Hot.
   */
  includeDomainsMode?: 'filter' | 'boost'
  /**
   * Publication-date window lower bound, `YYYY-MM-DD` (S22 P3; orthogonal to `timeRange`'s relative
   * windows). `''` clears. Hot.
   */
  startDate?: string
  /** Publication-date window upper bound, `YYYY-MM-DD` (S22 P3). `''` clears. Hot. */
  endDate?: string
  /**
   * Only return results containing the exact quoted phrase(s) of the query, bypassing synonym
   * expansion (S22 P3; a pure result filter, no credit note in the official spec). Hot.
   */
  exactMatch?: boolean
  /** Pool selection policy; defaults to `round-robin` (ADR-0011). Hot: settings changes apply to the next search. */
  keySelection?: KeySelection
}

/** Firecrawl member settings (`dshws-firecrawl`). */
export interface FirecrawlSettings {
  /** Defaults to `true`. Hot: settings changes apply to the next search. */
  enabled?: boolean
  /** Defaults to `FIRECRAWL_API_KEY`. Hot: a settings change applies to the next search (S17 D1; keys are configured through the credentials service, not this field). */
  apiKeyEnv?: string
  /** API endpoint base; provider default applies when omitted (S05a). Hot: a settings change applies to the next search (S17 D1). */
  baseURL?: string
  /**
   * Time-based search filter (S17 P1, Google-style `tbs` presets; omitted = no filter). Hot.
   */
  tbs?: 'qdr:h' | 'qdr:d' | 'qdr:w' | 'qdr:m' | 'qdr:y' | ''
  /**
   * Free-text geo location for search results (S17 P1, e.g. `San Francisco,California,United
   * States`; city-level granularity — finer than the global country entry; omitted = not sent).
   * The official docs recommend setting it together with a country. Hot.
   */
  location?: string
  /**
   * Result sources (S20 P2; `''` = clear, omitted = not sent, API default web-only): `news` adds
   * the native time-sorted news feed (the only bundled member with one), `web+news` requests both —
   * `limit` applies PER SOURCE there (up to 2× results). Hot.
   */
  sources?: 'news' | 'web+news' | ''
  /**
   * Result category (S20 P2, official enum; `''` = clear): `developer`/`research` target docs and
   * papers for coding-agent queries. Hot.
   */
  categories?: 'developer' | 'research' | 'pdf' | ''
  /** Pool selection policy; defaults to `round-robin` (ADR-0011). Hot: settings changes apply to the next search. */
  keySelection?: KeySelection
}

/** Exa member settings (`dshws-exa`). */
export interface ExaSettings {
  /** Defaults to `true`. Hot: settings changes apply to the next search. */
  enabled?: boolean
  /** Defaults to `EXA_API_KEY`. Hot: a settings change applies to the next search (S17 D1; keys are configured through the credentials service, not this field). */
  apiKeyEnv?: string
  /** API endpoint base; provider default applies when omitted (S05a). Hot: a settings change applies to the next search (S17 D1). */
  baseURL?: string
  /** Default result count; provider default applies when omitted (S05a). Hot: a settings change applies to the next search (S17 D1). */
  numResults?: number
  /**
   * Search type (S17 P1): the current official 6-value enum — `keyword`/`neural` were removed
   * upstream. Defaults to `'auto'` (the provider constant). Hot.
   */
  type?: 'instant' | 'fast' | 'auto' | 'deep-lite' | 'deep' | 'deep-reasoning'
  /**
   * Text fallback (S17 P1, D4 default `true`): also request `contents.text` so a result without
   * highlights keeps a full-text excerpt as its snippet instead of being dropped. Hot.
   */
  textFallback?: boolean
  /**
   * Publication-date floor (S17 P1): only results published after this date. Stored as
   * `YYYY-MM-DD` (the GUI date input) or a full ISO date-time; the provider normalizes date-only
   * values to the date-time form the API expects. Hot.
   */
  startPublishedDate?: string
  /**
   * Vertical category (S20 P2, official 6-value enum; `''` = clear). `company`/`people` disable the
   * date floor and exclude-domain fan-out at the wire (official 400 combos). Hot.
   */
  category?: 'company' | 'publication' | 'news' | 'personal site' | 'financial report' | 'people' | ''
  /**
   * Content cache freshness (S20 P2, -1..720 hours; omitted = not sent). The current official name —
   * the old `livecrawl`/`crawlingOptions` are deprecated. Hot.
   */
  maxAgeHours?: number
  /** Pool selection policy; defaults to `round-robin` (ADR-0011). Hot: settings changes apply to the next search. */
  keySelection?: KeySelection
}


/** Anysearch member settings (`dshws-anysearch`, ADR-0009). */
export interface AnysearchSettings {
  /** Defaults to `true`. Hot: settings changes apply to the next search. */
  enabled?: boolean
  /** Defaults to `ANYSEARCH_API_KEY`. Hot: a settings change applies to the next search (S17 D1; keys are configured through the credentials service, not this field). */
  apiKeyEnv?: string
  /** API endpoint base; provider default applies when omitted. Hot: a settings change applies to the next search (S17 D1). */
  baseURL?: string
  /** Regional zone passed through to the request body; omitted = not sent. Hot (S17 D1). */
  zone?: 'cn' | 'intl'
  /** Pool selection policy; defaults to `round-robin` (ADR-0011). Hot: settings changes apply to the next search. */
  keySelection?: KeySelection
}

/**
 * The unified fan-out context (S17 P1 ADR-0015 geo entry + S20 P1 ADR-0018
 * domain entry): single write points fanned out to each member's native wire
 * parameters. Country is an ISO 3166-1 alpha-2 code, language an ISO 639-1
 * code; both normalize (country uppercase, language lowercase) and blank means
 * "not sent". The domain lists arrive pre-split (resolveConfig owns the
 * comma-string parsing and the include-vs-exclude exclusivity rule).
 */
export interface UnifiedSearchFanout {
  readonly country?: string
  readonly language?: string
  readonly includeDomains?: readonly string[]
  readonly excludeDomains?: readonly string[]
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
   * The designated fallback (ADR-0014): `'auto'` (default — chain-order last
   * position), a tool member id (pinned tail), or `'dshws-deepseek'` (paid
   * floor; joins only when at most one tool member is ready and its key is
   * configured). Hot: settings changes apply to the next search.
   */
  fallbackMember?: FallbackMember | LegacyFallbackMember
  /**
   * @deprecated Legacy pre-0.2 alias (ADR-0014), read-only: normalized into
   * {@link fallbackMember} at resolve time; the GUI never writes it. Kept in
   * the schema so stored sections from older versions still load.
   */
  fallbackProvider?: LegacyFallbackProvider
  /**
   * Append the chain trace (draws with key tails, rotation, degradation,
   * served-by) to `<dshHome>/logs/dsh-websearch.log` (S14z). Default true;
   * best-effort — a failing append disables the sink, never the chain.
   */
  chainLogFile?: boolean
  /**
   * Universal web_fetch takeover (S15c): true = the web_fetch tool is
   * hidden from every agent's tool list and prompt via the official
   * `tools.restrict()` API (zero errors, zero guidance); false = web_fetch
   * is visible and functional. Default true.
   * Hot: applies to the next agent created after the settings commit.
   */
  fetchTakeover?: boolean
  /**
   * Unified search region (S17 P1, ADR-0015): an ISO 3166-1 alpha-2 code (e.g. `CN`) fanned
   * out to the members whose native APIs accept a region — Exa `userLocation` and Firecrawl
   * `country` (Tavily is excluded in v1:
   * its `country` expects country-name strings; ISO-code compatibility is unverified). Blank =
   * not sent. Hot: the next search.
   */
  searchCountry?: string
  /**
   * Unified search language (S17 P1, ADR-0015): an ISO 639-1 code (e.g. `zh`) fanned out to
   * the members with a search-level language parameter — Tavily `language`. Blank = not sent. Hot: the next search.
   */
  searchLanguage?: string
  /**
   * Unified include-domain allowlist (S20 P1, ADR-0018): comma-separated domains fanned out to
   * Tavily/Exa/Firecrawl (with each member's format guards). Mutually exclusive with
   * {@link searchExcludeDomains} — a state setting both fails loud (settings path: validate hook
   * rejects before persist; cordis.yml path: load error). Blank = not sent. Hot: the next search.
   */
  searchIncludeDomains?: string
  /**
   * Unified exclude-domain blocklist (S20 P1, ADR-0018): comma-separated domains fanned out to
   * Tavily/Exa/Firecrawl. Mutually exclusive with {@link searchIncludeDomains}. Blank = not sent.
   * Hot: the next search.
   */
  searchExcludeDomains?: string
  /** DeepSeek member settings. */
  deepseek?: DeepSeekSettings
  /** Tavily member settings. */
  tavily?: TavilySettings
  /** Firecrawl member settings. */
  firecrawl?: FirecrawlSettings
  /** Exa member settings. */
  exa?: ExaSettings
  /** Anysearch member settings (ADR-0009). */
  anysearch?: AnysearchSettings
}

/** Validation schema the cordis loader applies to the `dsh-websearch` config section. */
export const Config: z<Config> = z.object({
  searchChain: z.array(z.string()),
  // 'dshws-perplexity' stays as a legacy alias (S19): stored values load, resolveConfig normalizes to 'auto'.
  fallbackMember: z.union(['auto', 'dshws-tavily', 'dshws-exa', 'dshws-perplexity', 'dshws-firecrawl', 'dshws-anysearch', 'dshws-deepseek']),
  fallbackProvider: z.union(['deepseek', 'none', 'auto', 'fetch']),
  chainLogFile: z.boolean(),
  fetchTakeover: z.boolean(),
  searchCountry: z.string(),
  searchLanguage: z.string(),
  searchIncludeDomains: z.string(),
  searchExcludeDomains: z.string(),
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
    topic: z.union(['', 'general', 'news', 'finance']),
    timeRange: z.union(['', 'day', 'week', 'month', 'year']),
    searchDepth: z.union(['', 'basic', 'advanced', 'fast', 'ultra-fast']),
    includeAnswer: z.union(['basic', 'advanced']),
    chunksPerSource: z.number().step(1).min(1).max(3),
    filterByLanguage: z.boolean(),
    includeDomainsMode: z.union(['filter', 'boost']),
    startDate: z.string(),
    endDate: z.string(),
    exactMatch: z.boolean(),
    keySelection: z.union(['order', 'round-robin', 'random']),
  }),
  firecrawl: z.object({
    enabled: z.boolean(),
    apiKeyEnv: z.string(),
    baseURL: z.string(),
    tbs: z.union(['', 'qdr:h', 'qdr:d', 'qdr:w', 'qdr:m', 'qdr:y']),
    location: z.string(),
    sources: z.union(['', 'news', 'web+news']),
    categories: z.union(['', 'developer', 'research', 'pdf']),
    keySelection: z.union(['order', 'round-robin', 'random']),
  }),
  exa: z.object({
    enabled: z.boolean(),
    apiKeyEnv: z.string(),
    baseURL: z.string(),
    numResults: z.number().step(1).min(1),
    type: z.union(['instant', 'fast', 'auto', 'deep-lite', 'deep', 'deep-reasoning']),
    textFallback: z.boolean(),
    startPublishedDate: z.string(),
    category: z.union(['', 'company', 'publication', 'news', 'personal site', 'financial report', 'people']),
    maxAgeHours: z.number().step(1).min(-1).max(720),
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
  /** Search category; absent = not sent (S17 P1). */
  topic?: 'general' | 'news' | 'finance'
  /** Publication-recency filter; absent = not sent (S17 P1). */
  timeRange?: 'day' | 'week' | 'month' | 'year'
  /** Search depth tier; absent = API default `basic` (S17 P1). */
  searchDepth?: 'basic' | 'advanced' | 'fast' | 'ultra-fast'
  /** Generated-answer tier; resolveConfig defaults `'basic'` (S17 P1, D4). */
  includeAnswer?: 'basic' | 'advanced'
  /** Content chunks per source; absent = not sent (S20 P2). */
  chunksPerSource?: number
  /** Hard language filter; absent = not sent (S20 P2). */
  filterByLanguage?: boolean
  /** Include-list semantics; absent = not sent (S20 P2). */
  includeDomainsMode?: 'filter' | 'boost'
  /** Publication-date window lower bound (`YYYY-MM-DD`); absent = not sent (S22 P3). */
  startDate?: string
  /** Publication-date window upper bound; absent = not sent (S22 P3). */
  endDate?: string
  /** Exact quoted-phrase filter; absent = not sent (S22 P3). */
  exactMatch?: boolean
  /** Pool selection policy; resolveConfig defaults to 'round-robin' (ADR-0011). */
  keySelection?: KeySelection
}

/** Fully defaulted settings for one member. */
export interface FirecrawlMemberConfig extends Required<Pick<FirecrawlSettings, 'enabled' | 'apiKeyEnv'>> {
  baseURL?: string
  /** Time-based search filter; absent = not sent (S17 P1). */
  tbs?: 'qdr:h' | 'qdr:d' | 'qdr:w' | 'qdr:m' | 'qdr:y'
  /** Free-text geo location; absent = not sent (S17 P1). */
  location?: string
  /** Result sources; `''` normalizes away at resolve (S20 P2). */
  sources?: 'news' | 'web+news' | ''
  /** Result category; `''` normalizes away at resolve (S20 P2). */
  categories?: 'developer' | 'research' | 'pdf' | ''
  /** Pool selection policy; resolveConfig defaults to 'round-robin' (ADR-0011). */
  keySelection?: KeySelection
}

/** Fully defaulted settings for one member. */
export interface ExaMemberConfig extends Required<Pick<ExaSettings, 'enabled' | 'apiKeyEnv'>> {
  baseURL?: string
  numResults?: number
  /** Search type; absent = provider default `'auto'` (S17 P1). */
  type?: 'instant' | 'fast' | 'auto' | 'deep-lite' | 'deep' | 'deep-reasoning'
  /** Text fallback; resolveConfig defaults `true` (S17 P1, D4). */
  textFallback?: boolean
  /** Publication-date floor; absent = not sent (S17 P1). */
  startPublishedDate?: string
  /** Vertical category; `''` normalizes away at resolve (S20 P2). */
  category?: 'company' | 'publication' | 'news' | 'personal site' | 'financial report' | 'people' | ''
  /** Content cache freshness; absent = not sent (S20 P2). */
  maxAgeHours?: number
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

/** Fully defaulted plugin configuration; the chain providers consume this, not the raw `Config`. */
export interface ResolvedWebSearchConfig {
  /** Canonical designated fallback (legacy `fallbackProvider` normalized away; ADR-0014). */
  readonly fallbackMember: FallbackMember
  /** Universal web_fetch takeover toggle, resolved default true (S15a). */
  readonly fetchTakeover: boolean
  /** Unified search region (ISO 3166-1 alpha-2, uppercase); absent = not sent (S17 P1, ADR-0015). */
  readonly searchCountry?: string
  /** Unified search language (ISO 639-1, lowercase); absent = not sent (S17 P1, ADR-0015). */
  readonly searchLanguage?: string
  /** Unified include-domain allowlist, pre-split; empty = not sent (S20 P1, ADR-0018). */
  readonly searchIncludeDomains: readonly string[]
  /** Unified exclude-domain blocklist, pre-split; empty = not sent (S20 P1, ADR-0018). */
  readonly searchExcludeDomains: readonly string[]
  /** Search priority chain; never empty after resolution. */
  readonly searchChain: readonly string[]
  /** Fetch priority chain; never empty after resolution. */
  readonly fetchChain: readonly string[]
  /** Timeout budget per member per call, in milliseconds. */
  readonly perMemberTimeoutMs: number
  readonly deepseek: DeepSeekMemberConfig
  readonly tavily: TavilyMemberConfig
  readonly firecrawl: FirecrawlMemberConfig
  readonly exa: ExaMemberConfig
  readonly anysearch: AnysearchMemberConfig
}

/** Split a comma-separated domain list into trimmed non-blank entries. */
function splitDomainList(value: string | undefined): readonly string[] {
  if (value === undefined) return []
  return value.split(',').map((entry) => entry.trim()).filter((entry) => entry.length > 0)
}

/**
 * The include-vs-exclude exclusivity rule (ADR-0018): both lists set at once is
 * rejected — on the settings path through the installSection validate hook
 * (before persist, error surfaced to the committer) and on the cordis.yml load
 * path through this throw. A resolveConfig throw must NOT be relied on for the
 * settings path: the host swallows watcher throws into a warn, persisting the
 * invalid value and bricking the plugin on restart (S20 stage-2 M-1 evidence).
 */
export function validateUnifiedDomainRule(value: Pick<Config, 'searchIncludeDomains' | 'searchExcludeDomains'>): void {
  if (value.searchIncludeDomains?.trim().length && value.searchExcludeDomains?.trim().length) {
    throw new Error('searchIncludeDomains and searchExcludeDomains are mutually exclusive — set only one (ADR-0018)')
  }
}

/**
 * Apply every default explicitly: empty chains become the built-in member
 * order, a missing timeout budget becomes 30s, and each member section gets
 * `enabled: true` plus its credential-ref env name. Provider-specific option
 * defaults (base URLs, models, result counts) stay with the provider
 * implementations (S04/S05a); their values pass through untouched.
 */
export function resolveConfig(config: Config): ResolvedWebSearchConfig {
  validateUnifiedDomainRule(config)
  const fallbackMember: FallbackMember = config.fallbackMember === 'dshws-perplexity'
    // S19 legacy alias: the removed member's designation degrades to auto.
    ? 'auto'
    : config.fallbackMember !== undefined
      ? config.fallbackMember
      // Legacy alias (ADR-0014): 'deepseek' names the paid floor; 'none',
      // 'auto', and the deleted 'fetch' free floor all mean the chain-order tail.
      : (config.fallbackProvider === 'deepseek' ? DEEPSEEK_FALLBACK_MEMBER_ID : 'auto')
  return {
    searchChain: withDesignatedFallback(
      config.searchChain?.length ? [...config.searchChain] : ORDERABLE_SEARCH_MEMBER_ORDER,
      fallbackMember,
    ),
    fallbackMember,
    fetchTakeover: config.fetchTakeover ?? true,
    // ADR-0015 canonical forms: country uppercase, language lowercase; blank drops.
    searchCountry: config.searchCountry?.trim().length ? config.searchCountry.trim().toUpperCase() : undefined,
    searchLanguage: config.searchLanguage?.trim().length ? config.searchLanguage.trim().toLowerCase() : undefined,
    searchIncludeDomains: splitDomainList(config.searchIncludeDomains),
    searchExcludeDomains: splitDomainList(config.searchExcludeDomains),
    fetchChain: config.fetchChain?.length
      ? [...config.fetchChain].filter((id) => id !== DEEPSEEK_FALLBACK_MEMBER_ID)
      : [...FETCH_CHAIN_DEFAULT_ORDER],
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
      topic: config.tavily?.topic || undefined,
      timeRange: config.tavily?.timeRange || undefined,
      searchDepth: config.tavily?.searchDepth || undefined,
      // S17 D4: the free generated answer is ON at the basic tier by default.
      includeAnswer: config.tavily?.includeAnswer ?? 'basic',
      chunksPerSource: config.tavily?.chunksPerSource,
      filterByLanguage: config.tavily?.filterByLanguage,
      startDate: config.tavily?.startDate?.trim().length ? config.tavily.startDate.trim() : undefined,
      endDate: config.tavily?.endDate?.trim().length ? config.tavily.endDate.trim() : undefined,
      exactMatch: config.tavily?.exactMatch,
      includeDomainsMode: config.tavily?.includeDomainsMode,
    },
    firecrawl: {
      enabled: config.firecrawl?.enabled ?? true,
      apiKeyEnv: config.firecrawl?.apiKeyEnv ?? 'FIRECRAWL_API_KEY',
      keySelection: config.firecrawl?.keySelection ?? 'round-robin',
      baseURL: config.firecrawl?.baseURL?.trim() === '' ? undefined : config.firecrawl?.baseURL,
      tbs: config.firecrawl?.tbs || undefined,
      sources: config.firecrawl?.sources || undefined,
      categories: config.firecrawl?.categories || undefined,
      location: config.firecrawl?.location?.trim() === '' ? undefined : config.firecrawl?.location,
    },
    exa: {
      enabled: config.exa?.enabled ?? true,
      apiKeyEnv: config.exa?.apiKeyEnv ?? 'EXA_API_KEY',
      keySelection: config.exa?.keySelection ?? 'round-robin',
      baseURL: config.exa?.baseURL?.trim() === '' ? undefined : config.exa?.baseURL,
      numResults: config.exa?.numResults,
      type: config.exa?.type,
      // S17 D4: text fallback is ON by default — it fixes dropped results.
      textFallback: config.exa?.textFallback ?? true,
      startPublishedDate: config.exa?.startPublishedDate?.trim().length ? config.exa.startPublishedDate.trim() : undefined,
      category: config.exa?.category || undefined,
      maxAgeHours: config.exa?.maxAgeHours,
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
