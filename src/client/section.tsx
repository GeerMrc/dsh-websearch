/**
 * Web-search settings section (S06 skeleton): five provider cards (key write
 * through credentials, configured status dot, hot enable switch) plus a
 * read-only chain display. Presentational on purpose — all host access lives
 * behind the action callbacks (the entry binds the controller), so jsdom tests
 * drive plain props and the slot mechanism only has to supply the `t` seat.
 *
 * Styling composes ui-primitives (requested through the manifest's
 * `dsh.client.external`, so their token-driven styles ship with the host) and
 * a minimal inline layer over verified `--dsw-alias-*` tokens; text color is
 * inherited from the settings shell. Brand labels are locale-neutral code
 * constants, not dictionary keys.
 *
 * @module dsh-websearch/client/section
 */
import { useState, useSyncExternalStore } from 'react'
import { Button, IconQuestionOutline14, Input, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { MEMBERS } from './controller.ts'
import type { WebSearchSettingsController, ActionResult, MemberSnapshot, SectionSnapshot } from './controller.ts'
import type { DshWsLocaleKey } from './locales.ts'

/** Presentational contract; the entry binds these to the controller. */
export interface SectionProps {
  snapshot: SectionSnapshot
  onSaveKey: (memberKey: string, value: string) => Promise<ActionResult>
  onClearKey: (memberKey: string) => Promise<ActionResult>
  onToggleEnabled: (memberKey: string, enabled: boolean) => Promise<ActionResult>
  onMoveSearch: (id: string, delta: -1 | 1) => Promise<ActionResult>
  onSetKeySelection: (memberKey: string, selection: 'order' | 'round-robin' | 'random') => Promise<ActionResult>
}

/**
 * Bind a controller into a registrable section component: the slot mechanism
 * supplies the `t` seat, the controller supplies state and actions through
 * the store subscription. The factory lives next to the presentational
 * component so the entry stays framework-light wiring.
 */
export function bindWebSearchSettingsSection(controller: WebSearchSettingsController) {
  return function BoundWebSearchSettingsSection(props: PropsLocale<'dsh-websearch'>) {
    const snapshot = useSyncExternalStore(
      (onStoreChange) => controller.subscribe(onStoreChange),
      () => controller.snapshot(),
    )
    return (
      <WebSearchSettingsSection
        t={props.t}
        snapshot={snapshot}
        onSaveKey={(key, value) => controller.setKey(key, value)}
        onClearKey={(key) => controller.clearKey(key)}
        onToggleEnabled={(key, enabled) => controller.setEnabled(key, enabled)}
        onMoveSearch={(id, delta) => controller.moveSearchChainEntry(id, delta)}
        onSetKeySelection={(key, selection) => controller.setKeySelection(key, selection)}
      />
    )
  }
}

const cardStyle = {
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: 12,
  background: 'var(--dsw-alias-bg-layer-3)',
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
} as const

const cardHeadStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
} as const

const nameStyle = {
  fontSize: 14,
  fontWeight: 500,
} as const

const hintStyle = {
  margin: 0,
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--dsw-alias-label-tertiary)',
} as const

const footerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 8,
} as const

/** Page-header info anchor (12b): the single key-format note seat. */
const infoButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: 'inherit',
  opacity: 0.6,
  cursor: 'help',
} as const

/** 11px pill (host badge convention) marking the DeepSeek card's shared credential. */
const sharedBadgeStyle = {
  fontSize: 11,
  padding: '1px 6px',
  borderRadius: 999,
  border: '1px solid var(--dsw-alias-border-l2)',
  color: 'var(--dsw-alias-label-tertiary)',
} as const

/** Key-selection row (S13 D2): label + three segments; the pressed segment
 * carries the field visual (bg-layer-1/border-l3 — Input wrapper precedent). */
const keySelRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
} as const

const keySelLabelStyle = {
  fontSize: 12,
  color: 'var(--dsw-alias-label-secondary)',
} as const

