/**
 * Chain core: the orchestration behind the `dshws-chain` meta providers.
 * HTTP-free by design (architecture §3 boundary) — members are reached
 * through the {@link ChainMemberResolver} port, so tests substitute fakes and
 * S04/S05a wire the real registry, settings, and credentials ports.
 *
 * @module dsh-websearch/chain/core
 */
import type { WebSearchProvider, WebSearchRequest, WebSearchResult } from '@deepseek-ai/dsh-web'
import { CHAIN_ERROR_CODES, createChainExhaustedError, DshwsError } from '../errors.ts'
import type { ChainMemberFailure } from '../errors.ts'

/** One chain member as resolved at call time. */
export interface ChainMember {
  /** Member id (always the wrapped provider's `id`, `dshws-` prefixed). */
  readonly id: string
  /** The member's own provider implementation. */
  readonly provider: WebSearchProvider
  /** False when the user disabled this member in settings. */
  readonly enabled: boolean
  /** True when the member's credential ref resolves (S04: credentials describe + refresh). */
  readonly credentialsReady: boolean
}

/** Port that turns configured member ids into runnable members; `undefined` = unregistered. */
export interface ChainMemberResolver {
  resolve(memberId: string): ChainMember | undefined
}

/** Log sink for chain observability (attribution and degradation lines). */
export type ChainLogger = (message: string) => void

/** Constructor options shared by the chain meta providers. */
export interface ChainOptions {
  readonly members: ChainMemberResolver
  /** Configured member order; the chain tries members in exactly this order. */
  readonly order: readonly string[]
  /** Timeout budget per member per call, in milliseconds. */
  readonly perMemberTimeoutMs: number
  /** Observability sink; omit for a silent chain (tests assert through results). */
  readonly log?: ChainLogger
}

/** Selection-level gates of architecture §4: an unusable member is skipped without being called. */
function isUsable(member: ChainMember | undefined): member is ChainMember {
  if (member === undefined) return false
  if (!member.enabled) return false
  if (!member.credentialsReady) return false
  return member.provider.available()
}

/** Internal sentinel: the member's `perMemberTimeoutMs` budget expired before a result. */
const MEMBER_TIMED_OUT: unique symbol = Symbol('dshws.member-timed-out')

/** Search chain: `dshws-chain` as a plain `WebSearchProvider` (ADR-0002). */
export class ChainSearchProvider implements WebSearchProvider {
  readonly id = 'dshws-chain'

  constructor(private readonly options: ChainOptions) {}

  /** Cheap local check (§4): true when at least one enabled member has credentials ready. */
  available(): boolean {
    return this.options.order.some((id) => {
      const member = this.options.members.resolve(id)
      return member !== undefined && member.enabled && member.credentialsReady
    })
  }

  /** Try members in configured order; runtime failures and per-member timeouts degrade to the next member (ADR-0002 Decision 2). */
  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    const failures: ChainMemberFailure[] = []
    for (const id of this.options.order) {
      const member = this.options.members.resolve(id)
      if (!isUsable(member)) continue
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
        }, this.options.perMemberTimeoutMs)
        try {
          const searchPromise = member.provider.search(request, controller.signal)
          // After a timeout abort the member promise still rejects (typically
          // with an AbortError); that rejection is expected here — the timeout
          // is already recorded as the member's failure.
          searchPromise.catch(() => {})
          const result = await Promise.race([searchPromise, timedOut])
          this.options.log?.(`[dshws-chain] served-by: ${id}`)
          return withServedBy(id, result)
        } finally {
          clearTimeout(timer)
          signal?.removeEventListener('abort', abortFromOuter)
        }
      } catch (error) {
        // Caller cancellation is the caller's verdict, not a member failure:
        // propagate it instead of degrading to further members.
        if (signal?.aborted && error !== MEMBER_TIMED_OUT) throw error
        const isTimeout = error === MEMBER_TIMED_OUT
        const reason = isTimeout
          ? `${CHAIN_ERROR_CODES.memberTimeout}: no result within ${this.options.perMemberTimeoutMs}ms`
          : error instanceof Error
            ? error.message
            : String(error)
        failures.push({ memberId: id, reason, error: isTimeout ? undefined : error })
        this.options.log?.(`[dshws-chain] member ${id} failed (${reason}); degrading to next member`)
      }
    }
    if (failures.length === 0) throw noMemberConfigured(this.options.order)
    throw createChainExhaustedError(failures)
  }
}

/** Build the fail-loud error for a chain whose members were all selection-skipped. */
function noMemberConfigured(order: readonly string[]): DshwsError {
  return new DshwsError(
    CHAIN_ERROR_CODES.noMemberConfigured,
    `${CHAIN_ERROR_CODES.noMemberConfigured}: no usable member on the chain (configured: ${order.join(', ')})`,
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
