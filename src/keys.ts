/**
 * Key pool: the multi-key selection layer behind one member's
 * `resolveApiKey` thunk (ADR-0011 single-slot comma value). The member has
 * ONE credential ref whose value is `k1,k2,...,kN` — the pool resolves it
 * fresh per call, splits it into the key sequence, and selects one key per
 * the member's `keySelection` policy (order / round-robin / random; random
 * is without-replacement per ADR-0012).
 *
 * Failure faces, in the order they fire: a caller abort wins first; a
 * rejecting resolver is the member's request-failure; an over-limit pool is
 * a loud request-failure naming the limit; a missing or all-empty value is
 * the member's credential-missing naming the ref. The value is never cached
 * (the credentials service's per-operation contract) and never logged.
 *
 * @module dsh-websearch/keys
 */
import { DshwsError } from './errors.ts'
import type { MemberErrorFamily } from './providers/shared.ts'
import { resolveMemberApiKey, throwIfMemberAborted } from './providers/shared.ts'

/** Hard cap on keys per member pool (ADR-0011: overage is a loud request failure). */
export const MAX_KEYS_PER_POOL = 10

/** Constructor ports for one member's key pool; all state enters through them. */
export interface KeyPoolPorts {
  /**
   * The member's single credential ref (primary; `apiKeyEnv`) — read live
   * per call so a settings change reaches the next search.
   */
  readonly ref: () => string
  /** The live selection policy (settings hot). */
  readonly selection: () => 'order' | 'round-robin' | 'random'
  /** Per-operation value resolution (the credentials service; never cached). */
  readonly resolve: (ref: string) => Promise<string | undefined>
  /** The credential gate's cached describe fact for the member's ref. */
  readonly isReady: (ref: string) => boolean
  /** Display label for diagnostics (`'Tavily'`). */
  readonly label: string
  /** The member's error family. */
  readonly codes: MemberErrorFamily
  /**
   * Uniform sampler for the `random` policy over `[0, 1)`; defaults to
   * `Math.random`. Injectable so tests can pin a deterministic pick.
   */
  readonly rng?: () => number
}

/** Split one comma value into the trimmed, non-empty key sequence. */
export function splitKeys(value: string): string[] {
  return value
    .split(',')
    .map((key) => key.trim())
    .filter((key) => key.length > 0)
}

export class KeyPool {
  readonly #ports: KeyPoolPorts
  /** Round-robin cursor over the key sequence; modulo-applied per call. */
  #cursor = 0
  /** Keys in the pool as of the LAST resolve (S14r retry gate; 0 = never drawn). */
  #lastKeyCount = 0
  /** Without-replacement deck for `random` (ADR-0012); a permutation of the last seen split. */
  #deck: string[] = []
  /** Next deck index to draw; `>= deck.length` means the cycle is exhausted. */
  #deckPos = 0

  constructor(ports: KeyPoolPorts) {
    this.#ports = ports
  }

  /**
   * Whether the next draw could yield a DIFFERENT key (S14r/S14u): needs
   * more than one key AND a policy that advances the selection — `order`
   * always returns keys[0], so its "redraws" would retry the SAME key and
   * the retry gate must refuse (blind-retry guard extended to policies).
   * Before the first draw this reports false — the gate warms up after the
   * first request, so the very first request degrades on single-key members.
   */
  hasMultiKeyPool(): boolean {
    return this.#lastKeyCount > 1 && this.#ports.selection() !== 'order'
  }

  /** The live ref name (gate priming and diagnostics). */
  refs(): readonly string[] {
    return [this.#ports.ref()]
  }

  /**
   * Whether the member's credential ref currently describes as configured —
   * the member-gate readiness (`credentialsReady`). The comma value counts
   * as configured whenever a value is stored; emptiness inside it fails
   * loud at resolve time (ADR-0011).
   */
  ready(): boolean {
    return this.#ports.isReady(this.#ports.ref())
  }

  /** The provider-facing thunk: resolve the value, split, select one key. */
  async resolveApiKey(signal?: AbortSignal): Promise<string> {
    const { label, codes } = this.#ports
    throwIfMemberAborted(codes, label, signal)
    const ref = this.#ports.ref()
    let value: string | undefined
    try {
      value = await this.#ports.resolve(ref)
    } catch (error: unknown) {
      if (signal?.aborted === true || (error instanceof DOMException && error.name === 'AbortError')) {
        throw new DshwsError(codes.aborted, `${label} search aborted`, { cause: error })
      }
      throw new DshwsError(codes.requestFailed, `${label} credential resolution failed: ${String(error)}`, { cause: error })
    }
    const keys = splitKeys(value ?? '')
    this.#lastKeyCount = keys.length
    if (keys.length === 0) {
      throw new DshwsError(
        codes.credentialMissing,
        `${label} search has no API key for "${ref}"; store it (comma-separated for multiple keys) through the dsh credentials`
        + ' page or export it in the launching environment',
      )
    }
    if (keys.length > MAX_KEYS_PER_POOL) {
      throw new DshwsError(
        codes.requestFailed,
        `${label} key pool exceeds the limit: ${keys.length} keys configured for "${ref}" (max ${MAX_KEYS_PER_POOL});`
        + ' trim the comma-separated value',
      )
    }
    const selected = this.#select(keys)
    // The selected key already passed the missing-value gate; wrap it with the
    // shared abort-facing semantics for parity with the single-key path.
    return resolveMemberApiKey({
      codes,
      label,
      apiKeyRef: ref,
      resolveApiKey: async () => selected,
      signal,
    })
  }

  /**
   * Draw one key per policy. `random` draws from a shuffled deck without
   * replacement (ADR-0012): mid-cycle draws walk the deck; an exhausted deck
   * or a split whose multiset no longer matches the deck (hot value change)
   * reshuffles first. A failed request consumes its draw — no same-member
   * retry, the chain degrades instead.
   */
  #select(keys: readonly string[]): string {
    const selection = this.#ports.selection()
    if (selection === 'random') {
      const rng = this.#ports.rng ?? Math.random
      if (this.#deckPos >= this.#deck.length || !KeyPool.#sameMultiset(this.#deck, keys)) {
        this.#deck = KeyPool.#shuffle(keys, rng)
        this.#deckPos = 0
      }
      return this.#deck[this.#deckPos++]
    }
    if (selection === 'round-robin') {
      const picked = keys[this.#cursor % keys.length]
      this.#cursor += 1
      return picked
    }
    return keys[0]
  }

  /** Fisher-Yates (ascending form): `rng ≡ 0` yields the identity permutation. */
  static #shuffle(keys: readonly string[], rng: () => number): string[] {
    const deck = [...keys]
    for (let i = 0; i < deck.length - 1; i += 1) {
      const j = i + Math.floor(rng() * (deck.length - i))
      ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }
    return deck
  }

  /** Whether both sequences contain exactly the same keys with the same multiplicities. */
  static #sameMultiset(a: readonly string[], b: readonly string[]): boolean {
    if (a.length !== b.length) return false
    const counts = new Map<string, number>()
    for (const key of a) counts.set(key, (counts.get(key) ?? 0) + 1)
    for (const key of b) {
      const left = counts.get(key)
      // `left <= 0` catches duplicate-multiplicity shifts (k1,k1,k2 → k1,k2,k2):
      // the same key set, so `undefined` alone never fires (S13 stage-4/5 🟡-1).
      if (left === undefined || left <= 0) return false
      counts.set(key, left - 1)
    }
    return true
  }
}
