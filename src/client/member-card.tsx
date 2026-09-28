/**
 * Per-member provider cards of the web-search settings section: the key pool
 * surface with its selection chip and key-count badge, the endpoint override,
 * the S17 P1 parameter controls, and the staged-text field family
 * (StagedTextField/DomainField/GeoField) shared with the section's geo and
 * domain rows.
 *
 * @module dsh-websearch/client/member-card
 */
import { useState } from 'react'
import { Button, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import { ChevronDownIcon, QuestionIcon } from './host-icons.tsx'
import { MEMBERS } from './controller.ts'
import type { ActionResult, MemberSnapshot } from './controller.ts'
import type { SectionProps } from './section.tsx'
import type { DshWsLocaleKey } from './locales.ts'
import {
  cardStyle,
  cardHeadStyle,
  nameStyle,
  paramRowStyle,
  groupHeaderStyle,
  fieldLabelStyle,
  fieldInputStyle,
  infoButtonStyle,
  feedbackColor,
  feedbackStyle,
  switchStyle,
  thumbStyle,
  statusDotStyle,
  selectStyle,
  useAutoClearFeedback,
  useLiftedDraft,
} from './section-styles.ts'

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

// The Input primitive's own wrapper carries the full field visual (32px, r8,
// bg-layer-1, border) — only the width needs asserting here.
/** Chain rows render the brand label; ids stay the test/action payload (D3). */

/** The three pool policies and their label keys, in control order (S13 D2). */
const KEY_SELECTIONS = [
  { value: 'order', labelKey: 'keySelOrder' },
  { value: 'round-robin', labelKey: 'keySelRoundRobin' },
  { value: 'random', labelKey: 'keySelRandom' },
] as const

/** Locale key for one policy value (the hint interpolates the live policy name). */
const keySelectionLabelKey = (selection: 'order' | 'round-robin' | 'random'): DshWsLocaleKey =>
  KEY_SELECTIONS.find((entry) => entry.value === selection)?.labelKey ?? 'keySelOrder'

/** S23 D9: the host's header-carried pending pill (PluginCard.module.css .pending). */
const unsavedPillStyle = {
  flex: 'none',
  borderRadius: 999,
  padding: '1px 8px',
  fontSize: 11,
  lineHeight: '17px',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  background: 'var(--dsw-alias-bg-module-platform)',
  color: 'var(--dsw-alias-label-secondary)',
} as const

/** The pending pill a header carries while a staged draft is unsaved. */
export function UnsavedPill(props: { t: (key: DshWsLocaleKey) => string, testid: string }) {
  return <span data-testid={props.testid} style={unsavedPillStyle}>{props.t('unsavedPending')}</span>
}

/** Pool cap mirrored from the node half's `MAX_KEYS_PER_POOL` (tooltip copy). */
const MAX_KEYS_PER_POOL = 10

// 14px circular footprint — the same size as the header's ? info icon
// (QuestionIcon), so the badge sits in the established icon rhythm.
// Widths are content-box: 12+2×1px (counted) and 11+2×1.5px (zero) both
// render exactly 14px including borders.
const keyCountBadgeBaseStyle = {
  flex: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  borderRadius: '50%',
  fontSize: 10,
  lineHeight: '12px',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  marginLeft: 6,
  background: 'transparent',
} as const

const keyCountZeroStyle = {
  ...keyCountBadgeBaseStyle,
  width: 11,
  height: 11,
  border: '1.5px solid var(--dsw-alias-border-l3)',
} as const

const keyCountCountStyle = {
  ...keyCountBadgeBaseStyle,
  width: 12,
  height: 12,
  // Green activation, the plugin's own "lit" color (status dot, saved
  // feedback, chain member badges all use this token).
  border: '1px solid var(--dsw-alias-state-success-primary)',
  color: 'var(--dsw-alias-state-success-primary)',
} as const

const keyCountOverStyle = {
  ...keyCountBadgeBaseStyle,
  width: 12,
  height: 12,
  border: '1px solid var(--dsw-alias-state-warn-label)',
  color: 'var(--dsw-alias-state-warn-label)',
} as const

/**
 * Per-member API-key count chip (expanded header only): a 14px circle (the ?
 * info icon's footprint) — gray hollow at 0, green-counted at 1..cap (the
 * plugin's activation color), warn-colored at over-cap (the pool draws loudly
 * fail over the limit, ADR-0011). `undefined` never reaches here — the caller
 * hides the badge until counts load.
 */
function KeyCountBadge(props: { count: number, t: (key: DshWsLocaleKey) => string, testid: string }) {
  const { count, t, testid } = props
  if (count === 0) {
    return <span role="img" aria-label={t('keyCountZeroTitle')} title={t('keyCountZeroTitle')} data-testid={testid} data-state="zero" style={keyCountZeroStyle} />
  }
  const title = t('keyCountTitle').replace('{count}', String(count)).replace('{max}', String(MAX_KEYS_PER_POOL))
  return (
    <span
      role="img"
      aria-label={title}
      title={title}
      data-testid={testid}
      data-state={count > MAX_KEYS_PER_POOL ? 'over' : 'count'}
      style={count > MAX_KEYS_PER_POOL ? keyCountOverStyle : keyCountCountStyle}
    >
      {count}
    </span>
  )
}

/**
 * S23 D1: the host chevron icon; 160ms rotation (D16 exemption lands with the T4 style block).
 */
/** Per-member endpoint override (S14k): staged text input mirroring the
 * official「接口地址」field — empty means the provider default; the saved value
 * applies to the next search (hot since S17 D1, noted beside the field). */
function MemberEndpointField(props: {
  member: MemberSnapshot
  t: (key: DshWsLocaleKey) => string
  onSet: (memberKey: string, baseURL: string) => Promise<ActionResult>
  lifted?: { draft: string | null, onDraftChange: (value: string | null) => void }
}) {
  const { member, t, onSet, lifted } = props
  const [draft, setDraft] = useLiftedDraft(lifted)
  const [feedback, setFeedback] = useAutoClearFeedback<'saved' | 'failed'>()
  const value = draft ?? member.baseURL ?? ''
  return (
    <div style={fieldStyle}>
      <span style={fieldLabelStyle}>
        {t('endpointLabel')}
        <Tooltip label={t('endpointNote')} side="bottom" delayMs={400} maxWidth={320}>
          <button type="button" aria-label={t('endpointNote')} style={infoButtonStyle}>
            <QuestionIcon />
          </button>
        </Tooltip>
      </span>
      <input
        aria-label={`${member.label} ${t('endpointLabel')}`}
        data-testid={`dshws-endpoint-${member.key}`}
        data-dshws-input=""
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
      { value: '', labelKey: 'optDefault' }, { value: 'restrict', labelKey: 'modeRestrict' }, { value: 'prefer', labelKey: 'modePrefer' }] },
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
      { value: '', labelKey: 'optDefault' }, { value: 'developer', labelKey: 'fcCatDeveloper' }, { value: 'research', labelKey: 'fcCatResearch' }, { value: 'pdf', labelKey: 'fcCatPdf' }, { value: 'alexandria', labelKey: 'fcCatAlexandria' }] },
  ],
}

