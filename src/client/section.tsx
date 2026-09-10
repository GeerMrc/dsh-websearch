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
import { useEffect, useState, useSyncExternalStore } from 'react'
import { Button, IconQuestionOutline14, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
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
  /** DeepSeek fallback maxUses (S14c, host parity). */
  onSetMaxUses: (maxUses: number) => Promise<ActionResult>
  /** Per-member endpoint override (S14k, host-parity「接口地址」). */
  onSetBaseURL: (memberKey: string, baseURL: string) => Promise<ActionResult>
  /** Fetch-chain reorder (S21, ADR-0019): independent of the search order. */
  onMoveFetch: (id: string, delta: -1 | 1) => Promise<ActionResult>
  /** One S17 P1 member option (selects/toggles/text/number controls); '' clears enum/date fields. */
  onSetMemberOption: (
    memberKey: string,
    option: 'topic' | 'timeRange' | 'searchDepth' | 'includeAnswer' | 'type' | 'textFallback' | 'startPublishedDate' | 'tbs' | 'location' | 'chunksPerSource' | 'filterByLanguage' | 'includeDomainsMode' | 'category' | 'maxAgeHours' | 'sources' | 'categories' | 'startDate' | 'endDate' | 'exactMatch' | 'endPublishedDate' | 'textVerbosity' | 'includeSections' | 'excludeSections' | 'safe',
    value: string | number | boolean,
  ) => Promise<ActionResult>
  /** Unified search region (S17 P1, ADR-0015). */
  onSetSearchCountry: (country: string) => Promise<ActionResult>
  /** Unified search language (S17 P1, ADR-0015). */
  onSetSearchLanguage: (language: string) => Promise<ActionResult>
  /** Unified domain allow/block lists (S20 P1, ADR-0018); setting one clears the other. */
  onSetSearchDomains: (kind: 'include' | 'exclude', domains: string) => Promise<ActionResult>
  /** Designated fallback (ADR-0014): 'auto' = chain-order last position. */
  onSetFallbackMember: (member: SectionSnapshot['fallbackSelection']) => Promise<ActionResult>
  /** Universal web_fetch takeover toggle (S15a). */
  onSetFetchTakeover: (active: boolean) => Promise<ActionResult>
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
        onSetMaxUses={(maxUses) => controller.setDeepseekMaxUses(maxUses)}
        onSetFallbackMember={(member) => controller.setFallbackMember(member)}
        onSetFetchTakeover={(active) => controller.setFetchTakeover(active)}
        onSetBaseURL={(key, url) => controller.setBaseURL(key, url)}
        onSetMemberOption={(key, option, value) => controller.setMemberOption(key, option, value)}
        onSetSearchCountry={(country) => controller.setSearchCountry(country)}
        onSetSearchLanguage={(language) => controller.setSearchLanguage(language)}
        onSetSearchDomains={(kind, domains) => controller.setSearchDomains(kind, domains)}
        onMoveFetch={(id, delta) => controller.moveFetchChainEntry(id, delta)}
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

/**
 * S14m: expanded fields mirror the host Models editor verbatim
 * (ModelsSection.module.css .field/.fieldLabel/.input) — a vertical stack per
 * field: 12px/500 label ABOVE a full-width 32px bordered input. Same pattern
 * the Models page and every host settings card uses.
 */
const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
} as const

const fieldLabelStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  // S23 D14: the Models field label leaves a 10px gap before the ⓘ icon.
  gap: 10,
  fontSize: 12,
  lineHeight: '18px',
  fontWeight: 500,
  color: 'var(--dsw-alias-label-secondary)',
} as const

