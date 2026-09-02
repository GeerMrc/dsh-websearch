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

const BUILT_IN = ['dshws-tavily', 'dshws-exa', 'dshws-perplexity', 'dshws-firecrawl', 'dshws-deepseek']

function member(key: string, label: string, overrides: Partial<MemberSnapshot> = {}): MemberSnapshot {
  return {
    key,
    label,
    refName: `${key.toUpperCase()}_API_KEY`,
    enabled: true,
    configured: false,
    source: undefined,
    writable: true,
    extraRefs: [],
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
    onAddExtraKey: vi.fn(async () => ({ ok: true }) as ActionResult),
    onRemoveExtraKey: vi.fn(async () => ({ ok: true }) as ActionResult),
    ...overrides,
  }
}

afterEach(cleanup)

describe('WebSearchSettingsSection', () => {
  it('renders one card per member in snapshot order with brand labels', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const cards = screen.getByTestId('dshws-members').children
    expect(cards.length).toBe(5)
    expect(screen.getByText('Tavily')).toBeTruthy()
    expect(screen.getByText('DeepSeek')).toBeTruthy()
  })

  it('renders localized heading and description through the t seat', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    expect(screen.getByText(en.title)).toBeTruthy()
    expect(screen.getByText(en.description)).toBeTruthy()
  })

  it('the status dot maps configured to done and missing to warning', () => {
    const members = defaultMembers()
    members[0] = member('tavily', 'Tavily', { configured: true, source: 'file' })
    const { container } = render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members) })} t={t} />)
    const tavily = container.querySelector('[data-testid="dshws-member-tavily"]')!
    expect(tavily.querySelector('[data-state="done"]')).toBeTruthy()
    expect(tavily.textContent).toContain(en.configured)
    const exa = container.querySelector('[data-testid="dshws-member-exa"]')!
    expect(exa.querySelector('[data-state="warning"]')).toBeTruthy()
    expect(exa.textContent).toContain(en.notConfigured)
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
    await waitFor(() => expect(onSaveKey).toHaveBeenCalledWith('tavily', 'TAVILY_API_KEY', 'sk-fake-tavily'))
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
    render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members), onClearKey })} t={t} />)
    const tavilyClear = within(screen.getByTestId('dshws-member-tavily')).getByRole('button', { name: 'Tavily Clear' })
    expect((tavilyClear as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(tavilyClear)
    await waitFor(() => expect(onClearKey).toHaveBeenCalledWith('tavily', 'TAVILY_API_KEY'))
    const exaClear = within(screen.getByTestId('dshws-member-exa')).getByRole('button', { name: 'Exa Clear' })
    expect((exaClear as HTMLButtonElement).disabled).toBe(true)
  })

  it('renders both chains in snapshot order plus the timeout budget', () => {
    const { container } = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const chains = container.querySelector('[data-testid="dshws-chains"]')!
    const lists = chains.querySelectorAll('ol')
    expect(lists.length).toBe(2)
    for (const list of lists) {
      expect(Array.from(list.querySelectorAll('li > span')).map((span) => span.textContent)).toEqual(BUILT_IN)
    }
    expect(chains.textContent).toContain('30000')
  })

  it('the search chain is reorderable and the fetch chain stays read-only', () => {
    const { container } = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const searchList = container.querySelector('[data-testid="dshws-search-chain"]')!
    const fetchList = container.querySelector('[data-testid="dshws-fetch-chain"]')!
    const upButtons = searchList.querySelectorAll('button[aria-label$="Move up"]')
    const downButtons = searchList.querySelectorAll('button[aria-label$="Move down"]')
    expect(upButtons.length).toBe(5)
    expect(downButtons.length).toBe(5)
    expect(screen.getByRole('button', { name: 'dshws-tavily Move up' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'dshws-exa Move down' })).toBeTruthy()
    expect(fetchList.querySelectorAll('button').length).toBe(0)
  })

  it('boundary move buttons disable at the ends of the search chain', () => {
    const { container } = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const searchList = container.querySelector('[data-testid="dshws-search-chain"]')!
    const firstUp = searchList.querySelector('button[aria-label="dshws-tavily Move up"]') as HTMLButtonElement
    const firstDown = searchList.querySelector('button[aria-label="dshws-tavily Move down"]') as HTMLButtonElement
    const lastDown = searchList.querySelector(
      'button[aria-label="dshws-deepseek Move down"]',
    ) as HTMLButtonElement
    const lastUp = searchList.querySelector('button[aria-label="dshws-deepseek Move up"]') as HTMLButtonElement
    expect(firstUp.disabled).toBe(true)
    expect(firstDown.disabled).toBe(false)
    expect(lastUp.disabled).toBe(false)
    expect(lastDown.disabled).toBe(true)
  })

  it('move clicks forward the entry id and delta', async () => {
    const onMoveSearch = vi.fn(async () => ({ ok: true }) as ActionResult)
    const { container } = render(<WebSearchSettingsSection {...makeProps({ onMoveSearch })} t={t} />)
    const searchList = container.querySelector('[data-testid="dshws-search-chain"]')!
    fireEvent.click(searchList.querySelector('button[aria-label="dshws-exa Move up"]')!)
    await waitFor(() => expect(onMoveSearch).toHaveBeenCalledWith('dshws-exa', -1))
    fireEvent.click(searchList.querySelector('button[aria-label="dshws-tavily Move down"]')!)
    await waitFor(() => expect(onMoveSearch).toHaveBeenCalledWith('dshws-tavily', 1))
  })

  it('chain badges reflect the pinned flags on both chains', () => {
    const { container } = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const badges = container.querySelectorAll('[data-dshws-chain-state]')
    expect(badges.length).toBe(2)
    for (const badge of badges) {
      expect(badge.getAttribute('data-dshws-chain-state')).toBe('default')
      expect(badge.textContent).toBe(en.chainDefault)
    }
    cleanup()
    const pinnedSnapshot: SectionSnapshot = {
      ...makeSnapshot(),
      searchChainPinned: true,
      fetchChainPinned: true,
    }
    const pinned = render(<WebSearchSettingsSection {...makeProps({ snapshot: pinnedSnapshot })} t={t} />)
    const pinnedBadges = pinned.container.querySelectorAll('[data-dshws-chain-state]')
    expect(pinnedBadges.length).toBe(2)
    for (const badge of pinnedBadges) {
      expect(badge.getAttribute('data-dshws-chain-state')).toBe('pinned')
      expect(badge.textContent).toBe(en.chainPinned)
    }
  })

  it('renders extra key rows with per-ref labels and forwards their writes', async () => {
    const onSaveKey = vi.fn(async () => ({ ok: true }) as ActionResult)
    const onClearKey = vi.fn(async () => ({ ok: true }) as ActionResult)
    const members = defaultMembers()
    members[0] = member('tavily', 'Tavily', {
      extraRefs: [{ ref: 'TAVILY_SPARE', configured: true, writable: true }],
    })
    render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members), onSaveKey, onClearKey })} t={t} />)
    const card = screen.getByTestId('dshws-member-tavily')
    expect(card.textContent).toContain('TAVILY_SPARE')
    const input = screen.getByLabelText('TAVILY_SPARE API Key') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'sk-spare' } })
    fireEvent.click(within(card).getByRole('button', { name: 'TAVILY_SPARE Save' }))
    await waitFor(() => expect(onSaveKey).toHaveBeenCalledWith('tavily', 'TAVILY_SPARE', 'sk-spare'))
    const clear = within(card).getByRole('button', { name: 'TAVILY_SPARE Clear' })
    fireEvent.click(clear)
    await waitFor(() => expect(onClearKey).toHaveBeenCalledWith('tavily', 'TAVILY_SPARE'))
  })

  it('adding an extra key forwards the member key and ref name', async () => {
    const onAddExtraKey = vi.fn(async () => ({ ok: true }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onAddExtraKey })} t={t} />)
    const card = screen.getByTestId('dshws-member-tavily')
    const input = screen.getByLabelText('Tavily New ref name') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'TAVILY_SPARE' } })
    fireEvent.click(within(card).getByRole('button', { name: 'Tavily Add' }))
    await waitFor(() => expect(onAddExtraKey).toHaveBeenCalledWith('tavily', 'TAVILY_SPARE'))
  })

  it('removing an extra key forwards the member key and ref name', async () => {
    const onRemoveExtraKey = vi.fn(async () => ({ ok: true }) as ActionResult)
    const members = defaultMembers()
    members[0] = member('tavily', 'Tavily', {
      extraRefs: [{ ref: 'TAVILY_SPARE', configured: false, writable: true }],
    })
    render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members), onRemoveExtraKey })} t={t} />)
    fireEvent.click(within(screen.getByTestId('dshws-member-tavily')).getByRole('button', { name: 'TAVILY_SPARE Remove' }))
    await waitFor(() => expect(onRemoveExtraKey).toHaveBeenCalledWith('tavily', 'TAVILY_SPARE'))
  })

  it('a failed move shows failed feedback and a later success clears it', async () => {
    const onMoveSearch = vi.fn(async () => ({ ok: false }) as ActionResult)
    const { container } = render(<WebSearchSettingsSection {...makeProps({ onMoveSearch })} t={t} />)
    const searchList = container.querySelector('[data-testid="dshws-search-chain"]')!
    fireEvent.click(searchList.querySelector('button[aria-label="dshws-exa Move up"]')!)
    await waitFor(() => expect(screen.getByTestId('dshws-chain-feedback').textContent).toBe(en.failed))

    const succeeding = vi.fn(async () => ({ ok: true }) as ActionResult)
    const rerendered = render(
      <WebSearchSettingsSection {...makeProps({ onMoveSearch: succeeding })} t={t} />,
    )
    const list = rerendered.container.querySelector('[data-testid="dshws-search-chain"]')!
    fireEvent.click(list.querySelector('button[aria-label="dshws-exa Move up"]')!)
    await waitFor(() => expect(succeeding).toHaveBeenCalled())
    // Scoped to the fresh instance: the first container is still mounted until
    // afterEach cleanup, so a document-wide query would hit its leftover span.
    expect(rerendered.container.querySelector('[data-testid="dshws-chain-feedback"]')).toBeNull()
  })
})
