/**
 * Client-side controller for the web-search settings section (S06). It reads
 * the section through the settings remote, maps per-member credential facts
 * onto cards, and applies user actions (key write/clear, enable toggle) back
 * through the same remotes. All host access goes through the narrow
 * {@link WebSearchSettingsPorts} face: tests run against a fake remote and the
 * entry wires the real `ctx.remote` namespaces in one adapter.
 *
 * Client-side defaulting mirrors the node half's `resolveConfig` (built-in
 * member order, 30s timeout, per-member default refs, `enabled: true` with
 * the deepseek fallback's client-facing flag defaulting to `false`) because
 * the described section value only carries user-set fields. Member ids and
 * default ref names are spelled here rather than imported: a client bundle
 * must not depend on host packages at value level (upstream WebSearchCard NS
 * precedent).
 *
 * @module dsh-websearch/client/controller
 */
import type { CredentialInfo } from '@deepseek-ai/dsh-credentials'
import type { SettingsDescribeValue, SettingsNamespaceView } from '@deepseek-ai/dsh-settings/types'
import { NS } from './locales.ts'

/** Structural subset of the host `RemoteResult` the controller branches on. */
type RemoteResult<T> = { ok: true; value: T } | { ok: false; error: unknown }

/** Narrow remote face the controller consumes; the entry adapters `ctx.remote` onto this. */
export interface WebSearchSettingsPorts {
  describeSettings(): Promise<RemoteResult<SettingsDescribeValue>>
  updateSettings(
    ns: string,
    patch: Record<string, unknown>,
    expectedRevision: number | undefined,
  ): Promise<RemoteResult<SettingsNamespaceView>>
  describeCredentials(refs: readonly string[]): Promise<RemoteResult<Record<string, CredentialInfo>>>
  setCredential(ref: string, value: string): Promise<RemoteResult<void>>
  unsetCredential(ref: string): Promise<RemoteResult<void>>
  onReferenceUpdated(handler: (ref: string) => void): () => void
}

/** Bundled member display metadata; ids, default refs, and the documented
 * default endpoints mirror the node-half provider constants (the endpoint is
 * the GUI placeholder for the「接口地址」field, S14p). */
export const MEMBERS = [
  { key: 'tavily', label: 'Tavily', memberId: 'dshws-tavily', defaultRef: 'TAVILY_API_KEY', defaultBaseURL: 'https://api.tavily.com' },
  { key: 'exa', label: 'Exa', memberId: 'dshws-exa', defaultRef: 'EXA_API_KEY', defaultBaseURL: 'https://api.exa.ai' },
  { key: 'firecrawl', label: 'Firecrawl', memberId: 'dshws-firecrawl', defaultRef: 'FIRECRAWL_API_KEY', defaultBaseURL: 'https://api.firecrawl.dev' },
  { key: 'deepseek', label: 'DeepSeek', memberId: 'dshws-deepseek', defaultRef: 'DEEPSEEK_API_KEY', defaultBaseURL: 'https://api.deepseek.com/anthropic/v1' },
  { key: 'anysearch', label: 'AnySearch', memberId: 'dshws-anysearch', defaultRef: 'ANYSEARCH_API_KEY', defaultBaseURL: 'https://api.anysearch.com' },
] as const

/** Built-in member order applied when the section omits a chain (ADR-0004). */
/** Orderable domain (S14c): the five tool members; deepseek is the fixed tail
 * fallback and never appears in the reorderable chain rows. */
const ORDERABLE_MEMBER_IDS: readonly string[] = MEMBERS.filter((member) => member.key !== 'deepseek').map((member) => member.memberId)
const DEEPSEEK_MEMBER_ID = 'dshws-deepseek'

/** Per-member timeout budget applied when the section omits one (ADR-0002). */
const DEFAULT_PER_MEMBER_TIMEOUT_MS = 30000