const keySelButtonStyle = (pressed: boolean, configured: boolean) =>
  ({
    fontSize: 12,
    lineHeight: '18px',
    padding: '2px 10px',
    cursor: configured ? 'pointer' : 'not-allowed',
    opacity: configured ? 1 : 0.4,
    borderRadius: 6,
    border: `1px solid var(--dsw-alias-border-${pressed ? 'l3' : 'l2'})`,
    background: pressed ? 'var(--dsw-alias-bg-layer-1)' : 'transparent',
    color: pressed ? 'var(--dsw-alias-label-secondary)' : 'var(--dsw-alias-label-tertiary)',
  }) as const

const feedbackStyle = {
  flex: 1,
  fontSize: 12,
  color: 'var(--dsw-alias-state-success-primary)',
} as const

/** Track follows the host switch shape (36x20, pad 2, r10 — SubagentModelSelectionCard
 * precedent) while keeping the S12 user-decided semantic green: green only when the
 * member is configured AND enabled — an unconfigured member never renders green. */
const switchStyle = (configured: boolean, enabled: boolean) =>
  ({
    boxSizing: 'border-box' as const,
    position: 'relative' as const,
    flex: '0 0 auto' as const,
    width: 36,
    height: 20,
    padding: 2,
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    background:
      configured && enabled
        ? 'var(--dsw-alias-state-success-primary)'
        : 'var(--dsw-alias-border-l3)',
  }) as const

const thumbStyle = (enabled: boolean) =>
  ({
    display: 'block' as const,
    position: 'absolute' as const,
    top: 2,
    left: 2,
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: 'var(--dsw-alias-label-primary-foreground)',
    transition: 'transform 120ms ease',
    transform: enabled ? 'translateX(16px)' : 'translateX(0px)',
  }) as const

/** Semantic status dot (host credentialDot precedent): role=img + aria-label +
 * title carry the configured state for assistive tech, unlike aria-hidden StateDot. */
const statusDotStyle = (configured: boolean) =>
  ({
    flex: '0 0 auto' as const,
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: configured
      ? 'var(--dsw-alias-state-success-primary)'
      : 'var(--dsw-alias-state-warn-label)',
  }) as const

// The Input primitive's own wrapper carries the full field visual (32px, r8,
// bg-layer-1, border) — only the width needs asserting here.
const inputStyle = {
  width: '100%',
} as const

/** Chain rows render the brand label; ids stay the test/action payload (D3). */
const labelOf = (id: string): string => MEMBERS.find((member) => member.memberId === id)?.label ?? id

/** The three pool policies and their label keys, in control order (S13 D2). */
const KEY_SELECTIONS = [
  { value: 'order', labelKey: 'keySelOrder' },
  { value: 'round-robin', labelKey: 'keySelRoundRobin' },
  { value: 'random', labelKey: 'keySelRandom' },
] as const

/** Locale key for one policy value (the hint interpolates the live policy name). */
const keySelectionLabelKey = (selection: 'order' | 'round-robin' | 'random'): DshWsLocaleKey =>
  KEY_SELECTIONS.find((entry) => entry.value === selection)?.labelKey ?? 'keySelOrder'

