/**
 * Shared member-provider scaffolding: the mechanical cancellation, config
 * check, and error-unfold plumbing every bundled provider needs. Families
 * supply their code object and a display label; only extraction lives here —
 * request mapping, response mapping, and each backend's availability contract
 * stay in the provider files (a shared base class would obscure which fields
 * make a given backend usable).
 *
 * @module dsh-websearch/providers/shared
 */
import { DshwsError } from '../errors.ts'

/** The five concrete codes a landed provider family owns (`MEMBER_ERROR_CODES` family value). */
export type MemberErrorFamily = {
  readonly credentialMissing: string
  readonly requestFailed: string
  readonly httpError: string
  readonly badResponse: string
  readonly aborted: string
}

/** True for a fetch/`AbortSignal` abort, surfaced as the member's aborted code. */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/** Build the member's stable cancellation error while retaining the caller's reason. */
export function memberAborted(
  codes: MemberErrorFamily,
  label: string,
  signal?: AbortSignal,
  fallback?: unknown,
): DshwsError {
  return new DshwsError(codes.aborted, `${label} search aborted`, {
    cause: signal?.aborted === true ? signal.reason : fallback,
  })
}

/** Throw the member's stable cancellation error when the caller already aborted. */
export function throwIfMemberAborted(codes: MemberErrorFamily, label: string, signal?: AbortSignal): void {
  if (signal?.aborted === true) throw memberAborted(codes, label, signal)
}

/** Classify one fetch throw: caller cancellation keeps its own error, the rest is a request failure. */
export function memberFetchFailure(
  codes: MemberErrorFamily,
  label: string,
  error: unknown,
  signal?: AbortSignal,
): DshwsError {
  if (signal?.aborted === true || isAbortError(error)) return memberAborted(codes, label, signal, error)
  return new DshwsError(codes.requestFailed, `${label} search request failed: ${String(error)}`, { cause: error })
}

/** Wrap an unprocessable success body (bad JSON, unexpected shape) as the member's bad-response error. */
export function memberBadResponse(codes: MemberErrorFamily, label: string, error: unknown): DshwsError {
  return new DshwsError(codes.badResponse, `${label} returned an unprocessable response body: ${String(error)}`, { cause: error })
}

/**
 * Read a member response body once, mapping both failure legs to the member
 * error family: a non-2xx status throws the HTTP error with the unfolded
 * upstream detail (plus the optional `decorate` diagnostics suffix), a 2xx
 * body parses as `T`, and an unparseable 2xx body is the bad-response error.
 * An abort firing mid-body always surfaces as the member's aborted error.
 * @param response - the settled fetch Response.
 * @param deps - error family + label; `decorate` appends extra diagnostics
 *   (anysearch rides error_code/request_id here, S37 T4).
 * @returns the parsed 2xx envelope.
 */
export async function readMemberEnvelope<T>(response: Response, deps: {
  codes: MemberErrorFamily
  label: string
  signal?: AbortSignal
  decorate?: (parsed: unknown) => string
}): Promise<T> {
  const { codes, label, signal, decorate } = deps
  if (!response.ok) {
    const status = response.status
    let message = `${label} API error (HTTP ${status})`
    let parsed: unknown
    try {
      parsed = await response.json()
      const detail = unfoldHttpErrorDetail(parsed as Parameters<typeof unfoldHttpErrorDetail>[0])
      if (detail !== undefined && detail.length > 0) message += `: ${detail}`
      if (decorate !== undefined) message += decorate(parsed)
    } catch (error: unknown) {
      // An abort firing mid-body must surface as aborted, not be swallowed
      // into a generic HTTP-error message; otherwise the status is already
      // in `message` and a non-JSON error body only ever cost the richer text.
      if (signal?.aborted === true || isAbortError(error)) throw memberAborted(codes, label, signal, error)
    }
    throw new DshwsError(codes.httpError, message, { httpStatus: status })
  }
  try {
    return await response.json() as T
  } catch (error: unknown) {
    if (signal?.aborted === true || isAbortError(error)) throw memberAborted(codes, label, signal, error)
    throw memberBadResponse(codes, label, error)
  }
}

/**
 * Attribution header sent on every provider request. Pinned here once and
 * drift-guarded by tests/user-agent.test.ts against package.json's version —
 * a version bump that forgets this constant fails the guard loudly.
 */
export const USER_AGENT = 'dsh-websearch/0.3.0'

/**
 * First non-empty detail string among the wire error shapes seen across
 * providers: `error` (string or `{ message }` or `{ error }`), `detail`
 * (same three forms, or the FastAPI validation array whose first entry
 * renders as `msg @loc.loc`), then top-level `message`. The nested
 * `{ error }` form is the live Tavily 401 body and the array form is the
 * live Tavily 422 body (both verified 2026-09-28) — narrower picks
 * silently degrade those responses to a bare status. A top-level `code`
 * (Firecrawl 408/500: `TIMEOUT`/`UNKNOWN_ERROR`) appends as `[code]` when
 * present. Non-JSON bodies never reach this (the caller's
 * `response.json()` throws first).
 */
export function unfoldHttpErrorDetail(parsed: {
  readonly error?: string | { readonly message?: string, readonly error?: string } | null
  readonly detail?: string | { readonly message?: string, readonly error?: string } | { readonly msg?: string, readonly loc?: readonly string[] }[]
  readonly message?: string
  readonly code?: string
}): string | undefined {
  const pick = (value: string | { readonly message?: string, readonly error?: string } | undefined | null): string | undefined =>
    typeof value === 'string' ? value : value?.message ?? (typeof value?.error === 'string' ? value.error : undefined)
  const pickArray = (entries: readonly { readonly msg?: string, readonly loc?: readonly string[] }[]): string | undefined => {
    const first = entries.find(entry => entry.msg !== undefined && entry.msg.length > 0)
    if (first === undefined) return undefined
    return first.loc !== undefined && first.loc.length > 0 ? `${first.msg} @${first.loc.join('.')}` : first.msg
  }
  const detail = Array.isArray(parsed.detail)
    ? pickArray(parsed.detail)
    : pick(parsed.detail)
  const base = [pick(parsed.error), detail, parsed.message]
    .find((candidate) => candidate !== undefined && candidate.length > 0)
  if (base === undefined) return parsed.code
  return parsed.code !== undefined && parsed.code.length > 0 ? `${base} [${parsed.code}]` : base
}

/** True for a request limit that can be sent to the provider (a positive whole number). */
export function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0
}

/**
 * Resolve one operation's key without retaining it (the credentials service's
 * per-operation contract). A missing key is a loud credential error naming the
 * ref; a rejecting resolver is a request failure; a caller abort wins over both.
 */
export async function resolveMemberApiKey(options: {
  codes: MemberErrorFamily
  label: string
  apiKeyRef: string
  resolveApiKey: () => Promise<string | undefined>
  signal?: AbortSignal
}): Promise<string> {
  const { codes, label, apiKeyRef, resolveApiKey, signal } = options
  throwIfMemberAborted(codes, label, signal)
  let resolved: string | undefined
  try {
    resolved = await resolveApiKey()
  } catch (error: unknown) {
    if (signal?.aborted === true || isAbortError(error)) throw memberAborted(codes, label, signal, error)
    throw new DshwsError(codes.requestFailed, `${label} credential resolution failed: ${String(error)}`, { cause: error })
  }
  if (resolved !== undefined && resolved.length > 0) return resolved
  throw new DshwsError(
    codes.credentialMissing,
    `${label} search has no API key for "${apiKeyRef}"; store it through the dsh credentials`
    + ' page or export it in the launching environment',
  )
}