/** The section-value fields the cards read (user-set only; everything else defaults). */
interface MemberSectionValue {
  enabled?: boolean
  apiKeyEnv?: string
  /** Pool selection policy; client default mirrors the node half's `resolveConfig` (S13 D4). */
  keySelection?: 'order' | 'round-robin' | 'random'
  /** DeepSeek-only (S14c): server-tool search budget per request, host parity. */
  maxUses?: number
  /** Endpoint override (S14k, host-parity「接口地址」); empty = provider default. Hot (S17 D1). */
  baseURL?: string
  /** Tavily S17 P1: search category. */
  topic?: 'general' | 'news' | 'finance'
  /** Tavily S17 P1: publication-recency filter. */
  timeRange?: 'day' | 'week' | 'month' | 'year'
  /** Tavily S17 P1: search depth tier. */
  searchDepth?: 'basic' | 'advanced' | 'fast' | 'ultra-fast'
  /** Tavily S17 P1: generated-answer tier (resolved default 'basic'). */
  includeAnswer?: 'basic' | 'advanced'
  /** Exa S17 P1: search type (current official 6-value enum). */
  type?: 'instant' | 'fast' | 'auto' | 'deep-lite' | 'deep' | 'deep-reasoning'
  /** Exa S17 P1: text fallback (resolved default true). */
  textFallback?: boolean
  /** Exa S17 P1: publication-date floor (YYYY-MM-DD). */
  startPublishedDate?: string
  /** Firecrawl S17 P1: time-based search filter. */
  tbs?: 'qdr:h' | 'qdr:d' | 'qdr:w' | 'qdr:m' | 'qdr:y'
  /** Firecrawl S17 P1: free-text geo location. */
  location?: string
}

interface SectionValue {
  /** Universal web_fetch takeover toggle (S15a). */
  fetchTakeover?: boolean
  /** Unified search region, ISO 3166-1 alpha-2 (S17 P1, ADR-0015). */
  searchCountry?: string
  /** Unified search language, ISO 639-1 (S17 P1, ADR-0015). */
  searchLanguage?: string
  /** Designated fallback (ADR-0014 canonical field; the GUI writes only this). */
  fallbackMember?: 'auto' | 'dshws-tavily' | 'dshws-exa' | 'dshws-perplexity' | 'dshws-firecrawl' | 'dshws-anysearch' | 'dshws-deepseek' // 'dshws-perplexity' = S19 legacy input, normalized to 'auto'
  /** @deprecated Legacy pre-0.2 alias (ADR-0014), read-only input. */
  fallbackProvider?: 'deepseek' | 'none' | 'auto' | 'fetch'
  /** S19 legacy alias: a stored value naming the removed member normalizes to 'auto' in the snapshot. */
  searchChain?: string[]
  perMemberTimeoutMs?: number
  tavily?: MemberSectionValue
  exa?: MemberSectionValue
  firecrawl?: MemberSectionValue
  deepseek?: MemberSectionValue
  anysearch?: MemberSectionValue
}

/** One provider card's render-ready state. */
export interface MemberSnapshot {
  readonly key: string
  readonly label: string
  /** Chain-id alignment key (`dshws-<key>`) — chain filtering maps ids through this, not string surgery. */
  readonly memberId: string
  readonly refName: string
  readonly enabled: boolean
  readonly configured: boolean
  /** Pool selection policy, defaulted to `round-robin` (S14n user ruling; ADR-0008). */
  readonly keySelection: 'order' | 'round-robin' | 'random'
  /** Endpoint override; `undefined` = provider default (hot since S17 D1). */
  readonly baseURL: string | undefined
  /** Tavily S17 P1: raw section values, `undefined` = provider default. */
  readonly topic: string | undefined
  readonly timeRange: string | undefined
  readonly searchDepth: string | undefined
  readonly includeAnswer: string | undefined
  /** Exa S17 P1: raw section values, `undefined` = provider default. */
  readonly type: string | undefined
  readonly textFallback: boolean
  readonly startPublishedDate: string | undefined
  /** Firecrawl S17 P1: raw section values, `undefined` = provider default. */
  readonly tbs: string | undefined
  readonly location: string | undefined
  readonly source: string | undefined
  readonly writable: boolean
}

/** The whole section's render-ready state. */
export interface SectionSnapshot {
  readonly members: readonly MemberSnapshot[]
  readonly searchChain: readonly string[]
  /** True when the section value sets the chain explicitly — the pinned-override marker (plan 007 D1). */
  readonly searchChainPinned: boolean
  readonly timeoutMs: number
  /** DeepSeek fallback `maxUses` (S14c): raw section value, `undefined` = provider default (5). */
  readonly deepseekMaxUses: number | undefined
  /** Canonical designated fallback (ADR-0014); legacy values normalized away. */
  readonly fallbackSelection: 'auto' | 'dshws-tavily' | 'dshws-exa' | 'dshws-firecrawl' | 'dshws-anysearch' | 'dshws-deepseek'
  /** True when a DESIGNATED TOOL member is ready (configured && enabled). */
  readonly fallbackDesignationReady: boolean
  /** True when the paid DeepSeek option exists at all: at most one ready tool member AND its key configured. */
  readonly fallbackDeepseekEligible: boolean
  /** Ready tool members (configured && enabled), excluding DeepSeek — the ADR-0014 count. */
  readonly readyToolMembers: readonly string[]
  /** Universal web_fetch takeover toggle (S15a); resolved default true. */
  readonly fetchTakeover: boolean
  /** Unified search region (ISO 3166-1 alpha-2); `undefined` = not sent (S17 P1, ADR-0015). */
  readonly searchCountry: string | undefined
  /** Unified search language (ISO 639-1); `undefined` = not sent (S17 P1, ADR-0015). */
  readonly searchLanguage: string | undefined
  readonly revision: number | undefined
  readonly writable: boolean
}

