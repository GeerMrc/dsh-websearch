/**
 * The core DoH resolver (ADR-0022 D2): cache → nodes in order with a
 * per-node budget (3 consecutive failures cool a node for 30s) → NXDOMAIN
 * respected as a deterministic answer (no node retry) → reserved-range poison
 * filtering (keep the unfiltered list when everything matches — the filter
 * must not become the outage) → every node failed returns `null` so the
 * caller falls back to the original system lookup (never-worse principle).
 *
 * @module dsh-websearch/dns/resolver
 */
import { isReservedIpv4, parseIpv4Ranges } from './ranges.ts'
import type { IpRange } from './ranges.ts'
import { dohQuery, extractDohRecords } from './transport.ts'
import type { DohRecordType, DohRecords, NodeHttpsSend, ResolvedDohNode } from './transport.ts'

/** One resolved address with its family. */
export interface ResolverAddress {
  readonly address: string
  readonly family: 4 | 6
}

/** The outcome of one resolution: the answer (or a negative), its provenance, and filter diagnostics. */
export interface DohResolution {
  readonly addresses: readonly ResolverAddress[]
  /** True when the real resolver answered NXDOMAIN / NOERROR-no-data; callers surface ENOTFOUND, never a fabricated address. */
  readonly negative: boolean
  /** The winning node's host, or `'cache'`. */
  readonly via: string
  readonly latencyMs: number
  /** Addresses the poison filter dropped (diagnostics; empty when the filter kept the list intact). */
  readonly droppedPoisoned: readonly string[]
}

/** Constructor inputs; every clock/send seam is injectable so unit tests never touch the network. */
export interface DohResolverOptions {
  readonly nodes: readonly ResolvedDohNode[]
  /** Per-node DoH query budget (resolveConfig default 350ms). */
  readonly nodeTimeoutMs: number
  readonly cache: { readonly posMinS: number; readonly posMaxS: number; readonly negS: number }
  readonly poisonRanges: readonly string[]
  readonly send?: NodeHttpsSend
  readonly clock?: () => number
  readonly cooldown?: { readonly failThreshold: number; readonly cooldownS: number }
}

/** A node failure streak becomes a cooldown after this many consecutive transport/SERVFAIL outcomes. */
const DEFAULT_COOLDOWN = { failThreshold: 3, cooldownS: 30 } as const

interface CacheEntry {
  readonly resolution: Omit<DohResolution, 'via' | 'latencyMs'>
  readonly expiresAt: number
}

/**
 * The DoH resolver core. One instance owns the cache, the per-node failure
 * streaks, and the cooldown bookkeeping; the intercept layer (ADR-0022 D10)
 * constructs and disposes it with the patch lifecycle.
 */
export class DohResolver {
  readonly #nodes: readonly ResolvedDohNode[]
  readonly #nodeTimeoutMs: number
  readonly #cacheSpec: DohResolverOptions['cache']
  readonly #cooldown: { failThreshold: number; cooldownS: number }
  readonly #send: NodeHttpsSend | undefined
  readonly #clock: () => number
  readonly #ranges: readonly IpRange[]
  readonly #cache = new Map<string, CacheEntry>()
  readonly #failStreaks = new Map<string, number>()
  readonly #cooldownUntil = new Map<string, number>()

  constructor(options: DohResolverOptions) {
    this.#nodes = options.nodes
    this.#nodeTimeoutMs = options.nodeTimeoutMs
    this.#cacheSpec = options.cache
    this.#cooldown = options.cooldown ?? DEFAULT_COOLDOWN
    this.#send = options.send
    this.#clock = options.clock ?? Date.now
    this.#ranges = parseIpv4Ranges(options.poisonRanges)
  }

  /**
   * S36 (plan 036) negative feedback: drop every cached POSITIVE entry for
   * the name across all three family keys — the next resolve re-queries DoH
   * for a fresh rotation. Negative entries stay (NXDOMAIN is respected and
   * its TTL is 10s).
   * @param name - the hostname whose positive cache entries drop.
   */
  invalidate(name: string): void {
    const lowered = name.toLowerCase()
    for (const key of [`${lowered}:0`, `${lowered}:4`, `${lowered}:6`]) {
      const entry = this.#cache.get(key)
      if (entry !== undefined && !entry.resolution.negative) this.#cache.delete(key)
    }
  }

