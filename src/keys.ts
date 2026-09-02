/**
 * Key pool: the multi-credential-ref selection layer behind one member's
 * `resolveApiKey` thunk (ADR-0008). The pool owns WHICH ref serves a call —
 * readiness-filtered, then ordered/rotated/sampled per the member's
 * `keySelection` — while the value resolution keeps the shared per-operation
 * tri-state (abort / rejecting resolver / missing value) through
 * `resolveMemberApiKey`, so the provider face and its error codes are
 * untouched.
 *
 * `refs` and `selection` are live ports read on every call (the settings hot
 * path, same discipline as the chain order getters), and readiness is the
 * credential gate's cached describe fact. An empty ready set is fail-loud:
 * the pool itself throws the member's `credentialMissing` naming the primary
 * ref and the whole pool (ADR-0008 Decision 3) — it never silently falls back
 * to an unconfigured key.
 *
 * @module dsh-websearch/keys
 */
import type { KeySelection } from './config.ts'
import { DshwsError } from './errors.ts'
import type { MemberErrorFamily } from './providers/shared.ts'
import { resolveMemberApiKey, throwIfMemberAborted } from './providers/shared.ts'

/** Constructor ports for one member's key pool; all state enters through them. */
export interface KeyPoolPorts {
  /**
   * The full ref pool in order — `[apiKeyEnv, ...extraApiKeyEnvs]` — read
   * live per call so a settings change reaches the next search.
   */
  readonly refs: () => readonly string[]
  /** The live selection policy (settings hot). */
  readonly selection: () => KeySelection
  /** The credential gate's cached describe fact per ref. */
  readonly isReady: (ref: string) => boolean
  /** Per-operation value resolution (the credentials service; never cached). */
  readonly resolve: (ref: string) => Promise<string | undefined>
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

export class KeyPool {
  readonly #ports: KeyPoolPorts
  /** Round-robin cursor over the ready sequence; modulo-applied per call. */
  #cursor = 0

  constructor(ports: KeyPoolPorts) {
    this.#ports = ports
  }

  /** The provider-facing thunk: select a ref from the pool, resolve its value. */
  async resolveApiKey(signal?: AbortSignal): Promise<string> {
    const { label, codes } = this.#ports
    throwIfMemberAborted(codes, label, signal)
    const refs = this.#ports.refs()
    const ready = refs.filter((ref) => this.#ports.isReady(ref))
    if (ready.length === 0) {
      throw new DshwsError(
        codes.credentialMissing,
        `${label} search has no API key: none of the pool [${refs.join(', ')}] is configured`
        + ` (primary: ${refs[0]}); store keys through the dsh credentials page or export them in the launching environment`,
      )
    }
    const selected = this.#select(ready)
    return resolveMemberApiKey({
      codes,
      label,
      apiKeyRef: selected,
      resolveApiKey: () => this.#ports.resolve(selected),
      signal,
    })
  }

  #select(ready: readonly string[]): string {
    const selection: KeySelection = this.#ports.selection()
    if (selection === 'random') {
      const rng = this.#ports.rng ?? Math.random
      return ready[Math.floor(rng() * ready.length)]
    }
    if (selection === 'round-robin') {
      const picked = ready[this.#cursor % ready.length]
      this.#cursor += 1
      return picked
    }
    return ready[0]
  }
}
