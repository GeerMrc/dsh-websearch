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
import type { WebFetchProvider, WebFetchRequest, WebFetchResult } from '@deepseek-ai/dsh-web'
import { WebError } from '@deepseek-ai/dsh-web'

/** Stable id this provider registers under; the plugin patch pins `fetchProvider` here. */
export const FETCH_GATE_PROVIDER_ID = 'dshws-fetch-gate'

/** The guidance the model sees when the takeover is ON. */
const TAKEOVER_MESSAGE =
  'web_fetch is taken over by dsh-websearch — use the web_search tool instead (multi-tool, multi-key, fallback chain).'

/** Plain HTTP fetch delegation (OFF state): a minimal anonymous GET. */
async function delegateFetch(request: WebFetchRequest, signal?: AbortSignal): Promise<WebFetchResult> {
  const response = await fetch(request.url, {
    redirect: 'follow',
    ...(signal !== undefined ? { signal } : {}),
  })
  const text = (await response.text()).slice(0, 200_000)
  const contentType = response.headers.get('content-type') ?? ''
  const isHtml = contentType.includes('text/html') || /^\s*<(!doctype|html)/i.test(text)
  return {
    url: response.url || request.url,
    statusCode: response.status,
    body: { kind: isHtml ? 'html' : 'text', content: text },
    truncated: false,
  }
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
