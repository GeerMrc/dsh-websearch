/**
 * The web_fetch gateway provider (S15a Layer C, review M1+M2 ruling): a
 * always-registered, always-available fetch provider pinned by the plugin
 * patch (`fetchProvider: dshws-fetch-gate`). Its behavior follows the live
 * takeover toggle —
 *
 * ON: `fetch()` rejects with a guidance error naming web_search as the
 * replacement, so the model reads the instruction and reroutes. This is the
 * only path where the tool's outcome is fully ours — the seam's
 * registered-but-unavailable message has no room for custom copy (M2).
 *
 * OFF: `fetch()` delegates to a plain HTTP fetch — the plugin's own
 * implementation of the official anonymous-fetch behavior, so the gateway is
 * a transparent pass-through and web_fetch keeps working exactly as the
 * host shipped it. Uninstalling the plugin removes the patch pin entirely
 * (the seam falls back to auto-selecting the host's own `http` provider),
 * so OFF state never outlives the plugin.
 *
 * @module dsh-websearch/fetch-gate
 */
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import type { WebFetchProvider, WebFetchRequest, WebFetchResult } from '@deepseek-ai/dsh-web'
import { WebError } from '@deepseek-ai/dsh-web'

/** Stable id this provider registers under; the plugin patch pins `fetchProvider` here. */
export const FETCH_GATE_PROVIDER_ID = 'dshws-fetch-gate'

/** The guidance the model sees when the takeover is ON. */
const TAKEOVER_MESSAGE =
  'web_fetch is taken over by dsh-websearch — use the web_search tool instead (multi-tool, multi-key, fallback chain).'

/** Cap the delegated body, matching the official provider's default budget. */
const MAX_DELEGATED_CHARS = 200_000

/** Content types the official provider rejects as undecodable binary. */
const BINARY_CONTENT_TYPE = /^(application\/octet-stream|image\/|audio\/|video\/|application\/pdf|application\/zip)/i

/**
 * Plain HTTP fetch delegation (OFF state): an anonymous GET with the same
 * public-network guard the official provider enforces — resolve once, reject
 * non-public destinations, pin the connection to the validated address. The
 * redirect policy stays 'error' so a cross-origin hop cannot silently bypass
 * the check (the official provider limits same-origin hops; refusing all
 * redirects is the conservative subset).
 *
 * @throws WebError with a stable code for each rejection class.
 */
async function delegateFetch(request: WebFetchRequest, signal?: AbortSignal): Promise<WebFetchResult> {
  const url = new URL(request.url)
  // SSRF guard (review Y-2): the OFF state must not become a private-network
  // probe the official provider would have refused.
  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  const literal = isIP(hostname)
  let addresses: readonly string[]
  if (literal) {
    addresses = [hostname]
  } else {
    const resolved = await lookup(hostname, { all: true })
    addresses = resolved.map((entry) => entry.address)
  }
  for (const address of addresses) {
    if (!isPublicAddress(address)) {
      throw new WebError(`URL hostname resolves to a non-public address (${address})`, 'WEB_FETCH_BLOCKED')
    }
  }

  const response = await fetch(url, {
    method: 'GET',
    redirect: 'error',
    ...(signal !== undefined ? { signal } : {}),
  })
  const contentType = response.headers.get('content-type') ?? ''
  if (BINARY_CONTENT_TYPE.test(contentType)) {
    throw new WebError(`unsupported content type "${contentType}"`, 'WEB_UNSUPPORTED_CONTENT_TYPE')
  }
  const full = await response.text()
  const truncated = full.length > MAX_DELEGATED_CHARS
  const text = truncated ? full.slice(0, MAX_DELEGATED_CHARS) : full
  const isHtml = contentType.includes('text/html') || /^\s*<(!doctype|html)/i.test(text)
  return {
    url: response.url || url.href,
    statusCode: response.status,
    body: { kind: isHtml ? 'html' : 'text', content: text },
    truncated,
  }
}

/** Whether an address is globally reachable unicast (the official SSRF bar). */
function isPublicAddress(address: string): boolean {
  const kind = isIP(address)
  if (kind === 6) {
    // Reject well-known non-public v6 ranges: loopback, link-local, unique-local.
    const lower = address.toLowerCase()
    if (lower === '::1' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) return false
    return true
  }
  const parts = address.split('.').map(Number)
  const [a, b] = parts
  if (a === 10 || a === 127 || a === 0) return false
  if (a === 172 && b !== undefined && b >= 16 && b <= 31) return false
  if (a === 192 && b === 168) return false
  if (a === 169 && b === 254) return false
  if (a === 198 && (b === 18 || b === 19)) return false
  return true
}

/**
 * The gateway provider. `takeoverActive` is read per call so the settings
 * toggle is hot on the next web_fetch invocation.
 */
export class FetchGateProvider implements WebFetchProvider {
  readonly id = FETCH_GATE_PROVIDER_ID

  constructor(private readonly isTakeoverActive: () => boolean) {}

  /** Always true: the pin guarantees selection, so availability is ours to own (review M2). */
  available(): boolean {
    return true
  }

  async fetch(request: WebFetchRequest, signal?: AbortSignal): Promise<WebFetchResult> {
    if (this.isTakeoverActive()) {
      throw new WebError(TAKEOVER_MESSAGE, 'WEB_FETCH_TAKEOVER')
    }
    return await delegateFetch(request, signal)
  }
}
