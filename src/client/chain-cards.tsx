/**
 * Chain-level cards of the web-search settings section: the DeepSeek fallback
 * selector row (ADR-0014), the universal web_fetch takeover fold (S15a), and
 * the fetch degradation chain rows (S21, ADR-0019).
 *
 * @module dsh-websearch/client/chain-cards
 */
import { useState } from 'react'
import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import { ChevronDownIcon, QuestionIcon } from './host-icons.tsx'
import { memberLabelOf } from './controller.ts'
import type { ActionResult, SectionSnapshot } from './controller.ts'
import type { DshWsLocaleKey } from './locales.ts'
import {
  cardStyle,
  nameStyle,
  hintStyle,
  infoButtonStyle,
  feedbackColor,
  feedbackStyle,
  switchStyle,
  thumbStyle,
  statusDotStyle,
  chainRowStyle,
  chainIndexStyle,
  roleChipStyle,
  moveButtonStyle,
  selectStyle,
  useAutoClearFeedback,
} from './section-styles.ts'

/**
 * The DeepSeek fallback row (S14b D1, user ruling): DeepSeek is not a
 * symmetric config card — it shares DEEPSEEK_API_KEY with the Models page, so
 * a key input (and a comma pool on that shared ref) would poison chat auth.
 * The row carries the live readiness dot, the shared-key badge, the takeover
 * semantics behind an ⓘ tooltip, and the paid-fallback off-switch (the
 * ADR-0004 neutrality opt-out).
 */
