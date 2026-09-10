// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WebSearchSettingsSection } from '../../src/client/section.tsx'

/** The bare brand of one chain row: role chips nest inside the label cell (S22a T1),
 * so the name is the label's first text node, not its full textContent. */
const rowBrand = (span: Element): string => (span.childNodes[0]?.textContent ?? '')
import type { SectionProps } from '../../src/client/section.tsx'
import type { ActionResult, MemberSnapshot, SectionSnapshot } from '../../src/client/controller.ts'
import { en } from '../../src/client/locales.ts'
import type { DshWsLocaleKey } from '../../src/client/locales.ts'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'

// The section only looks up own-namespace keys; the common-namespace keys
// TranslateNS also accepts resolve through the runtime's fallback chain,
// which this stub pins to the own dictionary.
const t: TranslateNS<'dsh-websearch'> = (key) => en[key as DshWsLocaleKey] ?? key

const BUILT_IN = ['dshws-tavily', 'dshws-exa', 'dshws-firecrawl', 'dshws-deepseek', 'dshws-anysearch']


/** S14c: cards default collapsed — expand before driving the key surface. */
function expand(memberKey: string): void {
  fireEvent.click(screen.getByTestId(`dshws-member-toggle-${memberKey}`))
}

/** S22b: open the search-chain card's verbose-config fold (default collapsed). */
function openAdvanced(): void {
  fireEvent.click(screen.getByTestId('dshws-advanced-disclosure'))
}

/** S22b: open the takeover card's Web Fetch chain fold (default collapsed). */
function openTakeover(): void {
  fireEvent.click(screen.getByTestId('dshws-fetch-takeover-disclosure'))
}

/** S14d: a configured card shows the masked value until focused — open a fresh
 * entry (focus) before typing into the key field. */
function focusKey(label: string): HTMLInputElement {
  const input = screen.getByLabelText(label) as HTMLInputElement
  fireEvent.focus(input)
  return input
}
const BRANDS = ['Tavily', 'Exa', 'Firecrawl', 'DeepSeek', 'AnySearch']

function member(key: string, label: string, overrides: Partial<MemberSnapshot> = {}): MemberSnapshot {
  return {
    key,
    label,
    memberId: `dshws-${key}`,
    refName: `${key.toUpperCase()}_API_KEY`,
    enabled: true,
    configured: true,
    keySelection: 'round-robin',
    baseURL: undefined,
    // S17 P1 raw values (undefined = provider default).
    topic: undefined,
    timeRange: undefined,
    searchDepth: undefined,
    includeAnswer: undefined,
    type: undefined,
    textFallback: true,
    startPublishedDate: undefined,
    tbs: undefined,
    location: undefined,
    chunksPerSource: undefined,
    filterByLanguage: undefined,
    safe: undefined,
    startDate: undefined,
    endDate: undefined,
    exactMatch: undefined,
    endPublishedDate: undefined,
    textVerbosity: undefined,
    includeSections: undefined,
    excludeSections: undefined,
    includeDomainsMode: undefined,
    category: undefined,
    maxAgeHours: undefined,
    sources: undefined,
    categories: undefined,
    source: undefined,
    writable: true,
    ...overrides,
  }
}

function defaultMembers(): MemberSnapshot[] {
  return [
    member('tavily', 'Tavily'),
    member('exa', 'Exa'),
    member('firecrawl', 'Firecrawl'),
    member('deepseek', 'DeepSeek'),
    member('anysearch', 'AnySearch'),
      ]
}

function makeSnapshot(members: MemberSnapshot[] = defaultMembers()): SectionSnapshot {
  const ORDERABLE = BUILT_IN.filter((id) => id !== 'dshws-deepseek')
  return {
    members,
    searchChain: ORDERABLE,
    searchChainPinned: false,
    timeoutMs: 30000,
    fetchChain: ['dshws-firecrawl', 'dshws-tavily', 'dshws-anysearch'],
    deepseekMaxUses: undefined,
    fallbackSelection: 'auto',
    fallbackDesignationReady: false,
    fallbackDeepseekEligible: false,
    readyToolMembers: [...ORDERABLE],
    fetchTakeover: true,
    searchCountry: undefined,
    searchLanguage: undefined,
    searchIncludeDomains: undefined,
    searchExcludeDomains: undefined,
    revision: 0,
    writable: true,
  }
}

function makeProps(overrides: Partial<SectionProps> = {}): SectionProps {
  return {
    snapshot: makeSnapshot(),
    onSaveKey: vi.fn(async () => ({ ok: true }) as ActionResult),
    onClearKey: vi.fn(async () => ({ ok: true }) as ActionResult),
    onToggleEnabled: vi.fn(async () => ({ ok: true }) as ActionResult),
    onMoveSearch: vi.fn(async () => ({ ok: true }) as ActionResult),
    onSetKeySelection: vi.fn(async () => ({ ok: true }) as ActionResult),
    onSetMaxUses: vi.fn(async () => ({ ok: true }) as ActionResult),
    onSetFallbackMember: vi.fn(async () => ({ ok: true }) as ActionResult),
    onSetFetchTakeover: vi.fn(async () => ({ ok: true }) as ActionResult),
    onSetBaseURL: vi.fn(async () => ({ ok: true }) as ActionResult),
    onSetMemberOption: vi.fn(async () => ({ ok: true }) as ActionResult),
    onSetSearchCountry: vi.fn(async () => ({ ok: true }) as ActionResult),
    onSetSearchLanguage: vi.fn(async () => ({ ok: true }) as ActionResult),
    onSetSearchDomains: vi.fn(async () => ({ ok: true }) as ActionResult),
    onMoveFetch: vi.fn(async () => ({ ok: true }) as ActionResult),
    ...overrides,
  }
}

afterEach(cleanup)

