/**
 * Error vocabulary for dsh-websearch. Every error carries a stable string
 * code prefixed `DSHWS_` so tool output and host logs stay machine-routable
 * (AGENTS.md 插件开发规范). Chain-level codes are final here; member-level
 * namespaces are claimed now and each provider adds its concrete codes when
 * it lands (S04/S05a).
 *
 * @module dsh-websearch/errors
 */

/** Chain-level codes owned by the chain meta providers (`src/chain/`). */
export const CHAIN_ERROR_CODES = {
  /** Every member on the chain was tried and failed. Terminal, fail-loud. */
  exhausted: 'DSHWS_CHAIN_EXHAUSTED',
  /** No member on the chain passed the selection-level gates (unregistered, disabled, missing credentials, `available() === false`). */
  noMemberConfigured: 'DSHWS_NO_MEMBER_CONFIGURED',
  /** Log code recorded when a member exceeds its `perMemberTimeoutMs` budget and the chain degrades to the next member. */
  memberTimeout: 'DSHWS_MEMBER_TIMEOUT',
} as const

/**
 * Member-level code families. Every landed provider family carries its five
 * concrete codes (S05a: all five families are objects; a family value is a
 * reserved namespace prefix only between reserving the name and landing the
 * provider — a state that no longer exists).
 */
export const MEMBER_ERROR_CODES = {
  deepseek: {
    credentialMissing: 'DSHWS_DEEPSEEK_CREDENTIAL_MISSING',
    requestFailed: 'DSHWS_DEEPSEEK_REQUEST_FAILED',
    httpError: 'DSHWS_DEEPSEEK_HTTP_ERROR',
    badResponse: 'DSHWS_DEEPSEEK_BAD_RESPONSE',
    aborted: 'DSHWS_DEEPSEEK_ABORTED',
  },
  tavily: {
    credentialMissing: 'DSHWS_TAVILY_CREDENTIAL_MISSING',
    requestFailed: 'DSHWS_TAVILY_REQUEST_FAILED',
    httpError: 'DSHWS_TAVILY_HTTP_ERROR',
    badResponse: 'DSHWS_TAVILY_BAD_RESPONSE',
    aborted: 'DSHWS_TAVILY_ABORTED',
  },
  firecrawl: {
    credentialMissing: 'DSHWS_FIRECRAWL_CREDENTIAL_MISSING',
    requestFailed: 'DSHWS_FIRECRAWL_REQUEST_FAILED',
    httpError: 'DSHWS_FIRECRAWL_HTTP_ERROR',
    badResponse: 'DSHWS_FIRECRAWL_BAD_RESPONSE',
    aborted: 'DSHWS_FIRECRAWL_ABORTED',
  },
  exa: {
    credentialMissing: 'DSHWS_EXA_CREDENTIAL_MISSING',
    requestFailed: 'DSHWS_EXA_REQUEST_FAILED',
    httpError: 'DSHWS_EXA_HTTP_ERROR',
    badResponse: 'DSHWS_EXA_BAD_RESPONSE',
    aborted: 'DSHWS_EXA_ABORTED',
  },
  perplexity: {
    credentialMissing: 'DSHWS_PERPLEXITY_CREDENTIAL_MISSING',
    requestFailed: 'DSHWS_PERPLEXITY_REQUEST_FAILED',
    httpError: 'DSHWS_PERPLEXITY_HTTP_ERROR',
    badResponse: 'DSHWS_PERPLEXITY_BAD_RESPONSE',
    aborted: 'DSHWS_PERPLEXITY_ABORTED',
  },
} as const

/** Domain error with a machine-routable string code and the standard `cause` slot. */
export class DshwsError extends Error {
  /** Stable `DSHWS_*` code; consumers must tolerate member-specific codes. */
  readonly code: string

  constructor(code: string, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'DshwsError'
    this.code = code
  }
}

/** One member's failure, as recorded by the chain while degrading. */
export interface ChainMemberFailure {
  /** Provider id of the failed member (e.g. `dshws-tavily`). */
  readonly memberId: string
  /** Human-readable failure reason; timeout entries carry the `DSHWS_MEMBER_TIMEOUT` marker. */
  readonly reason: string
  /** The error the member threw, when the failure came from a throw. */
  readonly error?: unknown
}

/**
 * Build the terminal `DSHWS_CHAIN_EXHAUSTED` error. The message embeds one
 * `memberId: reason` line per failed member; the last member's thrown error
 * (when any) is chained as `cause` so the terminal diagnostics keep the
 * deepest failure (ADR-0002 Decision 3).
 */
export function createChainExhaustedError(failures: readonly ChainMemberFailure[]): DshwsError {
  const lines = failures.map((failure) => `- ${failure.memberId}: ${failure.reason}`)
  const last = failures.at(-1)
  return new DshwsError(
    CHAIN_ERROR_CODES.exhausted,
    `${CHAIN_ERROR_CODES.exhausted}: all ${failures.length} configured chain members failed\n${lines.join('\n')}`,
    last?.error !== undefined ? { cause: last.error } : undefined,
  )
}
