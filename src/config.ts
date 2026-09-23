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
   * Time-based search filter (S17 P1 presets; S22 P3 widened to official combos: `qdr:*`
   * presets, `sbd:1` date sort, `cdr:1,cd_min:MM/DD/YYYY,cd_max:MM/DD/YYYY` custom range,
   * comma-combinable). Validated on both write paths; omitted = no filter. Hot.
   */
  tbs?: string
  /**
   * Free-text geo location for search results (S17 P1, e.g. `San Francisco,California,United
   * States`; city-level granularity — finer than the global country entry; omitted = not sent).
   * The official docs recommend setting it together with a country. Hot.
   */
  location?: string
  /**
   * SafeSearch filter (S22 P3, official boolean): `true` filters explicit content from `web`
   * source results; omitted = not sent (the API default, no filtering). Hot.
   */
  safe?: boolean
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
  /**
   * Publication-date ceiling (S22 P3, symmetric to `startPublishedDate`); date-only stored,
   * normalized to date-time at the provider. `''` clears. Hot.
   */
  endPublishedDate?: string
  /**
   * `contents.text` verbosity (S22 P3, official enum). `standard`/`full` enlarge the returned
   * text (more downstream tokens — billing-relevant, ⓘ-noted in the GUI); absent = API default
   * `compact`, identical to the previous wire. Hot.
   */
  textVerbosity?: 'compact' | 'standard' | 'full' | ''
  /**
   * `contents.text` section filter, comma-separated from the official closed set
   * (header/navigation/banner/sidebar/footer/metadata/body; S22 P3). Requires `maxAgeHours: 0`
   * (fresh crawl) — enforced on both write paths. Hot.
   */
  includeSections?: string
  /** `contents.text` section exclusion filter; same closed set and freshness requirement as {@link includeSections}. Hot. */
  excludeSections?: string
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

/**
 * A volatile handle as the host hands it to `apply` on 0.1.7+ (upstream
 * `Volatile<T>`): reading through `get()` evaluates the field against the
 * live configuration. Structural — no compile-time cordis-version tie.
 */
interface VolatileHandle<T> {
  get(): T
}

/**
 * The configuration shape `apply` receives at runtime. On 0.1.7+ hosts every
 * volatile-marked field (the whole schema, S32/ADR-0021) arrives as a handle;
 * on 0.1.5/0.1.6 hosts the same fields arrive as plain values, so every
 * consumer normalizes through {@link materializeConfig} before resolving.
 */
export type ConfigRuntime = { [K in keyof Config]?: Config[K] | VolatileHandle<Config[K]> }

/**
 * Unwrap a runtime config into the plain {@link Config} shape: handle fields
 * read through `get()` (snapshot at call time), plain fields pass through.
 * Shallow by construction — volatile marks sit exactly on the top-level
 * fields and the five member objects, never deeper.
 * @param runtime - the config object the host handed the plugin.
 * @returns the plain snapshot for one resolve pass.
 */
export function materializeConfig(runtime: ConfigRuntime): Config {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(runtime) as (keyof Config)[]) {
    const value: unknown = runtime[key]
    out[key] = value !== null && typeof value === 'object' && typeof (value as VolatileHandle<unknown>).get === 'function'
      ? (value as VolatileHandle<unknown>).get()
      : value
  }
  return out as Config
}


/**
 * Validation schema the cordis loader applies to the `dsh-websearch` config
 * section. Every editable field is `.volatile()` (S32, ADR-0021): on 0.1.7+
 * hosts that registers the namespace as a live settings form (the whole
 * subtree under a volatile node is form-editable, upstream `volatileForm`);
 * on 0.1.5/0.1.6 hosts the marker is inert metadata and values arrive plain
 * (see {@link ConfigRuntime}).
 */
