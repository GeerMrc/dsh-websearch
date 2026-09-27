/**
 * The DNS observability sink (ADR-0022 D9/D11): renders layer events as
 * `[dshws-dns] log lines (with the per-resolution latency figure) and keeps a
 * sanitized ring buffer for the remote trace face. Every host passes the
 * sanitizer BEFORE any surface sees it — the privacy red line lives here, not
 * at the consumers.
 *
 * @module dsh-websearch/dns/observability
 */
import type { DnsLayerEvent } from './intercept.ts'
import { DNS_ERROR_CODES } from '../errors.ts'

/** One ring entry; `host` is already sanitized. */
export interface DnsTraceEntry {
  readonly at: number
  readonly kind: 'resolve' | 'decision' | 'fallback' | 'suspend'
  readonly host: string
  readonly via?: string
  readonly latencyMs?: number
  readonly kept?: number
  readonly dropped?: number
  readonly code?: string
  readonly detail?: string
}

/** Constructor inputs; the log seam and clock are injectable. */
export interface DnsObservabilityOptions {
  readonly log: (line: string) => void
  readonly ringLimit?: number
  readonly now?: () => number
}

/**
 * Build the host sanitizer: non-sensitive hosts pass verbatim (the member
 * baseURLs are configuration, not secrets); sensitive hosts — any host while
 * `scope: 'all'` that is not a member host — reduce to a stable 4-hex prefix
 * plus the last two labels, so traces stay groupable without leaking names.
 * @param isSensitiveHost - live predicate (scope=all && not a member host).
 * @returns the sanitizing function every surface routes through.
 */
export function sanitizeHostFactory(isSensitiveHost: (host: string) => boolean): (host: string) => string {
  return (host) => {
    if (!isSensitiveHost(host)) return host
    let hash = 0x811c9dc5
    for (let i = 0; i < host.length; i++) {
      hash ^= host.charCodeAt(i)
      hash = Math.imul(hash, 0x01000193) >>> 0
    }
    const labels = host.split('.').filter((label) => label.length > 0)
    const tail = labels.length >= 2 ? `${labels.at(-2)}.${labels.at(-1)}` : (labels.at(-1) ?? 'host')
    return `${hash.toString(16).slice(0, 4).padStart(4, '0')}…${tail}`
  }
}

/** Render one entry as the single-line log form. */
function renderLine(entry: DnsTraceEntry): string {
  const parts = [`[dshws-dns] ${entry.kind}`]
  if (entry.host.length > 0) parts.push(`host=${entry.host}`)
  if (entry.via !== undefined) parts.push(`via=${entry.via}`)
  if (entry.kept !== undefined) parts.push(`kept=${entry.kept}`)
  if (entry.dropped !== undefined && entry.dropped > 0) parts.push(`dropped=${entry.dropped}`)
  if (entry.detail !== undefined && entry.detail.length > 0) parts.push(entry.detail)
  if (entry.latencyMs !== undefined) parts.push(`latencyMs=${entry.latencyMs}`)
  if (entry.code !== undefined) parts.push(`code=${entry.code}`)
  return parts.join(' ')
}

/** The sink: one instance owns the ring; the log seam goes to the chain-log line and the host logger alike. */
export class DnsObservability {
  readonly #log: (line: string) => void
  readonly #ringLimit: number
  readonly #now: () => number
  readonly #ring: DnsTraceEntry[] = []

  constructor(options: DnsObservabilityOptions) {
    this.#log = options.log
    this.#ringLimit = options.ringLimit ?? 50
    this.#now = options.now ?? Date.now
  }

  /**
   * Record one layer event: sanitize the host, derive the diagnostic code,
   * append the ring entries (a doh-dead fallback yields the
   * DOH_UNREACHABLE → FALLBACK_SYSTEM pair), and emit the log lines.
   * @param event - the layer event.
   * @param sanitize - the host sanitizer (see {@link sanitizeHostFactory}).
   */
  record(event: DnsLayerEvent, sanitize: (host: string) => string): void {
    for (const entry of this.#entriesFor(event, sanitize)) {
      this.#ring.push(entry)
      while (this.#ring.length > this.#ringLimit) this.#ring.shift()
      this.#log(renderLine(entry))
    }
  }

  /** The sanitized ring, oldest first. */
  trace(): readonly DnsTraceEntry[] {
    return [...this.#ring]
  }

  #entriesFor(event: DnsLayerEvent, sanitize: (host: string) => string): DnsTraceEntry[] {
    const at = this.#now()
    switch (event.kind) {
      case 'resolve': {
        const probeDrop = event.probeDropped.length
        // The all-failed precheck kept the original list — only that state is
        // PROBE_ALL_FAILED; partial drops stay plain diagnostics.
        const probeAllFailed = probeDrop > 0 && probeDrop === event.kept
        return [{
          at,
          kind: 'resolve',
          host: sanitize(event.host),
          via: event.via,
          latencyMs: event.latencyMs,
          kept: event.kept,
          dropped: event.dropped,
          ...(probeDrop > 0 ? { detail: `probeDrop=${probeDrop}` } : {}),
          ...(probeAllFailed ? { code: DNS_ERROR_CODES.probeAllFailed } : {}),
        }]
      }
      case 'decision': {
        const code = event.outcome.verdict === 'poisoned'
          ? DNS_ERROR_CODES.autoEnabled
          : event.outcome.verdict === 'inconclusive'
            ? DNS_ERROR_CODES.detectInconclusive
            : DNS_ERROR_CODES.autoSkipped
        const hits = event.outcome.hits.map((hit) => `${sanitize(hit.host)}→${hit.addresses.join(',')}`).join(' ')
        const failures = event.outcome.failures.length > 0
          ? ` failures=${event.outcome.failures.map((failure) => `${sanitize(failure.host)}:${failure.reason}`).join(',')}`
          : ''
        return [{
          at,
          kind: 'decision',
          host: '',
          code,
          detail: `${event.outcome.action}/${event.outcome.verdict}${hits.length > 0 ? ` hits=${hits}` : ''}${failures}`,
        }]
      }
      case 'fallback': {
        if (event.reason === 'doh-dead') {
          return [
            { at, kind: 'fallback', host: sanitize(event.host), code: DNS_ERROR_CODES.dohUnreachable, detail: 'reason=doh-dead' },
            { at, kind: 'fallback', host: sanitize(event.host), code: DNS_ERROR_CODES.fallbackSystem, detail: 'reason=doh-dead' },
          ]
        }
        return [{ at, kind: 'fallback', host: sanitize(event.host), detail: `reason=${event.reason}` }]
      }
      case 'suspend':
        return [{ at, kind: 'suspend', host: sanitize(event.host), code: DNS_ERROR_CODES.suspendedProxy }]
    }
  }
}
