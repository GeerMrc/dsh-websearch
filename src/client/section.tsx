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

/** T1 interim: still referenced by ChainStateBadge's info anchor (T2 removes it
 * together with the tooltip itself). */
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

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box' as const,
} as const

/** Chain rows render the brand label; ids stay the test/action payload (D3). */
const labelOf = (id: string): string => MEMBERS.find((member) => member.memberId === id)?.label ?? id

/** The section body (`t` arrives as the locale runtime's standard seat). */
export function WebSearchSettingsSection(props: SectionProps & PropsLocale<'dsh-websearch'>) {
  const { t, snapshot, onSaveKey, onClearKey, onToggleEnabled, onMoveSearch } = props
  const [chainFeedback, setChainFeedback] = useState<'failed' | undefined>(undefined)

  const move = async (id: string, delta: -1 | 1): Promise<void> => {
    const result = await onMoveSearch(id, delta)
    setChainFeedback(result.ok ? undefined : 'failed')
  }

  const visibleSearch = snapshot.searchChain.filter((id) =>
    snapshot.members.some((m) => m.memberId === id && m.configured),
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <h3 style={{ margin: 0 }}>{t('title')}</h3>
        <p style={{ margin: 0 }}>{t('description')}</p>
      </div>
      <div data-testid="dshws-members" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {snapshot.members.map((member) => (
          <MemberCard
            key={member.key}
            member={member}
            t={t}
            onSaveKey={onSaveKey}
            onClearKey={onClearKey}
            onToggleEnabled={onToggleEnabled}
          />
        ))}
      </div>
      <section data-testid="dshws-chains" style={{ ...cardStyle, padding: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h4 style={{ margin: 0 }}>{t('searchChain')}</h4>
          <ChainStateBadge pinned={snapshot.searchChainPinned} t={t} />
        </div>
        <ol data-testid="dshws-search-chain" style={{ margin: 0, paddingLeft: 20 }}>
          {/* Disabled boundaries follow the FILTERED (visible) list: computing them
          against the full chain left the last visible ↓ clickable and failing. */}
          {visibleSearch.map((id, index) => (
            <li key={id} data-testid={`dshws-chain-item-${id}`} style={chainItemStyle}>
              <span>{labelOf(id)}</span>
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
          ))}
        </ol>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h4 style={{ margin: 0 }}>{t('fetchChain')}</h4>
          <ChainStateBadge pinned={snapshot.fetchChainPinned} t={t} />
        </div>
        <ol data-testid="dshws-fetch-chain" style={{ margin: 0, paddingLeft: 20 }}>
          {snapshot.fetchChain.map((id) => (
            <li key={id}>
              <span>{labelOf(id)}</span>
            </li>
          ))}
        </ol>
        <span>
          {t('timeout')}: {snapshot.timeoutMs} ms
        </span>
        {chainFeedback ? <span data-testid="dshws-chain-feedback">{t(chainFeedback)}</span> : null}
      </section>
    </div>
  )
}

const chainItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  justifyContent: 'space-between',
} as const

const moveButtonStyle = {
  width: 22,
  height: 22,
  lineHeight: 1,
  padding: 0,
  cursor: 'pointer',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: 4,
  background: 'var(--dsw-alias-bg-base)',
} as const

/** The pinned-override marker: data attribute for tests, copy for humans (plan 007 D1).
 * The default (unpinned) state carries an ⓘ whose bubble spells the built-in order,
 * derived from MEMBERS — the same source as BUILT_IN_MEMBER_ORDER, never hardcoded. */
function ChainStateBadge(props: { pinned: boolean; t: (key: DshWsLocaleKey) => string }) {
  if (props.pinned) {
    return (
      <span
        data-dshws-chain-state="pinned"
        style={{ fontSize: 12 }}
      >
        {props.t('chainPinned')}
      </span>
    )
  }
  return (
    <span
      data-dshws-chain-state="default"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12 }}
    >
      {props.t('chainDefault')}
      <Tooltip
        label={`${props.t('chainDefaultHint')} ${MEMBERS.map((member) => member.label).join(' → ')}`}
        side="bottom"
        delayMs={400}
        maxWidth={320}
      >
        <button type="button" aria-label={props.t('chainDefault')} style={infoButtonStyle}>
          <IconQuestionOutline14 />
        </button>
      </Tooltip>
    </span>
  )
}

function MemberCard(props: {
  member: MemberSnapshot
  t: (key: DshWsLocaleKey) => string
  onSaveKey: SectionProps['onSaveKey']
  onClearKey: SectionProps['onClearKey']
  onToggleEnabled: SectionProps['onToggleEnabled']
}) {
  const { member, t, onSaveKey, onClearKey, onToggleEnabled } = props
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
      <p style={hintStyle}>{t('keyFieldNote')}</p>
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
