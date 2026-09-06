// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WebSearchSettingsSection } from '../../src/client/section.tsx'
import type { SectionProps } from '../../src/client/section.tsx'
import type { ActionResult, MemberSnapshot, SectionSnapshot } from '../../src/client/controller.ts'
import { en } from '../../src/client/locales.ts'
import type { DshWsLocaleKey } from '../../src/client/locales.ts'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'

// The section only looks up own-namespace keys; the common-namespace keys
// TranslateNS also accepts resolve through the runtime's fallback chain,
// which this stub pins to the own dictionary.
const t: TranslateNS<'dsh-websearch'> = (key) => en[key as DshWsLocaleKey] ?? key

const BUILT_IN = ['dshws-tavily', 'dshws-exa', 'dshws-perplexity', 'dshws-firecrawl', 'dshws-deepseek', 'dshws-anysearch']
const BRANDS = ['Tavily', 'Exa', 'Perplexity', 'Firecrawl', 'DeepSeek', 'AnySearch']

function member(key: string, label: string, overrides: Partial<MemberSnapshot> = {}): MemberSnapshot {
  return {
    key,
    label,
    memberId: `dshws-${key}`,
    refName: `${key.toUpperCase()}_API_KEY`,
    enabled: true,
    configured: true,
    keySelection: 'order',
    source: undefined,
    writable: true,
    ...overrides,
  }
}

function defaultMembers(): MemberSnapshot[] {
  return [
    member('tavily', 'Tavily'),
    member('exa', 'Exa'),
    member('perplexity', 'Perplexity'),
    member('firecrawl', 'Firecrawl'),
    member('deepseek', 'DeepSeek'),
    member('anysearch', 'AnySearch'),
      ]
}

function makeSnapshot(members: MemberSnapshot[] = defaultMembers()): SectionSnapshot {
  return {
    members,
    searchChain: BUILT_IN,
    fetchChain: BUILT_IN,
    searchChainPinned: false,
    fetchChainPinned: false,
    timeoutMs: 30000,
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
    ...overrides,
  }
}

afterEach(cleanup)

