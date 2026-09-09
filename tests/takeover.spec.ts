import { describe, expect, it, vi } from 'vitest'
import type { Context } from '@deepseek-ai/cordis'
import { apply, inject, name } from '../src/index.ts'
import { fakeCtx, flushGate } from './helpers/fake-ctx.ts'

/**
 * S15c takeover unit tests: the plugin's agent/created listener must call
 * tools.restrict({deny:['web_fetch']}) and register a shadow prompt section
 * for every agent when the takeover toggle is ON — and do neither when OFF.
 *
 * The fake ctx below stubs the three host services the listener touches
 * (event bus, tools registry, systemPrompt registry) at the minimum surface
 * the plugin reads.
 */

interface RestrictCall { readonly deny: readonly string[] }
interface SectionCall { readonly name: string; readonly order: number; readonly text: string }
interface AgentCall { readonly restrictCalls: readonly RestrictCall[]; readonly sectionCalls: readonly SectionCall[] }

function takeoverCtx(takeover: boolean): { ctx: Context; agents: AgentCall[] } {
  const agents: AgentCall[] = []
  const { ctx } = fakeCtx()
  const c = ctx as unknown as Record<string, unknown>

  // Event bus: the plugin registers ctx.on('agent/created', handler).
  const handlers = new Map<string, ((payload: unknown) => void)[]>()
  c.on = (event: string, handler: (payload: unknown) => void) => {
    const list = handlers.get(event) ?? []
    list.push(handler)
    handlers.set(event, list)
    return () => {}
  }

  // Config: the plugin reads live.current().fetchTakeover — inject via apply.
  c.web = {
    registerSearchProvider: () => {},
    registerFetchProvider: () => {},
  }

  // Simulate agent creation: host emits agent/created with {agent:{ctx:{...}}}
  const createAgent = () => {
    const agent: AgentCall = { restrictCalls: [], sectionCalls: [] }
    const agentCtx = {
      tools: {
        restrict: (filter: RestrictCall) => {
          agent.restrictCalls.push(filter)
          return () => {}
        },
      },
      systemPrompt: {
        section: (section: SectionCall) => {
          agent.sectionCalls.push(section)
          return () => {}
        },
      },
    }
    agents.push(agent)
    for (const handler of handlers.get('agent/created') ?? []) {
      handler({ agent: { ctx: agentCtx } })
    }
  }

  return { ctx: c as unknown as Context, agents, createAgent: createAgent as unknown as () => void }
}

describe('S15c takeover: tools.restrict on agent/created', () => {
  it('takeover ON (default): every new agent gets web_fetch denied and prompt shadowed', async () => {
    const { ctx, agents, createAgent } = takeoverCtx(true)
    apply(ctx, {})
    await flushGate()

    // Simulate two agents being created
    ;(createAgent as () => void)()
    ;(createAgent as () => void)()

    expect(agents).toHaveLength(2)
    for (const agent of agents) {
      expect(agent.restrictCalls).toHaveLength(1)
      expect(agent.restrictCalls[0]!.deny).toContain('web_fetch')
      expect(agent.sectionCalls).toHaveLength(1)
      expect(agent.sectionCalls[0]!.name).toBe('tool:web_fetch')
      expect(agent.sectionCalls[0]!.text).toBe('')
      expect(agent.sectionCalls[0]!.order).toBe(2100)
    }
  })

  it('takeover OFF: no restrict call, no prompt shadow', async () => {
    const { ctx, agents, createAgent } = takeoverCtx(false)
    apply(ctx, { fetchTakeover: false })
    await flushGate()

    ;(createAgent as () => void)()

    expect(agents).toHaveLength(1)
    expect(agents[0]!.restrictCalls).toHaveLength(0)
    expect(agents[0]!.sectionCalls).toHaveLength(0)
  })

  it('reports plugin name and inject surface unchanged', () => {
    expect(name).toBe('dsh-websearch')
    expect(inject).toEqual(['web', 'credentials'])
  })
})
