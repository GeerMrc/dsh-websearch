// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import { apply, inject } from '../../src/client/index.ts'
import { en } from '../../src/client/locales.ts'
import type { DshWsLocaleKey } from '../../src/client/locales.ts'

const t = (key: DshWsLocaleKey) => en[key]

/**
 * Hand-built client ctx stub (upstream section spec style): captures locale
 * registrations and slot registrations, backs the remote face with plain
 * fns. The cast to Context mirrors the template's `as unknown as` approach —
 * the stub implements only the faces the entry touches.
 */
function makeCtx() {
  const creds: Record<string, { configured: boolean; source?: string; writable: boolean }> = {}
  const unregisterRemote = vi.fn()
  const remote = {
    settings: {
      describe: vi.fn(async () => ({
        ok: true as const,
        value: {
          writable: true,
          hasDocument: false,
          namespaces: [{ ns: 'dsh-websearch', schema: {}, value: {}, applies: 'live' as const, secrets: [], revision: 0 }],
        },
      })),
      update: vi.fn(),
    },
    credentials: {
      describe: vi.fn(async () => ({ ok: true as const, value: { ...creds } })),
      set: vi.fn(async (ref: string, _value: string) => {
        creds[ref] = { configured: true, source: 'file', writable: true }
        return { ok: true as const, value: undefined }
      }),
      unset: vi.fn(),
    },
    $on: vi.fn((_event: string, _handler: (ref: string) => void) => unregisterRemote),
  }
  const registered: { props: Record<string, unknown>; component: unknown }[] = []
  const unregisterSlot = vi.fn()
  const slots = {
    inject: vi.fn((_key: string, _cb: () => unknown) => undefined),
    register: vi.fn((props: Record<string, unknown>, component: unknown) => {
      registered.push({ props, component })
      return unregisterSlot
    }),
  }
  const locale = {
    register: vi.fn(() => () => {}),
    bind: vi.fn(() => t),
  }
  const ctx = {
    locale,
    slots,
    remote,
    effect: vi.fn((fn: () => unknown) => {
      fn()
      return () => {}
    }),
  }
  return { ctx: ctx as unknown as Context, raw: ctx, registered, remote, unregisterRemote, unregisterSlot }
}

afterEach(cleanup)

describe('client entry', () => {
  it('declares the fine-grained inject face', () => {
    expect(inject).toEqual(['slots', 'locale', 'remote', 'remote.settings', 'remote.credentials'])
  })

  it('apply registers the typed zh/en dictionaries under the section namespace', () => {
    const { ctx, raw } = makeCtx()
    apply(ctx)
    expect(raw.locale.register).toHaveBeenCalledWith('dsh-websearch', { zh: expect.anything(), en: expect.anything() })
  })

  it('apply injects the settings.section slot with the registration contract', () => {
    const { ctx, raw, registered } = makeCtx()
    apply(ctx)
    // S14: the toolview takeover adds a second slot injection (ADR-0010).
    expect(raw.slots.inject).toHaveBeenCalledTimes(2)
    const settingsCall = raw.slots.inject.mock.calls.find((call) => call[0] === 'settings.section')
    expect(settingsCall).toBeDefined()

    const registerCallback = settingsCall![1] as () => unknown
    registerCallback()
    expect(registered.length).toBe(1)
    const props = registered[0]!.props
    expect(props.name).toBe('settings.section')
    expect(props.id).toBe('dsh-websearch')
    expect(props.order).toBe(16)
    expect(props.locale).toBe('dsh-websearch')
    const label = props.label as () => string
    expect(label()).toBe(en.nav)
    expect(typeof registered[0]!.component).toBe('function')
  })

  it('the composed slot disposer detaches both the event subscription and the registration', () => {
    const { ctx, raw, unregisterRemote, unregisterSlot } = makeCtx()
    apply(ctx)
    const registerCallback = raw.slots.inject.mock.calls[0]?.[1] as () => (() => void)
    const disposer = registerCallback()
    disposer()
    expect(unregisterRemote).toHaveBeenCalledTimes(1)
    expect(unregisterSlot).toHaveBeenCalledTimes(1)
  })

  it('the bound section renders live remote state through the controller', async () => {
    const { ctx, raw, registered } = makeCtx()
    apply(ctx)
    const registerCallback = raw.slots.inject.mock.calls[0]?.[1] as () => unknown
    registerCallback()
    const Component = registered[0]!.component as (props: { t: typeof t }) => JSX.Element

    render(<Component t={t} />)
    // S23b: the fallback row moved into the advanced fold — 4 cards + takeover.
    await waitFor(() => expect(screen.getByTestId('dshws-members').children.length).toBe(5))
    // Scoped to the cards grid: the brand label also renders in chain rows.
    expect(within(screen.getByTestId('dshws-members')).getByText('Tavily')).toBeTruthy()
  })

  it('saving a key in the bound section reaches ctx.remote.credentials.set', async () => {
    const { ctx, raw, registered, remote } = makeCtx()
    apply(ctx)
    const registerCallback = raw.slots.inject.mock.calls[0]?.[1] as () => unknown
    registerCallback()
    const Component = registered[0]!.component as (props: { t: typeof t }) => JSX.Element

    render(<Component t={t} />)
    // S23b: the fallback row moved into the advanced fold — 4 cards + takeover.
    await waitFor(() => expect(screen.getByTestId('dshws-members').children.length).toBe(5))
    // S14c: cards default collapsed — expand before driving the key surface.
    fireEvent.click(screen.getByTestId('dshws-member-toggle-tavily'))
    const input = screen.getByLabelText('Tavily API Key') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'sk-fake-entry' } })
    fireEvent.click(within(screen.getByTestId('dshws-member-tavily')).getByRole('button', { name: 'Tavily Save' }))
    await waitFor(() => expect(remote.credentials.set).toHaveBeenCalledWith('TAVILY_API_KEY', 'sk-fake-entry'))
  })
})
