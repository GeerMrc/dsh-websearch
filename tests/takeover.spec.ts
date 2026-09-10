import { describe, expect, it } from 'vitest'
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
interface AgentCall { restrictCalls: RestrictCall[]; sectionCalls: SectionCall[] }

function takeoverCtx(): { ctx: Context; agents: AgentCall[]; createAgent: () => void } {
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

  return { ctx: c as unknown as Context, agents, createAgent }
}

describe('S21 takeover semantics: restrict listener retired (ADR-0019)', () => {
  it('S21: no agent/created subscription exists — web_fetch stays visible and is served by the chain when ON', async () => {
    const { ctx, agents, createAgent } = takeoverCtx()
    apply(ctx, {})
    await flushGate()

    // S15c's restrict/prompt-shadow listener is RETIRED (ADR-0019): agents
    // get no deny and no shadow section; the gate serves web_fetch instead.
    createAgent()
    expect(agents).toHaveLength(1)
    expect(agents[0]!.restrictCalls).toHaveLength(0)
    expect(agents[0]!.sectionCalls).toHaveLength(0)
  })

  it('takeover OFF: no restrict call, no prompt shadow', async () => {
    const { ctx, agents, createAgent } = takeoverCtx()
    apply(ctx, { fetchTakeover: false })
    await flushGate()

    createAgent()

    expect(agents).toHaveLength(1)
    expect(agents[0]!.restrictCalls).toHaveLength(0)
    expect(agents[0]!.sectionCalls).toHaveLength(0)
  })

  it('reports plugin name and inject surface unchanged', () => {
    expect(name).toBe('dsh-websearch')
    expect(inject).toEqual(['web', 'credentials'])
  })
})