describe('WebSearchSettingsSection', () => {
  it('renders one card per member in snapshot order with brand labels', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const cards = screen.getByTestId('dshws-members').children
    expect(cards.length).toBe(6)
    // Card testids, not brand text: the fallback selector's options also
    // carry brand names inside this container (ADR-0014).
    expect(screen.getByTestId('dshws-member-tavily')).toBeTruthy()
    expect(screen.getByTestId('dshws-member-anysearch')).toBeTruthy()
    expect(screen.getByTestId('dshws-fallback-tool')).toBeTruthy()
    expect(screen.getByTestId('dshws-fetch-takeover')).toBeTruthy()
  })

  it('renders localized heading and description through the t seat', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    expect(screen.getByText(en.title)).toBeTruthy()
    expect(screen.getByText(en.description)).toBeTruthy()
  })

  it('the switch reflects enabled and forwards toggle clicks', async () => {
    const onToggleEnabled = vi.fn(async () => ({ ok: true }) as ActionResult)
    const members = defaultMembers()
    members[1] = member('exa', 'Exa', { enabled: false })
    render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members), onToggleEnabled })} t={t} />)
    const tavilySwitch = screen.getByRole('switch', { name: 'Tavily Enabled' })
    expect(tavilySwitch.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(tavilySwitch)
    await waitFor(() => expect(onToggleEnabled).toHaveBeenCalledWith('tavily', false))
    const exaSwitch = screen.getByRole('switch', { name: 'Exa Enabled' })
    expect(exaSwitch.getAttribute('aria-checked')).toBe('false')
  })

  it('save forwards the typed key, clears the draft, and shows saved feedback', async () => {
    const onSaveKey = vi.fn(async () => ({ ok: true }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onSaveKey })} t={t} />)
    expand('tavily')
    const input = focusKey('Tavily API Key')
    // S14q: typing is plaintext (the mask is a re-expand display state).
    expect(input.getAttribute('type')).toBe('text')
    fireEvent.change(input, { target: { value: 'sk-fake-tavily' } })
    fireEvent.click(within(screen.getByTestId('dshws-member-tavily')).getByRole('button', { name: 'Tavily Save' }))
    await waitFor(() => expect(onSaveKey).toHaveBeenCalledWith('tavily', 'sk-fake-tavily'))
    // S14r: save returns the field to the MASKED display state immediately
    // (configured + not editing) — plaintext until blur was the reported bug.
    await waitFor(() => expect(input.value).toBe(en.maskedKey))
    expect(screen.getByTestId('dshws-feedback-tavily').textContent).toBe(en.saved)
  })

  it('save failure shows failed feedback and keeps the draft', async () => {
    const onSaveKey = vi.fn(async () => ({ ok: false }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onSaveKey })} t={t} />)
    expand('tavily')
    const input = focusKey('Tavily API Key')
    fireEvent.change(input, { target: { value: 'sk-fake-tavily' } })
    fireEvent.click(within(screen.getByTestId('dshws-member-tavily')).getByRole('button', { name: 'Tavily Save' }))
    await waitFor(() => expect(screen.getByTestId('dshws-feedback-tavily').textContent).toBe(en.failed))
    expect(input.value).toBe('sk-fake-tavily')
  })

  it('the cleared note auto-dismisses instead of sticking until reload (S14o, 用户报告)', async () => {
    vi.useFakeTimers()
    try {
      const onClearKey = vi.fn(async () => ({ ok: true }) as ActionResult)
      render(<WebSearchSettingsSection {...makeProps({ onClearKey })} t={t} />)
      expand('tavily')
      fireEvent.click(within(screen.getByTestId('dshws-member-tavily')).getByRole('button', { name: `Tavily ${en.clear}` }))
      // The note appears (await the async action's microtask flush)…
      await vi.advanceTimersByTimeAsync(0)
      expect(screen.getByTestId('dshws-feedback-tavily').textContent).toBe(en.cleared)
      // …and leaves on its own after 2.5s — no reload needed.
      await vi.advanceTimersByTimeAsync(2600)
      expect(screen.queryByTestId('dshws-feedback-tavily')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('clear is gated on configured and forwards the member key', async () => {
    const onClearKey = vi.fn(async () => ({ ok: true }) as ActionResult)
    const members = defaultMembers()
    members[0] = member('tavily', 'Tavily', { configured: true })
    members[1] = member('exa', 'Exa', { configured: false })
    render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members), onClearKey })} t={t} />)
    expand('tavily')
    expand('exa')
    const tavilyClear = within(screen.getByTestId('dshws-member-tavily')).getByRole('button', { name: 'Tavily Clear' })
    expect((tavilyClear as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(tavilyClear)
    await waitFor(() => expect(onClearKey).toHaveBeenCalledWith('tavily'))
    const exaClear = within(screen.getByTestId('dshws-member-exa')).getByRole('button', { name: 'Exa Clear' })
    expect((exaClear as HTMLButtonElement).disabled).toBe(true)
  })

  it('renders the search chain as a compact card with brand names (S21: the fetch chain block sits beside it)', () => {
    const { container } = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const chains = container.querySelector('[data-testid="dshws-chains"]')!
    // S21: the fetch chain is now a live reorderable block (ADR-0019) — two
    // lists coexist inside the global card.
    expect(chains.querySelectorAll('ol').length).toBe(1)
    // S22a T3 + S22b: the fetch chain lives inside the takeover card's fold —
    // absent collapsed, present once the fold opens.
    expect(chains.querySelector('[data-testid="dshws-fetch-chain"]')).toBeNull()
    expect(container.querySelector('[data-testid="dshws-fetch-chain"]')).toBeNull()
    openTakeover()
    expect(container.querySelector('[data-testid="dshws-fetch-chain"]')).not.toBeNull()
    const searchRows = Array.from(chains.querySelector('[data-testid="dshws-search-chain"]')!.querySelectorAll('[data-dshws-chain-label]')).map(rowBrand)
    // S14c: four orderable rows only — DeepSeek is the fixed tail, not a row.
    expect(searchRows).toEqual(BRANDS.filter((brand) => brand !== 'DeepSeek'))
    // S22b: the timeout line sits behind the default-collapsed advanced fold.
    expect(chains.textContent).not.toContain('30000')
    openAdvanced()
    expect(chains.textContent).toContain('30000')
  })

  it('S22b: the advanced fold defaults collapsed and opens on demand (maxUses hidden until opened)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    expect(screen.queryByLabelText(en.maxUsesLabel)).toBeNull()
    openAdvanced()
    expect(screen.getByLabelText(en.maxUsesLabel)).toBeTruthy()
  })

  it('the reorder rows stay hidden while no member is configured; the global card remains (S14c 改判 12a 反馈④)', () => {
    const members = defaultMembers().map((m) => member(m.key, m.label, { configured: false }))
    const { container } = render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members) })} t={t} />)
    // The global card (chain + advanced fold) is always visible now…
    expect(container.querySelector('[data-testid="dshws-chains"]')).not.toBeNull()
    openAdvanced()
    expect(container.querySelector('[data-testid="dshws-max-uses"]')).not.toBeNull()
    // …but the reorder rows only earn their place once a member is configured.
    expect(container.querySelector('[data-testid="dshws-search-chain"]')).toBeNull()
  })

  it('the search chain is reorderable (the fetch chain has its own block, S21)', () => {
    const { container } = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const searchList = container.querySelector('[data-testid="dshws-search-chain"]')!
    const upButtons = searchList.querySelectorAll('button[aria-label$="Move up"]')
    const downButtons = searchList.querySelectorAll('button[aria-label$="Move down"]')
    // S14c: four orderable rows (S19: perplexity removed).
    expect(upButtons.length).toBe(4)
    expect(downButtons.length).toBe(4)
    expect(searchList.querySelector('button[aria-label="Tavily Move up"]')).toBeTruthy()
    expect(searchList.querySelector('button[aria-label="Exa Move down"]')).toBeTruthy()
  })

  it('boundary move buttons disable at the ends of the search chain', () => {
    const { container } = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const searchList = container.querySelector('[data-testid="dshws-search-chain"]')!
    const firstUp = searchList.querySelector('button[aria-label="Tavily Move up"]') as HTMLButtonElement
    const firstDown = searchList.querySelector('button[aria-label="Tavily Move down"]') as HTMLButtonElement
    const lastDown = searchList.querySelector(
      'button[aria-label="AnySearch Move down"]',
    ) as HTMLButtonElement
    const lastUp = searchList.querySelector('button[aria-label="AnySearch Move up"]') as HTMLButtonElement
    expect(firstUp.disabled).toBe(true)
    expect(firstDown.disabled).toBe(false)
    expect(lastUp.disabled).toBe(false)
    expect(lastDown.disabled).toBe(true)
  })

  it('move clicks forward the entry id and delta', async () => {
    const onMoveSearch = vi.fn(async () => ({ ok: true }) as ActionResult)
    const { container } = render(<WebSearchSettingsSection {...makeProps({ onMoveSearch })} t={t} />)
    const searchList = container.querySelector('[data-testid="dshws-search-chain"]')!
    fireEvent.click(searchList.querySelector('button[aria-label="Exa Move up"]')!)
    await waitFor(() => expect(onMoveSearch).toHaveBeenCalledWith('dshws-exa', -1))
    fireEvent.click(searchList.querySelector('button[aria-label="Tavily Move down"]')!)
    await waitFor(() => expect(onMoveSearch).toHaveBeenCalledWith('dshws-tavily', 1))
  })

  it('the ! badge carries the pinned/default state and its tooltip prefixes the pinned note (S14f)', () => {
    const { container } = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const badge = container.querySelector('[data-dshws-chain-state]') as HTMLElement
    expect(badge.getAttribute('data-dshws-chain-state')).toBe('default')
    fireEvent.focus(badge)
    expect(screen.getByRole('tooltip').textContent).toBe(en.chainOrderHint)
    fireEvent.blur(badge)
    cleanup()
    const pinnedSnapshot: SectionSnapshot = { ...makeSnapshot(), searchChainPinned: true }
    const pinned = render(<WebSearchSettingsSection {...makeProps({ snapshot: pinnedSnapshot })} t={t} />)
    const pinnedBadge = pinned.container.querySelector('[data-dshws-chain-state]') as HTMLElement
    expect(pinnedBadge.getAttribute('data-dshws-chain-state')).toBe('pinned')
    fireEvent.focus(pinnedBadge)
    expect(screen.getByRole('tooltip').textContent).toBe(`${en.chainPinned}: ${en.chainOrderHint}`)
  })

  it('the order note lives behind the bordered ! badge, not dead prose (S14e D4, 用户裁定)', () => {
    const { container } = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const chains = container.querySelector('[data-testid="dshws-chains"]')!
    // No dead prose lines: neither the old default-order hint nor the tail note.
    expect(chains.textContent).not.toContain(en.chainTailHint)
    // The bordered badge exists; focusing it opens the full order note.
    const badge = screen.getByTestId('dshws-chain-order-info')
    expect(badge.textContent).toBe('!')
    fireEvent.focus(badge)
    expect(screen.getByRole('tooltip').textContent).toBe(en.chainOrderHint)
    fireEvent.blur(badge)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it("an unconfigured member's switch is disabled (置灰断言)", () => {
    const members = defaultMembers()
    members[0] = member('tavily', 'Tavily', { configured: false })
    members[1] = member('exa', 'Exa', { configured: true })
    render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members) })} t={t} />)
    const tavilySwitch = screen.getByRole('switch', { name: 'Tavily Enabled' }) as HTMLButtonElement
    const exaSwitch = screen.getByRole('switch', { name: 'Exa Enabled' }) as HTMLButtonElement
    expect(tavilySwitch.disabled).toBe(true)
    expect(exaSwitch.disabled).toBe(false)
  })

  it('the switch color tracks the configured state, not the enabled flag (反馈②)', async () => {
    const members = defaultMembers()
    // Unconfigured with enabled defaulting to true must NOT render green.
    members[0] = member('tavily', 'Tavily', { configured: false })
    // Configured but toggled off stays gray; only configured+enabled is green.
    members[1] = member('exa', 'Exa', { enabled: false })
    render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members) })} t={t} />)
    const tavily = screen.getByRole('switch', { name: 'Tavily Enabled' }) as HTMLButtonElement
    expect(tavily.disabled).toBe(true)
    expect(tavily.style.background).toBe('var(--dsw-alias-border-l3)')
    const exa = screen.getByRole('switch', { name: 'Exa Enabled' }) as HTMLButtonElement
    expect(exa.getAttribute('aria-checked')).toBe('false')
    expect(exa.style.background).toBe('var(--dsw-alias-border-l3)')
    // S14d: the fallback row is a two-way choice; the configured state is
    // carried by the choice buttons being enabled (unconfigured rows disable).
    // Action feedback is a polite live region (host savedNotice convention);
    // verified on the save leg — toggling has never rendered member feedback.
    // The save leg runs on a full member card (deepseek has no key surface).
    expand('firecrawl')
    const input = focusKey('Firecrawl API Key')
    fireEvent.change(input, { target: { value: 'sk-fake-fc' } })
    fireEvent.click(within(screen.getByTestId('dshws-member-firecrawl')).getByRole('button', { name: 'Firecrawl Save' }))
    await waitFor(() =>
      expect(screen.getByTestId('dshws-feedback-firecrawl').getAttribute('role')).toBe('status'),
    )
  })

  it('the key format note lives behind a single page-header icon (12b 反馈①)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    // Per-card hint paragraphs are gone — the note is stated once per card as
    // the input placeholder (S14d), never as rendered text.
    // One icon anchor after the heading; S14d: it carries the description.
    const anchorBtn = screen.getByRole('button', { name: en.description })
    fireEvent.focus(anchorBtn)
    expect(screen.getByRole('tooltip').textContent).toBe(en.description)
    fireEvent.blur(anchorBtn)
    expect(screen.queryByRole('tooltip')).toBeNull()
    // The member-card subtrees stay tooltip-free (the icon is page-level only).
    expect(within(screen.getByTestId('dshws-members')).queryByRole('tooltip')).toBeNull()
  })

  it('the fallback row is a single tool selector; five ready tools → tool options only (ADR-0014)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const row = screen.getByTestId('dshws-fallback-tool')
    expect(within(row).getByText(en.fallbackRowLabel)).toBeTruthy()
    const info = within(row).getByRole('button', { name: en.fallbackInfo })
    fireEvent.focus(info)
    expect(screen.getByRole('tooltip').textContent).toBe(en.fallbackNote)
    fireEvent.blur(info)
    expect(screen.queryByRole('tooltip')).toBeNull()
    // No key input, no pool controls, no save/clear.
    expect(within(row).queryByLabelText(`DeepSeek ${en.apiKey}`)).toBeNull()
    expect(within(row).queryByRole('group', { name: en.keySelection })).toBeNull()
    expect(within(row).queryByRole('button', { name: `DeepSeek ${en.save}` })).toBeNull()
    const select = within(row).getByTestId('dshws-fallback-select') as HTMLSelectElement
    // Five ready tools: Auto + the five tool members; NO paid DeepSeek option.
    const values = Array.from(select.options).map((option) => option.value)
    expect(values).toEqual(['auto', 'dshws-tavily', 'dshws-exa', 'dshws-firecrawl', 'dshws-anysearch'])
    expect(select.value).toBe('auto')
    expect(within(row).queryByTestId('dshws-fallback-note')).toBeNull()
  })


  it('disabling a member removes it from the chain rows (S14r 用户裁定：仅就绪成员入链)', () => {
    const members = defaultMembers()
    members[1] = member('exa', 'Exa', { enabled: false })
    render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members) })} t={t} />)
    // exa is configured but disabled → NOT a row; other enabled members stay.
    expect(screen.queryByTestId('dshws-chain-item-dshws-exa')).toBeNull()
    expect(screen.getByTestId('dshws-chain-item-dshws-tavily')).toBeTruthy()
    // Another enabled member keeps the chain usable — no warning.
    expect(screen.queryByTestId('dshws-chain-no-usable')).toBeNull()
  })


  it('zero usable tools with nothing selected is the honest red warning (ADR-0014 default, breaking pin)', () => {
    // A configured-but-disabled orderable member keeps the card rendered;
    // with no designated floor the next search genuinely fails.
    const members = defaultMembers()
    for (const [index] of members.entries()) {
      members[index] = member(members[index]!.key, members[index]!.label, { configured: false })
    }
    members[0] = member('tavily', 'Tavily', { configured: true, enabled: false })
    const snapshot = { ...makeSnapshot(members), readyToolMembers: [] }
    render(<WebSearchSettingsSection {...makeProps({ snapshot })} t={t} />)
    expect(screen.queryByTestId('dshws-chain-floor')).toBeNull()
    expect(screen.getByTestId('dshws-chain-no-usable').textContent).toBe(en.chainNoUsableWarning)
  })

  it('zero usable tools + selected eligible keyed DeepSeek shows the paid floor note', () => {
    const members = defaultMembers()
    for (const [index] of members.entries()) {
      members[index] = member(members[index]!.key, members[index]!.label, { configured: false })
    }
    members[0] = member('tavily', 'Tavily', { configured: true, enabled: false })
    members[4] = member('deepseek', 'DeepSeek', { configured: true, enabled: false })
    const snapshot = {
      ...makeSnapshot(members),
      readyToolMembers: [],
      fallbackSelection: 'dshws-deepseek' as const,
      fallbackDeepseekEligible: true,
    }
    render(<WebSearchSettingsSection {...makeProps({ snapshot })} t={t} />)
    expect(screen.queryByTestId('dshws-chain-no-usable')).toBeNull()
    expect(screen.getByTestId('dshws-chain-floor').textContent).toBe(en.chainFloorDeepseekNote)
  })

  it('zero usable tools + selected KEYLESS DeepSeek keeps the honest warning', () => {
    const members = defaultMembers()
    for (const [index] of members.entries()) {
      members[index] = member(members[index]!.key, members[index]!.label, { configured: false })
    }
    members[0] = member('tavily', 'Tavily', { configured: true, enabled: false })
    const snapshot = { ...makeSnapshot(members), readyToolMembers: [], fallbackSelection: 'dshws-deepseek' as const }
    render(<WebSearchSettingsSection {...makeProps({ snapshot })} t={t} />)
    expect(screen.queryByTestId('dshws-chain-floor')).toBeNull()
    expect(screen.getByTestId('dshws-chain-no-usable').textContent).toBe(en.chainNoUsableWarning)
  })

  it('marks the first ready member as primary and the last as the standby slot (S14w 主备显式化)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    // Four ready members: tavily heads the chain (primary), anysearch closes
    // it (the in-chain standby slot).
    const rows = screen.getAllByTestId(/^dshws-chain-item-/)
    expect(rows).toHaveLength(4)
    expect(within(rows[0] as HTMLElement).getByTestId('dshws-chain-role-primary')).toBeTruthy()
    expect(within(rows[3] as HTMLElement).getByTestId('dshws-chain-role-standby')).toBeTruthy()
    // Role badges exist only on the two ends — the middle members carry none.
    for (const row of rows.slice(1, 3)) {
      expect(within(row as HTMLElement).queryByTestId('dshws-chain-role-primary')).toBeNull()
      expect(within(row as HTMLElement).queryByTestId('dshws-chain-role-standby')).toBeNull()
    }
  })

  it('a single ready member is primary and NOT its own standby (S14w 主备显式化)', () => {
    const members = defaultMembers()
    for (const [index] of members.entries()) {
      members[index] = member(members[index]!.key, members[index]!.label, { configured: index === 0 })
    }
    render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members) })} t={t} />)
    const rows = screen.getAllByTestId(/^dshws-chain-item-/)
    expect(rows).toHaveLength(1)
    expect(within(rows[0] as HTMLElement).getByTestId('dshws-chain-role-primary')).toBeTruthy()
    expect(within(rows[0] as HTMLElement).queryByTestId('dshws-chain-role-standby')).toBeNull()
  })

  it('the takeover toggle fires onSetFetchTakeover with the inverted value (S15a)', async () => {
    const onSetFetchTakeover = vi.fn(async () => ({ ok: true }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onSetFetchTakeover })} t={t} />)
    const toggle = screen.getByTestId('dshws-fetch-takeover-toggle') as HTMLButtonElement
    expect(toggle.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(toggle)
    await waitFor(() => expect(onSetFetchTakeover).toHaveBeenCalledWith(false))
  })

  it('key field placeholders, masking, and the {N} hint interpolate live values (S14d D3/T1, stage45 🟡-B 清偿)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    expand('tavily')
    // Placeholder carries the ref name and the multi-key format.
    const input = screen.getByLabelText(`Tavily ${en.apiKey}`) as HTMLInputElement
    expect(input.getAttribute('placeholder')).toBe(en.keyPlaceholder.replace('{ref}', 'TAVILY_API_KEY'))
    // A configured, not-editing field shows the mask; focus opens a fresh entry.
    expect(input.value).toBe(en.maskedKey)
    fireEvent.focus(input)
    expect(input.value).toBe('')
    fireEvent.blur(input)
    expect(input.value).toBe(en.maskedKey)
    // The maxUses hint names the value in the box (default 10; typing 3 → 3);
    // the knob sits behind the advanced fold (S22b).
    openAdvanced()
    const maxInput = screen.getByLabelText(en.maxUsesLabel) as HTMLInputElement
    const hintBtn = screen.getByRole('button', { name: en.maxUsesHint.replace('{N}', '10') })
    expect(hintBtn).toBeTruthy()
    fireEvent.change(maxInput, { target: { value: '3' } })
    expect(screen.getByRole('button', { name: en.maxUsesHint.replace('{N}', '3') })).toBeTruthy()
  })

  it('the whole card header expands/collapses on click (official PluginCard parity, S14k)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const header = screen.getByRole('button', { name: `Tavily ${en.configure}` })
    expect(header.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(header)
    expect(header.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByLabelText(`Tavily ${en.apiKey}`)).toBeTruthy()
    fireEvent.click(header)
    expect(header.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByLabelText(`Tavily ${en.apiKey}`)).toBeNull()
  })

  it('the endpoint placeholder names the member DEFAULT URL, not a generic hint (S14p, 用户建议)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const defaults: Record<string, string> = {
      tavily: 'https://api.tavily.com',
      exa: 'https://api.exa.ai',
      firecrawl: 'https://api.firecrawl.dev',
      anysearch: 'https://api.anysearch.com',
    }
    for (const [key, url] of Object.entries(defaults)) {
      expand(key)
      const field = screen.getByTestId(`dshws-endpoint-${key}`) as HTMLInputElement
      expect(field.getAttribute('placeholder')).toBe(url)
    }
  })

  it('each card exposes the endpoint override field with staged save (S14k, host-parity 接口地址)', async () => {
    const onSetBaseURL = vi.fn(async () => ({ ok: true }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onSetBaseURL })} t={t} />)
    expand('tavily')
    const field = screen.getByLabelText(`Tavily ${en.endpointLabel}`) as HTMLInputElement
    expect(field.getAttribute('value') ?? field.value).toBe('')
    fireEvent.change(field, { target: { value: 'https://proxy.example/api' } })
    fireEvent.click(screen.getByRole('button', { name: `Tavily ${en.endpointLabel} ${en.save}` }))
    await waitFor(() => expect(onSetBaseURL).toHaveBeenCalledWith('tavily', 'https://proxy.example/api'))
  })

  it('selecting a fallback tool writes the canonical field (ADR-0014)', async () => {
    const onSetFallbackMember = vi.fn(async () => ({ ok: true }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onSetFallbackMember })} t={t} />)
    const select = screen.getByTestId('dshws-fallback-select') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'dshws-exa' } })
    await waitFor(() => expect(onSetFallbackMember).toHaveBeenCalledWith('dshws-exa'))
  })

  it('zero or one ready tool: the selector offers the paid DeepSeek option instead of tools (ADR-0014)', () => {
    const members = defaultMembers()
    for (const [index] of members.entries()) {
      members[index] = member(members[index]!.key, members[index]!.label, { configured: index === 0 })
    }
    const snapshot = { ...makeSnapshot(members), readyToolMembers: ['dshws-tavily'] }
    render(<WebSearchSettingsSection {...makeProps({ snapshot })} t={t} />)
    const select = screen.getByTestId('dshws-fallback-select') as HTMLSelectElement
    const values = Array.from(select.options).map((option) => option.value)
    expect(values).toEqual(['auto', 'dshws-deepseek'])
  })

  it('a stored DeepSeek selection with two-plus ready tools degrades to auto with the stop note (ADR-0014)', () => {
    render(<WebSearchSettingsSection {...makeProps({ snapshot: { ...makeSnapshot(), fallbackSelection: 'dshws-deepseek' as const } })} t={t} />)
    const select = screen.getByTestId('dshws-fallback-select') as HTMLSelectElement
    expect(select.value).toBe('auto')
    expect(screen.getByTestId('dshws-fallback-note').textContent).toBe(en.fallbackDeepseekStoppedNote)
  })

  it('a designated tool member renders as the LOCKED chain tail with the standby badge (ADR-0014 strip-to-tail)', () => {
    const snapshot = {
      ...makeSnapshot(),
      fallbackSelection: 'dshws-exa' as const,
      fallbackDesignationReady: true,
    }
    render(<WebSearchSettingsSection {...makeProps({ snapshot })} t={t} />)
    const locked = screen.getByTestId('dshws-chain-item-dshws-exa')
    expect(locked.getAttribute('data-dshws-chain-locked')).toBe('')
    expect(within(locked).getByTestId('dshws-chain-role-standby')).toBeTruthy()
    expect(within(locked).getByText(en.chainLockedNote)).toBeTruthy()
    // Locked tail has no move buttons, and the reorderable rows exclude exa.
    expect(within(locked).queryByRole('button')).toBeNull()
    expect(screen.getByTestId('dshws-chain-item-dshws-tavily')).toBeTruthy()
    expect(within(screen.getByTestId('dshws-search-chain')).queryByTestId('dshws-chain-item-dshws-exa')).toBe(locked)
    // The last orderable row is NOT badged standby (the badge follows the lock).
    const anysearchRow = screen.getByTestId('dshws-chain-item-dshws-anysearch')
    expect(within(anysearchRow).queryByTestId('dshws-chain-role-standby')).toBeNull()
  })

  it('a NOT-READY designation keeps the auto walk and explains in the fallback row (ADR-0014 degrade)', () => {
    // Realistic shape: exa was designated, then lost its key — it is not in
    // the ready walk at all; the last ready tool holds the standby badge.
    const members = defaultMembers()
    members[1] = member('exa', 'Exa', { configured: false })
    const snapshot = {
      ...makeSnapshot(members),
      readyToolMembers: ['dshws-tavily', 'dshws-firecrawl', 'dshws-anysearch'],
      fallbackSelection: 'dshws-exa' as const,
      fallbackDesignationReady: false,
    }
    render(<WebSearchSettingsSection {...makeProps({ snapshot })} t={t} />)
    // No exa row at all (unusable members never list), no locked tail.
    expect(screen.queryByTestId('dshws-chain-item-dshws-exa')).toBeNull()
    const lastRow = screen.getByTestId('dshws-chain-item-dshws-anysearch')
    expect(within(lastRow).getByTestId('dshws-chain-role-standby')).toBeTruthy()
    expect(screen.getByTestId('dshws-fallback-note').textContent).toBe(en.fallbackDesignationLostNote)
  })

  it('the fallback dot: green for an armed paid selection, warn for auto (ADR-0014)', () => {
    // Default fixture: auto → dot off.
    const first = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    expect(screen.getByTestId('dshws-fallback-dot').style.background).toBe('var(--dsw-alias-state-warn-label)')
    first.unmount()

    // Selected + eligible + keyed → green.
    const members = defaultMembers()
    for (const [index] of members.entries()) {
      members[index] = member(members[index]!.key, members[index]!.label, { configured: index === 0 })
    }
    members[4] = member('deepseek', 'DeepSeek', { configured: true, enabled: false })
    const snapshot = {
      ...makeSnapshot(members),
      readyToolMembers: ['dshws-tavily'],
      fallbackSelection: 'dshws-deepseek' as const,
      fallbackDeepseekEligible: true,
    }
    render(<WebSearchSettingsSection {...makeProps({ snapshot })} t={t} />)
    expect(screen.getByTestId('dshws-fallback-dot').style.background).toBe('var(--dsw-alias-state-success-primary)')
  })


  it('the card head row pairs a semantic status dot with the brand name and the switch (12a D1)', () => {
    const members = defaultMembers()
    members[0] = member('tavily', 'Tavily', { configured: false })
    render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members) })} t={t} />)
    const tavilyDot = within(screen.getByTestId('dshws-member-tavily')).getByRole('img', { name: en.notConfigured })
    expect(tavilyDot.getAttribute('title')).toBe(en.notConfigured)
    const exaDot = within(screen.getByTestId('dshws-member-exa')).getByRole('img', { name: en.configured })
    expect(exaDot.getAttribute('title')).toBe(en.configured)
  })

  it('fields stack label-above-input; actions live in a separate footer row (S14m/S14n)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    expand('tavily')
    const card = screen.getByTestId('dshws-member-tavily')
    const input = within(card).getByLabelText('Tavily API Key')
    const wrap = input.parentElement as HTMLElement
    expect(wrap.querySelector('button')).toBeTruthy() // the policy chip shares the input row
    const save = within(card).getByRole('button', { name: 'Tavily Save' })
    const footer = save.parentElement as HTMLElement
    expect(within(footer).getByRole('button', { name: 'Tavily Clear' })).toBeTruthy()
    expect(footer).not.toBe(wrap)
  })


  it('the switch track carries a 16px thumb span that follows the enabled state (12a D1)', () => {
    const members = defaultMembers()
    members[1] = member('exa', 'Exa', { enabled: false })
    render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members) })} t={t} />)
    const tavilyThumb = screen.getByRole('switch', { name: 'Tavily Enabled' }).querySelector('span')
    expect(tavilyThumb).toBeTruthy()
    expect((tavilyThumb as HTMLElement).style.transform).toBe('translateX(16px)')
    const exaThumb = screen.getByRole('switch', { name: 'Exa Enabled' }).querySelector('span')
    expect((exaThumb as HTMLElement).style.transform).toBe('translateX(0px)')
  })

  it('unconfigured members are hidden from the priority list and the visible end is disabled (过滤未配置——S11 🟡1 清偿 + 边界修复)', () => {
    const members = defaultMembers()
    members[1] = member('exa', 'Exa', { configured: false })
    members[4] = member('anysearch', 'AnySearch', { configured: false })
    const { container } = render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members) })} t={t} />)
    const searchList = container.querySelector('[data-testid="dshws-search-chain"]')!
    const visible = [...searchList.querySelectorAll('[data-dshws-chain-label]')].map(rowBrand)
    // S14c: DeepSeek is not a row — the visible span ends at Firecrawl.
    expect(visible).toEqual(['Tavily', 'Firecrawl'])
    // The disabled boundary must follow the FILTERED list: the last visible
    // item's down button is disabled (previously computed against the full
    // chain length, so it stayed clickable and reported a bogus failure).
    const firstUp = searchList.querySelector('button[aria-label="Tavily Move up"]') as HTMLButtonElement
    const lastDown = searchList.querySelector('button[aria-label="Firecrawl Move down"]') as HTMLButtonElement
    const lastUp = searchList.querySelector('button[aria-label="Firecrawl Move up"]') as HTMLButtonElement
    expect(firstUp.disabled).toBe(true)
    expect(lastDown.disabled).toBe(true)
    expect(lastUp.disabled).toBe(false)
  })

  it('a failed move shows failed feedback and a later success clears it', async () => {
    const onMoveSearch = vi.fn(async () => ({ ok: false }) as ActionResult)
    const { container } = render(<WebSearchSettingsSection {...makeProps({ onMoveSearch })} t={t} />)
    const searchList = container.querySelector('[data-testid="dshws-search-chain"]')!
    fireEvent.click(searchList.querySelector('button[aria-label="Exa Move up"]')!)
    await waitFor(() => expect(screen.getByTestId('dshws-chain-feedback').textContent).toBe(en.failed))

    const succeeding = vi.fn(async () => ({ ok: true }) as ActionResult)
    const rerendered = render(
      <WebSearchSettingsSection {...makeProps({ onMoveSearch: succeeding })} t={t} />,
    )
    const list = rerendered.container.querySelector('[data-testid="dshws-search-chain"]')!
    fireEvent.click(list.querySelector('button[aria-label="Exa Move up"]')!)
    await waitFor(() => expect(succeeding).toHaveBeenCalled())
    // Scoped to the fresh instance: the first container is still mounted until
    // afterEach cleanup, so a document-wide query would hit its leftover span.
    expect(rerendered.container.querySelector('[data-testid="dshws-chain-feedback"]')).toBeNull()
  })

  it('every card carries one cycling policy chip beside the key input, defaulting to round-robin (S14n 用户方案)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const keyed = [
      ['tavily', 'Tavily'],
      ['exa', 'Exa'],
      ['firecrawl', 'Firecrawl'],
      ['anysearch', 'AnySearch'],
    ] as const
    for (const [key, brand] of keyed) {
      expand(key)
      const card = screen.getByTestId(`dshws-member-${key}`)
      const chip = within(card).getByTestId(`dshws-keysel-chip-${key}`) as HTMLButtonElement
      // The chip sits in the same row as the key input and names the live policy.
      expect(chip.textContent).toContain(en.keySelRoundRobin)
      expect(chip.getAttribute('aria-label')).toBe(`${brand} ${en.keySelection} ${en.keySelRoundRobin}`)
      // The old three-segment group is gone.
      expect(within(card).queryByRole('group', { name: `${brand} ${en.keySelection}` })).toBeNull()
    }
  })


  it('each chip click advances the policy 轮询→顺序→随机→轮询 and persists via the setter (S14n)', async () => {
    const onSetKeySelection = vi.fn(async () => ({ ok: true }) as ActionResult)
    const first = render(<WebSearchSettingsSection {...makeProps({ onSetKeySelection })} t={t} />)
    expand('tavily')
    const chip = () => screen.getByTestId('dshws-keysel-chip-tavily') as HTMLButtonElement
    expect(chip().textContent).toContain(en.keySelRoundRobin)
    fireEvent.click(chip())
    await waitFor(() => expect(onSetKeySelection).toHaveBeenCalledWith('tavily', 'order'))
    const members = defaultMembers()
    members[0] = member('tavily', 'Tavily', { keySelection: 'order' })
    first.rerender(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members), onSetKeySelection })} t={t} />)
    expect(chip().textContent).toContain(en.keySelOrder)
    fireEvent.click(chip())
    await waitFor(() => expect(onSetKeySelection).toHaveBeenLastCalledWith('tavily', 'random'))
    const members2 = defaultMembers()
    members2[0] = member('tavily', 'Tavily', { keySelection: 'random' })
    first.rerender(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members2), onSetKeySelection })} t={t} />)
    fireEvent.click(chip())
    await waitFor(() => expect(onSetKeySelection).toHaveBeenLastCalledWith('tavily', 'round-robin'))
  })



  it('the global card sits above the tools and carries the maxUses knob (S14c T1)', () => {
    const { container } = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const chains = container.querySelector('[data-testid="dshws-chains"]')!
    const members = container.querySelector('[data-testid="dshws-members"]')!
    // DOM order: global card first, tools after.
    expect(chains.compareDocumentPosition(members) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Host-parity label verbatim; S14d default is 10 (user ruling) — the knob
    // lives behind the advanced fold (S22b).
    openAdvanced()
    expect(screen.getByLabelText(en.maxUsesLabel).getAttribute('value')).toBe('10')
    expect(chains.textContent).toContain(en.maxUsesLabel)
  })

  it('cards default collapsed; expanding reveals the key surface without losing it (S14c T3)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const card = screen.getByTestId('dshws-member-tavily')
    // Collapsed by default: no key input, no pool group, no footer actions.
    expect(within(card).queryByLabelText(`Tavily ${en.apiKey}`)).toBeNull()
    expect(within(card).queryByRole('group')).toBeNull()
    expect(within(card).queryByRole('button', { name: `Tavily ${en.save}` })).toBeNull()
    // Header stays interactive in the collapsed state.
    expect(within(card).getByRole('switch', { name: `Tavily ${en.enabled}` })).toBeTruthy()
    // Expand: the multi-key surface is intact.
    expand('tavily')
    expect(within(card).getByLabelText(`Tavily ${en.apiKey}`)).toBeTruthy()
    expect(within(card).getByTestId('dshws-keysel-chip-tavily')).toBeTruthy()
    expect(within(card).getByRole('button', { name: `Tavily ${en.save}` })).toBeTruthy()
  })

  it('the fallback row is the last member element (S14c T1)', () => {
    const { container } = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const members = container.querySelector('[data-testid="dshws-members"]')!
    const children = Array.from(members.children)
    // S22b: the Web Fetch chain folds INSIDE the takeover card — the takeover
    // card is the container's last element again.
    expect(children.length).toBe(6)
    expect((children[children.length - 1] as HTMLElement).dataset.testid).toBe('dshws-fetch-takeover')
  })

  it('maxUses save patches the deepseek member key (S14c T4)', async () => {
    const onSetMaxUses = vi.fn(async () => ({ ok: true }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onSetMaxUses })} t={t} />)
    openAdvanced()
    const input = screen.getByLabelText(en.maxUsesLabel) as HTMLInputElement
    // S14g: bounds are [5, 100] — 3 is out of range and must NOT save.
    fireEvent.change(input, { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: `${en.maxUsesLabel} ${en.save}` }))
    expect(onSetMaxUses).not.toHaveBeenCalled()
    // An in-range typed value saves verbatim.
    fireEvent.change(input, { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: `${en.maxUsesLabel} ${en.save}` }))
    await waitFor(() => expect(onSetMaxUses).toHaveBeenCalledWith(12))
  })

  it('the maxUses steppers snap in steps of 5 within [5, 100] (S14g)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    openAdvanced()
    const input = screen.getByLabelText(en.maxUsesLabel) as HTMLInputElement
    expect(input.value).toBe('10')
    fireEvent.click(screen.getByTestId('dshws-max-uses-up'))
    expect(input.value).toBe('15')
    fireEvent.click(screen.getByTestId('dshws-max-uses-up'))
    expect(input.value).toBe('20')
    fireEvent.click(screen.getByTestId('dshws-max-uses-down'))
    expect(input.value).toBe('15')
    // Snapping floors into range: type 7 → step up lands on 10.
    fireEvent.change(input, { target: { value: '7' } })
    fireEvent.click(screen.getByTestId('dshws-max-uses-up'))
    expect(input.value).toBe('10')
    // The ceiling: from 100 stepping up stays at 100.
    fireEvent.change(input, { target: { value: '100' } })
    fireEvent.click(screen.getByTestId('dshws-max-uses-up'))
    expect(input.value).toBe('100')
  })

  it('the ! badge exists only in the EXPANDED body, never in the collapsed header (S14s 用户裁定)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const card = screen.getByTestId('dshws-member-tavily')
    // Collapsed: no badge anywhere in the card.
    expect(within(card).queryByTestId('dshws-keysel-info-tavily')).toBeNull()
    expand('tavily')
    // Expanded: the badge sits INSIDE the「API Key」field-label span (S14t —
    // beside the field it explains), not after the input+chip row.
    const badge = within(card).getByTestId('dshws-keysel-info-tavily')
    const labelSpan = badge.closest('span')
    expect(labelSpan?.textContent).toContain(en.apiKey)
    // And the chip row that follows holds only the input + chip.
    expect(badge.closest('button[data-testid="dshws-member-toggle-tavily"]')).toBeNull()
    fireEvent.focus(badge)
    expect(screen.getByRole('tooltip').textContent)
      .toBe(en.keySelectionHint.replace('{policy}', en.keySelRoundRobin))
  })

  it('feedback color follows semantics: saved=green, cleared=warn, failed=error (S14s 分态配色)', async () => {
    const onSave = vi.fn(async () => ({ ok: true }) as ActionResult)
    const onClear = vi.fn(async () => ({ ok: true }) as ActionResult)
    const onFail = vi.fn(async () => ({ ok: false }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onSaveKey: onSave })} t={t} />)
    expand('tavily')
    // saved → success green
    const input = focusKey('Tavily API Key')
    fireEvent.change(input, { target: { value: 'sk-1' } })
    fireEvent.click(within(screen.getByTestId('dshws-member-tavily')).getByRole('button', { name: `Tavily ${en.save}` }))
    await waitFor(() => expect(screen.getByTestId('dshws-feedback-tavily').style.color).toBe('var(--dsw-alias-state-success-primary)'))
    cleanup()
    // cleared → warn orange (the mislabeled-green bug the user caught)
    render(<WebSearchSettingsSection {...makeProps({ onClearKey: onClear })} t={t} />)
    expand('tavily')
    fireEvent.click(within(screen.getByTestId('dshws-member-tavily')).getByRole('button', { name: `Tavily ${en.clear}` }))
    await waitFor(() => expect(screen.getByTestId('dshws-feedback-tavily').style.color).toBe('var(--dsw-alias-state-warn-label)'))
    cleanup()
    // failed → error red
    render(<WebSearchSettingsSection {...makeProps({ onSaveKey: onFail })} t={t} />)
    expand('tavily')
    const input2 = focusKey('Tavily API Key')
    fireEvent.change(input2, { target: { value: 'sk-2' } })
    fireEvent.click(within(screen.getByTestId('dshws-member-tavily')).getByRole('button', { name: `Tavily ${en.save}` }))
    await waitFor(() => expect(screen.getByTestId('dshws-feedback-tavily').style.color).toBe('var(--dsh-alias-state-error-primary)'))
  })

  it('feedback auto-dismisses after 1.5s (S14s 时序收紧)', async () => {
    vi.useFakeTimers()
    try {
      const onClear = vi.fn(async () => ({ ok: true }) as ActionResult)
      render(<WebSearchSettingsSection {...makeProps({ onClearKey: onClear })} t={t} />)
      expand('tavily')
      fireEvent.click(within(screen.getByTestId('dshws-member-tavily')).getByRole('button', { name: `Tavily ${en.clear}` }))
      await vi.advanceTimersByTimeAsync(0)
      expect(screen.getByTestId('dshws-feedback-tavily').textContent).toBe(en.cleared)
      await vi.advanceTimersByTimeAsync(1500)
      expect(screen.queryByTestId('dshws-feedback-tavily')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('an unconfigured member disables the policy chip; the ! badge carries the live semantics (S14n/S14r)', () => {
    const members = defaultMembers()
    members[0] = member('tavily', 'Tavily', { configured: false })
    render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members) })} t={t} />)
    expand('tavily')
    const chip = screen.getByTestId('dshws-keysel-chip-tavily') as HTMLButtonElement
    expect(chip.disabled).toBe(true)
    // The hint line is gone; the ! badge tooltip states the live policy.
    const info = screen.getByTestId('dshws-keysel-info-tavily')
    fireEvent.focus(info)
    expect(screen.getByRole('tooltip').textContent)
      .toBe(en.keySelectionHint.replace('{policy}', en.keySelRoundRobin))
  })


})