/** The section body (`t` arrives as the locale runtime's standard seat). */
export function WebSearchSettingsSection(props: SectionProps & PropsLocale<'dsh-websearch'>) {
  const { t, snapshot, onSaveKey, onClearKey, onToggleEnabled, onMoveSearch, onSetKeySelection } = props
  const [chainFeedback, setChainFeedback] = useState<'failed' | undefined>(undefined)

  const move = async (id: string, delta: -1 | 1): Promise<void> => {
    const result = await onMoveSearch(id, delta)
    setChainFeedback(result.ok ? undefined : 'failed')
  }

  const visibleSearch = snapshot.searchChain.filter((id) =>
    snapshot.members.some((m) => m.memberId === id && m.configured),
  )
  // The chain card only earns its place once at least one member is configured:
  // with nothing configured it read as a half-screen block of static copy.
  const showChains = snapshot.members.some((m) => m.configured)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {t('title')}
          {/* Page-level key-format note (12b): stated once behind this icon instead
          of repeated as a hint paragraph on every member card. */}
          <Tooltip label={t('keyFieldNote')} side="bottom" delayMs={400} maxWidth={320}>
            <button type="button" aria-label={t('keyFieldNote')} style={infoButtonStyle}>
              <IconQuestionOutline14 />
            </button>
          </Tooltip>
        </h3>
        <p style={{ margin: 0, marginTop: 4, fontSize: 14, lineHeight: '22px', color: 'var(--dsw-alias-label-tertiary)' }}>{t('description')}</p>
      </div>
      <div data-testid="dshws-members" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {snapshot.members.map((member) =>
          member.key === 'deepseek' ? (
            <DeepSeekFallbackRow key={member.key} member={member} t={t} onToggleEnabled={onToggleEnabled} />
          ) : (
            <MemberCard
              key={member.key}
              member={member}
              t={t}
              onSaveKey={onSaveKey}
              onClearKey={onClearKey}
              onToggleEnabled={onToggleEnabled}
              onSetKeySelection={onSetKeySelection}
            />
          ),
        )}
      </div>
      {/* The fallback rule, stated once below the grid (S14b D1): DeepSeek is
      not configured here — it rides the Models-page key as the chain floor. */}
      <p data-testid="dshws-fallback-footnote" style={{ ...hintStyle, margin: 0 }}>
        {t('fallbackFootnote')}
      </p>
      {showChains ? (
        <section data-testid="dshws-chains" style={{ ...cardStyle, padding: '10px 14px', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h4 style={{ margin: 0, fontSize: 12, fontWeight: 500, color: 'var(--dsw-alias-label-secondary)' }}>{t('searchChain')}</h4>
            <ChainStateBadge pinned={snapshot.searchChainPinned} t={t} />
          </div>
          <p style={hintStyle}>
            {t('chainDefaultHint')} {MEMBERS.map((m) => m.label).join(' → ')}
          </p>
          <ol
            data-testid="dshws-search-chain"
            style={{ margin: 0, paddingLeft: 0, listStyle: 'none', maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}
          >
            {/* Disabled boundaries follow the FILTERED (visible) list: computing them
            against the full chain left the last visible ↓ clickable and failing. */}
            {visibleSearch.map((id, index) => {
              // S14b D2: the visible list is the live serving order — a configured
              // but disabled member stays listed (position matters once re-enabled)
              // yet must read as inert, not as servable.
              const memberDisabled = snapshot.members.some((m) => m.memberId === id && !m.enabled)
              return (
              <li
                key={id}
                data-testid={`dshws-chain-item-${id}`}
                style={{ ...chainRowStyle, ...(memberDisabled ? { opacity: 0.45 } : {}) }}
                title={memberDisabled ? t('chainDisabledNote').trim() : undefined}
              >
                <span style={chainIndexStyle}>{index + 1}</span>
                <span data-dshws-chain-label="">{labelOf(id)}</span>
                {memberDisabled ? <span style={hintStyle}>{t('chainDisabledNote')}</span> : null}
                {/* Per-item aria labels: identical "move" buttons are a screen-reader ambiguity (S06 lesson). */}
                <button
                  type="button"
                  aria-label={`${labelOf(id)} ${t('moveUp')}`}
                  disabled={index === 0}
                  onClick={() => void move(id, -1)}
                  style={moveButtonStyle}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`${labelOf(id)} ${t('moveDown')}`}
                  disabled={index === visibleSearch.length - 1}
                  onClick={() => void move(id, 1)}
                  style={moveButtonStyle}
                >
                  ↓
                </button>
              </li>
              )
            })}
          </ol>
          {snapshot.members.every((m) => !(m.configured && m.enabled)) ? (
            <p role="status" data-testid="dshws-chain-no-usable" style={{ ...hintStyle, color: 'var(--dsw-alias-danger, #f87171)' }}>
              {t('chainNoUsableWarning')}
            </p>
          ) : null}
          <p style={hintStyle}>
            {t('timeout')}: {snapshot.timeoutMs} ms
          </p>
          {chainFeedback ? <p style={{ ...hintStyle, color: 'var(--dsw-alias-state-error-primary)' }} data-testid="dshws-chain-feedback">{t(chainFeedback)}</p> : null}
        </section>
      ) : null}
    </div>
  )
}

const chainRowStyle = {
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr) auto auto',
  gap: 8,
  alignItems: 'center',
  padding: 6,
  borderRadius: 6,
} as const