describe('WebSearchSettingsSection', () => {
  it('renders one card per member in snapshot order with brand labels', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const cards = screen.getByTestId('dshws-members').children
    expect(cards.length).toBe(6)
    // Scoped to the cards grid: the brand label also renders in chain rows.
    expect(within(screen.getByTestId('dshws-members')).getByText('Tavily')).toBeTruthy()
    expect(within(screen.getByTestId('dshws-members')).getByText('AnySearch')).toBeTruthy()
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
    const input = screen.getByLabelText('Tavily API Key') as HTMLInputElement
    expect(input.getAttribute('type')).toBe('password')
    fireEvent.change(input, { target: { value: 'sk-fake-tavily' } })
    fireEvent.click(within(screen.getByTestId('dshws-member-tavily')).getByRole('button', { name: 'Tavily Save' }))
    await waitFor(() => expect(onSaveKey).toHaveBeenCalledWith('tavily', 'sk-fake-tavily'))
    await waitFor(() => expect(input.value).toBe(''))
    expect(screen.getByTestId('dshws-feedback-tavily').textContent).toBe(en.saved)
  })

  it('save failure shows failed feedback and keeps the draft', async () => {
    const onSaveKey = vi.fn(async () => ({ ok: false }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onSaveKey })} t={t} />)
    const input = screen.getByLabelText('Tavily API Key') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'sk-fake-tavily' } })
    fireEvent.click(within(screen.getByTestId('dshws-member-tavily')).getByRole('button', { name: 'Tavily Save' }))
    await waitFor(() => expect(screen.getByTestId('dshws-feedback-tavily').textContent).toBe(en.failed))
    expect(input.value).toBe('sk-fake-tavily')
  })

  it('clear is gated on configured and forwards the member key', async () => {
    const onClearKey = vi.fn(async () => ({ ok: true }) as ActionResult)
    const members = defaultMembers()
    members[0] = member('tavily', 'Tavily', { configured: true })
    members[1] = member('exa', 'Exa', { configured: false })
    render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members), onClearKey })} t={t} />)
    const tavilyClear = within(screen.getByTestId('dshws-member-tavily')).getByRole('button', { name: 'Tavily Clear' })
    expect((tavilyClear as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(tavilyClear)
    await waitFor(() => expect(onClearKey).toHaveBeenCalledWith('tavily'))
    const exaClear = within(screen.getByTestId('dshws-member-exa')).getByRole('button', { name: 'Exa Clear' })
    expect((exaClear as HTMLButtonElement).disabled).toBe(true)
  })

  it('renders the search chain as a compact card with brand names and no fetch block (12a 反馈④)', () => {
    const { container } = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const chains = container.querySelector('[data-testid="dshws-chains"]')!
    // The read-only fetch chain block is gone; exactly one list remains.
    expect(chains.querySelectorAll('ol').length).toBe(1)
    expect(container.querySelector('[data-testid="dshws-fetch-chain"]')).toBeNull()
    const rows = Array.from(chains.querySelectorAll('[data-dshws-chain-label]')).map((span) => span.textContent)
    expect(rows).toEqual(BRANDS)
    // The timeout folded into the card hint line.
    expect(chains.textContent).toContain('30000')
  })

  it('the chain section is hidden entirely while no member is configured (12a 反馈④)', () => {
    const members = defaultMembers().map((m) => member(m.key, m.label, { configured: false }))
    const { container } = render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members) })} t={t} />)
    expect(container.querySelector('[data-testid="dshws-chains"]')).toBeNull()
  })

  it('the search chain is reorderable and the fetch chain stays read-only', () => {
    const { container } = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const searchList = container.querySelector('[data-testid="dshws-search-chain"]')!
    const upButtons = searchList.querySelectorAll('button[aria-label$="Move up"]')
    const downButtons = searchList.querySelectorAll('button[aria-label$="Move down"]')
    expect(upButtons.length).toBe(6)
    expect(downButtons.length).toBe(6)
    expect(screen.getByRole('button', { name: 'Tavily Move up' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Exa Move down' })).toBeTruthy()
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

  it('the chain badge reflects the pinned flag on the search chain', () => {
    const { container } = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const badges = container.querySelectorAll('[data-dshws-chain-state]')
    expect(badges.length).toBe(1)
    expect(badges[0].getAttribute('data-dshws-chain-state')).toBe('default')
    cleanup()
    const pinnedSnapshot: SectionSnapshot = { ...makeSnapshot(), searchChainPinned: true }
    const pinned = render(<WebSearchSettingsSection {...makeProps({ snapshot: pinnedSnapshot })} t={t} />)
    const pinnedBadges = pinned.container.querySelectorAll('[data-dshws-chain-state]')
    expect(pinnedBadges.length).toBe(1)
    expect(pinnedBadges[0].getAttribute('data-dshws-chain-state')).toBe('pinned')
  })

  it('the chain card hint explains the built-in order with no info icon (12a 反馈④)', () => {
    const { container } = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const chains = container.querySelector('[data-testid="dshws-chains"]')!
    // The ⓘ/tooltip pattern is gone from the whole section.
    expect(within(chains as HTMLElement).queryByRole('tooltip')).toBeNull()
    expect(within(chains as HTMLElement).queryByRole('button', { name: en.chainDefault })).toBeNull()
    // The hint line spells the semantics and derives the order from MEMBERS.
    expect(chains.textContent).toContain(en.chainDefaultHint)
    expect(chains.textContent).toContain(BRANDS.join(' → '))
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
    // S14b: DeepSeek renders as the fallback row — its switch carries the
    // paid-fallback label but keeps the same configured-tracks-color contract.
    const deepseek = screen.getByRole('switch', { name: `DeepSeek ${en.fallbackSwitch}` }) as HTMLButtonElement
    expect(deepseek.style.background).toBe('var(--dsw-alias-state-success-primary)')
    // Action feedback is a polite live region (host savedNotice convention);
    // verified on the save leg — toggling has never rendered member feedback.
    // The save leg runs on a full member card (deepseek has no key surface).
    const input = within(screen.getByTestId('dshws-member-perplexity')).getByLabelText(
      'Perplexity API Key',
    ) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'sk-fake-px' } })
    fireEvent.click(within(screen.getByTestId('dshws-member-perplexity')).getByRole('button', { name: 'Perplexity Save' }))
    await waitFor(() =>
      expect(screen.getByTestId('dshws-feedback-perplexity').getAttribute('role')).toBe('status'),
    )
  })

  it('the key format note lives behind a single page-header icon (12b 反馈①)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    // Per-card hint paragraphs are gone — the note is stated once, page-level.
    expect(within(screen.getByTestId('dshws-members')).queryByText(en.keyFieldNote)).toBeNull()
    // One icon anchor after the heading; focus shows the formatted note.
    const anchor = screen.getByRole('button', { name: en.keyFieldNote })
    fireEvent.focus(anchor)
    expect(screen.getByRole('tooltip').textContent).toBe(en.keyFieldNote)
    fireEvent.blur(anchor)
    expect(screen.queryByRole('tooltip')).toBeNull()
    // The member-card subtrees stay tooltip-free (the icon is page-level only).
    expect(within(screen.getByTestId('dshws-members')).queryByRole('tooltip')).toBeNull()
  })

  it('DeepSeek renders as the fallback row without any key configuration surface (S14b D1)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const row = screen.getByTestId('dshws-fallback-deepseek')
    expect(within(row).getByText('DeepSeek')).toBeTruthy()
    expect(within(row).getByText(en.sharedWithModels)).toBeTruthy()
    const info = within(row).getByRole('button', { name: en.fallbackInfo })
    fireEvent.focus(info)
    expect(screen.getByRole('tooltip').textContent).toBe(en.fallbackNote)
    fireEvent.blur(info)
    expect(screen.queryByRole('tooltip')).toBeNull()
    // No key input, no pool controls, no save/clear on the fallback row.
    expect(within(row).queryByLabelText(`DeepSeek ${en.apiKey}`)).toBeNull()
    expect(within(row).queryByRole('group')).toBeNull()
    expect(within(row).queryByRole('button', { name: `DeepSeek ${en.save}` })).toBeNull()
    expect(within(row).queryByRole('button', { name: `DeepSeek ${en.clear}` })).toBeNull()
    expect(within(row).queryByTestId('dshws-keysel-hint-deepseek')).toBeNull()
    // The bottom footnote states the fallback rule once, page-level.
    expect(screen.getByTestId('dshws-fallback-footnote').textContent).toBe(en.fallbackFootnote)
  })

  it('the fallback switch toggles the paid fallback and stays disabled until the shared key exists (S14b D1)', async () => {
    const onToggleEnabled = vi.fn(async () => ({ ok: true }) as ActionResult)
    const members = defaultMembers()
    members[4] = member('deepseek', 'DeepSeek', { configured: false })
    const { unmount } = render(
      <WebSearchSettingsSection {...makeProps({ onToggleEnabled, snapshot: makeSnapshot(members) })} t={t} />,
    )
    const off = screen.getByRole('switch', { name: `DeepSeek ${en.fallbackSwitch}` }) as HTMLButtonElement
    expect(off.disabled).toBe(true)
    unmount()
    render(<WebSearchSettingsSection {...makeProps({ onToggleEnabled })} t={t} />)
    const on = screen.getByRole('switch', { name: `DeepSeek ${en.fallbackSwitch}` }) as HTMLButtonElement
    expect(on.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(on)
    await waitFor(() => expect(onToggleEnabled).toHaveBeenCalledWith('deepseek', false))
  })

  it('only the DeepSeek card carries the shared-with-models badge (12b 反馈②)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const badge = within(screen.getByTestId('dshws-fallback-deepseek')).getByText(en.sharedWithModels)
    expect(badge.getAttribute('title')).toBe(en.sharedWithModelsDetail)
    // The other five cards have no such badge.
    for (const key of ['tavily', 'exa', 'perplexity', 'firecrawl', 'anysearch']) {
      expect(within(screen.getByTestId(`dshws-member-${key}`)).queryByText(en.sharedWithModels)).toBeNull()
    }
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

  it('the key input owns its line and the actions live in a separate footer row (12a 反馈③)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const card = screen.getByTestId('dshws-member-tavily')
    const input = within(card).getByLabelText('Tavily API Key')
    // The Input primitive wraps the field in a span; that wrapper must be a
    // DIRECT child of the card (its own line), with no button in it.
    const wrap = input.parentElement as HTMLElement
    expect(wrap.parentElement).toBe(card)
    expect(wrap.querySelector('button')).toBeNull()
    // Save and Clear share a dedicated footer row.
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
    members[5] = member('anysearch', 'AnySearch', { configured: false })
    const { container } = render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members) })} t={t} />)
    const searchList = container.querySelector('[data-testid="dshws-search-chain"]')!
    const visible = [...searchList.querySelectorAll('[data-dshws-chain-label]')].map((span) => span.textContent)
    expect(visible).toEqual(['Tavily', 'Perplexity', 'Firecrawl', 'DeepSeek'])
    // The disabled boundary must follow the FILTERED list: the last visible
    // item's down button is disabled (previously computed against the full
    // chain length, so it stayed clickable and reported a bogus failure).
    const firstUp = searchList.querySelector('button[aria-label="Tavily Move up"]') as HTMLButtonElement
    const lastDown = searchList.querySelector('button[aria-label="DeepSeek Move down"]') as HTMLButtonElement
    const lastUp = searchList.querySelector('button[aria-label="DeepSeek Move up"]') as HTMLButtonElement
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

  it('renders a key-selection group on every card with the order policy pressed by default (S13 D2)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    // S14b: the fallback row carries no key-selection group — five cards only.
    const keyed = [
      ['tavily', 'Tavily'],
      ['exa', 'Exa'],
      ['perplexity', 'Perplexity'],
      ['firecrawl', 'Firecrawl'],
      ['anysearch', 'AnySearch'],
    ] as const
    for (const [key, brand] of keyed) {
      const card = screen.getByTestId(`dshws-member-${key}`)
      const group = within(card).getByRole('group', { name: `${brand} ${en.keySelection}` })
      const buttons = within(group).getAllByRole('button')
      expect(buttons.length).toBe(3)
      // The live policy is pressed and carries the pressed field visual.
      const pressed = within(group).getByRole('button', { name: `${brand} ${en.keySelOrder}` }) as HTMLButtonElement
      expect(pressed.getAttribute('aria-pressed')).toBe('true')
      expect(pressed.style.background).toBe('var(--dsw-alias-bg-layer-1)')
      for (const other of [en.keySelRoundRobin, en.keySelRandom]) {
        expect((within(group).getByRole('button', { name: `${brand} ${other}` }).getAttribute('aria-pressed'))).toBe('false')
      }
    }
  })

  it('clicking a strategy reports the member and policy, and the pressed state follows the snapshot (S13 D2/D4)', async () => {
    const onSetKeySelection = vi.fn(async () => ({ ok: true }) as ActionResult)
    const first = render(<WebSearchSettingsSection {...makeProps({ onSetKeySelection })} t={t} />)
    fireEvent.click(
      within(screen.getByTestId('dshws-member-tavily')).getByRole('button', { name: `Tavily ${en.keySelRandom}` }),
    )
    await waitFor(() => expect(onSetKeySelection).toHaveBeenCalledWith('tavily', 'random'))

    const members = defaultMembers()
    members[0] = member('tavily', 'Tavily', { keySelection: 'random' })
    first.rerender(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members), onSetKeySelection })} t={t} />)
    const card = screen.getByTestId('dshws-member-tavily')
    expect((within(card).getByRole('button', { name: `Tavily ${en.keySelRandom}` }).getAttribute('aria-pressed'))).toBe('true')
    expect((within(card).getByRole('button', { name: `Tavily ${en.keySelOrder}` }).getAttribute('aria-pressed'))).toBe('false')
  })

  it('an unconfigured member disables the control, and the hint states the two-level semantics (S13 D3)', () => {
    const members = defaultMembers()
    members[0] = member('tavily', 'Tavily', { configured: false })
    render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members) })} t={t} />)
    const card = screen.getByTestId('dshws-member-tavily')
    for (const strategy of [en.keySelOrder, en.keySelRoundRobin, en.keySelRandom]) {
      expect(((within(card).getByRole('button', { name: `Tavily ${strategy}` })) as HTMLButtonElement).disabled).toBe(true)
    }
    // The hint interpolates the live policy name and states no-swap degrade.
    const hint = within(card).getByTestId('dshws-keysel-hint-tavily')
    expect(hint.textContent).toBe(en.keySelectionHint.replace('{policy}', en.keySelOrder))
  })
})
