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
 * First non-empty detail string among the wire error shapes seen across
 * providers: `error` (string or `{ message }`), `detail` (string or
 * `{ message }`), then top-level `message`. Non-JSON bodies never reach this
 * (the caller's `response.json()` throws first).
 */
export function unfoldHttpErrorDetail(parsed: {
  readonly error?: string | { readonly message?: string } | null
  readonly detail?: string | { readonly message?: string }
  readonly message?: string
}): string | undefined {
  const pick = (value: string | { readonly message?: string } | undefined | null): string | undefined =>
    typeof value === 'string' ? value : value?.message
  return [pick(parsed.error), pick(parsed.detail), parsed.message]
    .find((candidate) => candidate !== undefined && candidate.length > 0)
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