const chainIndexStyle = {
  fontSize: 12,
  color: 'var(--dsw-alias-label-tertiary)',
  minWidth: 14,
} as const

const moveButtonStyle = {
  width: 28,
  height: 28,
  lineHeight: 1,
  padding: 0,
  cursor: 'pointer',
  border: 'none',
  borderRadius: 6,
  background: 'transparent',
  color: 'var(--dsw-alias-label-secondary)',
} as const

/** The pinned-override marker: data attribute for tests, copy for humans (plan 007 D1);
 * a plain 11px badge — the default-order explanation lives in the card hint line. */
function ChainStateBadge(props: { pinned: boolean; t: (key: DshWsLocaleKey) => string }) {
  return (
    <span
      data-dshws-chain-state={props.pinned ? 'pinned' : 'default'}
      style={{
        fontSize: 11,
        padding: '1px 6px',
        borderRadius: 999,
        border: '1px solid var(--dsw-alias-border-l2)',
        color: 'var(--dsw-alias-label-tertiary)',
      }}
    >
      {props.pinned ? props.t('chainPinned') : props.t('chainDefault')}
    </span>
  )
}

/**
 * The DeepSeek fallback row (S14b D1, user ruling): DeepSeek is not a
 * symmetric config card — it shares DEEPSEEK_API_KEY with the Models page, so
 * a key input (and a comma pool on that shared ref) would poison chat auth.
 * The row carries the live readiness dot, the shared-key badge, the takeover
 * semantics behind an ⓘ tooltip, and the paid-fallback off-switch (the
 * ADR-0004 neutrality opt-out).
 */
function DeepSeekFallbackRow(props: {
  member: MemberSnapshot
  t: (key: DshWsLocaleKey) => string
  onToggleEnabled: (memberKey: string, enabled: boolean) => Promise<ActionResult>
}) {
  const { member, t, onToggleEnabled } = props
  const statusText = member.configured ? t('configured') : t('notConfigured')
  return (
    <div data-testid="dshws-fallback-deepseek" style={{ ...cardStyle, flexDirection: 'row', alignItems: 'center', gap: 8, padding: '10px 14px' }}>
      <span role="img" aria-label={statusText} title={statusText} style={statusDotStyle(member.configured)} />
      <strong style={nameStyle}>{member.label}</strong>
      <span title={t('sharedWithModelsDetail')} style={sharedBadgeStyle}>{t('sharedWithModels')}</span>
      <Tooltip label={t('fallbackNote')} side="bottom" delayMs={400} maxWidth={360}>
        <button type="button" aria-label={t('fallbackInfo')} style={infoButtonStyle}>
          <IconQuestionOutline14 />
        </button>
      </Tooltip>
      <span style={{ flex: 1 }} />
      <button
        type="button"
        role="switch"
        aria-checked={member.enabled}
        aria-label={`${member.label} ${t('fallbackSwitch')}`}
        disabled={!member.configured}
        onClick={() => void onToggleEnabled(member.key, !member.enabled)}
        style={{ ...switchStyle(member.configured, member.enabled), cursor: member.configured ? 'pointer' : 'not-allowed', opacity: member.configured ? 1 : 0.4 }}
      >
        <span style={thumbStyle(member.enabled)} />
      </button>
    </div>
  )
}

