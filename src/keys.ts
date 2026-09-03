/**
 * Key pool: the multi-key selection layer behind one member's
 * `resolveApiKey` thunk (ADR-0011 single-slot comma value). The member has
 * ONE credential ref whose value is `k1,k2,...,kN` — the pool resolves it
 * fresh per call, splits it into the key sequence, and selects one key per
 * the member's `keySelection` policy (order / round-robin / random).
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

  constructor(ports: KeyPoolPorts) {
    this.#ports = ports
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

  #select(keys: readonly string[]): string {
    const selection = this.#ports.selection()
    if (selection === 'random') {
      const rng = this.#ports.rng ?? Math.random
      return keys[Math.floor(rng() * keys.length)]
    }
    if (selection === 'round-robin') {
      const picked = keys[this.#cursor % keys.length]
      this.#cursor += 1
      return picked
    }
    return keys[0]
  }
}
