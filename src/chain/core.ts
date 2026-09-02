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

  /** Try members in configured order; first success serves (degradation lands with its own task). */
  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    const failures: ChainMemberFailure[] = []
    for (const id of this.options.order) {
      const member = this.options.members.resolve(id)
      if (!isUsable(member)) continue
      return member.provider.search(request, signal)
    }
    throw noMemberConfigured(this.options.order, failures)
  }
}

/** Build the fail-loud error for a chain whose members were all selection-skipped. */
function noMemberConfigured(order: readonly string[], failures: readonly ChainMemberFailure[]): DshwsError {
  return new DshwsError(
    CHAIN_ERROR_CODES.noMemberConfigured,
    failures.length === 0
      ? `${CHAIN_ERROR_CODES.noMemberConfigured}: no usable member on the chain (configured: ${order.join(', ')})`
      : createChainExhaustedError(failures).message,
  )
}
