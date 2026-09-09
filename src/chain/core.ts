/**
 * Chain core: the orchestration behind the `dshws-chain` meta providers.
 * HTTP-free by design (architecture §3 boundary) — members are reached
 * through the {@link ChainMemberResolver} port, so tests substitute fakes and
 * S04/S05a wire the real registry, settings, and credentials ports. One
 * {@link ChainCore} instance drives each capability kind; the capability
 * classes are thin typed shells over it.
 *
 * @module dsh-websearch/chain/core
 */
import type { WebFetchProvider, WebFetchResult, WebFetchRequest, WebSearchProvider, WebSearchRequest, WebSearchResult } from '@deepseek-ai/dsh-web'
import { CHAIN_ERROR_CODES, createChainExhaustedError, CREDENTIAL_LEVEL_HTTP_STATUSES, DshwsError, REQUEST_LEVEL_HTTP_STATUSES } from '../errors.ts'
import type { ChainMemberFailure } from '../errors.ts'

/** One chain member as resolved at call time. */
export interface ChainMember<P = unknown> {
  /** Member id (always the wrapped provider's `id`, `dshws-` prefixed). */
  readonly id: string
  /** The member's own provider implementation. */
  readonly provider: P
  /** False when the user disabled this member in settings. */
  readonly enabled: boolean
  /** True when the member's credential ref resolves (S04: credentials describe + refresh). */
  readonly credentialsReady: boolean
  /**
   * True when the member's key pool can yield a DIFFERENT key on the next
   * draw (S14r same-member retry). Default false: single-key members and
   * gate-less test stubs degrade immediately — redrawing the same key would
   * be a blind retry, not recovery.
   */
  readonly multiKeyPool?: boolean
}

/** Port that turns configured member ids into runnable members; `undefined` = unregistered. */
export interface ChainMemberResolver<P = unknown> {
  resolve(memberId: string): ChainMember<P> | undefined
}

/** Log sink for chain observability (attribution and degradation lines). */
export type ChainLogger = (message: string) => void

/** Constructor options for a chain meta provider. */
export interface ChainOptions<P> {
  /** The registry view members are resolved against. */
  readonly members: ChainMemberResolver<P>
  /** Configured member order; the chain tries members in exactly this order. Read per run (hot). */
  readonly order: readonly string[]
  /** Timeout budget per member per call, in milliseconds. Read per member per run (hot). */
  readonly perMemberTimeoutMs: number
  /** Observability sink; omit for a silent chain (tests assert through results). */
  readonly log?: ChainLogger
}

/** Hot-read state gates a chain member is consulted through at resolve time. */
export interface MemberGates {
  /** False when the user disabled this member (config now, settings hot-toggle in S05a). */
  readonly enabled?: () => boolean
  /** True when the member's credential ref currently resolves (credential gate, `src/credentials.ts`). */
  readonly credentialsReady?: () => boolean
  /** True when the member's key pool holds more than one usable key (S14r retry gate). */
  readonly multiKeyPool?: () => boolean
}

/**
 * Plugin-owned registry of bundled members. The host's provider registry is
 * private and not enumerable (ADR-0003), so the plugin keeps its own: every
 * bundled member registers here AND with `ctx.web` under the same `dshws-`
 * id, which is what lets users pin one member directly via the selection
 * scalar — direct connections bypass the chain entirely (ADR-0002 Decision 5).
 *
 * Bundled members register with real gates (config-enabled + credential
 * state), which is what replaced the S03 constant-true facade: a member
 * without its credentials configured now resolves as not ready and the chain
 * skips it. Gate-less registration stays enabled/ready by design for members
 * with no credential concept (loopback stubs, test fakes) — bundled members
 * must always pass gates, or the skipped-when-unconfigured semantics die.
 */
export class MemberRegistry<P extends { readonly id: string } = WebSearchProvider> {
  readonly #providers = new Map<string, P>()
  readonly #gates = new Map<string, MemberGates | undefined>()

  /** Register one member with its state gates; returns the disposer. */
  register(provider: P, gates?: MemberGates): () => void {
    this.#providers.set(provider.id, provider)
    this.#gates.set(provider.id, gates)
    return () => {
      this.#providers.delete(provider.id)
      this.#gates.delete(provider.id)
    }
  }

  /** Chain-facing view; gates are read at each resolve, so flips apply to the next call. */
  toResolver(): ChainMemberResolver<P> {
    return {
      resolve: (id) => {
        const provider = this.#providers.get(id)
        if (provider === undefined) return undefined
        const gates = this.#gates.get(id)
        return {
          id,
          provider,
          enabled: gates?.enabled?.() ?? true,
          credentialsReady: gates?.credentialsReady?.() ?? true,
          multiKeyPool: gates?.multiKeyPool?.() ?? false,
        }
      },
    }
  }
}

/**
 * Capability-neutral orchestrator (architecture §4): selection-level skips,
 * runtime degradation, per-member timeout budgets, terminal exhaustion, and
 * the served-by log line. The result transform is the capability's
 * attribution policy (search: content prefix, D2; fetch: log only, D3).
 */