/** Outcome of a user action; the component maps this to feedback copy. */
export type ActionResult = { ok: true } | { ok: false }

const EMPTY_SECTION: SectionValue = {}
const EMPTY_FACTS: ReadonlyMap<string, CredentialInfo> = new Map()

/**
 * Build the render-ready state from the described section value plus the
 * credential fact table. Pure on purpose: every refresh path (init, action,
 * event) funnels here so the snapshot is always derived, never patched in
 * place.
 */
function deriveSnapshot(value: SectionValue, facts: ReadonlyMap<string, CredentialInfo>, writable: boolean, revision: number | undefined): SectionSnapshot {
  const members = MEMBERS.map((member) => {
    const section = value[member.key]
    const refName = section?.apiKeyEnv ?? member.defaultRef
    const fact = facts.get(refName)
    return {
      key: member.key,
      label: member.label,
      memberId: member.memberId,
      refName,
      // Client-facing flag (S14d default off); chain membership itself is
      // governed by the ADR-0014 fallback rules, not this flag.
      enabled: section?.enabled ?? (member.key === 'deepseek' ? false : true),
      configured: fact?.configured === true,
      keySelection: section?.keySelection ?? 'round-robin',
      baseURL: section?.baseURL,
      // S17 P1 raw values (undefined = provider default; '' is the GUI clear
      // sentinel the node half's resolveConfig normalizes away).
      topic: section?.topic,
      timeRange: section?.timeRange,
      searchDepth: section?.searchDepth,
      includeAnswer: section?.includeAnswer,
      type: section?.type,
      // S17 D4 client mirror: the text fallback defaults ON.
      textFallback: section?.textFallback ?? true,
      startPublishedDate: section?.startPublishedDate,
      tbs: section?.tbs,
      location: section?.location,
      source: fact?.source,
      writable: fact?.writable === true,
    }
  })
  // Ready TOOL members (ADR-0014): configured && enabled, DeepSeek excluded
  // BY SPEC — the paid floor's eligibility counts only the tools it backs up.
  const readyToolMembers = members
    .filter((m) => m.key !== 'deepseek' && m.configured && m.enabled)
    .map((m) => m.memberId)
  const fallbackSelection: SectionSnapshot['fallbackSelection'] = value.fallbackMember === 'dshws-perplexity'
    // S19 legacy alias: the removed member's designation degrades to auto.
    ? 'auto'
    : value.fallbackMember !== undefined
      ? value.fallbackMember
      : (value.fallbackProvider === 'deepseek' ? 'dshws-deepseek' : 'auto')
  const deepseekRef = value.deepseek?.apiKeyEnv ?? 'DEEPSEEK_API_KEY'
  return {
    members,
    searchChain: value.searchChain?.length
      ? value.searchChain.filter((id) => id !== DEEPSEEK_MEMBER_ID)
      : [...ORDERABLE_MEMBER_IDS],
    searchChainPinned: (value.searchChain?.length ?? 0) > 0,
    timeoutMs: value.perMemberTimeoutMs ?? DEFAULT_PER_MEMBER_TIMEOUT_MS,
    deepseekMaxUses: value.deepseek?.maxUses,
    // ADR-0014 canonical projection: fallbackMember wins; the legacy alias
    // normalizes in ('deepseek' designates the paid floor, everything else
    // means the chain-order tail) so legacy values never leak into the snapshot.
    fallbackSelection,
    fallbackDesignationReady: fallbackSelection !== 'auto' && fallbackSelection !== 'dshws-deepseek'
      && members.some((m) => m.memberId === fallbackSelection && m.configured && m.enabled),
    fallbackDeepseekEligible: readyToolMembers.length <= 1 && facts.get(deepseekRef)?.configured === true,
    readyToolMembers,
    fetchTakeover: value.fetchTakeover ?? true,
    searchCountry: value.searchCountry,
    searchLanguage: value.searchLanguage,
    revision,
    writable,
  }
}

