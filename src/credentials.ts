/**
 * Credential gate: the hot-read `credentialsReady` source for chain members.
 * It caches the credentials service's `describe` answer per watched reference
 * and refreshes the cache on `credentials/reference-updated`, so chain
 * availability tracks the user storing or removing a key without a restart.
 *
 * Only the describe fact is cached — never a key value. Members resolve the
 * secret fresh at each operation (the service's per-operation contract); this
 * gate carries the cheap, value-free readiness signal `available()` needs.
 *
 * The cache starts empty and an unknown reference reads as not ready: before
 * a describe there is no fact, and readiness without a fact is the S03
 * facade again. `describe` failures read as not-ready plus a log line — the
 * conservative answer can only skip a member, never leak readiness.
 *
 * @module dsh-websearch/credentials
 */
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import type { CredentialProvider, CredentialRef } from '@deepseek-ai/dsh-credentials'

/**
 * Port wiring the gate into the cordis event bus (`apply` passes
 * `ctx.on('credentials/reference-updated', …)`). The returned disposer is
 * owned by the caller's disposal scope — cordis binds `ctx.on` to the
 * calling fiber, so plugin unload unsubscribes the gate.
 */
export type CredentialEventSubscribe = (handler: (ref: CredentialRef) => void) => () => void

/** Constructor ports for the gate; all host access goes through them. */
export interface CredentialGatePorts {
  /** The injected credentials service (`ctx.credentials`). */
  readonly credentials: CredentialProvider
  /** Event subscription port; the gate fans one handler out over watched refs. */
  readonly subscribe: CredentialEventSubscribe
  /** Observability sink for describe failures; omit for a silent gate (tests). */
  readonly log?: (message: string) => void
}

export class CredentialGate {
  readonly #credentials: CredentialProvider
  readonly #log?: (message: string) => void
  readonly #watched = new Set<string>()
  readonly #ready = new Map<string, boolean>()

  constructor(ports: CredentialGatePorts) {
    this.#credentials = ports.credentials
    this.#log = ports.log
    ports.subscribe((ref) => void this.#refresh(String(ref)))
  }

  /**
   * Validate the configured references (a name outside the credential
   * grammar throws here — misconfiguration fails loud at load), then describe
   * each and cache the result. Resolves once the initial cache is filled.
   */
  async prime(refNames: readonly string[]): Promise<void> {
    const refs = refNames.map((name) => String(credentialRef(name)))
    for (const ref of refs) this.#watched.add(ref)
    await Promise.all(refs.map((ref) => this.#refresh(ref)))
  }

  /** Whether the ref currently describes as configured; unknown refs are not ready. */
  isReady(refName: string): boolean {
    return this.#ready.get(refName) === true
  }

  /** Re-describe one watched ref; events for unwatched refs are ignored. */
  async #refresh(ref: string): Promise<void> {
    if (!this.#watched.has(ref)) return
    try {
      const info = await this.#credentials.describe(credentialRef(ref))
      this.#ready.set(ref, info.configured)
    } catch (error: unknown) {
      // A describe failure must neither flip a member to ready nor crash the
      // caller: not-ready is the conservative cache entry, and the log line
      // is the only observer a describe rejection has.
      this.#ready.set(ref, false)
      this.#log?.(`[dshws-websearch] credential describe failed for ${ref}: ${String(error)}`)
    }
  }
}
