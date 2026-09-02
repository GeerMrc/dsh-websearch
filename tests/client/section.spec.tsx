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
    render(<WebSearchSettingsSection {...makeProps({ snapshot: makeSnapshot(members), onClearKey })} t={t} />)
    const tavilyClear = within(screen.getByTestId('dshws-member-tavily')).getByRole('button', { name: 'Tavily Clear' })
    expect((tavilyClear as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(tavilyClear)
    await waitFor(() => expect(onClearKey).toHaveBeenCalledWith('tavily'))
    const exaClear = within(screen.getByTestId('dshws-member-exa')).getByRole('button', { name: 'Exa Clear' })
    expect((exaClear as HTMLButtonElement).disabled).toBe(true)
  })

  it('renders both chains read-only plus the timeout budget', () => {
    const { container } = render(<WebSearchSettingsSection {...makeProps()} t={t} />)
    const chains = container.querySelector('[data-testid="dshws-chains"]')!
    const lists = chains.querySelectorAll('ol')
    expect(lists.length).toBe(2)
    for (const list of lists) {
      expect(Array.from(list.querySelectorAll('li')).map((li) => li.textContent)).toEqual(BUILT_IN)
    }
    expect(chains.textContent).toContain('30000')
  })
})
