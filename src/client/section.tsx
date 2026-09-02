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
import { Button, Input, StateDot } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
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
  borderRadius: 8,
  background: 'var(--dsw-alias-bg-base)',
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
} as const

const switchStyle = (enabled: boolean) =>
  ({
    width: 34,
    height: 20,
    borderRadius: 10,
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    position: 'relative' as const,
    background: enabled ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-border-l2)',
  }) as const

/** The section body (`t` arrives as the locale runtime's standard seat). */
export function WebSearchSettingsSection(props: SectionProps & PropsLocale<'dsh-websearch'>) {
  const { t, snapshot, onSaveKey, onClearKey, onToggleEnabled, onMoveSearch } = props
  const [chainFeedback, setChainFeedback] = useState<'failed' | undefined>(undefined)

  const move = async (id: string, delta: -1 | 1): Promise<void> => {
    const result = await onMoveSearch(id, delta)
    setChainFeedback(result.ok ? undefined : 'failed')
  }

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
          {snapshot.searchChain.map((id, index) => (
            <li key={id} data-testid={`dshws-chain-item-${id}`} style={chainItemStyle}>
              <span>{id}</span>
              {/* Per-item aria labels: identical "move" buttons are a screen-reader ambiguity (S06 lesson). */}
              <button
                type="button"
                aria-label={`${id} ${t('moveUp')}`}
                disabled={index === 0}
                onClick={() => void move(id, -1)}
                style={moveButtonStyle}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`${id} ${t('moveDown')}`}
                disabled={index === snapshot.searchChain.length - 1}
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
              <span>{id}</span>
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

/** The pinned-override marker: data attribute for tests, copy for humans (plan 007 D1). */
function ChainStateBadge(props: { pinned: boolean; t: (key: DshWsLocaleKey) => string }) {
  return (
    <span
      data-dshws-chain-state={props.pinned ? 'pinned' : 'default'}
      style={{ fontSize: 12 }}
    >
      {props.pinned ? props.t('chainPinned') : props.t('chainDefault')}
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

  return (
    <div data-testid={`dshws-member-${member.key}`} style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* StateDot is aria-hidden by contract; the status text pairs with it. */}
        <StateDot state={member.configured ? 'done' : 'warning'} />
        <strong>{member.label}</strong>
        <span>{member.configured ? t('configured') : t('notConfigured')}</span>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          role="switch"
          aria-checked={member.enabled}
          aria-label={`${member.label} ${t('enabled')}`}
          onClick={() => void onToggleEnabled(member.key, !member.enabled)}
          style={switchStyle(member.enabled)}
        />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <Input
          type="password"
          aria-label={`${member.label} ${t('apiKey')}`}
          placeholder={member.refName}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          style={{ flex: 1 }}
        />
        <Button
          variant="primary"
          size="sm"
          disabled={draft === ''}
          aria-label={`${member.label} ${t('save')}`}
          onClick={() => void save()}
        >
          {t('save')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!member.configured}
          aria-label={`${member.label} ${t('clear')}`}
          onClick={() => void clear()}
        >
          {t('clear')}
        </Button>
      </div>
      {feedback ? (
        <span data-testid={`dshws-feedback-${member.key}`}>{t(feedback)}</span>
      ) : null}
    </div>
  )
}