function buildConfigSchema(markVolatile: boolean): z {
  const vol = (node: z): z => (markVolatile ? node.volatile() : node)
  return z.object({
  searchChain: vol(z.array(z.string())),
  // 'dshws-perplexity' stays as a legacy alias (S19): stored values load, resolveConfig normalizes to 'auto'.
  fallbackMember: vol(z.union(['auto', 'dshws-tavily', 'dshws-exa', 'dshws-perplexity', 'dshws-firecrawl', 'dshws-anysearch', 'dshws-deepseek'])),
  fallbackProvider: vol(z.union(['deepseek', 'none', 'auto', 'fetch'])),
  chainLogFile: vol(z.boolean()),
  fetchTakeover: vol(z.boolean()),
  searchCountry: vol(z.string()),
  searchLanguage: vol(z.string()),
  searchIncludeDomains: vol(z.string()),
  searchExcludeDomains: vol(z.string()),
  fetchChain: vol(z.array(z.string())),
  perMemberTimeoutMs: vol(z.number().step(1).min(1)),
  deepseek: vol(z.object({
    enabled: z.boolean(),
    apiKeyEnv: z.string(),
    baseURL: z.string(),
    model: z.string(),
    maxTokens: z.number().step(1).min(1),
    maxUses: z.number().step(1).min(1),
    keySelection: z.union(['order', 'round-robin', 'random']),
  })),
  tavily: vol(z.object({
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
  })),
  firecrawl: vol(z.object({
    enabled: z.boolean(),
    apiKeyEnv: z.string(),
    baseURL: z.string(),
    tbs: z.string(),
    safe: z.boolean(),
    location: z.string(),
    sources: z.union(['', 'news', 'web+news']),
    categories: z.union(['', 'developer', 'research', 'pdf']),
    keySelection: z.union(['order', 'round-robin', 'random']),
  })),
  exa: vol(z.object({
    enabled: z.boolean(),
    apiKeyEnv: z.string(),
    baseURL: z.string(),
    numResults: z.number().step(1).min(1),
    type: z.union(['instant', 'fast', 'auto', 'deep-lite', 'deep', 'deep-reasoning']),
    textFallback: z.boolean(),
    startPublishedDate: z.string(),
    category: z.union(['', 'company', 'publication', 'news', 'personal site', 'financial report', 'people']),
    maxAgeHours: z.number().step(1).min(-1).max(720),
    endPublishedDate: z.string(),
    textVerbosity: z.union(['', 'compact', 'standard', 'full']),
    includeSections: z.string(),
    excludeSections: z.string(),
    keySelection: z.union(['order', 'round-robin', 'random']),
  })),
  anysearch: vol(z.object({
    enabled: z.boolean(),
    apiKeyEnv: z.string(),
    baseURL: z.string(),
    zone: z.union(['cn', 'intl']),
    keySelection: z.union(['order', 'round-robin', 'random']),
  })),
})
}

/**
 * Validation schema the cordis loader applies to the `dsh-websearch` config
 * section — every editable field volatile-marked (S32, ADR-0021): 0.1.7+
 * hosts register the namespace as a live settings form from these marks and
 * resolve the fields into `Volatile` handles.
 */
export const Config: z = buildConfigSchema(true)

/**
 * The 0.1.5/0.1.6 `installSection` face of the same schema — identical
 * fields with the volatile marks stripped, because a legacy host's settings
 * GUI would serialize a `Volatile` handle as an empty object (ADR-0021).
 */
export const ConfigLegacy: z = buildConfigSchema(false)

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
  /** Time-based search filter (presets + official combos, validated upstream); absent = not sent (S17/S22 P3). */
  tbs?: string
  /** SafeSearch filter; absent = not sent (S22 P3). */
  safe?: boolean
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
  /** Publication-date ceiling; absent = not sent (S22 P3). */
  endPublishedDate?: string
  /** `contents.text` verbosity; absent = not sent = API default compact (S22 P3). */
  textVerbosity?: 'compact' | 'standard' | 'full'
  /** `contents.text` include-section filter; absent = not sent (S22 P3). */
  includeSections?: string
  /** `contents.text` exclude-section filter; absent = not sent (S22 P3). */
  excludeSections?: string
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
 * The Exa section-filter freshness rule (S22 P3): `contents.text` section filters officially
 * require a fresh crawl (`maxAgeHours: 0`; `-1` never-recrawl also bypasses cache). Sections
 * configured while `maxAgeHours` is absent or positive are rejected — dual-path like the ADR-0018
 * domain rule: the settings write path through the installSection validate hook (before persist)
 * and the cordis.yml load path through the `resolveConfig` throw (a watcher throw would otherwise
 * be swallowed into a warn and brick the restart, see {@link validateUnifiedDomainRule}).
 */
const TBS_TOKEN = /^(qdr:[hdwmy]|sbd:1|cdr:1|cd_min:\d{2}\/\d{2}\/\d{4}|cd_max:\d{2}\/\d{2}\/\d{4})$/

/**
 * The Firecrawl `tbs` grammar rule (S22 P3): comma-combined tokens from the official forms —
 * `qdr:*` presets, `sbd:1` date sort, `cdr:1` requiring both `cd_min`/`cd_max` `MM/DD/YYYY`
 * bounds. Anything else is rejected, dual-path like the ADR-0018 domain rule (settings validate
 * hook before persist + resolveConfig throw on load).
 */
