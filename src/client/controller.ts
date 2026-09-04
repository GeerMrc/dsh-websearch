/**
 * Client-side controller for the web-search settings section (S06). It reads
 * the section through the settings remote, maps per-member credential facts
 * onto cards, and applies user actions (key write/clear, enable toggle) back
 * through the same remotes. All host access goes through the narrow
 * {@link WebSearchSettingsPorts} face: tests run against a fake remote and the
 * entry wires the real `ctx.remote` namespaces in one adapter.
 *
 * Client-side defaulting mirrors the node half's `resolveConfig` (built-in
 * member order, 30s timeout, per-member default refs, `enabled: true`) because
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

/** Bundled member display metadata; ids and default refs mirror the node half (exported for the S11 attribution card's label mapping). */
export const MEMBERS = [
  { key: 'tavily', label: 'Tavily', memberId: 'dshws-tavily', defaultRef: 'TAVILY_API_KEY' },
  { key: 'exa', label: 'Exa', memberId: 'dshws-exa', defaultRef: 'EXA_API_KEY' },
  { key: 'perplexity', label: 'Perplexity', memberId: 'dshws-perplexity', defaultRef: 'PERPLEXITY_API_KEY' },
  { key: 'firecrawl', label: 'Firecrawl', memberId: 'dshws-firecrawl', defaultRef: 'FIRECRAWL_API_KEY' },
  { key: 'deepseek', label: 'DeepSeek', memberId: 'dshws-deepseek', defaultRef: 'DEEPSEEK_API_KEY' },
  { key: 'anysearch', label: 'AnySearch', memberId: 'dshws-anysearch', defaultRef: 'ANYSEARCH_API_KEY' },
] as const

/** Built-in member order applied when the section omits a chain (ADR-0004). */
const BUILT_IN_MEMBER_ORDER: readonly string[] = MEMBERS.map((member) => member.memberId)

/** Per-member timeout budget applied when the section omits one (ADR-0002). */
const DEFAULT_PER_MEMBER_TIMEOUT_MS = 30000

/** The section-value fields the cards read (user-set only; everything else defaults). */
interface MemberSectionValue {
  enabled?: boolean
  apiKeyEnv?: string
  /** Pool selection policy; client default mirrors the node half's `resolveConfig` (S13 D4). */
  keySelection?: 'order' | 'round-robin' | 'random'
}

interface SectionValue {
  searchChain?: string[]
  fetchChain?: string[]
  perMemberTimeoutMs?: number
  tavily?: MemberSectionValue
  exa?: MemberSectionValue
  perplexity?: MemberSectionValue
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
  /** Pool selection policy, defaulted to `order` in deriveSnapshot (ADR-0008; S13 D4). */
  readonly keySelection: 'order' | 'round-robin' | 'random'
  readonly source: string | undefined
  readonly writable: boolean
}

/** The whole section's render-ready state. */
export interface SectionSnapshot {
  readonly members: readonly MemberSnapshot[]
  readonly searchChain: readonly string[]
  readonly fetchChain: readonly string[]
  /** True when the section value sets the chain explicitly — the pinned-override marker (plan 007 D1). */
  readonly searchChainPinned: boolean
  /** True when the section value sets the chain explicitly — the pinned-override marker (plan 007 D1). */
  readonly fetchChainPinned: boolean
  readonly timeoutMs: number
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
      enabled: section?.enabled ?? true,
      configured: fact?.configured === true,
      keySelection: section?.keySelection ?? 'order',
      source: fact?.source,
      writable: fact?.writable === true,
    }
  })
  return {
    members,
    searchChain: value.searchChain?.length ? [...value.searchChain] : BUILT_IN_MEMBER_ORDER,
    fetchChain: value.fetchChain?.length ? [...value.fetchChain] : BUILT_IN_MEMBER_ORDER,
    searchChainPinned: (value.searchChain?.length ?? 0) > 0,
    fetchChainPinned: (value.fetchChain?.length ?? 0) > 0,
    timeoutMs: value.perMemberTimeoutMs ?? DEFAULT_PER_MEMBER_TIMEOUT_MS,
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
    const described = await this.#ports.describeSettings()
    if (described.ok) {
      const view = described.value.namespaces.find((candidate) => candidate.ns === NS)
      this.#value = (view?.value ?? {}) as SectionValue
      this.#revision = view?.revision
      this.#writable = described.value.writable
      this.#recompute()
    }
    await this.#refreshCredentials()
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
    this.#value = (result.value.value ?? {}) as SectionValue
    this.#revision = result.value.revision
    this.#recompute()
    return { ok: true }
  }

  /** Set a member's `keySelection` through the settings remote (hot gate; S13 D4). */
  async setKeySelection(memberKey: string, keySelection: 'order' | 'round-robin' | 'random'): Promise<ActionResult> {
    const member = MEMBERS.find((candidate) => candidate.key === memberKey)
    if (!member) return { ok: false }
    const result = await this.#ports.updateSettings(NS, { [member.key]: { keySelection } }, this.#revision)
    if (!result.ok) return { ok: false }
    this.#value = (result.value.value ?? {}) as SectionValue
    this.#revision = result.value.revision
    this.#recompute()
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
    this.#value = (result.value.value ?? {}) as SectionValue
    this.#revision = result.value.revision
    this.#recompute()
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