export function FallbackToolRow(props: {
  snapshot: SectionSnapshot
  t: (key: DshWsLocaleKey) => string
  onChoose: (member: SectionSnapshot['fallbackSelection']) => Promise<ActionResult>
}) {
  const { snapshot, t, onChoose } = props
  const { fallbackSelection, readyToolMembers, fallbackDeepseekEligible, fallbackDesignationReady } = snapshot
  const readyCount = readyToolMembers.length
  // Contract (ADR-0014): two-plus ready tools → the selector offers the tool
  // members only; zero or one → it offers the paid DeepSeek candidate.
  const toolOptions = readyCount >= 2 ? readyToolMembers : []
  const offerDeepseek = readyCount <= 1
  const deepseekKeyed = snapshot.members.some((m) => m.key === 'deepseek' && m.configured)
  // A stored DeepSeek designation with two-plus ready tools is not offered:
  // the intent degrades to auto — display auto and explain below.
  const effective = fallbackSelection === 'dshws-deepseek' && !offerDeepseek ? 'auto' : fallbackSelection
  const [feedback, setFeedback] = useAutoClearFeedback<'saved' | 'failed'>()
  const note =
    fallbackSelection === 'dshws-deepseek' && !offerDeepseek ? t('fallbackDeepseekStoppedNote')
    : fallbackSelection === 'dshws-deepseek' && !deepseekKeyed ? t('fallbackDeepseekKeylessNote')
    : fallbackSelection !== 'auto' && fallbackSelection !== 'dshws-deepseek' && !fallbackDesignationReady ? t('fallbackDesignationLostNote')
    : undefined
  const dotOn = effective === 'dshws-deepseek'
    ? (deepseekKeyed && fallbackDeepseekEligible)
    : effective !== 'auto' ? fallbackDesignationReady : false
  const dotTitle = dotOn ? t('configured') : note !== undefined ? t('notConfigured') : undefined
  return (
    <div data-testid="dshws-fallback-tool" data-dshws-card="" style={{ ...cardStyle, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span role="img" aria-label={dotTitle} title={dotTitle} data-testid="dshws-fallback-dot" style={statusDotStyle(dotOn)} />
        <strong style={nameStyle}>{t('fallbackRowLabel')}</strong>
        <Tooltip label={t('fallbackNote')} side="bottom" delayMs={400} maxWidth={360}>
          <button type="button" aria-label={t('fallbackInfo')} style={infoButtonStyle}>
            <QuestionIcon />
          </button>
        </Tooltip>
        <span style={{ flex: 1 }} />
        <select
          aria-label={t('fallbackRowLabel')}
          data-testid="dshws-fallback-select" data-dshws-focusable="" data-dshws-input=""
          value={effective}
          onChange={(event) => {
            const next = event.target.value as SectionSnapshot['fallbackSelection']
            void onChoose(next).then((result) => setFeedback(result.ok ? 'saved' : 'failed'))
          }}
          style={{ ...selectStyle, minWidth: 0 }}
        >
          <option value="auto" title={t('fallbackAutoOption')}>{t('fallbackAutoShort')}</option>
          {toolOptions.map((id) => <option key={id} value={id}>{memberLabelOf(id)}</option>)}
          {offerDeepseek ? <option value="dshws-deepseek" title={t('fallbackDeepseekOption')}>{t('fallbackDeepseekShort')}</option> : null}
        </select>
      </div>
      {note !== undefined ? (
        <p role="status" data-testid="dshws-fallback-note" style={{ ...hintStyle, margin: 0, color: 'var(--dsw-alias-state-warn-label)' }}>{note}</p>
      ) : null}
      {feedback !== undefined ? (
        <p role="status" data-testid="dshws-fallback-feedback" style={{ ...hintStyle, margin: 0, color: feedbackColor(feedback === 'saved' ? 'saved' : 'failed') }}>{t(feedback)}</p>
      ) : null}
    </div>
  )
}

/** Universal web_fetch takeover toggle (S15a; S22b member-card fold): the
 * header row (label, ⓘ, switch) is the steady state, the Web Fetch chain
 * rows open on demand and only while the takeover is on. */
export function FetchTakeoverRow(props: {
  t: (key: DshWsLocaleKey) => string
  active: boolean
  onSet: (active: boolean) => Promise<ActionResult>
  /** The Web Fetch chain block; rendered only when the fold is open AND the takeover is on. */
  chain: React.ReactNode
}) {
  const { t, active, onSet, chain } = props
  const [feedback, setFeedback] = useAutoClearFeedback<'saved' | 'failed'>()
  const [open, setOpen] = useState(false)
  return (
    <div data-testid="dshws-fetch-takeover" data-dshws-card="" data-open={open} style={{ ...cardStyle, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          data-testid="dshws-fetch-takeover-disclosure"
          data-dshws-focusable=""
          aria-expanded={open}
          aria-label={`${t('fetchTakeoverLabel')} ${t('configure')}`}
          onClick={() => { setOpen((value) => !value) }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, border: 'none', background: 'transparent', color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer', padding: 0 }}
        >
          <strong style={nameStyle}>{t('fetchTakeoverLabel')}</strong>
          <Tooltip label={t('fetchTakeoverNoteS21')} side="bottom" delayMs={400} maxWidth={380}>
            <button type="button" aria-label={t('fetchTakeoverNoteS21')} style={infoButtonStyle}>
              <QuestionIcon />
            </button>
          </Tooltip>
          <span style={{ flex: 1 }} />
          {/* S23 D1: the host chevron icon; 160ms rotation (D16 exemption lands with the T4 style block). */}
          <span aria-hidden="true" style={{ display: 'inline-flex', color: 'var(--dsw-alias-label-tertiary)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }} data-dshws-chevron="">
            <ChevronDownIcon />
          </span>
        </button>
        <button
          type="button"
          role="switch"
          data-dshws-focusable=""
          aria-checked={active}
          aria-label={t('fetchTakeoverLabel')}
          data-testid="dshws-fetch-takeover-toggle"
          onClick={() => { void onSet(!active).then((result) => setFeedback(result.ok ? 'saved' : 'failed')) }}
          style={{ ...switchStyle(active, active), cursor: 'pointer' }}
        >
          <span style={thumbStyle(active)} />
        </button>
        {feedback !== undefined ? (
          <span role="status" data-testid="dshws-fetch-takeover-feedback" style={{ ...feedbackStyle, flex: undefined, color: feedbackColor(feedback === 'saved' ? 'saved' : 'failed') }}>{t(feedback)}</span>
        ) : null}
      </div>
      {/* S22a T3 + S22b: the chain renders only when the fold is open AND the
      takeover is on — collapsed or off, the rows take no viewport. */}
      {open && active ? chain : null}
    </div>
  )
}

/** Fetch-chain rows (S21, ADR-0019): the web_fetch degradation order — visible
 * once any fetch-capable member is configured; Firecrawl leads by default. */
export function FetchChainRows(props: {
  t: (key: DshWsLocaleKey) => string
  snapshot: SectionSnapshot
  onMove: (id: string, delta: -1 | 1) => Promise<ActionResult>
}) {
  const { t, snapshot, onMove } = props
  const [feedback, setFeedback] = useState<'failed' | undefined>(undefined)
  const visible = snapshot.fetchChain.filter((id) =>
    snapshot.members.some((m) => m.memberId === id && m.configured && m.enabled),
  )
  if (visible.length === 0) return null
  const move = async (id: string, delta: -1 | 1): Promise<void> => {
    const result = await onMove(id, delta)
    setFeedback(result.ok ? undefined : 'failed')
  }
  return (
    <div data-testid="dshws-fetch-chain" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h4 style={{ margin: 0, fontSize: 12, fontWeight: 500, color: 'var(--dsw-alias-label-secondary)' }}>{t('fetchChainLabel')}</h4>
        <Tooltip label={t('fetchChainHint')} side="bottom" delayMs={200} maxWidth={360}>
          <button
            type="button"
            aria-label={t('fetchChainHint')}
            data-testid="dshws-fetch-chain-info"
            style={infoButtonStyle}
          >
            <QuestionIcon />
          </button>
        </Tooltip>
        {feedback ? <span role="status" data-testid="dshws-fetch-chain-feedback" style={{ ...hintStyle, color: 'var(--dsw-alias-state-error-primary)' }}>{t(feedback)}</span> : null}
      </div>
      <ol data-testid="dshws-fetch-chain-list" style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {visible.map((id, index) => (
          <li key={id} data-testid={`dshws-fetch-chain-item-${id}`} style={chainRowStyle}>
            <span style={chainIndexStyle}>{index + 1}</span>
            {/* S22a T1: same label-cell chip placement as the search chain. */}
            <span data-dshws-chain-label="" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              {memberLabelOf(id)}
              {index === 0 ? <span data-testid="dshws-fetch-role-primary" style={roleChipStyle}>{t('chainRolePrimary')}</span> : null}
            </span>
            <button type="button" data-dshws-focusable="" aria-label={`${memberLabelOf(id)} ${t('moveUp')}`} disabled={index === 0} onClick={() => void move(id, -1)} style={moveButtonStyle}>↑</button>
            <button type="button" data-dshws-focusable="" aria-label={`${memberLabelOf(id)} ${t('moveDown')}`} disabled={index === visible.length - 1} onClick={() => void move(id, 1)} style={moveButtonStyle}>↓</button>
          </li>
        ))}
      </ol>
    </div>
  )
}