function MemberCard(props: {
  member: MemberSnapshot
  t: (key: DshWsLocaleKey) => string
  onSaveKey: SectionProps['onSaveKey']
  onClearKey: SectionProps['onClearKey']
  onToggleEnabled: SectionProps['onToggleEnabled']
  onSetKeySelection: SectionProps['onSetKeySelection']
}) {
  const { member, t, onSaveKey, onClearKey, onToggleEnabled, onSetKeySelection } = props
  const [draft, setDraft] = useState('')
  const [feedback, setFeedback] = useState<Extract<DshWsLocaleKey, 'saved' | 'cleared' | 'failed'> | undefined>(undefined)
  const save = async (): Promise<void> => {
    const result = await onSaveKey(member.key, draft)
    if (result.ok) {
      setDraft('')
      setFeedback('saved')
    } else {
      setFeedback('failed')
    }
  }

  const clear = async (): Promise<void> => {
    const result = await onClearKey(member.key)
    setFeedback(result.ok ? 'cleared' : 'failed')
  }


  const statusText = member.configured ? t('configured') : t('notConfigured')

  return (
    <div data-testid={`dshws-member-${member.key}`} style={cardStyle}>
      <div style={cardHeadStyle}>
        <span role="img" aria-label={statusText} title={statusText} style={statusDotStyle(member.configured)} />
        <strong style={nameStyle}>{member.label}</strong>
        {member.key === 'deepseek' ? (
          <span title={t('sharedWithModelsDetail')} style={sharedBadgeStyle}>{t('sharedWithModels')}</span>
        ) : null}
        <span style={{ flex: 1 }} />
        <button
          type="button"
          role="switch"
          aria-checked={member.enabled}
          aria-label={`${member.label} ${t('enabled')}`}
          disabled={!member.configured}
          onClick={() => void onToggleEnabled(member.key, !member.enabled)}
          style={{ ...switchStyle(member.configured, member.enabled), cursor: member.configured ? 'pointer' : 'not-allowed', opacity: member.configured ? 1 : 0.4 }}
        >
          <span style={thumbStyle(member.enabled)} />
        </button>
      </div>
      <Input
        type="password"
        aria-label={`${member.label} ${t('apiKey')}`}
        placeholder={member.refName}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        style={inputStyle}
      />
      {/* Key-selection control (S13 D2/D3): the pool policy plus the two-level
      call-semantics note — per-button member-prefixed names avoid the
      identical-buttons ambiguity (S06 lesson). */}
      <div role="group" aria-label={`${member.label} ${t('keySelection')}`} style={keySelRowStyle}>
        <span style={keySelLabelStyle}>{t('keySelection')}</span>
        {KEY_SELECTIONS.map((entry) => (
          <button
            key={entry.value}
            type="button"
            aria-pressed={member.keySelection === entry.value}
            aria-label={`${member.label} ${t(entry.labelKey)}`}
            data-testid={`dshws-keysel-${member.key}-${entry.value}`}
            disabled={!member.configured}
            onClick={() => void onSetKeySelection(member.key, entry.value)}
            style={keySelButtonStyle(member.keySelection === entry.value, member.configured)}
          >
            {t(entry.labelKey)}
          </button>
        ))}
      </div>
      <p data-testid={`dshws-keysel-hint-${member.key}`} style={{ ...hintStyle, marginTop: -6 }}>
        {t('keySelectionHint').replace('{policy}', t(keySelectionLabelKey(member.keySelection)))}
      </p>
      <div style={footerStyle}>
        {feedback ? (
          <span role="status" data-testid={`dshws-feedback-${member.key}`} style={feedbackStyle}>{t(feedback)}</span>
        ) : (
          <span style={{ flex: 1 }} />
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={!member.configured}
          aria-label={`${member.label} ${t('clear')}`}
          onClick={() => void clear()}
        >
          {t('clear')}
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={draft === ''}
          aria-label={`${member.label} ${t('save')}`}
          onClick={() => void save()}
        >
          {t('save')}
        </Button>
      </div>
    </div>
  )
}
