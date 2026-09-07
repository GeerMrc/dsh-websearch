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


/** S14c: cards default collapsed — expand before driving the key surface. */
function expand(memberKey: string): void {
  fireEvent.click(screen.getByTestId(`dshws-member-toggle-${memberKey}`))
}

/** S14d: a configured card shows the masked value until focused — open a fresh
 * entry (focus) before typing into the key field. */
function focusKey(label: string): HTMLInputElement {
  const input = screen.getByLabelText(label) as HTMLInputElement
  fireEvent.focus(input)
  return input
}
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
    baseURL: undefined,
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
  const ORDERABLE = BUILT_IN.filter((id) => id !== 'dshws-deepseek')
  return {
    members,
    searchChain: ORDERABLE,
    fetchChain: ORDERABLE,
    searchChainPinned: false,
    fetchChainPinned: false,
    timeoutMs: 30000,
    deepseekMaxUses: undefined,
    fallbackProvider: 'fetch',
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
    onSetFallbackProvider: vi.fn(async () => ({ ok: true }) as ActionResult),
    onSetBaseURL: vi.fn(async () => ({ ok: true }) as ActionResult),
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
    expand('tavily')
    const input = focusKey('Tavily API Key')
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
    expand('tavily')
    const input = focusKey('Tavily API Key')
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
    expand('tavily')
    expand('exa')
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
    // S14c: five orderable rows only — DeepSeek is the fixed tail, not a row.
    expect(rows).toEqual(BRANDS.filter((brand) => brand !== 'DeepSeek'))
    // The timeout folded into the card hint line.
    expect(chains.textContent).toContain('30000')
  })

  it('the reorder rows stay hidden while no member is configured; the global card remains (S14c 改判 12a 反馈④)', () => {
    const members = defaultMembers().map((m) => member(m.key, m.label, { configured: false }))
    const { container } = render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members) })} t={t} />)
    // The global card (chain + timeout + maxUses) is always visible now…
    expect(container.querySelector('[data-testid="dshws-chains"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="dshws-max-uses"]')).not.toBeNull()
    // …but the reorder rows only earn their place once a member is configured.
    expect(container.querySelector('[data-testid="dshws-search-chain"]')).toBeNull()
  })

  it('the search chain is reorderable and the fetch chain stays read-only', () => {
    const { container } = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const searchList = container.querySelector('[data-testid="dshws-search-chain"]')!
    const upButtons = searchList.querySelectorAll('button[aria-label$="Move up"]')
    const downButtons = searchList.querySelectorAll('button[aria-label$="Move down"]')
    // S14c: five orderable rows.
    expect(upButtons.length).toBe(5)
    expect(downButtons.length).toBe(5)
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
    expect(chains.textContent).not.toContain(en.chainDefaultHint)
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
    expand('perplexity')
    const input = focusKey('Perplexity API Key')
    fireEvent.change(input, { target: { value: 'sk-fake-px' } })
    fireEvent.click(within(screen.getByTestId('dshws-member-perplexity')).getByRole('button', { name: 'Perplexity Save' }))
    await waitFor(() =>
      expect(screen.getByTestId('dshws-feedback-perplexity').getAttribute('role')).toBe('status'),
    )
  })

  it('the key format note lives behind a single page-header icon (12b 反馈①)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    // Per-card hint paragraphs are gone — the note is stated once per card as
    // the input placeholder (S14d), never as rendered text.
    expect(within(screen.getByTestId('dshws-members')).queryByText(en.keyFieldNote)).toBeNull()
    // One icon anchor after the heading; S14d: it carries the description.
    const anchorBtn = screen.getByRole('button', { name: en.description })
    fireEvent.focus(anchorBtn)
    expect(screen.getByRole('tooltip').textContent).toBe(en.description)
    fireEvent.blur(anchorBtn)
    expect(screen.queryByRole('tooltip')).toBeNull()
    // The member-card subtrees stay tooltip-free (the icon is page-level only).
    expect(within(screen.getByTestId('dshws-members')).queryByRole('tooltip')).toBeNull()
  })

  it('the fallback row carries no key surface; the ACTIVE choice owns the green dot (S14b D1 + S14i 审核)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const row = screen.getByTestId('dshws-fallback-deepseek')
    expect(within(row).getByText(en.fallbackRowLabel)).toBeTruthy()
    const info = within(row).getByRole('button', { name: en.fallbackInfo })
    fireEvent.focus(info)
    expect(screen.getByRole('tooltip').textContent).toBe(en.fallbackNote)
    fireEvent.blur(info)
    expect(screen.queryByRole('tooltip')).toBeNull()
    // No key input, no pool controls, no save/clear — and no leftover
    // DeepSeek-specific label/badge (S14i: those live in the ⓘ note only).
    expect(within(row).queryByLabelText(`DeepSeek ${en.apiKey}`)).toBeNull()
    expect(within(row).queryByRole('group', { name: en.keySelection })).toBeNull()
    expect(within(row).queryByRole('button', { name: `DeepSeek ${en.save}` })).toBeNull()
    expect(within(row).queryByTestId('dshws-keysel-hint-deepseek')).toBeNull()
    expect(within(row).queryByText(en.sharedWithModels)).toBeNull()
    expect(within(row).getByRole('group', { name: en.fallbackChoiceGroup })).toBeTruthy()
  })


  it('chain rows visually mark disabled members while they stay listed (S14b D2, S14c 移至可排序成员)', () => {
    const members = defaultMembers()
    members[1] = member('exa', 'Exa', { enabled: false })
    render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members) })} t={t} />)
    const row = screen.getByTestId('dshws-chain-item-dshws-exa')
    expect(row.textContent).toContain(en.chainDisabledNote.trim())
    expect(row.style.opacity).toBe('0.45')
    // Still listed and still movable — position matters once re-enabled.
    expect((within(row).getByRole('button', { name: `Exa ${en.moveUp}` }) as HTMLButtonElement).disabled).toBe(false)
    // Another enabled member keeps the chain usable — no warning.
    expect(screen.queryByTestId('dshws-chain-no-usable')).toBeNull()
  })

  it('zero enabled configured members renders the no-usable warning (S14b D2)', () => {
    const members = defaultMembers()
    for (const [index] of members.entries()) {
      members[index] = member(members[index]!.key, members[index]!.label, { configured: index === 4 })
    }
    members[4] = member('deepseek', 'DeepSeek', { enabled: false })
    render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members) })} t={t} />)
    expect(screen.getByTestId('dshws-chain-no-usable').textContent).toBe(en.chainNoUsableWarning)
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
    // The maxUses hint names the value in the box (default 10; typing 3 → 3).
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

  it('the fallback is a paid-vs-free choice; pressing writes the explicit field (S14e D3, 用户方向修正)', async () => {
    const onSetFallbackProvider = vi.fn(async () => ({ ok: true }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onSetFallbackProvider })} t={t} />)
    const row = screen.getByTestId('dshws-fallback-deepseek')
    // Fixture default: fetch (free) — the auto default with no model key.
    const paid = within(row).getByRole('button', { name: en.fallbackChoicePaid }) as HTMLButtonElement
    const free = within(row).getByRole('button', { name: en.fallbackChoiceFree }) as HTMLButtonElement
    expect(free.getAttribute('aria-pressed')).toBe('true')
    expect(paid.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(paid)
    await waitFor(() => expect(onSetFallbackProvider).toHaveBeenCalledWith('deepseek'))
    fireEvent.click(free)
    await waitFor(() => expect(onSetFallbackProvider).toHaveBeenCalledWith('fetch'))
  })


  it('the choice dots follow the ACTIVE tool: paid needs its key, free is always ready (S14i)', () => {
    // Default fixture: choice=fetch (auto, no key) → fetch dot green, paid gray.
    const first = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const paidDot1 = screen.getByTestId('dshws-fallback-dot-paid')
    const fetchDot1 = screen.getByTestId('dshws-fallback-dot-fetch')
    expect(paidDot1.style.background).toBe('var(--dsw-alias-state-warn-label)')
    expect(fetchDot1.style.background).toBe('var(--dsw-alias-state-success-primary)')
    first.unmount()

    // choice=deepseek with the key configured → paid dot green, fetch gray.
    const second = render(<WebSearchSettingsSection {...makeProps({ snapshot: { ...makeSnapshot(), fallbackProvider: 'deepseek' } })} t={t} />)
    expect(screen.getByTestId('dshws-fallback-dot-paid').style.background).toBe('var(--dsw-alias-state-success-primary)')
    expect(screen.getByTestId('dshws-fallback-dot-fetch').style.background).toBe('var(--dsw-alias-state-warn-label)')
    second.unmount()

    // choice=deepseek WITHOUT the key → both gray (paid not armed; honest).
    const dryMembers = defaultMembers()
    dryMembers[4] = member('deepseek', 'DeepSeek', { configured: false })
    render(<WebSearchSettingsSection {...makeProps({ snapshot: { ...makeSnapshot(dryMembers), fallbackProvider: 'deepseek' } })} t={t} />)
    expect(screen.getByTestId('dshws-fallback-dot-paid').style.background).toBe('var(--dsw-alias-state-warn-label)')
    expect(screen.getByTestId('dshws-fallback-dot-fetch').style.background).toBe('var(--dsw-alias-state-warn-label)')
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

  it('field rows share one label column; actions live in a separate footer row (S14l 重构 12a 反馈③)', () => {
    render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    expand('tavily')
    const card = screen.getByTestId('dshws-member-tavily')
    const input = within(card).getByLabelText('Tavily API Key')
    // The label column: the API key, policy, and endpoint rows align on the
    // same grid — their labels share the fieldLabelStyle right alignment.
    const labels = within(card).getAllByText(en.apiKey)
    expect(labels.length).toBeGreaterThanOrEqual(1)
    // The Input wrapper sits inside the field row (no button in it).
    const wrap = input.parentElement as HTMLElement
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
    // S14c: DeepSeek is not a row — the visible span ends at Firecrawl.
    expect(visible).toEqual(['Tavily', 'Perplexity', 'Firecrawl'])
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
      expand(key)
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
    expand('tavily')
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


  it('the global card sits above the tools and carries the maxUses knob (S14c T1)', () => {
    const { container } = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const chains = container.querySelector('[data-testid="dshws-chains"]')!
    const members = container.querySelector('[data-testid="dshws-members"]')!
    // DOM order: global card first, tools after.
    expect(chains.compareDocumentPosition(members) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Host-parity label verbatim; S14d default is 10 (user ruling).
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
    expect(within(card).getByRole('group', { name: `Tavily ${en.keySelection}` })).toBeTruthy()
    expect(within(card).getByRole('button', { name: `Tavily ${en.save}` })).toBeTruthy()
  })

  it('the fallback row is the last member element (S14c T1)', () => {
    const { container } = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const members = container.querySelector('[data-testid="dshws-members"]')!
    const children = Array.from(members.children)
    expect(children.length).toBe(6)
    expect((children[children.length - 1] as HTMLElement).dataset.testid).toBe('dshws-fallback-deepseek')
  })

  it('maxUses save patches the deepseek member key (S14c T4)', async () => {
    const onSetMaxUses = vi.fn(async () => ({ ok: true }) as ActionResult)
    render(<WebSearchSettingsSection {...makeProps({ onSetMaxUses })} t={t} />)
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

  it('an unconfigured member disables the control, and the hint states the two-level semantics (S13 D3)', () => {
    const members = defaultMembers()
    members[0] = member('tavily', 'Tavily', { configured: false })
    render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members) })} t={t} />)
    expand('tavily')
    const card = screen.getByTestId('dshws-member-tavily')
    for (const strategy of [en.keySelOrder, en.keySelRoundRobin, en.keySelRandom]) {
      expect(((within(card).getByRole('button', { name: `Tavily ${strategy}` })) as HTMLButtonElement).disabled).toBe(true)
    }
    // The hint interpolates the live policy name and states no-swap degrade.
    const hint = within(card).getByTestId('dshws-keysel-hint-tavily')
    expect(hint.textContent).toBe(en.keySelectionHint.replace('{policy}', en.keySelOrder))
  })
})
