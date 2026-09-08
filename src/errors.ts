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
 * concrete codes (S05a: five families landed as objects; S14u added the
 * fetch-search family, which had been borrowing the firecrawl namespace).
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
  fetchsearch: {
    credentialMissing: 'DSHWS_FETCHSEARCH_CREDENTIAL_MISSING',
    requestFailed: 'DSHWS_FETCHSEARCH_REQUEST_FAILED',
    httpError: 'DSHWS_FETCHSEARCH_HTTP_ERROR',
    badResponse: 'DSHWS_FETCHSEARCH_BAD_RESPONSE',
    aborted: 'DSHWS_FETCHSEARCH_ABORTED',
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
  anysearch: {
    credentialMissing: 'DSHWS_ANYSEARCH_CREDENTIAL_MISSING',
    requestFailed: 'DSHWS_ANYSEARCH_REQUEST_FAILED',
    httpError: 'DSHWS_ANYSEARCH_HTTP_ERROR',
    badResponse: 'DSHWS_ANYSEARCH_BAD_RESPONSE',
    aborted: 'DSHWS_ANYSEARCH_ABORTED',
  },
} as const

/** Domain error with a machine-routable string code and the standard `cause` slot. */
export class DshwsError extends Error {
  /** Stable `DSHWS_*` code; consumers must tolerate member-specific codes. */
  readonly code: string
  /** HTTP status of the failing response, when the failure came from one; a non-retryable status ends the member's redraw loop (S14u). */
  readonly httpStatus?: number

  constructor(code: string, message: string, options?: { cause?: unknown; httpStatus?: number }) {
    super(message, options)
    this.name = 'DshwsError'
    this.code = code
    this.httpStatus = options?.httpStatus
  }
}

/**
 * HTTP statuses that hold for every key of a member with certainty — bad
 * request, bad key, forbidden, missing route, unprocessable body. The chain
 * degrades to the next member without spending redraw draws on them (S14u);
 * 429 and 5xx stay out because they are key- or moment-specific.
 */
export const NON_RETRYABLE_HTTP_STATUSES: ReadonlySet<number> = new Set([400, 401, 403, 404, 422])

/** One member's failure, as recorded by the chain while degrading. */
export interface ChainMemberFailure {
  /** Provider id of the failed member (e.g. `dshws-tavily`). */
  readonly memberId: string
  /** One human-readable failure reason per attempted draw, in draw order; timeout entries carry the `DSHWS_MEMBER_TIMEOUT` marker. */
  readonly drawReasons: readonly string[]
  /** The error the member's last draw threw, when the failure came from a throw. */
  readonly error?: unknown
}

/**
 * Build the terminal `DSHWS_CHAIN_EXHAUSTED` error. The message embeds ONE
 * line per failed member — a multi-draw member lists its draws inline, so
 * the member count stays truthful; the last member's last-draw error (when
 * any) is chained as `cause` so the terminal diagnostics keep the deepest
 * failure (ADR-0002 Decision 3).
 */
export function createChainExhaustedError(failures: readonly ChainMemberFailure[]): DshwsError {
  const lines = failures.map((failure) => {
    const detail =
      failure.drawReasons.length > 1
        ? `failed (${failure.drawReasons.length} draws: ${failure.drawReasons.join('; ')})`
        : failure.drawReasons[0] ?? 'failed'
    return `- ${failure.memberId}: ${detail}`
  })
  const last = failures.at(-1)
  return new DshwsError(
    CHAIN_ERROR_CODES.exhausted,
    `${CHAIN_ERROR_CODES.exhausted}: all ${failures.length} configured chain members failed\n${lines.join('\n')}`,
    last?.error !== undefined ? { cause: last.error } : undefined,
  )
}
