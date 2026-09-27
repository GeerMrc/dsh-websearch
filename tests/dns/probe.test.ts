import { describe, expect, it } from 'vitest'
import { EgressProbe } from '../../src/dns/probe.ts'

function clockFixture() {
  let now = 2_000_000
  return { clock: () => now, advance: (ms: number) => (now += ms) }
}

/** A scripted connect: the reachable set decides outcomes; every call is recorded with its budget. */
function scriptedConnect(reachable: ReadonlySet<string>) {
  const calls: Array<{ ip: string; port: number; timeoutMs: number }> = []
  const connect = async (ip: string, port: number, timeoutMs: number) => {
    calls.push({ ip, port, timeoutMs })
    return reachable.has(ip)
  }
  return { connect, calls }
}

describe('S35 T4: EgressProbe — TCP-443 precheck (ADR-0022 D3)', () => {
  it('keeps reachable addresses and drops unreachable ones (2 up 1 down)', async () => {
    const { connect } = scriptedConnect(new Set(['184.194.134.183', '98.87.123.185']))
    const probe = new EgressProbe({ port: 443, timeoutMs: 350, cacheTtlS: 30, connect })
    const outcome = await probe.filterReachable(['184.194.134.183', '54.243.194.162', '98.87.123.185'])
    expect(outcome.kept).toEqual(['184.194.134.183', '98.87.123.185'])
    expect(outcome.dropped).toEqual(['54.243.194.162'])
  })

  it('keeps the entire list when every probe fails (宁多勿无 — the precheck must not become the outage)', async () => {
    const { connect } = scriptedConnect(new Set())
    const probe = new EgressProbe({ port: 443, timeoutMs: 350, cacheTtlS: 30, connect })
    const outcome = await probe.filterReachable(['198.18.0.5', '10.0.0.1'])
    expect(outcome.kept).toEqual(['198.18.0.5', '10.0.0.1'])
    expect(outcome.dropped).toEqual(['198.18.0.5', '10.0.0.1'])
  })

  it('caches per-IP verdicts for cacheTtlS and re-probes after expiry', async () => {
    const { clock, advance } = clockFixture()
    const { connect, calls } = scriptedConnect(new Set(['1.1.1.1']))
    const probe = new EgressProbe({ port: 443, timeoutMs: 350, cacheTtlS: 30, connect, clock })
    await probe.filterReachable(['1.1.1.1', '2.2.2.2'])
    expect(calls).toHaveLength(2)
    advance(29_000)
    await probe.filterReachable(['1.1.1.1', '2.2.2.2'])
    expect(calls).toHaveLength(2)
    advance(2_000)
    await probe.filterReachable(['1.1.1.1', '2.2.2.2'])
    expect(calls).toHaveLength(4)
  })

  it('reuses cached verdicts across different name resolutions (per-IP, not per-name)', async () => {
    const { connect, calls } = scriptedConnect(new Set(['1.1.1.1']))
    const probe = new EgressProbe({ port: 443, timeoutMs: 350, cacheTtlS: 30, connect })
    await probe.filterReachable(['1.1.1.1'])
    const second = await probe.filterReachable(['1.1.1.1', '3.3.3.3'])
    expect(second.kept).toEqual(['1.1.1.1'])
    expect(calls.map((call) => call.ip)).toEqual(['1.1.1.1', '3.3.3.3'])
  })

  it('issues the handshakes in parallel with the configured budget and port', async () => {
    const calls: Array<{ ip: string; port: number; timeoutMs: number }> = []
    let release: (() => void) | undefined
    const gate = new Promise<void>((resolve) => (release = resolve))
    const connect = async (ip: string, port: number, timeoutMs: number) => {
      calls.push({ ip, port, timeoutMs })
      await gate
      return true
    }
    const probe = new EgressProbe({ port: 443, timeoutMs: 350, cacheTtlS: 30, connect })
    const pending = probe.filterReachable(['1.1.1.1', '2.2.2.2', '3.3.3.3'])
    // All three handshakes are already in flight before any resolves.
    expect(calls).toHaveLength(3)
    expect(calls.every((call) => call.port === 443 && call.timeoutMs === 350)).toBe(true)
    release?.()
    expect((await pending).kept).toHaveLength(3)
  })

  it('returns empty for an empty list without any handshake', async () => {
    const { connect, calls } = scriptedConnect(new Set())
    const probe = new EgressProbe({ port: 443, timeoutMs: 350, cacheTtlS: 30, connect })
    expect(await probe.filterReachable([])).toEqual({ kept: [], dropped: [], cached: true })
    expect(calls).toHaveLength(0)
  })
})