class ChainCore<P extends { readonly id: string; available(): boolean }, Req, Res> {
  readonly #options: ChainOptions<P>
  readonly #transform: (memberId: string, result: Res) => Res

  constructor(options: ChainOptions<P>, transform: (memberId: string, result: Res) => Res) {
    this.#options = options
    this.#transform = transform
  }

  /** Cheap local check (§4): true when at least one enabled member has credentials ready. */
  available(): boolean {
    return this.#options.order.some((id) => {
      const member = this.#options.members.resolve(id)
      return member !== undefined && member.enabled && member.credentialsReady
    })
  }

  /** Selection-level gates: an unusable member is skipped without being called. */
  #isUsable(member: ChainMember<P> | undefined): member is ChainMember<P> {
    if (member === undefined) return false
    if (!member.enabled) return false
    if (!member.credentialsReady) return false
    return member.provider.available()
  }

  /**
   * Per-member key-redraw budget (S14r, user ruling): a failing key may be
   * network/quota noise specific to THAT key, so the chain redraws another
   * key from the member's pool (a fresh `invoke` re-reads the pool policy)
   * before degrading to the next member. Three draws per member cap the
   * added latency; the per-member timeout budget is ONE shared deadline
   * across those draws (S14u), so redrawing never multiplies the budget.
   */
  static readonly MEMBER_DRAWS = 3

  /** Draws for members with a multi-key pool; single-key members get 1. */
  #drawsFor(member: ChainMember<P>): number {
    return member.multiKeyPool === true ? ChainCore.MEMBER_DRAWS : 1
  }

  /** Try members in configured order; per member one shared timeout budget across up to MEMBER_DRAWS key redraws, then degrade. */
  async run(
    request: Req,
    signal: AbortSignal | undefined,
    invoke: (provider: P, request: Req, signal: AbortSignal | undefined) => Promise<Res>,
  ): Promise<Res> {
    const failures: ChainMemberFailure[] = []
    for (const id of this.#options.order) {
      const member = this.#options.members.resolve(id)
      if (!this.#isUsable(member)) continue
      const draws = this.#drawsFor(member)
      const deadline = Date.now() + this.#options.perMemberTimeoutMs
      const drawReasons: string[] = []
      let lastError: unknown
      // The loop bound is the hard cap: the gate-computed `draws` (which may
      // be 1 while the multi-key pool is still cold) governs NON-credential
      // failures via the break below, while a credential-level 401/403 may
      // redraw up to the cap regardless (first-search healing, S14y).
      for (let draw = 1; draw <= ChainCore.MEMBER_DRAWS; draw += 1) {
        const remaining = deadline - Date.now()
        if (remaining <= 0) {
          // A prior draw consumed the whole budget: the member degrades now,
          // with the spent budget recorded instead of a zero-ms fake draw.
          const reason = `${CHAIN_ERROR_CODES.memberTimeout}: member budget of ${this.#options.perMemberTimeoutMs}ms spent after ${drawReasons.length} draw(s)`
          drawReasons.push(reason)
          this.#options.log?.(`[dshws-chain] member ${id} failed (${reason}); degrading to next member`)
          break
        }
        try {
          const controller = new AbortController()
          const abortFromOuter = () => controller.abort(signal?.reason)
          signal?.addEventListener('abort', abortFromOuter, { once: true })
          if (signal?.aborted) abortFromOuter()
          let fireTimeout: () => void = () => {}
          const timedOut = new Promise<never>((_, reject) => {
            fireTimeout = () => reject(MEMBER_TIMED_OUT)
          })
          const timer = setTimeout(() => {
            controller.abort()
            fireTimeout()
          }, remaining)
          try {
            const memberPromise = invoke(member.provider, request, controller.signal)
            // After a timeout abort the member promise still rejects (typically
            // with an AbortError); that rejection is expected here — the timeout
            // is already recorded as the member's failure.
            memberPromise.catch(() => {})
            const result = await Promise.race([memberPromise, timedOut])
            this.#options.log?.(`[dshws-chain] served-by: ${id}`)
            return this.#transform(id, result)
          } finally {
            clearTimeout(timer)
            signal?.removeEventListener('abort', abortFromOuter)
          }
        } catch (error) {
          // Caller cancellation is the caller's verdict, not a member failure:
          // propagate it instead of degrading to further members.
          if (signal?.aborted && error !== MEMBER_TIMED_OUT) throw error
          const isTimeout = error === MEMBER_TIMED_OUT
          const status = !isTimeout && error instanceof DshwsError ? error.httpStatus : undefined
          const requestLevelStatus = status !== undefined && REQUEST_LEVEL_HTTP_STATUSES.has(status) ? status : undefined
          const credentialLevelStatus = status !== undefined && CREDENTIAL_LEVEL_HTTP_STATUSES.has(status) ? status : undefined
          const reason = isTimeout
            ? `${CHAIN_ERROR_CODES.memberTimeout}: no result within the member budget of ${this.#options.perMemberTimeoutMs}ms`
            : error instanceof Error
              ? error.message
              : String(error)
          drawReasons.push(reason)
          if (!isTimeout) lastError = error
          // A credential-level failure bypasses the (possibly COLD) multi-key
          // gate: the gate learns the pool size only after the first key draw,
          // and a 401/403 is itself evidence that a DIFFERENT key may serve —
          // the first search after boot must heal, not degrade blind (S14y).
          const redrawCap = credentialLevelStatus !== undefined ? ChainCore.MEMBER_DRAWS : draws
          const degrading = isTimeout || requestLevelStatus !== undefined || draw >= redrawCap
          const drawNote = degrading
            ? `; degrading to next member${requestLevelStatus !== undefined ? ` (request-level HTTP ${requestLevelStatus})` : ''}`
            : `; redrawing key (${draw + 1}/${redrawCap})${credentialLevelStatus !== undefined ? ` (credential-level HTTP ${credentialLevelStatus}: another key may be valid)` : ''}`
          this.#options.log?.(`[dshws-chain] member ${id} failed (${reason})${drawNote}`)
          if (isTimeout) break // the shared budget is spent → degrade to the next member
          if (requestLevelStatus !== undefined) break // no key can change this verdict → degrade
          if (draw >= redrawCap) break // draw budget spent (gate draws, or the credential cap) → degrade
          continue // redraw another key within the same member, on the remaining budget
        }
      }
      if (drawReasons.length > 0) {
        failures.push(lastError !== undefined ? { memberId: id, drawReasons, error: lastError } : { memberId: id, drawReasons })
      }
    }
    if (failures.length === 0) throw noMemberConfigured(this.#options.order)
    throw createChainExhaustedError(failures)
  }
}

/** Internal sentinel: the member's `perMemberTimeoutMs` budget expired before a result. */
const MEMBER_TIMED_OUT: unique symbol = Symbol('dshws.member-timed-out')

/**
 * Build the fail-loud error for a chain whose members were all selection-skipped.
 * The list is the chain ORDER — skipped members are typically unconfigured, so
 * labeling them "configured" read as a lie; the message names the order and
 * points at the remediation (settings page, or the shared-key DeepSeek floor).
 */
function noMemberConfigured(order: readonly string[]): DshwsError {
  return new DshwsError(
    CHAIN_ERROR_CODES.noMemberConfigured,
    `${CHAIN_ERROR_CODES.noMemberConfigured}: no usable member on the chain (chain order: ${order.join(', ')});`
    + ' enable or configure a member on the dsh-websearch settings page,'
    + ' or select the DeepSeek paid fallback there when fewer than two tools are ready (Models-page key required)',
  )
}

/**
 * Attribution carrier (ADR-0002 Decision 4): the seam's `WebSearchResult` is
 * closed, so the serving member is named in a `[served-by: <id>]` first line
 * of `content` — the slot provider-generated text already lives in. Members
 * without content get the line alone, so attribution never disappears.
 */
function withServedBy(memberId: string, result: WebSearchResult): WebSearchResult {
  const line = `[served-by: ${memberId}]`
  return {
    ...result,
    content: result.content === undefined ? line : `${line}\n${result.content}`,
  }
}

/** Search chain meta provider, registered as `dshws-chain` (ADR-0002). */
export class ChainSearchProvider implements WebSearchProvider {
  readonly id = 'dshws-chain'

  readonly #core: ChainCore<WebSearchProvider, WebSearchRequest, WebSearchResult>

  /**
   * The caller's options object is kept by reference (never spread): getters
   * on it — the settings hot path — must be re-read on every run.
   */
  constructor(options: ChainOptions<WebSearchProvider>) {
    this.#core = new ChainCore(options, withServedBy)
  }

  available(): boolean {
    return this.#core.available()
  }

  search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    return this.#core.run(request, signal, (provider, req, sig) => provider.search(req, sig))
  }
}

/**
 * Fetch chain meta provider, registered as `dshws-chain-fetch`. Attribution is
 * the host log line only (D3): a fetched body is the resource itself, so the
 * `[served-by:]` marker must not corrupt it.
 */
export class ChainFetchProvider implements WebFetchProvider {
  readonly id = 'dshws-chain-fetch'

  readonly #core: ChainCore<WebFetchProvider, WebFetchRequest, WebFetchResult>

  /** Kept by reference for the same hot-read reason as the search shell. */
  constructor(options: ChainOptions<WebFetchProvider>) {
    this.#core = new ChainCore(options, (_memberId, result) => result)
  }

  available(): boolean {
    return this.#core.available()
  }

  fetch(request: WebFetchRequest, signal?: AbortSignal): Promise<WebFetchResult> {
    return this.#core.run(request, signal, (provider, req, sig) => provider.fetch(req, sig))
  }
}
