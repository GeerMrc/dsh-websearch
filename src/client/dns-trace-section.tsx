/**
 * The DNS resolution trace section for the toolview rows (S35 T9): renders
 * the sanitized ring (via the shared store) inside a `<details>` fold — the
 * process-level recent resolutions with via/latency/code, refreshed when the
 * fold opens. Attribution is the ring window, not per-call wiring: per-call
 * trace threading needs a session-event channel and stays a registered
 * follow-up (session-35 record).
 *
 * @module dsh-websearch/client/dns-trace-section
 */
import { useSyncExternalStore } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { dnsTraceEntries, refreshDnsTrace, subscribeDnsTrace } from './dns-trace-store.ts'

const traceLineStyle = {
  margin: 0,
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--dsw-alias-label-tertiary)',
} as const

/**
 * The shared trace fold — one per toolview row, all reading the same ring.
 * @param props - the locale seat (`t`).
 */
export function DnsTraceSection(props: PropsLocale<'dsh-websearch'>) {
  const { t } = props
  const entries = useSyncExternalStore(subscribeDnsTrace, dnsTraceEntries)
  return (
    <details
      data-testid="dshws-tool-dns-trace"
      onToggle={(event) => {
        if ((event.target as HTMLDetailsElement).open) void refreshDnsTrace()
      }}
      style={{ borderTop: '1px solid var(--dsw-alias-border-l2)', paddingTop: 6 }}
    >
      <summary style={{ ...traceLineStyle, cursor: 'pointer', listStyle: 'revert' }}>{t('dnsTraceTitle')}</summary>
      {entries.length === 0 ? (
        <p style={traceLineStyle}>{t('dnsTraceEmpty')}</p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {entries.slice(-8).reverse().map((entry, index) => (
            <li key={`${entry.at}-${index}`} style={traceLineStyle}>
              {entry.kind} {entry.host}
              {entry.via !== undefined ? ` · ${entry.via}` : ''}
              {entry.latencyMs !== undefined ? ` · ${t('dnsTraceLatency').replace('{ms}', String(entry.latencyMs))}` : ''}
              {entry.code !== undefined ? ` · ${entry.code}` : ''}
            </li>
          ))}
        </ul>
      )}
    </details>
  )
}
