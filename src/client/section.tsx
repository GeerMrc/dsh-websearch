import { useState, useSyncExternalStore } from 'react'
import { Button, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import { ChevronDownIcon, QuestionIcon } from './host-icons.tsx'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { memberLabelOf } from './controller.ts'
import type { WebSearchSettingsController, ActionResult, SectionSnapshot } from './controller.ts'
import type { DshWsLocaleKey } from './locales.ts'
import { DnsResilienceCard } from './dns-card.tsx'
import { FallbackToolRow, FetchTakeoverRow, FetchChainRows } from './chain-cards.tsx'
import { MemberCard, UnsavedPill, DomainField, GeoField } from './member-card.tsx'
import {
  cardStyle,
  hintStyle,
  infoButtonStyle,
  feedbackColor,
  feedbackStyle,
  chainRowStyle,
  chainIndexStyle,
  roleChipStyle,
  moveButtonStyle,
  useAutoClearFeedback,
  useLiftedDraft,
} from './section-styles.ts'

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
  /** Re-fetch key counts (badge freshness on card expand). */
  onRefreshKeyCounts: () => Promise<void>
  /** S35 DNS resilience block (ADR-0022): mode/scope/preset/custom-nodes writes. */
  onSetDnsMode: (mode: 'auto' | 'on' | 'off') => Promise<ActionResult>
  /** S39 (plan 038 T3): egress probe method (tcp/tls-hello). */
  onSetDnsProbeMethod: (method: 'tcp' | 'tls-hello') => Promise<ActionResult>
  onSetDnsPreset: (preset: 'auto' | 'cn' | 'global' | 'custom') => Promise<ActionResult>
  onSetDnsNodes: (text: string) => Promise<ActionResult>
  /** S35: force a fresh canary pass (the re-check button). */
  onRecheckDns: () => Promise<ActionResult>
  /** S36 (plan 036): refresh the DNS remote face — fires when the DNS card expands (refreshCounts-on-expand precedent). */
  onRefreshDnsFace: () => Promise<void>
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
        onRefreshKeyCounts={() => controller.refreshCounts()}
        onSetDnsMode={(mode) => controller.setDnsMode(mode)}
        onSetDnsProbeMethod={(method) => controller.setDnsProbeMethod(method)}
        onSetDnsPreset={(preset) => controller.setDnsPreset(preset)}
        onSetDnsNodes={(text) => controller.setDnsNodesText(text)}
        onRecheckDns={() => controller.recheckDns()}
        onRefreshDnsFace={() => controller.refreshDnsFace()}
      />
    )
  }
}


/**
 * S23 §0.5 B1: pseudo-class rules the inline-style system cannot express,
 * delivered as one injected <style> block selected by data-dshws-* attributes.
 * Colors stay tokenized (--dsw-alias-*) so both themes stay correct; host
 * anchors: PluginCard.module.css (.card:hover/.cardOpen/.header:focus-visible).
 */
const SECTION_STYLE_CSS = `
[data-dshws-card] { transition: border-color .16s, background .16s; }
[data-dshws-card]:hover { border-color: var(--dsw-alias-label-dimmed); }
[data-dshws-card][data-open='true'] { background: var(--dsw-alias-bg-layer-2); border-color: var(--dsw-alias-label-dimmed); }
[data-dshws-card-body] { border-top: 1px solid var(--dsw-alias-border-l2); margin: 0 2px; padding-top: 8px; }
[data-dshws-input]:focus { border-color: var(--dsw-alias-brand-primary); outline: none; }
[data-dshws-focusable]:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }
@media (prefers-reduced-motion: reduce) {
  [data-dshws-card] { transition: none; }
  [data-dshws-chevron] { transition: none !important; }
}
`