/** Web-search settings section controller (see {@link WebSearchSettingsPorts}). */
export class WebSearchSettingsController {
  readonly #ports: WebSearchSettingsPorts
  readonly #listeners = new Set<() => void>()
  #value: SectionValue = EMPTY_SECTION
  #facts: ReadonlyMap<string, CredentialInfo> = EMPTY_FACTS
  #writable = false
  #revision: number | undefined = undefined
  #snapshot: SectionSnapshot = deriveSnapshot(EMPTY_SECTION, EMPTY_FACTS, false, undefined)
  #unsubscribe?: () => void

  constructor(ports: WebSearchSettingsPorts) {
    this.#ports = ports
  }

  /** Load the section and credential facts, then subscribe to key updates. */
  async init(): Promise<void> {
    this.#unsubscribe = this.#ports.onReferenceUpdated(() => void this.#refreshCredentials())
    await this.#refreshSection()
    await this.#refreshCredentials()
  }

  /**
   * Re-describe the settings document and recompute from it. S14i audit fix:
   * every successful settings write re-describes — trusting the update
   * response's embedded view left the snapshot on stale values against the
   * real host (the page needed a reload to see the new state).
   */
  async #refreshSection(): Promise<void> {
    const described = await this.#ports.describeSettings()
    if (described.ok) {
      const view = described.value.namespaces.find((candidate) => candidate.ns === NS)
      this.#value = (view?.value ?? {}) as SectionValue
      this.#revision = view?.revision
      this.#writable = described.value.writable
      this.#recompute()
    }
  }

  /** Detach the reference-updated subscription (the entry's disposer calls this). */
  dispose(): void {
    this.#unsubscribe?.()
    this.#unsubscribe = undefined
  }

  /** Current render-ready state (replaced wholesale on every refresh). */
  snapshot(): SectionSnapshot {
    return this.#snapshot
  }

  /** Subscribe to snapshot changes; returns the unsubscriber. */
  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  /** Store `value` under the member's credential ref, then refresh the fact. */
  async setKey(memberKey: string, value: string): Promise<ActionResult> {
    const member = MEMBERS.find((candidate) => candidate.key === memberKey)
    if (!member) return { ok: false }
    const result = await this.#ports.setCredential(this.#refNameOf(member.key), value)
    if (!result.ok) return { ok: false }
    await this.#refreshCredentials()
    return { ok: true }
  }

  /** Remove the member's credential ref, then refresh the fact. */
  async clearKey(memberKey: string): Promise<ActionResult> {
    const member = MEMBERS.find((candidate) => candidate.key === memberKey)
    if (!member) return { ok: false }
    const result = await this.#ports.unsetCredential(this.#refNameOf(member.key))
    if (!result.ok) return { ok: false }
    await this.#refreshCredentials()
    return { ok: true }
  }

  /** Toggle a member's `enabled` through the settings remote (hot gate). */
  async setEnabled(memberKey: string, enabled: boolean): Promise<ActionResult> {
    const member = MEMBERS.find((candidate) => candidate.key === memberKey)
    if (!member) return { ok: false }
    const result = await this.#ports.updateSettings(NS, { [member.key]: { enabled } }, this.#revision)
    if (!result.ok) return { ok: false }
    await this.#refreshSection()
    return { ok: true }
  }

  /** Set a member's `keySelection` through the settings remote (hot gate; S13 D4). */
  async setKeySelection(memberKey: string, keySelection: 'order' | 'round-robin' | 'random'): Promise<ActionResult> {
    const member = MEMBERS.find((candidate) => candidate.key === memberKey)
    if (!member) return { ok: false }
    const result = await this.#ports.updateSettings(NS, { [member.key]: { keySelection } }, this.#revision)
    if (!result.ok) return { ok: false }
    await this.#refreshSection()
    return { ok: true }
  }

  /**
   * Set a member's endpoint override (S14k, host-parity「接口地址」). Empty
   * string clears the override (back to provider default). Hot since S17 D1:
   * applies to the next search.
   */
  async setBaseURL(memberKey: string, baseURL: string): Promise<ActionResult> {
    const member = MEMBERS.find((candidate) => candidate.key === memberKey)
    if (!member) return { ok: false }
    const result = await this.#ports.updateSettings(NS, { [member.key]: { baseURL: baseURL.trim() } }, this.#revision)
    if (!result.ok) return { ok: false }
    await this.#refreshSection()
    return { ok: true }
  }

  /**
   * Set one S17 P1 member option through the settings remote (hot: the next
   * search). `''` is the enum/date clear sentinel the node half's
   * `resolveConfig` normalizes to "not sent".
   */
  async setMemberOption(
    memberKey: string,
    option: 'topic' | 'timeRange' | 'searchDepth' | 'includeAnswer' | 'type' | 'textFallback' | 'startPublishedDate' | 'tbs' | 'location',
    value: string | number | boolean,
  ): Promise<ActionResult> {
    const member = MEMBERS.find((candidate) => candidate.key === memberKey)
    if (!member) return { ok: false }
    const result = await this.#ports.updateSettings(NS, { [member.key]: { [option]: value } }, this.#revision)
    if (!result.ok) return { ok: false }
    await this.#refreshSection()
    return { ok: true }
  }

  /** Set the unified search region (S17 P1, ADR-0015). Empty string clears. Hot: the next search. */
  async setSearchCountry(country: string): Promise<ActionResult> {
    const result = await this.#ports.updateSettings(NS, { searchCountry: country.trim() }, this.#revision)
    if (!result.ok) return { ok: false }
    await this.#refreshSection()
    return { ok: true }
  }

  /** Set the unified search language (S17 P1, ADR-0015). Empty string clears. Hot: the next search. */
  async setSearchLanguage(language: string): Promise<ActionResult> {
    const result = await this.#ports.updateSettings(NS, { searchLanguage: language.trim() }, this.#revision)
    if (!result.ok) return { ok: false }
    await this.#refreshSection()
    return { ok: true }
  }

  /** Toggle the universal web_fetch takeover (S15a): hot on the next call. */
  async setFetchTakeover(active: boolean): Promise<ActionResult> {
    const result = await this.#ports.updateSettings(NS, { fetchTakeover: active }, this.#revision)
    if (!result.ok) return { ok: false }
    await this.#refreshSection()
    return { ok: true }
  }

  /** Designate the fallback (ADR-0014): top-level field, hot on the next search. */
  async setFallbackMember(member: SectionSnapshot['fallbackSelection']): Promise<ActionResult> {
    const result = await this.#ports.updateSettings(NS, { fallbackMember: member }, this.#revision)
    if (!result.ok) return { ok: false }
    await this.#refreshSection()
    return { ok: true }
  }

  /**
   * Set the DeepSeek fallback `maxUses` (S14c, host-parity knob). Patched under
   * the deepseek member key — deep-merge keeps sibling fields; the provider
   * reads it hot (S17 D1).
   */
  async setDeepseekMaxUses(maxUses: number): Promise<ActionResult> {
    // S14g: mirror the GUI bounds [5, 100].
    if (!Number.isInteger(maxUses) || maxUses < 5 || maxUses > 100) return { ok: false }
    const result = await this.#ports.updateSettings(NS, { deepseek: { maxUses } }, this.#revision)
    if (!result.ok) return { ok: false }
    await this.#refreshSection()
    return { ok: true }
  }

  /**
   * Move one search-chain entry to the adjacent **configured** slot in the
   * given direction (skipping unconfigured members), then patch the full
   * array back (hot gate). Unconfigured members stay in place — sorting
   * operates on the visible (configured) subsequence.
   */
  async moveSearchChainEntry(id: string, delta: -1 | 1): Promise<ActionResult> {
    const chain = [...this.#snapshot.searchChain]
    const configuredIds = new Set(
      this.#snapshot.members.filter((m) => m.configured).map((m) => `dshws-${m.key}`),
    )
    const from = chain.indexOf(id)
    if (from < 0) return { ok: false }
    let to = from + delta
    // Skip over unconfigured members in the delta direction.
    while (to >= 0 && to < chain.length && !configuredIds.has(chain[to])) to += delta
    if (to < 0 || to >= chain.length) return { ok: false }
    ;[chain[from], chain[to]] = [chain[to], chain[from]]
    const result = await this.#ports.updateSettings(NS, { searchChain: chain }, this.#revision)
    if (!result.ok) return { ok: false }
    await this.#refreshSection()
    return { ok: true }
  }

  #refNameOf(memberKey: string): string {
    const member = MEMBERS.find((candidate) => candidate.key === memberKey)
    return member ? (this.#value[member.key]?.apiKeyEnv ?? member.defaultRef) : memberKey
  }

  async #refreshCredentials(): Promise<void> {
    const refs = MEMBERS.map((member) => this.#refNameOf(member.key))
    const described = await this.#ports.describeCredentials(refs)
    if (described.ok) {
      this.#facts = new Map(Object.entries(described.value))
    }
    this.#recompute()
  }

  #recompute(): void {
    this.#snapshot = deriveSnapshot(this.#value, this.#facts, this.#writable, this.#revision)
    for (const listener of this.#listeners) listener()
  }
}