  /** Whether a reserved-range membership drops this v4 address; v6 passes untouched (H7 follow-up owns v6 probing). */
  #isPoisoned(address: string): boolean {
    return isReservedIpv4(address, this.#ranges)
  }

  /**
   * Resolve one name for one family ask. `null` means the DoH plane is
   * unusable right now (every node failed) — the caller must fall back to the
   * original system lookup; a returned resolution (negative included) is the
   * real resolver's answer and is trusted as-is.
   * @param name - the hostname (never an IP literal; the intercept layer filters those).
   * @param family - 4, 6, or 0 for the merged both-families answer (v4 first).
   * @returns the resolution, or null for an all-nodes-dead DoH plane.
   */
  async resolve(name: string, family: 4 | 6 | 0): Promise<DohResolution | null> {
    const key = `${name.toLowerCase()}:${family}`
    const hit = this.#cache.get(key)
    const now = this.#clock()
    if (hit !== undefined && hit.expiresAt > now) {
      return { ...hit.resolution, via: 'cache', latencyMs: 0 }
    }
    const startedAt = now
    const types: DohRecordType[] = family === 6 ? [28] : family === 4 ? [1] : [1, 28]
    const merged: ResolverAddress[] = []
    const dropped: string[] = []
    let winningVia = ''
    let minTtlS = Number.POSITIVE_INFINITY
    let allNegative = true
    for (const type of types) {
      const perFamily = await this.#queryOneFamily(name, type)
      if (perFamily === null) return null
      if (!perFamily.negative) allNegative = false
      if (perFamily.via !== '' && winningVia === '') winningVia = perFamily.via
      const filtered = perFamily.records.addresses.filter((entry) => {
        if (entry.family === 6 || !this.#isPoisoned(entry.address)) return true
        dropped.push(entry.address)
        return false
      })
      const kept = filtered.length > 0 ? filtered : perFamily.records.addresses
      for (const entry of kept) merged.push({ address: entry.address, family: entry.family })
      for (const entry of perFamily.records.addresses) minTtlS = Math.min(minTtlS, entry.ttl)
    }
    const negative = allNegative
    const resolution: Omit<DohResolution, 'via' | 'latencyMs'> = { addresses: merged, negative, droppedPoisoned: dropped }
    const ttlS = negative
      ? this.#cacheSpec.negS
      : Math.min(Math.max(Math.ceil(minTtlS), this.#cacheSpec.posMinS), this.#cacheSpec.posMaxS)
    this.#cache.set(key, { resolution, expiresAt: this.#clock() + ttlS * 1000 })
    return { ...resolution, via: winningVia, latencyMs: this.#clock() - startedAt }
  }

  /**
   * Query one record type across the node list, honoring cooldowns. NXDOMAIN
   * and NOERROR are deterministic answers from the first node that produces
   * one; transport errors and SERVFAIL move to the next node and feed the
   * failure streak. An empty NOERROR answer counts as negative (NODATA).
   * @returns the node outcome, or null when every usable node failed.
   */
  async #queryOneFamily(name: string, type: DohRecordType): Promise<{ negative: boolean; via: string; records: DohRecords } | null> {
    const now = this.#clock()
    for (const node of this.#nodes) {
      const cooledUntil = this.#cooldownUntil.get(node.host)
      if (cooledUntil !== undefined && cooledUntil > now) continue
      let envelope
      try {
        envelope = await dohQuery(node, { name, type }, this.#nodeTimeoutMs, this.#send)
      } catch {
        this.#registerFailure(node.host)
        continue
      }
      if (envelope.Status === 2) {
        this.#registerFailure(node.host)
        continue
      }
      this.#failStreaks.delete(node.host)
      if (envelope.Status !== 0) {
        // NXDOMAIN (3) and every other definitive rcode are answers, not failures.
        return { negative: true, via: node.host, records: { addresses: [], cnameChain: [] } }
      }
      const records = extractDohRecords(envelope, type)
      if (records.addresses.length === 0) return { negative: true, via: node.host, records }
      return { negative: false, via: node.host, records }
    }
    return null
  }

  #registerFailure(host: string): void {
    const streak = (this.#failStreaks.get(host) ?? 0) + 1
    this.#failStreaks.set(host, streak)
    if (streak >= this.#cooldown.failThreshold) {
      this.#cooldownUntil.set(host, this.#clock() + this.#cooldown.cooldownS * 1000)
      this.#failStreaks.delete(host)
    }
  }
}