/** The section body (`t` arrives as the locale runtime's standard seat). */
export function WebSearchSettingsSection(props: SectionProps & PropsLocale<'dsh-websearch'>) {
  const { t, snapshot, onSaveKey, onClearKey, onToggleEnabled, onMoveSearch, onSetKeySelection, onSetMaxUses, onSetFallbackMember, onSetFetchTakeover, onSetBaseURL, onSetMemberOption, onSetSearchCountry, onSetSearchLanguage, onSetSearchDomains, onMoveFetch, onRefreshKeyCounts, onSetDnsMode, onSetDnsPreset, onSetDnsNodes, onRecheckDns, onRefreshDnsFace, onSetDnsProbeMethod } = props
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
  // S23 D9: the fold's staged drafts live HERE so they survive folding, and
  // any pending entry lights the disclosure's unsaved pill.
  const [advancedDrafts, setAdvancedDrafts] = useState<Record<string, string | null>>({})
  const setAdvancedDraft = (key: string, value: string | null): void => {
    setAdvancedDrafts((previous) => ({ ...previous, [key]: value }))
  }
  const advancedDirty = Object.values(advancedDrafts).some((value) => value !== null)
  const liftedOf = (key: string) => ({ draft: advancedDrafts[key] ?? null, onDraftChange: (value: string | null) => setAdvancedDraft(key, value) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
      {/* S23 §0.5 B1: one injected style block rides the section root (single-file CJS
          distribution has no CSS channel of its own). */}
      <style data-dshws-styles="">{SECTION_STYLE_CSS}</style>
      <div>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {t('title')}
          {/* Page-level key-format note (12b): stated once behind this icon instead
          of repeated as a hint paragraph on every member card. */}
          {/* S14d (user ruling): the page ⓘ carries the description; the
          multi-key format moved into each card's input placeholder. */}
          <Tooltip label={t('description')} side="bottom" delayMs={400} maxWidth={360}>
            <button type="button" aria-label={t('description')} style={infoButtonStyle}>
              <QuestionIcon />
            </button>
          </Tooltip>
        </h3>
        <p style={{ margin: 0, marginTop: 4, fontSize: 14, lineHeight: '22px', color: 'var(--dsw-alias-label-tertiary)' }}>{t('description')}</p>
      </div>
      {/* Global area (S14c, user ruling): the chain card sits ABOVE the tools,
      always visible; the reorder rows only earn their place once a member is
      configured (S12a rationale), while the tail note, timeout, and the
      host-parity maxUses knob are meaningful in every state. */}
      <section data-testid="dshws-chains" data-dshws-card="" style={{ ...cardStyle, padding: '10px 14px', gap: 8 }}>
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
                style={infoButtonStyle}
              >
                <QuestionIcon />
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
                  {memberLabelOf(id)}
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
                  data-dshws-focusable=""
                  aria-label={`${memberLabelOf(id)} ${t('moveUp')}`}
                  disabled={index === 0}
                  onClick={() => void move(id, -1)}
                  style={moveButtonStyle}
                >
                  ↑
                </button>
                <button
                  type="button"
                  data-dshws-focusable=""
                  aria-label={`${memberLabelOf(id)} ${t('moveDown')}`}
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
                <span data-dshws-chain-label="">{memberLabelOf(designatedId)}</span>
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
            data-dshws-focusable=""
            aria-expanded={advancedOpen}
            aria-label={t('advancedConfigLabel')}
            onClick={() => { setAdvancedOpen((value) => !value) }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', color: 'var(--dsw-alias-label-secondary)', font: 'inherit', fontSize: 12, fontWeight: 500, textAlign: 'left', cursor: 'pointer', padding: 0 }}
          >
            {t('advancedConfigLabel')}
            {advancedDirty ? <UnsavedPill t={t} testid="dshws-unsaved-advanced" /> : null}
            {/* S23 D1: the host chevron icon; 160ms rotation (D16 exemption lands with the T4 style block). */}
            <span aria-hidden="true" data-dshws-chevron="" style={{ display: 'inline-flex', color: 'var(--dsw-alias-label-tertiary)', transform: advancedOpen ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }}>
              <ChevronDownIcon />
            </span>
          </button>
          {advancedOpen ? (
            <>
              {/* S23b (user ruling): the fallback selector joins the verbose
              knobs inside the advanced fold — chain behavior config in one
              place, the member list above stays scannable. */}
              <FallbackToolRow key="dshws-fallback-tool" snapshot={snapshot} t={t} onChoose={onSetFallbackMember} />
              <p style={hintStyle}>
                {t('timeout')}: {snapshot.timeoutMs} ms
              </p>
              <MaxUsesRow t={t} value={snapshot.deepseekMaxUses} onSet={onSetMaxUses} lifted={liftedOf('maxUses')} />
              <SearchGeoFields t={t} country={snapshot.searchCountry} language={snapshot.searchLanguage} onSetCountry={onSetSearchCountry} onSetLanguage={onSetSearchLanguage} lifted={{ country: liftedOf('country'), language: liftedOf('language') }} />
              <SearchDomainFields t={t} includeDomains={snapshot.searchIncludeDomains} excludeDomains={snapshot.searchExcludeDomains} onSet={onSetSearchDomains} lifted={{ include: liftedOf('domain-include'), exclude: liftedOf('domain-exclude') }} />
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
            onRefreshKeyCounts={onRefreshKeyCounts}
          />
        ))}
        {/* S22b (user ruling): the takeover row adopts the member-card fold —
        header (label, ⓘ, switch) stays visible, the Web Fetch chain rows open
        on demand (and only while the takeover is on, S22a T3). */}
        <FetchTakeoverRow t={t} active={snapshot.fetchTakeover} onSet={onSetFetchTakeover} chain={<FetchChainRows t={t} snapshot={snapshot} onMove={onMoveFetch} />} />
      </div>
      {/* S35 (user ruling 2026-09-27): the DNS resilience block rides at the
      section bottom — a chain-level capability, owned by no single member. */}
      <DnsResilienceCard
        t={t}
        snapshot={snapshot}
        onSetDnsMode={onSetDnsMode}
        onSetDnsProbeMethod={onSetDnsProbeMethod} onSetDnsPreset={onSetDnsPreset}
        onSetDnsNodes={onSetDnsNodes}
        onRecheckDns={onRecheckDns}
        onRefreshDnsFace={onRefreshDnsFace}
      />
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
  lifted?: { draft: string | null, onDraftChange: (value: string | null) => void }
}) {
  const { t, value, onSet, lifted } = props
  const [liftedDraft, setLiftedDraft] = useLiftedDraft(lifted)
  // The knob's own semantics are string-draft based ('' = shows the stored
  // value); a lifted null maps onto the same '' steady state.
  const draft = liftedDraft ?? ''
  const setDraft = (next: string): void => { setLiftedDraft(next === '' && lifted !== undefined ? null : next) }
  const [feedback, setFeedback] = useAutoClearFeedback<'saved' | 'failed'>()
  const current = value ?? 10
  const parsed = draft.trim() === '' ? current : Number.parseInt(draft, 10)
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
            <QuestionIcon />
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
          data-dshws-input=""
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

/** Unified search region/language fields (S17 P1, ADR-0015) — global single write point. */
function SearchGeoFields(props: {
  t: (key: DshWsLocaleKey) => string
  country: string | undefined
  language: string | undefined
  onSetCountry: (country: string) => Promise<ActionResult>
  onSetLanguage: (language: string) => Promise<ActionResult>
  lifted?: Record<'country' | 'language', { draft: string | null, onDraftChange: (value: string | null) => void }>
}) {
  const { t, country, language, onSetCountry, onSetLanguage, lifted } = props
  return (
    <div data-testid="dshws-search-geo" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <GeoField t={t} testid="dshws-search-country" labelKey="searchCountryLabel" noteKey="searchCountryNote" placeholder="CN" value={country} onSet={onSetCountry} lifted={lifted?.country} />
      <GeoField t={t} testid="dshws-search-language" labelKey="searchLanguageLabel" noteKey="searchLanguageNote" placeholder="zh" value={language} onSet={onSetLanguage} lifted={lifted?.language} />
    </div>
  )
}

/** Unified domain allow/block lists (S20 P1, ADR-0018) — mutually exclusive single-line inputs. */
function SearchDomainFields(props: {
  t: (key: DshWsLocaleKey) => string
  includeDomains: string | undefined
  excludeDomains: string | undefined
  onSet: (kind: 'include' | 'exclude', domains: string) => Promise<ActionResult>
  lifted?: Record<'include' | 'exclude', { draft: string | null, onDraftChange: (value: string | null) => void }>
}) {
  const { t, includeDomains, excludeDomains, onSet, lifted } = props
  return (
    <div data-testid="dshws-search-domains" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <DomainField t={t} kind="include" value={includeDomains} onSet={onSet} lifted={lifted?.include} />
      <DomainField t={t} kind="exclude" value={excludeDomains} onSet={onSet} lifted={lifted?.exclude} />
    </div>
  )
}
