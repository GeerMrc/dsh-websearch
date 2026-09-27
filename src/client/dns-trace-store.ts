/**
 * The shared DNS trace store for the toolview rows (S35 T9): the rows are
 * self-drawn slot components with no Context, so the entry (which owns ctx)
 * registers the fetcher here and the rows read/refresh through this module
 * singleton. Entries are the host-sanitized ring (ADR-0022 D9) — nothing the
 * rows render can leak a plaintext sensitive hostname.
 *
 * @module dsh-websearch/client/dns-trace-store
 */
import type { DnsTraceEntryView } from './dns-remote.ts'

type Fetcher = () => Promise<readonly DnsTraceEntryView[]>

const listeners = new Set<() => void>()
let entries: readonly DnsTraceEntryView[] = []
let fetcher: Fetcher | undefined
let inFlight: Promise<void> | undefined

/**
 * Register the trace fetcher (the client entry; idempotent — the last
 * registration wins across HMR rebuilds).
 * @param next - pulls the sanitized ring across the mounted remote.
 */
export function registerDnsTraceFetcher(next: Fetcher): void {
  fetcher = next
}

/** The current sanitized entries, oldest first. */
export function dnsTraceEntries(): readonly DnsTraceEntryView[] {
  return entries
}

/** Subscribe to entry replacements; returns the unsubscribe. */
export function subscribeDnsTrace(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

/**
 * Pull a fresh ring through the registered fetcher; a no-op without one (an
 * entry that never mounted the remote) and coalesced while in flight.
 */
export function refreshDnsTrace(): Promise<void> {
  if (fetcher === undefined) return Promise.resolve()
  inFlight ??= (async () => {
    try {
      entries = await fetcher()
    } catch {
      // A transport failure keeps the last known ring — the section degrades
      // to stale data, never to an error surface inside a conversation row.
    } finally {
      inFlight = undefined
    }
    for (const listener of listeners) listener()
  })()
  return inFlight
}