/** One rendered S17 member parameter: selects/toggles commit immediately; text/number stage a draft. */
function MemberParamField(props: {
  member: MemberSnapshot
  control: MemberParamControl
  t: (key: DshWsLocaleKey) => string
  onSet: SectionProps['onSetMemberOption']
  lifted?: { draft: string | null, onDraftChange: (value: string | null) => void }
}) {
  const { member, control, t, onSet, lifted } = props
  const [draft, setDraft] = useLiftedDraft(lifted)
  const [feedback, setFeedback] = useAutoClearFeedback<'saved' | 'failed'>()
  const stored = member[control.option]
  const ariaLabel = `${member.label} ${t(control.labelKey)}`
  const testid = `dshws-param-${member.key}-${control.option}`
  const commit = (value: string | number | boolean): Promise<ActionResult> =>
    onSet(member.key, control.option, value).then((result) => {
      setFeedback(result.ok ? 'saved' : 'failed')
      return result
    })

  if (control.kind === 'select') {
    const value = typeof stored === 'string' && stored !== '' ? stored : (control.fallback ?? '')
    return (
      <div style={paramRowStyle}>
        <span style={{ ...fieldLabelStyle, flex: 1, minWidth: 0 }}>
          {t(control.labelKey)}
          {control.noteKey !== undefined ? (
            <Tooltip label={t(control.noteKey)} side="bottom" delayMs={400} maxWidth={320}>
              <button type="button" aria-label={ariaLabel} style={infoButtonStyle}>
                <QuestionIcon />
              </button>
            </Tooltip>
          ) : null}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            aria-label={ariaLabel}
            data-testid={testid}
            data-dshws-focusable=""
            data-dshws-input=""
            value={value}
            onChange={(event) => { void commit(event.target.value) }}
            style={selectStyle}
          >
            {control.options.map((option) => (
              <option key={option.value} value={option.value} title={t(option.labelKey)}>{t(option.labelKey)}</option>
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
      <div style={paramRowStyle}>
        <span style={{ ...fieldLabelStyle, flex: 1, minWidth: 0 }}>
          {t(control.labelKey)}
          {control.noteKey !== undefined ? (
            <Tooltip label={t(control.noteKey)} side="bottom" delayMs={400} maxWidth={320}>
              <button type="button" aria-label={ariaLabel} style={infoButtonStyle}>
                <QuestionIcon />
              </button>
            </Tooltip>
          ) : null}
        </span>
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
    <div style={paramRowStyle}>
      <span style={{ ...fieldLabelStyle, flex: 1, minWidth: 0 }}>
        {t(control.labelKey)}
        {control.noteKey !== undefined ? (
          <Tooltip label={t(control.noteKey)} side="bottom" delayMs={400} maxWidth={320}>
            <button type="button" aria-label={ariaLabel} style={infoButtonStyle}>
              <QuestionIcon />
            </button>
          </Tooltip>
        ) : null}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, justifyContent: 'flex-end' }}>
        <input
          type={control.kind === 'number' ? 'number' : control.inputType}
          min={control.kind === 'number' ? control.min : undefined}
          max={control.kind === 'number' ? control.max : undefined}
          aria-label={ariaLabel}
          data-testid={testid}
          data-dshws-input=""
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
            void commit(control.kind === 'number' ? Number(value) : value).then((result) => {
              if (result.ok) setDraft(null)
            })
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

/**
 * One staged text field (S37 T11): label + ⓘ note + input + Save + live-region
 * feedback, with the draft lifted on request — the shape DomainField and
 * GeoField previously duplicated at ~95% identity.
 */
function StagedTextField(props: {
  t: (key: DshWsLocaleKey) => string
  testid: string
  labelKey: DshWsLocaleKey
  noteKey: DshWsLocaleKey
  placeholder: string
  width: number
  centered?: boolean
  value: string | undefined
  onSet: (value: string) => Promise<ActionResult>
  lifted?: { draft: string | null, onDraftChange: (value: string | null) => void }
}) {
  const { t, testid, labelKey, noteKey, placeholder, width, centered, value, onSet, lifted } = props
  const [draft, setDraft] = useLiftedDraft(lifted)
  const [feedback, setFeedback] = useAutoClearFeedback<'saved' | 'failed'>()
  const current = value ?? ''
  const shown = draft ?? current
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--dsw-alias-label-secondary)' }}>
        {t(labelKey)}
        <Tooltip label={t(noteKey)} side="bottom" delayMs={400} maxWidth={380}>
          <button type="button" aria-label={t(noteKey)} style={infoButtonStyle}>
            <QuestionIcon />
          </button>
        </Tooltip>
      </span>
      <span style={{ flex: 1 }} />
      <input
        aria-label={t(labelKey)}
        data-testid={testid}
        data-dshws-input=""
        placeholder={placeholder}
        value={shown}
        onChange={(event) => { setDraft(event.target.value); setFeedback(undefined) }}
        style={{ width, height: 28, padding: '0 8px', ...(centered === true ? { textAlign: 'center' as const } : {}), borderRadius: 8, border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-2)', color: 'inherit', font: 'inherit' }}
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

/** One include/exclude domain-list field (S20 P1, ADR-0018) on StagedTextField. */
export function DomainField(props: {
  t: (key: DshWsLocaleKey) => string
  kind: 'include' | 'exclude'
  value: string | undefined
  onSet: (kind: 'include' | 'exclude', value: string) => Promise<ActionResult>
  lifted?: { draft: string | null, onDraftChange: (value: string | null) => void }
}) {
  const { t, kind, value, onSet, lifted } = props
  return (
    <StagedTextField
      t={t}
      testid={`dshws-search-domains-${kind}`}
      labelKey={kind === 'include' ? 'searchIncludeDomainsLabel' : 'searchExcludeDomainsLabel'}
      noteKey={kind === 'include' ? 'searchIncludeDomainsNote' : 'searchExcludeDomainsNote'}
      placeholder="example.com,foo.org"
      width={200}
      value={value}
      onSet={(text) => onSet(kind, text)}
      lifted={lifted}
    />
  )
}

/** A centered narrow staged text field (the search region/language inputs). */
export function GeoField(props: {
  t: (key: DshWsLocaleKey) => string
  testid: string
  labelKey: DshWsLocaleKey
  noteKey: DshWsLocaleKey
  placeholder: string
  value: string | undefined
  onSet: (value: string) => Promise<ActionResult>
  lifted?: { draft: string | null, onDraftChange: (value: string | null) => void }
}) {
  const { t, testid, labelKey, noteKey, placeholder, value, onSet, lifted } = props
  return (
    <StagedTextField
      t={t}
      testid={testid}
      labelKey={labelKey}
      noteKey={noteKey}
      placeholder={placeholder}
      width={88}
      centered
      value={value}
      onSet={onSet}
      lifted={lifted}
    />
  )
}

/** One provider card: header (status dot, name, badges, enable switch) above
 * the folded key/endpoint/parameter surface. */
export function MemberCard(props: {
  member: MemberSnapshot
  t: (key: DshWsLocaleKey) => string
  onSaveKey: SectionProps['onSaveKey']
  onClearKey: SectionProps['onClearKey']
  onToggleEnabled: SectionProps['onToggleEnabled']
  onSetKeySelection: SectionProps['onSetKeySelection']
  onSetBaseURL: SectionProps['onSetBaseURL']
  onSetMemberOption: SectionProps['onSetMemberOption']
  onRefreshKeyCounts: SectionProps['onRefreshKeyCounts']
}) {
  const { member, t, onSaveKey, onClearKey, onToggleEnabled, onSetKeySelection, onSetBaseURL, onSetMemberOption, onRefreshKeyCounts } = props
  const [draft, setDraft] = useState('')
  // S14d: masked •••• when configured and not editing; focus opens a fresh entry.
  const [editing, setEditing] = useState(false)
  const [feedback, setFeedback] = useAutoClearFeedback<'saved' | 'cleared' | 'failed'>()
  // S14o: the saved/cleared note auto-clears (1.5s) like the maxUses and
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
  // S23 D9 (plan §0.5 B2 path a): lifted staged drafts for the endpoint and
  // parameter fields — they survive the card folding around them, and any
  // non-null entry lights the header's unsaved pill.
  const [liftedDrafts, setLiftedDrafts] = useState<Record<string, string | null>>({})
  const setLiftedDraft = (key: string, value: string | null): void => {
    setLiftedDrafts((previous) => ({ ...previous, [key]: value }))
  }
  const hasUnsavedDraft = draft !== '' || Object.values(liftedDrafts).some((value) => value !== null)

  return (
    <div data-testid={`dshws-member-${member.key}`} data-dshws-card="" data-open={open} style={cardStyle}>
      {/* S14k (user report): the WHOLE header is the disclosure button — the
      official PluginCard pattern (click anywhere on the head row to expand /
      collapse, chevron rotates). The enable switch stays a separate sibling
      button (buttons cannot nest); clicking it must not toggle the card. */}
      <div style={cardHeadStyle}>
        <button
          type="button"
          data-testid={`dshws-member-toggle-${member.key}`}
          data-dshws-focusable=""
          aria-expanded={open}
          aria-label={`${member.label} ${t('configure')}`}
          onClick={() => {
            setOpen((value) => {
              if (!value) void onRefreshKeyCounts()
              return !value
            })
          }}
          style={{ ...cardHeadStyle, flex: 1, minWidth: 0, border: 'none', background: 'transparent', color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer', padding: 0 }}
        >
          <span role="img" aria-label={statusText} title={statusText} style={statusDotStyle(member.configured)} />
          <strong style={nameStyle}>{member.label}</strong>
          {open && member.keyCount !== undefined
            ? <KeyCountBadge count={member.keyCount} t={t} testid={`dshws-keycount-${member.key}`} />
            : null}
          {hasUnsavedDraft ? <UnsavedPill t={t} testid={`dshws-unsaved-${member.key}`} /> : null}
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
              style={infoButtonStyle}
            >
              <QuestionIcon />
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
          data-dshws-input=""
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
          {/* S23b (user bug report): the key save/clear actions ride the API
          Key row itself — the card footer's twin 保存 read as a duplicate. */}
          {feedback !== undefined ? (
            <span role="status" data-testid={`dshws-feedback-${member.key}`} style={{ ...feedbackStyle, flex: undefined, color: feedbackColor(feedback) }}>{t(feedback)}</span>
          ) : null}
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
      {/* S14k (user report): the official DeepSeek card exposes Endpoint —
      parity here. Empty = provider default; hot since S17 D1 (note inline). */}
      <MemberEndpointField member={member} t={t} onSet={onSetBaseURL} lifted={{ draft: liftedDrafts.endpoint ?? null, onDraftChange: (value) => setLiftedDraft('endpoint', value) }} />
      {/* S23a T4: named groups + a two-column parameter grid — the expanded
      card reads as credentials (full-width) then a compact filter grid. */}
      {(MEMBER_PARAM_CONTROLS[member.key] ?? []).length > 0 ? (
        <>
          <p style={groupHeaderStyle}>{t('paramsGroupLabel')}</p>
          <div data-testid={`dshws-params-grid-${member.key}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '6px 16px' }}>
            {(MEMBER_PARAM_CONTROLS[member.key] ?? []).map((control) => (
              <MemberParamField key={`${member.key}-${control.option}`} member={member} control={control} t={t} onSet={onSetMemberOption} lifted={{ draft: liftedDrafts[control.option] ?? null, onDraftChange: (value) => setLiftedDraft(control.option, value) }} />
            ))}
          </div>
        </>
      ) : null}
      </>
      ) : null}
    </div>
  )
}