export function validateFirecrawlTbsRule(value: Pick<Config, 'firecrawl'>): void {
  const raw = value.firecrawl?.tbs?.trim()
  if (raw === undefined || raw.length === 0) return
  const tokens = raw.split(',').map((token) => token.trim()).filter((token) => token.length > 0)
  if (tokens.length === 0 || tokens.some((token) => !TBS_TOKEN.test(token))) {
    throw new Error(`firecrawl.tbs "${raw}" is not a valid tbs expression — combine qdr:* presets, sbd:1, and cdr:1 with cd_min/cd_max MM/DD/YYYY bounds`)
  }
  const hasCdr = tokens.includes('cdr:1')
  const hasMin = tokens.some((token) => token.startsWith('cd_min:'))
  const hasMax = tokens.some((token) => token.startsWith('cd_max:'))
  // The date-bound tokens exist only inside a cdr custom range; a lone bound
  // without cdr:1 is not an official expression and is rejected with it.
  if (hasCdr && (!hasMin || !hasMax)) {
    throw new Error('firecrawl.tbs cdr:1 requires both cd_min:MM/DD/YYYY and cd_max:MM/DD/YYYY bounds')
  }
  if (!hasCdr && (hasMin || hasMax)) {
    throw new Error('firecrawl.tbs cd_min/cd_max bounds are only valid together with cdr:1')
  }
}

export function validateExaSectionFilterRule(value: Pick<Config, 'exa'>): void {
  const exa = value.exa
  if (exa === undefined) return
  const sectionsConfigured = (exa.includeSections?.trim().length ?? 0) > 0 || (exa.excludeSections?.trim().length ?? 0) > 0
  const freshness = exa.maxAgeHours
  if (sectionsConfigured && (freshness === undefined || freshness > 0)) {
    throw new Error('exa.includeSections/excludeSections require exa.maxAgeHours = 0 (fresh crawl) or -1 (never recrawl) — official constraint')
  }
}

/**
 * Apply every default explicitly: empty chains become the built-in member
 * order, a missing timeout budget becomes 30s, and each member section gets
 * `enabled: true` plus its credential-ref env name. Provider-specific option
 * defaults (base URLs, models, result counts) stay with the provider
 * implementations (S04/S05a); their values pass through untouched. Input is
 * normalized through {@link materializeConfig} first, so plain configs and
 * 0.1.7+ handle-wrapped runtime configs resolve identically (ADR-0021).
 */