const fieldInputStyle = {
  boxSizing: 'border-box',
  width: '100%',
  height: 32,
  padding: '0 10px',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: 8,
  font: 'inherit',
  fontSize: 14,
  lineHeight: '22px',
  background: 'var(--dsw-alias-bg-layer-1)',
  color: 'var(--dsw-alias-label-primary)',
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

/** Key-selection row (S13 D2): label + three segments; the pressed segment
 * carries the field visual (bg-layer-1/border-l3 — Input wrapper precedent). */
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

/** S14s: feedback color follows the operation's semantics — save is a
 * positive confirmation (success green), clear is a retractive act (warn),
 * failure is an error; the old single green mislabeled both. */
const feedbackColor = (state: 'saved' | 'cleared' | 'failed'): string =>
  state === 'saved'
    ? 'var(--dsw-alias-state-success-primary)'
    : state === 'cleared'
      ? 'var(--dsw-alias-state-warn-label)'
      : 'var(--dsw-alias-state-error-primary)'

const feedbackStyle = {
  flex: 1,
  fontSize: 12,
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
  const { t, snapshot, onSaveKey, onClearKey, onToggleEnabled, onMoveSearch, onSetKeySelection, onSetMaxUses, onSetFallbackMember, onSetFetchTakeover, onSetBaseURL, onSetMemberOption, onSetSearchCountry, onSetSearchLanguage, onSetSearchDomains, onMoveFetch } = props
  const [chainFeedback, setChainFeedback] = useState<'failed' | undefined>(undefined)

  const move = async (id: string, delta: -1 | 1): Promise<void> => {
    const result = await onMoveSearch(id, delta)
    setChainFeedback(result.ok ? undefined : 'failed')
  }

  // S14r (user ruling): the chain lists only READY members — configured AND
  // enabled. A disabled member is not a candidate for search, so it does not
  // occupy a rank (re-enabling restores it; the orderable span still holds
  // its slot via the pinned/default order data).
  const visibleSearch = snapshot.searchChain.filter((id) =>
    snapshot.members.some((m) => m.memberId === id && m.configured && m.enabled),
  )
  // ADR-0014: a designated tool member leaves the reorderable span and renders
  // as a LOCKED tail row (fallback-only role, badge follows the designation);
  // 'auto' keeps the S14w semantics — the last ready member is the standby.
  const designatedId = snapshot.fallbackSelection !== 'auto' && snapshot.fallbackSelection !== 'dshws-deepseek'
    ? snapshot.fallbackSelection
    : null
  const orderableSearch = designatedId === null ? visibleSearch : visibleSearch.filter((id) => id !== designatedId)
  const showLockedTail = designatedId !== null && snapshot.fallbackDesignationReady
  // The chain card only earns its place once at least one member is configured:
  // with nothing configured it read as a half-screen block of static copy.
  const showChains = snapshot.members.some((m) => m.configured)
  // S22b: verbose-config fold, default collapsed (user ruling).
  const [advancedOpen, setAdvancedOpen] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {t('title')}
          {/* Page-level key-format note (12b): stated once behind this icon instead
          of repeated as a hint paragraph on every member card. */}
          {/* S14d (user ruling): the page ⓘ carries the description; the
          multi-key format moved into each card's input placeholder. */}
          <Tooltip label={t('description')} side="bottom" delayMs={400} maxWidth={360}>
            <button type="button" aria-label={t('description')} style={infoButtonStyle}>
              <IconQuestionOutline14 />
            </button>
          </Tooltip>
        </h3>
        <p style={{ margin: 0, marginTop: 4, fontSize: 14, lineHeight: '22px', color: 'var(--dsw-alias-label-tertiary)' }}>{t('description')}</p>
      </div>
      {/* Global area (S14c, user ruling): the chain card sits ABOVE the tools,
      always visible; the reorder rows only earn their place once a member is
      configured (S12a rationale), while the tail note, timeout, and the
      host-parity maxUses knob are meaningful in every state. */}
      <section data-testid="dshws-chains" style={{ ...cardStyle, padding: '10px 14px', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* S14j (user report fix): the S14h edit accidentally dropped the
            「搜索链」 title itself — this row IS the reorder surface for the
            configured websearch tools, so the heading must stay. */}
            <h4 style={{ margin: 0, fontSize: 12, fontWeight: 500, color: 'var(--dsw-alias-label-secondary)' }}>{t('searchChain')}</h4>
            {/* S14h: the ! badge sits right after the title and matches the
            page's ⓘ icon size (14px box). */}
            <Tooltip
              label={snapshot.searchChainPinned ? `${t('chainPinned')}: ${t('chainOrderHint')}` : t('chainOrderHint')}
              side="bottom"
              delayMs={200}
              maxWidth={360}
            >
              <button
                type="button"
                aria-label={snapshot.searchChainPinned ? `${t('chainPinned')}: ${t('chainOrderHint')}` : t('chainOrderHint')}
                data-testid="dshws-chain-order-info"
                data-dshws-chain-state={snapshot.searchChainPinned ? 'pinned' : 'default'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 16,
                  height: 16,
                  padding: 0,
                  border: '1px solid var(--dsw-alias-border-l2)',
                  borderRadius: 999,
                  background: 'transparent',
                  color: 'var(--dsw-alias-label-secondary)',
                  fontSize: 11,
                  lineHeight: 1,
                  cursor: 'help',
                  opacity: 0.6,
                }}
              >
                !
              </button>
            </Tooltip>
            <span style={{ flex: 1 }} />
          </div>
          {showChains ? (
          <ol
            data-testid="dshws-search-chain"
            style={{ margin: 0, paddingLeft: 0, listStyle: 'none', maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}
          >
            {/* Disabled boundaries follow the FILTERED (visible) list: computing them
            against the full chain left the last visible ↓ clickable and failing. */}
            {orderableSearch.map((id, index) => (
              <li
                key={id}
                data-testid={`dshws-chain-item-${id}`}
                style={chainRowStyle}
              >
                <span style={chainIndexStyle}>{index + 1}</span>
                {/* S22a T1: role chips ride INSIDE the label cell right after the
                name — the row grid has one button column pair, a chip in its own
                grid cell pushed the last button onto a second line (user report). */}
                <span data-dshws-chain-label="" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  {labelOf(id)}
                  {/* S14w: the chain order IS the primary/standby order — the
                  two ends carry explicit role chips (pure presentation). With a
                  designation (ADR-0014) the standby chip moves to the locked tail. */}
                  {index === 0 ? (
                    <span data-testid="dshws-chain-role-primary" style={roleChipStyle}>{t('chainRolePrimary')}</span>
                  ) : null}
                  {!showLockedTail && orderableSearch.length > 1 && index === orderableSearch.length - 1 ? (
                    <span data-testid="dshws-chain-role-standby" style={roleChipStyle}>{t('chainRoleStandby')}</span>
                  ) : null}
                </span>
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
                  disabled={index === orderableSearch.length - 1 && !showLockedTail}
                  onClick={() => void move(id, 1)}
                  style={moveButtonStyle}
                >
                  ↓
                </button>
              </li>
            ))}
            {showLockedTail && designatedId !== null ? (
              <li
                key={designatedId}
                data-testid={`dshws-chain-item-${designatedId}`}
                data-dshws-chain-locked=""
                style={chainRowStyle}
              >
                <span style={chainIndexStyle}>{orderableSearch.length + 1}</span>
                <span data-dshws-chain-label="">{labelOf(designatedId)}</span>
                <span data-testid="dshws-chain-role-standby" style={roleChipStyle}>{t('chainRoleStandby')}</span>
                <span style={hintStyle}>{t('chainLockedNote')}</span>
                <span style={{ flex: 1 }} />
              </li>
            ) : null}

          </ol>
          ) : null}
          {/* ADR-0014 two-state: zero usable tools and no working floor → the
          honest red warning; a selected, eligible, keyed DeepSeek floor is the
          only thing that keeps the next search alive. */}
          {snapshot.members.every((m) => !(m.configured && m.enabled)) && showChains ? (
            snapshot.fallbackSelection === 'dshws-deepseek' && snapshot.fallbackDeepseekEligible ? (
              <p role="status" data-testid="dshws-chain-floor" style={hintStyle}>
                {t('chainFloorDeepseekNote')}
              </p>
            ) : (
              <p role="status" data-testid="dshws-chain-no-usable" style={{ ...hintStyle, color: 'var(--dsw-alias-state-error-primary)' }}>
                {t('chainNoUsableWarning')}
              </p>
            )
          ) : null}
          {/* S22b (user ruling): the verbose knobs fold away — the chain rows are
          the card's steady state, the timeout/maxUses/geo/domain detail opens
          on demand so the card stops eating the viewport. */}
          <button
            type="button"
            data-testid="dshws-advanced-disclosure"
            aria-expanded={advancedOpen}
            aria-label={t('advancedConfigLabel')}
            onClick={() => { setAdvancedOpen((value) => !value) }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', color: 'var(--dsw-alias-label-secondary)', font: 'inherit', fontSize: 12, fontWeight: 500, textAlign: 'left', cursor: 'pointer', padding: 0 }}
          >
            {t('advancedConfigLabel')}
            <span aria-hidden="true" style={{ fontSize: 10, color: 'var(--dsw-alias-label-tertiary)', transform: advancedOpen ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▾</span>
          </button>
          {advancedOpen ? (
            <>
              <p style={hintStyle}>
                {t('timeout')}: {snapshot.timeoutMs} ms
              </p>
              <MaxUsesRow t={t} value={snapshot.deepseekMaxUses} onSet={onSetMaxUses} />
              <SearchGeoFields t={t} country={snapshot.searchCountry} language={snapshot.searchLanguage} onSetCountry={onSetSearchCountry} onSetLanguage={onSetSearchLanguage} />
              <SearchDomainFields t={t} includeDomains={snapshot.searchIncludeDomains} excludeDomains={snapshot.searchExcludeDomains} onSet={onSetSearchDomains} />
            </>
          ) : null}
          {chainFeedback ? <p style={{ ...hintStyle, color: 'var(--dsw-alias-state-error-primary)' }} data-testid="dshws-chain-feedback">{t(chainFeedback)}</p> : null}
        </section>
      <div data-testid="dshws-members" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* S14c: five orderable tool cards, then the DeepSeek fallback row last. */}
        {snapshot.members.filter((member) => member.key !== 'deepseek').map((member) => (
          <MemberCard
            key={member.key}
            member={member}
            t={t}
            onSaveKey={onSaveKey}
            onClearKey={onClearKey}
            onToggleEnabled={onToggleEnabled}
            onSetKeySelection={onSetKeySelection}
            onSetBaseURL={onSetBaseURL}
            onSetMemberOption={onSetMemberOption}
          />
        ))}
        <FallbackToolRow key="dshws-fallback-tool" snapshot={snapshot} t={t} onChoose={onSetFallbackMember} />
        {/* S22b (user ruling): the takeover row adopts the member-card fold —
        header (label, ⓘ, switch) stays visible, the Web Fetch chain rows open
        on demand (and only while the takeover is on, S22a T3). */}
        <FetchTakeoverRow t={t} active={snapshot.fetchTakeover} onSet={onSetFetchTakeover} chain={<FetchChainRows t={t} snapshot={snapshot} onMove={onMoveFetch} />} />
      </div>
    </div>
  )
}


/**
 * Host-parity maxUses knob (S14c): staged numeric input in the global area —
 * the label and semantics match the host `web-search-deepseek` card verbatim.
 */
function MaxUsesRow(props: {
  t: (key: DshWsLocaleKey) => string
  value: number | undefined
  onSet: (maxUses: number) => Promise<ActionResult>
}) {
  const { t, value, onSet } = props
  const [draft, setDraft] = useState('')
  const [feedback, setFeedback] = useState<'saved' | 'failed' | undefined>(undefined)
  const current = value ?? 10
  const parsed = draft.trim() === '' ? current : Number.parseInt(draft, 10)
  // S14i: the saved note auto-clears (2.5s) so the row never looks stuck;
  // with the controller re-describe fix the value itself updates live too.
  useEffect(() => {
    if (feedback === undefined) return
    const timer = setTimeout(() => setFeedback(undefined), 1500)
    return () => clearTimeout(timer)
  }, [feedback])
  const save = async (): Promise<void> => {
    const result = await onSet(parsed as number)
    setFeedback(result.ok ? 'saved' : 'failed')
    if (result.ok) setDraft('')
  }
  // S14d: the hint interpolates the live {N} — it always names the value in
  // the box, not a stale default (user ruling).
  const hint = t('maxUsesHint').replace('{N}', String(parsed))
  // S14g (user ruling): budget bounds [5, 100]; the native stepper also snaps
  // to steps of 5 (10 → 15 → 20), typing any integer in range still works.
  const MIN_USES = 5
  const MAX_USES = 100
  const STEP_USES = 5
  const valid = Number.isInteger(parsed) && parsed >= MIN_USES && parsed <= MAX_USES
  const snap = (raw: number): number => Math.min(MAX_USES, Math.max(MIN_USES, raw - (raw % STEP_USES)))
  const stepUp = (): void => setDraft(String(snap((draft.trim() === '' ? current : parsed) + STEP_USES)))
  const stepDown = (): void => setDraft(String(snap((draft.trim() === '' ? current : parsed) - STEP_USES)))
  return (
    <div data-testid="dshws-max-uses" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }}>
        {t('maxUsesLabel')}
        <Tooltip label={hint} side="bottom" delayMs={400} maxWidth={320}>
          <button type="button" aria-label={hint} style={infoButtonStyle}>
            <IconQuestionOutline14 />
          </button>
        </Tooltip>
      </span>
      <span style={{ flex: 1 }} />
      {/* S14g: fixed compact width (the 100%-flex inputStyle made the border
      stretch across the row) + custom steppers snapping to steps of 5. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          type="button"
          aria-label={`${t('maxUsesLabel')} −`}
          data-testid="dshws-max-uses-down"
          onClick={stepDown}
          disabled={!valid}
          style={{ ...moveButtonStyle, width: 22, height: 22 }}
        >
          −
        </button>
        <input
          type="number"
          min={5}
          max={100}
          step={5}
          aria-label={t('maxUsesLabel')}
          data-testid="dshws-max-uses-input"
          style={{ width: 52, height: 28, padding: '0 6px', textAlign: 'center', borderRadius: 8, border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-2)', color: 'inherit', font: 'inherit' }}
          value={draft === '' ? String(current) : draft}
          onChange={(event) => { setDraft(event.target.value); setFeedback(undefined) }}
        />
        <button
          type="button"
          aria-label={`${t('maxUsesLabel')} +`}
          data-testid="dshws-max-uses-up"
          onClick={stepUp}
          disabled={!valid}
          style={{ ...moveButtonStyle, width: 22, height: 22 }}
        >
          +
        </button>
      </div>
      <Button
        variant="outline"
        size="sm"
        aria-label={`${t('maxUsesLabel')} ${t('save')}`}
        disabled={!valid || draft.trim() === ''}
        onClick={() => void save()}
      >
        {t('save')}
      </Button>
      {feedback ? (
        <span role="status" data-testid="dshws-max-uses-feedback" style={{ ...feedbackStyle, color: feedbackColor(feedback === 'saved' ? 'saved' : 'failed') }}>{t(feedback)}</span>
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

/** Role chip for the two chain ends (S14w): a quiet bordered pill, secondary tone. */
const roleChipStyle = {
  fontSize: 10,
  lineHeight: 1.4,
  padding: '0 6px',
  border: '1px solid var(--dsw-alias-border-l2)',
  borderRadius: 999,
  color: 'var(--dsw-alias-label-secondary)',
  whiteSpace: 'nowrap',
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

/**
 * The DeepSeek fallback row (S14b D1, user ruling): DeepSeek is not a
 * symmetric config card — it shares DEEPSEEK_API_KEY with the Models page, so
 * a key input (and a comma pool on that shared ref) would poison chat auth.
 * The row carries the live readiness dot, the shared-key badge, the takeover
 * semantics behind an ⓘ tooltip, and the paid-fallback off-switch (the
 * ADR-0004 neutrality opt-out).
 */
function FallbackToolRow(props: {
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
  const [feedback, setFeedback] = useState<'saved' | 'failed' | undefined>(undefined)
  useEffect(() => {
    if (feedback === undefined) return
    const timer = setTimeout(() => setFeedback(undefined), 1500)
    return () => clearTimeout(timer)
  }, [feedback])
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
    <div data-testid="dshws-fallback-tool" style={{ ...cardStyle, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <strong style={nameStyle}>{t('fallbackRowLabel')}</strong>
        <Tooltip label={t('fallbackNote')} side="bottom" delayMs={400} maxWidth={360}>
          <button type="button" aria-label={t('fallbackInfo')} style={infoButtonStyle}>
            <IconQuestionOutline14 />
          </button>
        </Tooltip>
        <span style={{ flex: 1 }} />
        <span role="img" aria-label={dotTitle} title={dotTitle} data-testid="dshws-fallback-dot" style={statusDotStyle(dotOn)} />
        <select
          aria-label={t('fallbackRowLabel')}
          data-testid="dshws-fallback-select"
          value={effective}
          onChange={(event) => {
            const next = event.target.value as SectionSnapshot['fallbackSelection']
            void onChoose(next).then((result) => setFeedback(result.ok ? 'saved' : 'failed'))
          }}
          style={{
            ...fieldInputStyle,
            width: 'auto',
            minWidth: 0,
            margin: 0,
            // Native chrome only: swap the edge-flush system arrow for an
            // inset chevron so it keeps its distance from the border.
            appearance: 'none',
            WebkitAppearance: 'none',
            paddingRight: 30,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
          }}
        >
          <option value="auto">{t('fallbackAutoOption')}</option>
          {toolOptions.map((id) => <option key={id} value={id}>{labelOf(id)}</option>)}
          {offerDeepseek ? <option value="dshws-deepseek">{t('fallbackDeepseekOption')}</option> : null}
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
function FetchTakeoverRow(props: {
  t: (key: DshWsLocaleKey) => string
  active: boolean
  onSet: (active: boolean) => Promise<ActionResult>
  /** The Web Fetch chain block; rendered only when the fold is open AND the takeover is on. */
  chain: React.ReactNode
}) {
  const { t, active, onSet, chain } = props
  const [feedback, setFeedback] = useState<'saved' | 'failed' | undefined>(undefined)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (feedback === undefined) return
    const timer = setTimeout(() => setFeedback(undefined), 1500)
    return () => clearTimeout(timer)
  }, [feedback])
  return (
    <div data-testid="dshws-fetch-takeover" style={{ ...cardStyle, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          data-testid="dshws-fetch-takeover-disclosure"
          aria-expanded={open}
          aria-label={`${t('fetchTakeoverLabel')} ${t('configure')}`}
          onClick={() => { setOpen((value) => !value) }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, border: 'none', background: 'transparent', color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer', padding: 0 }}
        >
          <strong style={nameStyle}>{t('fetchTakeoverLabel')}</strong>
          <Tooltip label={t('fetchTakeoverNoteS21')} side="bottom" delayMs={400} maxWidth={380}>
            <button type="button" aria-label={t('fetchTakeoverNoteS21')} style={infoButtonStyle}>
              <IconQuestionOutline14 />
            </button>
          </Tooltip>
          <span style={{ flex: 1 }} />
          <span aria-hidden="true" style={{ fontSize: 10, color: 'var(--dsw-alias-label-tertiary)', transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▾</span>
        </button>
        <button
          type="button"
          role="switch"
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
function FetchChainRows(props: {
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
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, padding: 0,
              border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 999, background: 'transparent',
              color: 'var(--dsw-alias-label-secondary)', fontSize: 11, lineHeight: 1, cursor: 'help', opacity: 0.6,
            }}
          >
            !
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
              {labelOf(id)}
              {index === 0 ? <span data-testid="dshws-fetch-role-primary" style={roleChipStyle}>{t('chainRolePrimary')}</span> : null}
            </span>
            <button type="button" aria-label={`${labelOf(id)} ${t('moveUp')}`} disabled={index === 0} onClick={() => void move(id, -1)} style={moveButtonStyle}>↑</button>
            <button type="button" aria-label={`${labelOf(id)} ${t('moveDown')}`} disabled={index === visible.length - 1} onClick={() => void move(id, 1)} style={moveButtonStyle}>↓</button>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Per-member endpoint override (S14k): staged text input mirroring the
 * official「接口地址」field — empty means the provider default; the saved value
 * applies to the next search (hot since S17 D1, noted beside the field). */
function MemberEndpointField(props: {
  member: MemberSnapshot
  t: (key: DshWsLocaleKey) => string
  onSet: (memberKey: string, baseURL: string) => Promise<ActionResult>
}) {
  const { member, t, onSet } = props
  const [draft, setDraft] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'saved' | 'failed' | undefined>(undefined)
  useEffect(() => {
    if (feedback === undefined) return
    const timer = setTimeout(() => setFeedback(undefined), 1500)
    return () => clearTimeout(timer)
  }, [feedback])
  const value = draft ?? member.baseURL ?? ''
  return (
    <div style={fieldStyle}>
      <span style={fieldLabelStyle}>
        {t('endpointLabel')}
        <Tooltip label={t('endpointNote')} side="bottom" delayMs={400} maxWidth={320}>
          <button type="button" aria-label={t('endpointNote')} style={infoButtonStyle}>
            <IconQuestionOutline14 />
          </button>
        </Tooltip>
      </span>
      <input
        aria-label={`${member.label} ${t('endpointLabel')}`}
        data-testid={`dshws-endpoint-${member.key}`}
        placeholder={MEMBERS.find((entry) => entry.key === member.key)?.defaultBaseURL ?? 'https://…'}
        value={value}
        onChange={(event) => { setDraft(event.target.value); setFeedback(undefined) }}
        style={fieldInputStyle}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        {feedback ? (
          <span role="status" data-testid={`dshws-endpoint-feedback-${member.key}`} style={{ ...feedbackStyle, flex: undefined, color: feedbackColor(feedback === 'saved' ? 'saved' : 'failed') }}>{t(feedback)}</span>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          disabled={draft === null || draft === (member.baseURL ?? '')}
          aria-label={`${member.label} ${t('endpointLabel')} ${t('save')}`}
          onClick={() => {
            void onSet(member.key, draft ?? '').then((result) => {
              setFeedback(result.ok ? 'saved' : 'failed')
              if (result.ok) setDraft(null)
            })
          }}
        >
          {t('save')}
        </Button>
      </div>
    </div>
  )
}

/** One S17 P1 member-parameter control descriptor (rendered inside the expanded card). */
type MemberParamControl =
  | {
    kind: 'select'
    option: 'topic' | 'timeRange' | 'searchDepth' | 'includeAnswer' | 'type' | 'includeDomainsMode' | 'chunksPerSource' | 'category' | 'sources' | 'categories' | 'textVerbosity'
    labelKey: DshWsLocaleKey
    noteKey?: DshWsLocaleKey
    /** Resolved display default when the section value is unset ('' options are clear sentinels). */
    fallback?: string
    options: readonly { value: string, labelKey: DshWsLocaleKey }[]
  }
  | { kind: 'toggle', option: 'textFallback' | 'filterByLanguage' | 'exactMatch' | 'safe', labelKey: DshWsLocaleKey, noteKey?: DshWsLocaleKey }
  | { kind: 'text', option: 'location' | 'startPublishedDate' | 'startDate' | 'endDate' | 'endPublishedDate' | 'includeSections' | 'excludeSections' | 'tbs', labelKey: DshWsLocaleKey, noteKey?: DshWsLocaleKey, inputType: 'text' | 'date', placeholder?: string }
  | { kind: 'number', option: 'maxAgeHours', labelKey: DshWsLocaleKey, noteKey?: DshWsLocaleKey, min: number, max: number, fallback: number }

/** The S17 P1 controls per member, in card order (ADR-0015 mapping; deepseek/anysearch expose none). */
const MEMBER_PARAM_CONTROLS: Readonly<Partial<Record<string, readonly MemberParamControl[]>>> = {
  tavily: [
    { kind: 'select', option: 'topic', labelKey: 'tavilyTopicLabel', options: [
      { value: '', labelKey: 'optDefault' }, { value: 'news', labelKey: 'topicNews' }, { value: 'finance', labelKey: 'topicFinance' }] },
    { kind: 'select', option: 'timeRange', labelKey: 'tavilyTimeRangeLabel', options: [
      { value: '', labelKey: 'optOff' }, { value: 'day', labelKey: 'recencyDay' }, { value: 'week', labelKey: 'recencyWeek' }, { value: 'month', labelKey: 'recencyMonth' }, { value: 'year', labelKey: 'recencyYear' }] },
    { kind: 'select', option: 'searchDepth', labelKey: 'tavilyDepthLabel', options: [
      { value: '', labelKey: 'optDefault' }, { value: 'advanced', labelKey: 'depthAdvanced' }, { value: 'fast', labelKey: 'depthFast' }, { value: 'ultra-fast', labelKey: 'depthUltraFast' }] },
    { kind: 'select', option: 'includeAnswer', labelKey: 'tavilyAnswerLabel', fallback: 'basic', options: [
      { value: 'basic', labelKey: 'answerBasic' }, { value: 'advanced', labelKey: 'answerAdvanced' }] },
    { kind: 'select', option: 'includeDomainsMode', labelKey: 'domainsLabel', options: [
      { value: '', labelKey: 'optDefault' }, { value: 'filter', labelKey: 'modeFilter' }, { value: 'boost', labelKey: 'modeBoost' }] },
    { kind: 'select', option: 'chunksPerSource', labelKey: 'chunksPerSourceLabel', options: [
      { value: '', labelKey: 'optDefault' }, { value: '1', labelKey: 'chunksOne' }, { value: '2', labelKey: 'chunksTwo' }, { value: '3', labelKey: 'chunksThree' }] },
    { kind: 'toggle', option: 'filterByLanguage', labelKey: 'filterByLanguageLabel', noteKey: 'filterByLanguageNote' },
    { kind: 'text', option: 'startDate', labelKey: 'tavilyStartDateLabel', inputType: 'date' },
    { kind: 'text', option: 'endDate', labelKey: 'tavilyEndDateLabel', inputType: 'date' },
    { kind: 'toggle', option: 'exactMatch', labelKey: 'tavilyExactMatchLabel', noteKey: 'tavilyExactMatchNote' },
  ],
  exa: [
    { kind: 'select', option: 'type', labelKey: 'exaTypeLabel', fallback: 'auto', options: [
      { value: 'auto', labelKey: 'typeAuto' }, { value: 'instant', labelKey: 'typeInstant' }, { value: 'fast', labelKey: 'typeFast' }, { value: 'deep-lite', labelKey: 'typeDeepLite' }, { value: 'deep', labelKey: 'typeDeep' }, { value: 'deep-reasoning', labelKey: 'typeDeepReasoning' }] },
    { kind: 'toggle', option: 'textFallback', labelKey: 'exaTextFallbackLabel', noteKey: 'exaTextFallbackNote' },
    { kind: 'text', option: 'startPublishedDate', labelKey: 'exaDateFloorLabel', inputType: 'date' },
    { kind: 'select', option: 'category', labelKey: 'categoryLabel', options: [
      { value: '', labelKey: 'optDefault' }, { value: 'company', labelKey: 'catCompany' }, { value: 'publication', labelKey: 'catPublication' }, { value: 'news', labelKey: 'catNews' }, { value: 'personal site', labelKey: 'catPersonalSite' }, { value: 'financial report', labelKey: 'catFinancialReport' }, { value: 'people', labelKey: 'catPeople' }] },
    { kind: 'number', option: 'maxAgeHours', labelKey: 'maxAgeHoursLabel', noteKey: 'maxAgeHoursNote', min: -1, max: 720, fallback: 24 },
    { kind: 'text', option: 'endPublishedDate', labelKey: 'exaDateCeilingLabel', inputType: 'date' },
    { kind: 'select', option: 'textVerbosity', labelKey: 'exaVerbosityLabel', noteKey: 'exaVerbosityNote', options: [
      { value: '', labelKey: 'optDefault' }, { value: 'compact', labelKey: 'verbosityCompact' }, { value: 'standard', labelKey: 'verbosityStandard' }, { value: 'full', labelKey: 'verbosityFull' }] },
    { kind: 'text', option: 'includeSections', labelKey: 'exaIncludeSectionsLabel', noteKey: 'exaSectionsNote', inputType: 'text', placeholder: 'header,body' },
    { kind: 'text', option: 'excludeSections', labelKey: 'exaExcludeSectionsLabel', noteKey: 'exaSectionsNote', inputType: 'text', placeholder: 'navigation,banner' },
  ],
  firecrawl: [
    { kind: 'text', option: 'tbs', labelKey: 'fcTbsLabel', noteKey: 'fcTbsNote', inputType: 'text', placeholder: 'qdr:w' },
    { kind: 'toggle', option: 'safe', labelKey: 'fcSafeLabel', noteKey: 'fcSafeNote' },
    { kind: 'text', option: 'location', labelKey: 'fcLocationLabel', noteKey: 'fcLocationNote', inputType: 'text', placeholder: 'Beijing,China' },
    { kind: 'select', option: 'sources', labelKey: 'sourcesLabel', options: [
      { value: '', labelKey: 'optDefault' }, { value: 'news', labelKey: 'srcNews' }, { value: 'web+news', labelKey: 'srcWebNews' }] },
    { kind: 'select', option: 'categories', labelKey: 'categoryLabel', options: [
      { value: '', labelKey: 'optDefault' }, { value: 'developer', labelKey: 'fcCatDeveloper' }, { value: 'research', labelKey: 'fcCatResearch' }, { value: 'pdf', labelKey: 'fcCatPdf' }] },
  ],
}

/** Native select chrome (the fallback-row precedent): inset chevron, auto width. */
const selectStyle = {
  ...fieldInputStyle,
  width: 'auto',
  minWidth: 120,
  margin: 0,
  appearance: 'none',
  WebkitAppearance: 'none',
  paddingRight: 30,
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
} as const

/** Field label with an optional ⓘ tooltip carrying the control's semantics. */
function FieldLabel(props: { t: (key: DshWsLocaleKey) => string, labelKey: DshWsLocaleKey, noteKey?: DshWsLocaleKey, ariaLabel: string }) {
  const { t, labelKey, noteKey, ariaLabel } = props
  return (
    <span style={fieldLabelStyle}>
      {t(labelKey)}
      {noteKey !== undefined ? (
        <Tooltip label={t(noteKey)} side="bottom" delayMs={400} maxWidth={320}>
          <button type="button" aria-label={ariaLabel} style={infoButtonStyle}>
            <IconQuestionOutline14 />
          </button>
        </Tooltip>
      ) : null}
    </span>
  )
}

/** One rendered S17 member parameter: selects/toggles commit immediately; text/number stage a draft. */
function MemberParamField(props: {
  member: MemberSnapshot
  control: MemberParamControl
  t: (key: DshWsLocaleKey) => string
  onSet: SectionProps['onSetMemberOption']
}) {
  const { member, control, t, onSet } = props
  const [draft, setDraft] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'saved' | 'failed' | undefined>(undefined)
  useEffect(() => {
    if (feedback === undefined) return
    const timer = setTimeout(() => setFeedback(undefined), 1500)
    return () => clearTimeout(timer)
  }, [feedback])
  const stored = member[control.option]
  const ariaLabel = `${member.label} ${t(control.labelKey)}`
  const testid = `dshws-param-${member.key}-${control.option}`
  const commit = (value: string | number | boolean): Promise<void> =>
    onSet(member.key, control.option, value).then((result) => setFeedback(result.ok ? 'saved' : 'failed'))

  if (control.kind === 'select') {
    const value = typeof stored === 'string' && stored !== '' ? stored : (control.fallback ?? '')
    return (
      <div style={fieldStyle}>
        <FieldLabel t={t} labelKey={control.labelKey} ariaLabel={ariaLabel} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            aria-label={ariaLabel}
            data-testid={testid}
            value={value}
            onChange={(event) => { void commit(event.target.value) }}
            style={selectStyle}
          >
            {control.options.map((option) => (
              <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
            ))}
          </select>
          {feedback !== undefined ? (
            <span role="status" data-testid={`${testid}-feedback`} style={{ ...feedbackStyle, flex: undefined, color: feedbackColor(feedback === 'saved' ? 'saved' : 'failed') }}>{t(feedback)}</span>
          ) : null}
        </div>
      </div>
    )
  }

  if (control.kind === 'toggle') {
    // textFallback defaults ON (S17 D4); filterByLanguage defaults OFF (S20 P2).
    const fallback = control.option === 'textFallback'
    const on = typeof stored === 'boolean' ? stored : fallback
    return (
      <div style={fieldStyle}>
        <FieldLabel t={t} labelKey={control.labelKey} noteKey={control.noteKey} ariaLabel={ariaLabel} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label={ariaLabel}
            data-testid={testid}
            onClick={() => { void commit(!on) }}
            style={{ ...switchStyle(on, on), cursor: 'pointer' }}
          >
            <span style={thumbStyle(on)} />
          </button>
          {feedback !== undefined ? (
            <span role="status" data-testid={`${testid}-feedback`} style={{ ...feedbackStyle, flex: undefined, color: feedbackColor(feedback === 'saved' ? 'saved' : 'failed') }}>{t(feedback)}</span>
          ) : null}
        </div>
      </div>
    )
  }

  // number | text: staged draft with a Save button (the endpoint-field pattern).
  const current = control.kind === 'number'
    ? (typeof stored === 'number' ? String(stored) : String(control.fallback))
    : (typeof stored === 'string' ? stored : '')
  const value = draft ?? current
  const valid = control.kind === 'number'
    ? Number.isInteger(Number(value)) && Number(value) >= control.min && Number(value) <= control.max
    : true
  return (
    <div style={fieldStyle}>
      <FieldLabel t={t} labelKey={control.labelKey} noteKey={control.noteKey} ariaLabel={ariaLabel} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <input
          type={control.kind === 'number' ? 'number' : control.inputType}
          min={control.kind === 'number' ? control.min : undefined}
          max={control.kind === 'number' ? control.max : undefined}
          aria-label={ariaLabel}
          data-testid={testid}
          placeholder={control.kind === 'text' ? control.placeholder : undefined}
          value={value}
          onChange={(event) => { setDraft(event.target.value); setFeedback(undefined) }}
          style={{ ...fieldInputStyle, flex: 1, minWidth: 0 }}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={!valid || draft === null || draft === current}
          aria-label={`${ariaLabel} ${t('save')}`}
          onClick={() => {
            void commit(control.kind === 'number' ? Number(value) : value).then(() => setDraft(null))
          }}
        >
          {t('save')}
        </Button>
        {feedback !== undefined ? (
          <span role="status" data-testid={`${testid}-feedback`} style={{ ...feedbackStyle, flex: undefined, color: feedbackColor(feedback === 'saved' ? 'saved' : 'failed') }}>{t(feedback)}</span>
        ) : null}
      </div>
    </div>
  )
}

/** Unified search region/language fields (S17 P1, ADR-0015) — global single write point. */
function SearchGeoFields(props: {
  t: (key: DshWsLocaleKey) => string
  country: string | undefined
  language: string | undefined
  onSetCountry: (country: string) => Promise<ActionResult>
  onSetLanguage: (language: string) => Promise<ActionResult>
}) {
  const { t, country, language, onSetCountry, onSetLanguage } = props
  return (
    <div data-testid="dshws-search-geo" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <GeoField t={t} testid="dshws-search-country" labelKey="searchCountryLabel" noteKey="searchCountryNote" placeholder="CN" value={country} onSet={onSetCountry} />
      <GeoField t={t} testid="dshws-search-language" labelKey="searchLanguageLabel" noteKey="searchLanguageNote" placeholder="zh" value={language} onSet={onSetLanguage} />
    </div>
  )
}

/** Unified domain allow/block lists (S20 P1, ADR-0018) — mutually exclusive single-line inputs. */
function SearchDomainFields(props: {
  t: (key: DshWsLocaleKey) => string
  includeDomains: string | undefined
  excludeDomains: string | undefined
  onSet: (kind: 'include' | 'exclude', domains: string) => Promise<ActionResult>
}) {
  const { t, includeDomains, excludeDomains, onSet } = props
  return (
    <div data-testid="dshws-search-domains" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <DomainField t={t} kind="include" value={includeDomains} onSet={onSet} />
      <DomainField t={t} kind="exclude" value={excludeDomains} onSet={onSet} />
    </div>
  )
}

function DomainField(props: {
  t: (key: DshWsLocaleKey) => string
  kind: 'include' | 'exclude'
  value: string | undefined
  onSet: (kind: 'include' | 'exclude', domains: string) => Promise<ActionResult>
}) {
  const { t, kind, value, onSet } = props
  const [draft, setDraft] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'saved' | 'failed' | undefined>(undefined)
  useEffect(() => {
    if (feedback === undefined) return
    const timer = setTimeout(() => setFeedback(undefined), 1500)
    return () => clearTimeout(timer)
  }, [feedback])
  const labelKey = kind === 'include' ? 'searchIncludeDomainsLabel' : 'searchExcludeDomainsLabel'
  const noteKey = kind === 'include' ? 'searchIncludeDomainsNote' : 'searchExcludeDomainsNote'
  const current = value ?? ''
  const shown = draft ?? current
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }}>
        {t(labelKey)}
        <Tooltip label={t(noteKey)} side="bottom" delayMs={400} maxWidth={380}>
          <button type="button" aria-label={t(noteKey)} style={infoButtonStyle}>
            <IconQuestionOutline14 />
          </button>
        </Tooltip>
      </span>
      <span style={{ flex: 1 }} />
      <input
        aria-label={t(labelKey)}
        data-testid={`dshws-search-domains-${kind}`}
        placeholder="example.com,foo.org"
        value={shown}
        onChange={(event) => { setDraft(event.target.value); setFeedback(undefined) }}
        style={{ width: 200, height: 28, padding: '0 8px', borderRadius: 8, border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-2)', color: 'inherit', font: 'inherit' }}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={draft === null || draft === current}
        aria-label={`${t(labelKey)} ${t('save')}`}
        onClick={() => {
          void onSet(kind, draft ?? '').then((result) => {
            setFeedback(result.ok ? 'saved' : 'failed')
            if (result.ok) setDraft(null)
          })
        }}
      >
        {t('save')}
      </Button>
      {feedback !== undefined ? (
        <span role="status" data-testid={`dshws-search-domains-${kind}-feedback`} style={{ fontSize: 12, color: feedbackColor(feedback === 'saved' ? 'saved' : 'failed') }}>{t(feedback)}</span>
      ) : null}
    </div>
  )
}

function GeoField(props: {
  t: (key: DshWsLocaleKey) => string
  testid: string
  labelKey: DshWsLocaleKey
  noteKey: DshWsLocaleKey
  placeholder: string
  value: string | undefined
  onSet: (value: string) => Promise<ActionResult>
}) {
  const { t, testid, labelKey, noteKey, placeholder, value, onSet } = props
  const [draft, setDraft] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<'saved' | 'failed' | undefined>(undefined)
  useEffect(() => {
    if (feedback === undefined) return
    const timer = setTimeout(() => setFeedback(undefined), 1500)
    return () => clearTimeout(timer)
  }, [feedback])
  const current = value ?? ''
  const shown = draft ?? current
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }}>
        {t(labelKey)}
        <Tooltip label={t(noteKey)} side="bottom" delayMs={400} maxWidth={360}>
          <button type="button" aria-label={t(noteKey)} style={infoButtonStyle}>
            <IconQuestionOutline14 />
          </button>
        </Tooltip>
      </span>
      <span style={{ flex: 1 }} />
      <input
        aria-label={t(labelKey)}
        data-testid={testid}
        placeholder={placeholder}
        value={shown}
        onChange={(event) => { setDraft(event.target.value); setFeedback(undefined) }}
        style={{ width: 88, height: 28, padding: '0 8px', textAlign: 'center', borderRadius: 8, border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-2)', color: 'inherit', font: 'inherit' }}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={draft === null || draft === current}
        aria-label={`${t(labelKey)} ${t('save')}`}
        onClick={() => {
          void onSet(draft ?? '').then((result) => {
            setFeedback(result.ok ? 'saved' : 'failed')
            if (result.ok) setDraft(null)
          })
        }}
      >
        {t('save')}
      </Button>
      {feedback !== undefined ? (
        <span role="status" data-testid={`${testid}-feedback`} style={{ fontSize: 12, color: feedbackColor(feedback === 'saved' ? 'saved' : 'failed') }}>{t(feedback)}</span>
      ) : null}
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
  onSetBaseURL: SectionProps['onSetBaseURL']
  onSetMemberOption: SectionProps['onSetMemberOption']
}) {
  const { member, t, onSaveKey, onClearKey, onToggleEnabled, onSetKeySelection, onSetBaseURL, onSetMemberOption } = props
  const [draft, setDraft] = useState('')
  // S14d: masked •••• when configured and not editing; focus opens a fresh entry.
  const [editing, setEditing] = useState(false)
  const [feedback, setFeedback] = useState<Extract<DshWsLocaleKey, 'saved' | 'cleared' | 'failed'> | undefined>(undefined)
  // S14o: the saved/cleared note auto-clears (2.5s) like the maxUses and
  // endpoint rows — a sticky 已清除/已保存 that only a page reload dismisses
  // reads as a stuck state (user report).
  useEffect(() => {
    if (feedback === undefined) return
    const timer = setTimeout(() => setFeedback(undefined), 1500)
    return () => clearTimeout(timer)
  }, [feedback])
  const save = async (): Promise<void> => {
    const result = await onSaveKey(member.key, draft)
    if (result.ok) {
      setDraft('')
      // S14r: leave the editing session so the field returns to the masked
      // display state immediately — the user asked for save → auto-mask, not
      // plaintext until blur/re-collapse (user report).
      setEditing(false)
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
  // S14c (user ruling): cards default COLLAPSED — the header row (status, name,
  // switch) is the steady state; the key/pool surface opens on demand.
  const [open, setOpen] = useState(false)

  return (
    <div data-testid={`dshws-member-${member.key}`} style={cardStyle}>
      {/* S14k (user report): the WHOLE header is the disclosure button — the
      official PluginCard pattern (click anywhere on the head row to expand /
      collapse, chevron rotates). The enable switch stays a separate sibling
      button (buttons cannot nest); clicking it must not toggle the card. */}
      <div style={cardHeadStyle}>
        <button
          type="button"
          data-testid={`dshws-member-toggle-${member.key}`}
          aria-expanded={open}
          aria-label={`${member.label} ${t('configure')}`}
          onClick={() => { setOpen((value) => !value) }}
          style={{ ...cardHeadStyle, flex: 1, minWidth: 0, border: 'none', background: 'transparent', color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer', padding: 0 }}
        >
          <span role="img" aria-label={statusText} title={statusText} style={statusDotStyle(member.configured)} />
          <strong style={nameStyle}>{member.label}</strong>
          <span style={{ flex: 1 }} />
          <span aria-hidden="true" style={{ fontSize: 10, color: 'var(--dsw-alias-label-tertiary)', transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▾</span>
        </button>
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
      {open ? (
      <>
      <div style={fieldStyle}>
        <span style={fieldLabelStyle}>
          {t('apiKey')}
          {/* S14t (user ruling): the ! badge sits right after the「API Key」
          LABEL — beside the field it explains, not after the input+chip row. */}
          <Tooltip
            label={t('keySelectionHint').replace('{policy}', t(keySelectionLabelKey(member.keySelection)))}
            side="bottom"
            delayMs={200}
            maxWidth={320}
          >
            <button
              type="button"
              aria-label={t('keySelectionHint').replace('{policy}', t(keySelectionLabelKey(member.keySelection)))}
              data-testid={`dshws-keysel-info-${member.key}`}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, padding: 0, border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 999, background: 'transparent', color: 'var(--dsw-alias-label-secondary)', fontSize: 11, lineHeight: 1, cursor: 'help', opacity: 0.6 }}
            >
              !
            </button>
          </Tooltip>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        {/* S14q (user ruling): typing is PLAINTEXT; the •••• mask shows only
        while a configured card sits re-expanded and untouched — focusing the
        field reveals an empty plaintext field for a fresh entry. Masking the
        user's own keystrokes read as broken input, not protection. */}
        <input
          type="text"
          autoComplete="off"
          aria-label={`${member.label} ${t('apiKey')}`}
          placeholder={t('keyPlaceholder').replace('{ref}', member.refName)}
          value={draft === '' && member.configured && !editing ? t('maskedKey') : draft}
          onFocus={() => { if (draft === '') setEditing(true) }}
          onBlur={() => { if (draft === '') setEditing(false) }}
          onChange={(event) => setDraft(event.target.value)}
          style={{ ...fieldInputStyle, flex: 1, minWidth: 0 }}
        />
          {/* S14n (user ruling): the pool policy is ONE cycling chip beside the
          key input — each click advances 轮询 → 顺序 → 随机 → 轮询; hover
          states the live semantics. Replaces the three-segment group. */}
          <Tooltip
            label={t('keySelectionHint').replace('{policy}', t(keySelectionLabelKey(member.keySelection)))}
            side="bottom"
            delayMs={300}
            maxWidth={320}
          >
            <button
              type="button"
              data-testid={`dshws-keysel-chip-${member.key}`}
              aria-label={`${member.label} ${t('keySelection')} ${t(keySelectionLabelKey(member.keySelection))}`}
              disabled={!member.configured}
              onClick={() => {
                const order: readonly ('order' | 'round-robin' | 'random')[] = ['round-robin', 'order', 'random']
                const next = order[(order.indexOf(member.keySelection) + 1) % order.length]!
                void onSetKeySelection(member.key, next)
              }}
              style={{ ...keySelButtonStyle(true, member.configured), display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, lineHeight: '18px', padding: '6px 10px' }}
            >
              <span aria-hidden="true" style={{ fontSize: 12 }}>⇄</span>
              {t(keySelectionLabelKey(member.keySelection))}
            </button>
          </Tooltip>
        </div>
      </div>
      {/* S14k (user report): the official DeepSeek card exposes Endpoint —
      parity here. Empty = provider default; hot since S17 D1 (note inline). */}
      <MemberEndpointField member={member} t={t} onSet={onSetBaseURL} />
      {(MEMBER_PARAM_CONTROLS[member.key] ?? []).map((control) => (
        <MemberParamField key={`${member.key}-${control.option}`} member={member} control={control} t={t} onSet={onSetMemberOption} />
      ))}
      <div style={footerStyle}>
        {feedback ? (
          <span role="status" data-testid={`dshws-feedback-${member.key}`} style={{ ...feedbackStyle, color: feedbackColor(feedback) }}>{t(feedback)}</span>
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
      </>
      ) : null}
    </div>
  )
}