describe('S17 P1 member parameter controls', () => {
  it('tavily: four selects render with resolved defaults and forward changes (topic news commit)', async () => {
    const onSetMemberOption = vi.fn(async () => ({ ok: true }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onSetMemberOption })} t={t} />)
    expand('tavily')
    // All four controls are present with their resolved display defaults.
    expect((screen.getByTestId('dshws-param-tavily-topic') as HTMLSelectElement).value).toBe('')
    expect((screen.getByTestId('dshws-param-tavily-timeRange') as HTMLSelectElement).value).toBe('')
    expect((screen.getByTestId('dshws-param-tavily-searchDepth') as HTMLSelectElement).value).toBe('')
    expect((screen.getByTestId('dshws-param-tavily-includeAnswer') as HTMLSelectElement).value).toBe('basic')

    fireEvent.change(screen.getByTestId('dshws-param-tavily-topic'), { target: { value: 'news' } })
    await waitFor(() => expect(onSetMemberOption).toHaveBeenCalledWith('tavily', 'topic', 'news'))
    // The saved note appears next to the control and auto-dismisses.
    expect(screen.getByTestId('dshws-param-tavily-topic-feedback').textContent).toBe(en.saved)
  })

  it('exa: type select defaults auto; the text-fallback toggle forwards the inverted value', async () => {
    const onSetMemberOption = vi.fn(async () => ({ ok: true }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onSetMemberOption })} t={t} />)
    expand('exa')
    expect((screen.getByTestId('dshws-param-exa-type') as HTMLSelectElement).value).toBe('auto')
    expect((screen.getByTestId('dshws-param-exa-textFallback') as HTMLButtonElement).getAttribute('aria-checked')).toBe('true')

    fireEvent.click(screen.getByTestId('dshws-param-exa-textFallback'))
    await waitFor(() => expect(onSetMemberOption).toHaveBeenCalledWith('exa', 'textFallback', false))

    fireEvent.change(screen.getByTestId('dshws-param-exa-type'), { target: { value: 'deep' } })
    await waitFor(() => expect(onSetMemberOption).toHaveBeenCalledWith('exa', 'type', 'deep'))
  })


  it('S22 T3: firecrawl tbs becomes a staged combo text field and safe toggles immediately', async () => {
    const onSetMemberOption = vi.fn(async () => ({ ok: true }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onSetMemberOption })} t={t} />)
    expand('firecrawl')
    const tbs = screen.getByTestId('dshws-param-firecrawl-tbs') as HTMLInputElement
    fireEvent.change(tbs, { target: { value: 'sbd:1,qdr:w' } })
    fireEvent.click(screen.getByRole('button', { name: `Firecrawl ${en.fcTbsLabel} ${en.save}` }))
    await waitFor(() => expect(onSetMemberOption).toHaveBeenCalledWith('firecrawl', 'tbs', 'sbd:1,qdr:w'))
    expect((screen.getByTestId('dshws-param-firecrawl-safe') as HTMLButtonElement).getAttribute('aria-checked')).toBe('false')
    fireEvent.click(screen.getByTestId('dshws-param-firecrawl-safe'))
    await waitFor(() => expect(onSetMemberOption).toHaveBeenCalledWith('firecrawl', 'safe', true))
  })

  it('firecrawl: tbs and location staged text fields forward their values', async () => {
    const onSetMemberOption = vi.fn(async () => ({ ok: true }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onSetMemberOption })} t={t} />)
    expand('firecrawl')
    const tbsField = screen.getByTestId('dshws-param-firecrawl-tbs') as HTMLInputElement
    fireEvent.change(tbsField, { target: { value: 'qdr:w' } })
    fireEvent.click(screen.getByRole('button', { name: `Firecrawl ${en.fcTbsLabel} ${en.save}` }))
    await waitFor(() => expect(onSetMemberOption).toHaveBeenCalledWith('firecrawl', 'tbs', 'qdr:w'))

    const location = screen.getByTestId('dshws-param-firecrawl-location') as HTMLInputElement
    fireEvent.change(location, { target: { value: 'Beijing,China' } })
    fireEvent.click(screen.getByRole('button', { name: `Firecrawl ${en.fcLocationLabel} ${en.save}` }))
    await waitFor(() => expect(onSetMemberOption).toHaveBeenCalledWith('firecrawl', 'location', 'Beijing,China'))
  })

  it('members without S17 params (anysearch/deepseek rows) render no param controls', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    expect(screen.queryByTestId('dshws-param-anysearch-zone')).toBeNull()
  })

  it('the unified region/language fields sit in the global card and commit staged drafts', async () => {
    const onSetSearchCountry = vi.fn(async () => ({ ok: true }) as ActionResult)
    const onSetSearchLanguage = vi.fn(async () => ({ ok: true }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onSetSearchCountry, onSetSearchLanguage })} t={t} />)
    openAdvanced()
    const country = screen.getByTestId('dshws-search-country') as HTMLInputElement
    const language = screen.getByTestId('dshws-search-language') as HTMLInputElement
    expect(country.value).toBe('')
    expect(language.value).toBe('')

    fireEvent.change(country, { target: { value: 'CN' } })
    fireEvent.click(screen.getByRole('button', { name: `${en.searchCountryLabel} ${en.save}` }))
    await waitFor(() => expect(onSetSearchCountry).toHaveBeenCalledWith('CN'))

    fireEvent.change(language, { target: { value: 'zh' } })
    fireEvent.click(screen.getByRole('button', { name: `${en.searchLanguageLabel} ${en.save}` }))
    await waitFor(() => expect(onSetSearchLanguage).toHaveBeenCalledWith('zh'))
  })
})
describe('S20 P2 domain entry and member controls', () => {
  it('the global domain pair renders with the exclusivity note and forwards the chosen list', async () => {
    const onSetSearchDomains = vi.fn(async () => ({ ok: true }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onSetSearchDomains })} t={t} />)
    openAdvanced()
    const include = screen.getByTestId('dshws-search-domains-include') as HTMLInputElement
    expect(include.value).toBe('')
    fireEvent.change(include, { target: { value: 'example.com' } })
    fireEvent.click(screen.getByRole('button', { name: `${en.searchIncludeDomainsLabel} ${en.save}` }))
    await waitFor(() => expect(onSetSearchDomains).toHaveBeenCalledWith('include', 'example.com'))
  })

  it('tavily exposes the S20 controls (mode select, chunks select, language-filter toggle); firecrawl exposes sources/categories', async () => {
    const onSetMemberOption = vi.fn(async () => ({ ok: true }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onSetMemberOption })} t={t} />)
    expand('tavily')
    expect((screen.getByTestId('dshws-param-tavily-includeDomainsMode') as HTMLSelectElement).value).toBe('')
    expect((screen.getByTestId('dshws-param-tavily-chunksPerSource') as HTMLSelectElement).value).toBe('')
    expect((screen.getByTestId('dshws-param-tavily-filterByLanguage') as HTMLButtonElement).getAttribute('aria-checked')).toBe('false')
    fireEvent.change(screen.getByTestId('dshws-param-tavily-chunksPerSource'), { target: { value: '1' } })
    await waitFor(() => expect(onSetMemberOption).toHaveBeenCalledWith('tavily', 'chunksPerSource', '1'))

    expand('firecrawl')
    fireEvent.change(screen.getByTestId('dshws-param-firecrawl-sources'), { target: { value: 'web+news' } })
    await waitFor(() => expect(onSetMemberOption).toHaveBeenCalledWith('firecrawl', 'sources', 'web+news'))
  })

  it('S22 T1: tavily exposes the P3 date window and exact_match controls', async () => {
    const onSetMemberOption = vi.fn(async () => ({ ok: true }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onSetMemberOption })} t={t} />)
    expand('tavily')
    const start = screen.getByTestId('dshws-param-tavily-startDate') as HTMLInputElement
    const end = screen.getByTestId('dshws-param-tavily-endDate') as HTMLInputElement
    expect(start.value).toBe('')
    expect(end.value).toBe('')
    expect((screen.getByTestId('dshws-param-tavily-exactMatch') as HTMLButtonElement).getAttribute('aria-checked')).toBe('false')
    fireEvent.change(start, { target: { value: '2026-01-01' } })
    fireEvent.click(screen.getByRole('button', { name: `Tavily ${en.tavilyStartDateLabel} ${en.save}` }))
    await waitFor(() => expect(onSetMemberOption).toHaveBeenCalledWith('tavily', 'startDate', '2026-01-01'))
    fireEvent.click(screen.getByTestId('dshws-param-tavily-exactMatch'))
    await waitFor(() => expect(onSetMemberOption).toHaveBeenCalledWith('tavily', 'exactMatch', true))
  })

  it('S22 T2: exa exposes the P3 controls (date ceiling, verbosity select, section filters)', async () => {
    const onSetMemberOption = vi.fn(async () => ({ ok: true }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onSetMemberOption })} t={t} />)
    expand('exa')
    fireEvent.change(screen.getByTestId('dshws-param-exa-textVerbosity'), { target: { value: 'standard' } })
    await waitFor(() => expect(onSetMemberOption).toHaveBeenCalledWith('exa', 'textVerbosity', 'standard'))
    const ceiling = screen.getByTestId('dshws-param-exa-endPublishedDate') as HTMLInputElement
    fireEvent.change(ceiling, { target: { value: '2026-06-30' } })
    fireEvent.click(screen.getByRole('button', { name: `Exa ${en.exaDateCeilingLabel} ${en.save}` }))
    await waitFor(() => expect(onSetMemberOption).toHaveBeenCalledWith('exa', 'endPublishedDate', '2026-06-30'))
    const sections = screen.getByTestId('dshws-param-exa-includeSections') as HTMLInputElement
    fireEvent.change(sections, { target: { value: 'header,body' } })
    fireEvent.click(screen.getByRole('button', { name: `Exa ${en.exaIncludeSectionsLabel} ${en.save}` }))
    await waitFor(() => expect(onSetMemberOption).toHaveBeenCalledWith('exa', 'includeSections', 'header,body'))
  })

  it('exa category select forwards its value (company guard covered at the wire)', async () => {
    const onSetMemberOption = vi.fn(async () => ({ ok: true }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onSetMemberOption })} t={t} />)
    expand('exa')
    fireEvent.change(screen.getByTestId('dshws-param-exa-category'), { target: { value: 'people' } })
    await waitFor(() => expect(onSetMemberOption).toHaveBeenCalledWith('exa', 'category', 'people'))
  })
})
describe('S21 T6: fetch chain GUI', () => {
  it('renders the fetch chain rows once a fetch-capable member is configured and forwards moves', async () => {
    const onMoveFetch = vi.fn(async () => ({ ok: true }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onMoveFetch })} t={t} />)
    // S22b: the chain rows open with the takeover card's fold.
    openTakeover()
    const list = screen.getByTestId('dshws-fetch-chain-list')
    const labels = [...list.querySelectorAll('[data-dshws-chain-label]')].map(rowBrand)
    // Default fixture: all members configured — the fetch-capable three in default order.
    expect(labels).toEqual(['Firecrawl', 'Tavily', 'AnySearch'])
    expect(screen.getByTestId('dshws-fetch-role-primary')).toBeTruthy()

    fireEvent.click(within(list).getByRole('button', { name: `Tavily ${en.moveUp}` }))
    await waitFor(() => expect(onMoveFetch).toHaveBeenCalledWith('dshws-tavily', -1))
  })

  it('S22a T1: role chips ride INSIDE the label cell right after the tool name (no grid wrap)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    openTakeover()
    const searchChip = screen.getByTestId('dshws-chain-role-primary')
    expect(searchChip.parentElement?.hasAttribute('data-dshws-chain-label')).toBe(true)
    expect(searchChip.parentElement?.textContent).toContain('Tavily')
    const fetchChip = screen.getByTestId('dshws-fetch-role-primary')
    expect(fetchChip.parentElement?.hasAttribute('data-dshws-chain-label')).toBe(true)
    expect(fetchChip.parentElement?.textContent).toContain('Firecrawl')
  })

  it('S22a T3+S22b: the Web Fetch chain folds inside the takeover card — collapsed by default, off hides it even expanded', () => {
    const onMoveFetch = vi.fn(async () => ({ ok: true }) as ActionResult)
    const { container } = render(<WebSearchSettingsSection {...makeProps({ onMoveFetch })} t={t} />)
    // S22b: default-collapsed — the chain takes no viewport until opened.
    expect(screen.queryByTestId('dshws-fetch-chain')).toBeNull()
    openTakeover()
    const fetchChain = screen.getByTestId('dshws-fetch-chain')
    // DOM: the chain rides INSIDE the takeover card, after its header (S22a/S22b).
    const takeoverCard = container.querySelector('[data-testid="dshws-fetch-takeover"]')!
    expect(takeoverCard.contains(fetchChain)).toBe(true)
    expect(takeoverCard.compareDocumentPosition(fetchChain) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    cleanup()
    const off = makeProps({ onMoveFetch })
    off.snapshot = { ...off.snapshot, fetchTakeover: false }
    render(<WebSearchSettingsSection {...off} t={t} />)
    openTakeover()
    expect(screen.queryByTestId('dshws-fetch-chain')).toBeNull()
  })

  it('an all-unconfigured snapshot renders no fetch chain block', () => {
    const members = defaultMembers().map((m) => ({ ...m, configured: false }))
    render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members) })} t={t} />)
    expect(screen.queryByTestId('dshws-fetch-chain')).toBeNull()
  })

  it('the takeover switch carries the S21 chain-service note (S22b: the ⓘ rides in the fold header)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const info = screen.getByTestId('dshws-fetch-takeover-disclosure').querySelector('button')
    expect(info?.getAttribute('aria-label')).toBe(en.fetchTakeoverNoteS21)
  })
})

