/**
 * The DNS resilience card rendered at the bottom of the web-search settings
 * section (S35, ADR-0022).
 *
 * @module dsh-websearch/client/dns-card
 */
import { useState } from 'react'
import { Button, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import { ChevronDownIcon, QuestionIcon } from './host-icons.tsx'
import type { ActionResult, SectionSnapshot } from './controller.ts'
import type { DshWsLocaleKey } from './locales.ts'
import {
  cardStyle,
  cardHeadStyle,
  nameStyle,
  hintStyle,
  paramRowStyle,
  groupHeaderStyle,
  fieldLabelStyle,
  fieldInputStyle,
  infoButtonStyle,
  switchStyle,
  thumbStyle,
  statusDotStyle,
  selectStyle,
  useAutoClearFeedback,
} from './section-styles.ts'

/**
 * The DNS resilience block (S35, user ruling: bottom of the「网页搜索」
 * section): mode/scope/preset selectors, the custom-node textarea, the live
 * detection status with its evidence, the re-check button, and the recent
 * resolution trace. Old hosts (no DNS remote) render the config-only view —
 * the status copy reflects the not-yet-detected state without a verdict.
 */
export function DnsResilienceCard(props: {
  t: (key: DshWsLocaleKey) => string
  snapshot: SectionSnapshot
  onSetDnsMode: (mode: 'auto' | 'on' | 'off') => Promise<ActionResult>
  onSetDnsProbeMethod: (method: 'tcp' | 'tls-hello') => Promise<ActionResult>
  onSetDnsPreset: (preset: 'auto' | 'cn' | 'global' | 'custom') => Promise<ActionResult>
  onSetDnsNodes: (text: string) => Promise<ActionResult>
  onRecheckDns: () => Promise<ActionResult>
  onRefreshDnsFace: () => Promise<void>
}) {
  const { t, snapshot, onSetDnsMode, onSetDnsPreset, onSetDnsNodes, onRecheckDns, onRefreshDnsFace, onSetDnsProbeMethod } = props
  const dns = snapshot.dns
  const [open, setOpen] = useState(false)
  const [nodesDraft, setNodesDraft] = useState<string | null>(null)
  const [rechecking, setRechecking] = useState(false)
  const [feedback, setFeedback] = useAutoClearFeedback<'saved' | 'failed'>()
  const nodesValue = nodesDraft ?? dns.nodesText
  const decisionCopy: DshWsLocaleKey = dns.status?.decision === undefined || dns.status.decision === null
    ? 'dnsDecisionNone'
    : dns.status.decision.verdict === 'poisoned'
      ? 'dnsDecisionPoisoned'
      : dns.status.decision.verdict === 'inconclusive'
        ? 'dnsDecisionInconclusive'
        : dns.status.decision.verdict === 'empty'
          ? 'dnsDecisionEmpty'
          : 'dnsDecisionClean'
  const statusCopy: DshWsLocaleKey = dns.status?.proxyActive === true
    ? 'dnsStatusSuspended'
    : dns.status?.armed === true
      ? 'dnsStatusArmed'
      : 'dnsStatusIdle'
  const run = async (action: () => Promise<ActionResult>): Promise<void> => {
    const result = await action()
    setFeedback(result.ok ? 'saved' : 'failed')
  }
  const recheck = async (): Promise<void> => {
    setRechecking(true)
    await run(onRecheckDns)
    setRechecking(false)
  }
  // S36 (plan 036): expanding refreshes the remote face — the member-card
  // expand→refreshCounts precedent, fixing the stale status chip.
  const toggle = (): void => {
    setOpen((value) => !value)
    if (!open) void onRefreshDnsFace()
  }
  return (
    <section data-testid="dshws-dns-card" style={cardStyle}>
      <div style={cardHeadStyle}>
        <button
          type="button"
          data-testid="dshws-dns-toggle"
          data-dshws-focusable=""
          aria-expanded={open}
          aria-label={`${t('dnsTitle')} ${t('configure')}`}
          onClick={toggle}
          style={{ ...cardHeadStyle, flex: 1, minWidth: 0, border: 'none', background: 'transparent', color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer', padding: 0 }}
        >
          <span role="img" aria-label={t(statusCopy)} title={t(statusCopy)} style={statusDotStyle(dns.status?.armed === true)} />
          <strong style={nameStyle}>{t('dnsTitle')}</strong>
          <Tooltip label={t('dnsDescription')} side="bottom" delayMs={400} maxWidth={360}>
            <button type="button" aria-label={t('dnsDescription')} data-testid="dshws-dns-info" style={{ ...infoButtonStyle, border: 'none', background: 'transparent' }}>
              <QuestionIcon />
            </button>
          </Tooltip>
          <span style={{ flex: 1 }} />
          <span aria-hidden="true" data-dshws-chevron="" style={{ display: 'inline-flex', color: 'var(--dsw-alias-label-tertiary)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }}>
            <ChevronDownIcon />
          </span>
        </button>
        <button
          type="button"
          role="switch"
          data-dshws-focusable=""
          aria-checked={dns.mode !== 'off'}
          aria-label={`${t('dnsTitle')} ${t('enabled')}`}
          onClick={() => { void run(() => onSetDnsMode(dns.mode === 'off' ? 'auto' : 'off')) }}
          style={{ ...switchStyle(true, dns.mode !== 'off'), cursor: 'pointer' }}
        >
          <span style={thumbStyle(dns.mode !== 'off')} />
        </button>
      </div>
      <p role="status" data-testid="dshws-dns-decision" style={hintStyle}>{t(decisionCopy)}</p>
      {dns.status?.decision?.hits.length ? (
        <p data-testid="dshws-dns-hits" style={hintStyle}>
          {t('dnsHitsLabel')}: {dns.status.decision.hits.map((hit) => `${hit.host}→${hit.addresses.join(',')}`).join(' ')}
        </p>
      ) : null}
      {dns.status?.decision?.failures.length ? (
        <p data-testid="dshws-dns-failures" style={hintStyle}>
          {t('dnsFailuresLabel')}: {dns.status.decision.failures.map((failure) => `${failure.host}:${failure.reason}`).join(' ')}
        </p>
      ) : null}
      {open ? (
        <>
          {/* S36 (plan 036): selector rows adopt the member-parameter rhythm —
          label + ⓘ tooltip left, control right; hints never occupy a line. */}
          <div style={paramRowStyle}>
            <label style={{ ...fieldLabelStyle, flex: 1 }}>{t('dnsModeLabel')}
              <Tooltip label={t('dnsModeHint')} side="bottom" delayMs={400} maxWidth={320}>
                <button type="button" aria-label={t('dnsModeLabel')} style={{ ...infoButtonStyle, padding: 0, border: 'none', background: 'transparent' }}>
                  <QuestionIcon />
                </button>
              </Tooltip>
            </label>
            <select data-testid="dshws-dns-mode" data-dshws-focusable="" data-dshws-input="" value={dns.mode} onChange={(event) => { void run(() => onSetDnsMode(event.target.value as 'auto' | 'on' | 'off')) }} style={selectStyle}>
              <option value="auto" title={t('dnsModeAuto')}>{t('dnsModeAutoShort')}</option>
              <option value="on" title={t('dnsModeOn')}>{t('dnsModeOnShort')}</option>
              <option value="off">{t('dnsModeOff')}</option>
            </select>
          </div>
          <div style={paramRowStyle}>
            <label style={{ ...fieldLabelStyle, flex: 1 }}>{t('dnsProbeMethodLabel')}
              <Tooltip label={t('dnsProbeMethodHint')} side="bottom" delayMs={400} maxWidth={320}>
                <button type="button" aria-label={t('dnsProbeMethodLabel')} style={{ ...infoButtonStyle, padding: 0, border: 'none', background: 'transparent' }}>
                  <QuestionIcon />
                </button>
              </Tooltip>
            </label>
            <select data-testid="dshws-dns-probe-method" data-dshws-focusable="" data-dshws-input="" value={dns.probeMethod} onChange={(event) => { void run(() => onSetDnsProbeMethod(event.target.value as 'tcp' | 'tls-hello')) }} style={selectStyle}>
              <option value="tcp" title={t('dnsProbeMethodTcp')}>TCP</option>
              <option value="tls-hello" title={t('dnsProbeMethodTlsHello')}>TLS</option>
            </select>
          </div>
          <div style={paramRowStyle}>
            <label style={{ ...fieldLabelStyle, flex: 1 }}>{t('dnsPresetLabel')}
              <Tooltip label={dns.preset === 'custom' ? t('dnsNodesHint') : t('dnsPresetHint')} side="bottom" delayMs={400} maxWidth={320}>
                <button type="button" aria-label={t('dnsPresetLabel')} style={{ ...infoButtonStyle, padding: 0, border: 'none', background: 'transparent' }}>
                  <QuestionIcon />
                </button>
              </Tooltip>
            </label>
            <select data-testid="dshws-dns-preset" data-dshws-focusable="" data-dshws-input="" value={dns.preset} onChange={(event) => { void run(() => onSetDnsPreset(event.target.value as 'auto' | 'cn' | 'global' | 'custom')) }} style={selectStyle}>
              <option value="auto" title={t('dnsPresetAuto')}>{t('dnsPresetAutoShort')}</option>
              <option value="cn" title={t('dnsPresetCn')}>{t('dnsPresetCnShort')}</option>
              <option value="global" title={t('dnsPresetGlobal')}>{t('dnsPresetGlobalShort')}</option>
              <option value="custom">{t('dnsPresetCustom')}</option>
            </select>
          </div>
          {dns.preset === 'custom' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={fieldLabelStyle}>{t('dnsNodesLabel')}
                <Tooltip label={t('dnsNodesHint')} side="bottom" delayMs={400} maxWidth={320}>
                  <button type="button" aria-label={t('dnsNodesLabel')} style={{ ...infoButtonStyle, padding: 0, border: 'none', background: 'transparent' }}>
                    <QuestionIcon />
                  </button>
                </Tooltip>
              </label>
              <textarea
                data-testid="dshws-dns-nodes"
                data-dshws-focusable=""
                data-dshws-input=""
                rows={3}
                spellCheck={false}
                value={nodesValue}
                placeholder={'223.5.5.5,dns.alidns.com,/resolve,443'}
                onChange={(event) => { setNodesDraft(event.target.value) }}
                onBlur={() => { if (nodesDraft !== null && nodesDraft !== dns.nodesText) { void run(() => onSetDnsNodes(nodesValue)) } }}
                style={{ ...fieldInputStyle, height: 'auto', padding: '6px 10px', lineHeight: '18px', resize: 'vertical' }}
              />
            </div>
          ) : null}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button variant="outline" size="sm" disabled={rechecking} aria-label={t('dnsRecheck')} onClick={() => { void recheck() }}>{rechecking ? t('dnsRechecking') : t('dnsRecheck')}</Button>
            {feedback !== undefined ? <span role="status" data-testid="dshws-dns-feedback" style={{ ...hintStyle, flex: undefined }}>{t(feedback)}</span> : null}
          </div>
          <p style={groupHeaderStyle}>{t('dnsTraceTitle')}</p>
          {dns.trace.length === 0 ? (
            <p style={hintStyle}>{t('dnsTraceEmpty')}</p>
          ) : (
            <ul data-testid="dshws-dns-trace" style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }}>
              {dns.trace.slice(-8).reverse().map((entry, index) => (
                <li key={`${entry.at}-${index}`} data-testid="dshws-dns-trace-entry">
                  {entry.kind} {entry.host}
                  {entry.via !== undefined ? ` · ${entry.via}` : ''}
                  {entry.latencyMs !== undefined ? ` · ${t('dnsTraceLatency').replace('{ms}', String(entry.latencyMs))}` : ''}
                  {entry.code !== undefined ? ` · ${entry.code}` : ''}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </section>
  )
}