export function resolveConfig(config: Config | ConfigRuntime): ResolvedWebSearchConfig {
  const plain = materializeConfig(config)
  validateUnifiedDomainRule(plain)
  validateExaSectionFilterRule(plain)
  validateFirecrawlTbsRule(plain)
  const fallbackMember: FallbackMember = plain.fallbackMember === 'dshws-perplexity'
    // S19 legacy alias: the removed member's designation degrades to auto.
    ? 'auto'
    : plain.fallbackMember !== undefined
      ? plain.fallbackMember
      // Legacy alias (ADR-0014): 'deepseek' names the paid floor; 'none',
      // 'auto', and the deleted 'fetch' free floor all mean the chain-order tail.
      : (plain.fallbackProvider === 'deepseek' ? DEEPSEEK_FALLBACK_MEMBER_ID : 'auto')
  return {
    searchChain: withDesignatedFallback(
      plain.searchChain?.length ? [...plain.searchChain] : ORDERABLE_SEARCH_MEMBER_ORDER,
      fallbackMember,
    ),
    fallbackMember,
    fetchTakeover: plain.fetchTakeover ?? true,
    // ADR-0015 canonical forms: country uppercase, language lowercase; blank drops.
    searchCountry: plain.searchCountry?.trim().length ? plain.searchCountry.trim().toUpperCase() : undefined,
    searchLanguage: plain.searchLanguage?.trim().length ? plain.searchLanguage.trim().toLowerCase() : undefined,
    searchIncludeDomains: splitDomainList(plain.searchIncludeDomains),
    searchExcludeDomains: splitDomainList(plain.searchExcludeDomains),
    fetchChain: plain.fetchChain?.length
      ? [...plain.fetchChain].filter((id) => id !== DEEPSEEK_FALLBACK_MEMBER_ID)
      : [...FETCH_CHAIN_DEFAULT_ORDER],
    perMemberTimeoutMs: plain.perMemberTimeoutMs ?? DEFAULT_PER_MEMBER_TIMEOUT_MS,
    deepseek: {
      // S14d (user ruling): the paid fallback is OPT-IN — default off keeps the
      // install at zero paid reach until the user chooses it in the settings.
      enabled: plain.deepseek?.enabled ?? false,
      apiKeyEnv: plain.deepseek?.apiKeyEnv ?? 'DEEPSEEK_API_KEY',
      keySelection: plain.deepseek?.keySelection ?? 'round-robin',
      baseURL: plain.deepseek?.baseURL?.trim() === '' ? undefined : plain.deepseek?.baseURL,
      model: plain.deepseek?.model,
      maxTokens: plain.deepseek?.maxTokens,
      maxUses: plain.deepseek?.maxUses,
    },
    tavily: {
      enabled: plain.tavily?.enabled ?? true,
      apiKeyEnv: plain.tavily?.apiKeyEnv ?? 'TAVILY_API_KEY',
      keySelection: plain.tavily?.keySelection ?? 'round-robin',
      baseURL: plain.tavily?.baseURL?.trim() === '' ? undefined : plain.tavily?.baseURL,
      maxResults: plain.tavily?.maxResults,
      topic: plain.tavily?.topic || undefined,
      timeRange: plain.tavily?.timeRange || undefined,
      searchDepth: plain.tavily?.searchDepth || undefined,
      // S17 D4: the free generated answer is ON at the basic tier by default.
      includeAnswer: plain.tavily?.includeAnswer ?? 'basic',
      chunksPerSource: plain.tavily?.chunksPerSource,
      filterByLanguage: plain.tavily?.filterByLanguage,
      startDate: plain.tavily?.startDate?.trim().length ? plain.tavily.startDate.trim() : undefined,
      endDate: plain.tavily?.endDate?.trim().length ? plain.tavily.endDate.trim() : undefined,
      exactMatch: plain.tavily?.exactMatch,
      includeDomainsMode: plain.tavily?.includeDomainsMode,
    },
    firecrawl: {
      enabled: plain.firecrawl?.enabled ?? true,
      apiKeyEnv: plain.firecrawl?.apiKeyEnv ?? 'FIRECRAWL_API_KEY',
      keySelection: plain.firecrawl?.keySelection ?? 'round-robin',
      baseURL: plain.firecrawl?.baseURL?.trim() === '' ? undefined : plain.firecrawl?.baseURL,
      tbs: plain.firecrawl?.tbs?.trim().length ? plain.firecrawl.tbs.trim() : undefined,
      safe: plain.firecrawl?.safe,
      sources: plain.firecrawl?.sources || undefined,
      categories: plain.firecrawl?.categories || undefined,
      location: plain.firecrawl?.location?.trim() === '' ? undefined : plain.firecrawl?.location,
    },
    exa: {
      enabled: plain.exa?.enabled ?? true,
      apiKeyEnv: plain.exa?.apiKeyEnv ?? 'EXA_API_KEY',
      keySelection: plain.exa?.keySelection ?? 'round-robin',
      baseURL: plain.exa?.baseURL?.trim() === '' ? undefined : plain.exa?.baseURL,
      numResults: plain.exa?.numResults,
      type: plain.exa?.type,
      // S17 D4: text fallback is ON by default — it fixes dropped results.
      textFallback: plain.exa?.textFallback ?? true,
      startPublishedDate: plain.exa?.startPublishedDate?.trim().length ? plain.exa.startPublishedDate.trim() : undefined,
      category: plain.exa?.category || undefined,
      maxAgeHours: plain.exa?.maxAgeHours,
      endPublishedDate: plain.exa?.endPublishedDate?.trim().length ? plain.exa.endPublishedDate.trim() : undefined,
      textVerbosity: plain.exa?.textVerbosity || undefined,
      includeSections: plain.exa?.includeSections?.trim().length ? plain.exa.includeSections.trim() : undefined,
      excludeSections: plain.exa?.excludeSections?.trim().length ? plain.exa.excludeSections.trim() : undefined,
    },
    anysearch: {
      enabled: plain.anysearch?.enabled ?? true,
      apiKeyEnv: plain.anysearch?.apiKeyEnv ?? 'ANYSEARCH_API_KEY',
      baseURL: plain.anysearch?.baseURL?.trim() === '' ? undefined : plain.anysearch?.baseURL,
      zone: plain.anysearch?.zone,
      keySelection: plain.anysearch?.keySelection ?? 'round-robin',
    },
  }
}
