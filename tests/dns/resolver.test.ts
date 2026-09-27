import { describe, expect, it } from 'vitest'
import { DohResolver } from '../../src/dns/resolver.ts'
import type { NodeHttpsSend, ResolvedDohNode } from '../../src/dns/transport.ts'

const NODES: ResolvedDohNode[] = [
  { host: '223.5.5.5', sni: 'dns.alidns.com', path: '/resolve', port: 443 },
  { host: '223.6.6.6', sni: 'dns.alidns.com', path: '/resolve', port: 443 },
]

const DEFAULTS = {
  nodes: NODES,
  nodeTimeoutMs: 350,
  cache: { posMinS: 30, posMaxS: 300, negS: 10 },
  poisonRanges: ['198.18.0.0/15', '192.0.2.0/24', '203.0.113.0/24', '0.0.0.0/8', '240.0.0.0/4'],
}

function envelope(ips: string[], ttl = 60) {
  return { Status: 0, Answer: ips.map((ip) => ({ name: 'x.example.', TTL: ttl, type: 1, data: ip })) }
}

/** A scripted send: routes by node host; each route holds a queue of outcomes (an Error to throw, or an envelope/body). */
function scriptedSend(script: Record<string, Array<Error | { Status: number; Answer?: Array<{ name: string; TTL: number; type: number; data: string }> }>>) {
  const calls: Array<{ host: string; type: number }> = []
  const send: NodeHttpsSend = async (node, path) => {
    const type = Number(path.split('type=')[1])
    calls.push({ host: node.host, type })
    const queue = script[node.host] ?? []
    const outcome = queue[Math.min(calls.filter((call) => call.host === node.host).length - 1, queue.length - 1)]
    if (outcome instanceof Error) throw outcome
    return { status: 200, body: JSON.stringify(outcome) }
  }
  return { send, calls }
}

function clockFixture() {
  let now = 1_000_000
  return { clock: () => now, advance: (ms: number) => (now += ms) }
}

describe('S35 T3: DohResolver — resolution, cache, TTL clamps (ADR-0022 D2)', () => {
  it('resolves through the first node with poison filtering and latency attribution', async () => {
    const { send, calls } = scriptedSend({ '223.5.5.5': [envelope(['198.18.0.5', '1.2.3.4'])] })
    const resolver = new DohResolver({ ...DEFAULTS, send })
    const outcome = await resolver.resolve('api.tavily.com', 4)
    expect(outcome?.addresses).toEqual([{ address: '1.2.3.4', family: 4 }])
    expect(outcome?.droppedPoisoned).toEqual(['198.18.0.5'])
    expect(outcome?.via).toBe('223.5.5.5')
    expect(outcome?.negative).toBe(false)
    expect(calls).toEqual([{ host: '223.5.5.5', type: 1 }])
  })

  it('serves the second hit from cache and re-queries only after the clamped TTL lapses', async () => {
    const { clock, advance } = clockFixture()
    const { send, calls } = scriptedSend({ '223.5.5.5': [envelope(['1.2.3.4'], 3600)] })
    const resolver = new DohResolver({ ...DEFAULTS, send, clock })
    await resolver.resolve('long.example', 4)
    const cached = await resolver.resolve('long.example', 4)
    expect(cached?.via).toBe('cache')
    expect(calls).toHaveLength(1)
    // TTL 3600 clamps UP to the 300s ceiling…
    advance(299_000)
    expect((await resolver.resolve('long.example', 4))?.via).toBe('cache')
    advance(2_000)
    expect((await resolver.resolve('long.example', 4))?.via).toBe('223.5.5.5')
    expect(calls).toHaveLength(2)
  })

  it('clamps a 1s upstream TTL UP to the 30s positive floor (CDN rotation must not thrash the cache)', async () => {
    const { clock, advance } = clockFixture()
    const { send, calls } = scriptedSend({ '223.5.5.5': [envelope(['179.255.102.224'], 1)] })
    const resolver = new DohResolver({ ...DEFAULTS, send, clock })
    await resolver.resolve('api.anysearch.com', 4)
    advance(29_000)
    expect((await resolver.resolve('api.anysearch.com', 4))?.via).toBe('cache')
    advance(2_000)
    expect((await resolver.resolve('api.anysearch.com', 4))?.via).toBe('223.5.5.5')
    expect(calls).toHaveLength(2)
  })

  it('negative-caches NXDOMAIN for negS and never retries the next node for it (deterministic answer)', async () => {
    const { clock, advance } = clockFixture()
    const { send, calls } = scriptedSend({ '223.5.5.5': [{ Status: 3 }] })
    const resolver = new DohResolver({ ...DEFAULTS, send, clock })
    const neg = await resolver.resolve('gone.example', 4)
    expect(neg?.negative).toBe(true)
    expect(neg?.addresses).toEqual([])
    expect(calls).toEqual([{ host: '223.5.5.5', type: 1 }])
    advance(9_000)
    expect((await resolver.resolve('gone.example', 4))?.via).toBe('cache')
    advance(2_000)
    expect((await resolver.resolve('gone.example', 4))?.via).toBe('223.5.5.5')
    expect(calls).toHaveLength(2)
  })

  it('keeps the unfiltered list when every address is poisoned (宁多勿无 — the filter must not become the outage)', async () => {
    const { send } = scriptedSend({ '223.5.5.5': [envelope(['198.19.9.9', '198.18.0.1'])] })
    const resolver = new DohResolver({ ...DEFAULTS, send })
    const outcome = await resolver.resolve('dark.example', 4)
    expect(outcome?.addresses.map((entry) => entry.address).sort()).toEqual(['198.18.0.1', '198.19.9.9'])
    expect(outcome?.droppedPoisoned).toEqual(['198.19.9.9', '198.18.0.1'])
  })
})

describe('S35 T3: DohResolver — failover, cooldown, degradation (ADR-0022 D2)', () => {
  it('fails over to the second node when the first throws a transport error', async () => {
    const networkDown = Object.assign(new Error('socket hang up'), { kind: 'network' as const })
    const { send, calls } = scriptedSend({ '223.5.5.5': [networkDown], '223.6.6.6': [envelope(['5.6.7.8'])] })
    const resolver = new DohResolver({ ...DEFAULTS, send })
    const outcome = await resolver.resolve('failover.example', 4)
    expect(outcome?.via).toBe('223.6.6.6')
    expect(outcome?.addresses).toEqual([{ address: '5.6.7.8', family: 4 }])
    expect(calls.map((call) => call.host)).toEqual(['223.5.5.5', '223.6.6.6'])
  })

  it('cools a node down after 3 consecutive failures — skipped even when it would answer, retried after 30s', async () => {
    const { clock, advance } = clockFixture()
    const networkDown = Object.assign(new Error('unreachable'), { kind: 'network' as const })
    const { send, calls } = scriptedSend({ '223.5.5.5': [networkDown, networkDown, networkDown, envelope(['9.9.9.9'])], '223.6.6.6': [envelope(['5.6.7.8'])] })
    const resolver = new DohResolver({ ...DEFAULTS, send, clock })
    // Three consecutive failures on node 1 (each resolve fails over to node 2 and succeeds — no cache of failures).
    for (let i = 0; i < 3; i++) {
      const outcome = await resolver.resolve(`warm${i}.example`, 4)
      expect(outcome?.via).toBe('223.6.6.6')
    }
    // Node 1 is now cooling: this fresh name goes straight to node 2.
    const cooled = await resolver.resolve('cooled.example', 4)
    expect(cooled?.via).toBe('223.6.6.6')
    expect(calls.filter((call) => call.host === '223.5.5.5')).toHaveLength(3)
    // After the 30s cooldown the node is retried (and its scripted answer now wins).
    advance(31_000)
    const revived = await resolver.resolve('revived.example', 4)
    expect(revived?.via).toBe('223.5.5.5')
  })

  it('returns null when every node fails — the caller falls back to the original system lookup (never-worse principle)', async () => {
    const down = Object.assign(new Error('refused'), { kind: 'network' as const })
    const { send, calls } = scriptedSend({ '223.5.5.5': [down], '223.6.6.6': [down] })
    const resolver = new DohResolver({ ...DEFAULTS, send })
    expect(await resolver.resolve('alloff.example', 4)).toBeNull()
    expect(calls.map((call) => call.host)).toEqual(['223.5.5.5', '223.6.6.6'])
  })

  it('treats SERVFAIL as node-scoped and moves to the next node', async () => {
    const { send, calls } = scriptedSend({ '223.5.5.5': [{ Status: 2 }], '223.6.6.6': [envelope(['5.6.7.8'])] })
    const resolver = new DohResolver({ ...DEFAULTS, send })
    const outcome = await resolver.resolve('servfail.example', 4)
    expect(outcome?.via).toBe('223.6.6.6')
    expect(calls.map((call) => call.host)).toEqual(['223.5.5.5', '223.6.6.6'])
  })
})

describe('S35 T3: DohResolver — family handling (ADR-0022 D2)', () => {
  it('family 0 queries A then AAAA and merges v4-first', async () => {
    const dual = { Status: 0, Answer: [{ name: 'x.', TTL: 60, type: 1, data: '1.2.3.4' }, { name: 'x.', TTL: 60, type: 28, data: '2606:4700::1111' }] }
    const { send, calls } = scriptedSend({ '223.5.5.5': [dual, dual] })
    const resolver = new DohResolver({ ...DEFAULTS, send })
    const outcome = await resolver.resolve('dual.example', 0)
    expect(outcome?.addresses).toEqual([{ address: '1.2.3.4', family: 4 }, { address: '2606:4700::1111', family: 6 }])
    expect(calls.map((call) => call.type)).toEqual([1, 28])
  })

  it('caches per requested family — a cached A answer does not serve an AAAA ask', async () => {
    const v4only = envelope(['1.2.3.4'])
    const v6only = { Status: 0, Answer: [{ name: 'x.', TTL: 60, type: 28, data: '2606:4700::1111' }] }
    const { send, calls } = scriptedSend({ '223.5.5.5': [v4only, v6only] })
    const resolver = new DohResolver({ ...DEFAULTS, send })
    await resolver.resolve('split.example', 4)
    const v6 = await resolver.resolve('split.example', 6)
    expect(v6?.addresses).toEqual([{ address: '2606:4700::1111', family: 6 }])
    expect(calls).toHaveLength(2)
  })
})

describe('S36 T2 (F1 清偿): invalidate — three-key positive-only invalidation (plan 036)', () => {
  it('drops every family key: a warm three-family cache re-queries DoH after invalidate, case-insensitive', async () => {
    const dual = { Status: 0, Answer: [{ name: 'x.', TTL: 60, type: 1, data: '1.2.3.4' }, { name: 'x.', TTL: 60, type: 28, data: '::42' }] }
    const { send, calls } = scriptedSend({ '223.5.5.5': [dual, dual, dual, dual, dual] })
    const resolver = new DohResolver({ ...DEFAULTS, send })
    await resolver.resolve('Multi.CASE.example', 4)
    await resolver.resolve('Multi.CASE.example', 6)
    // family-0 queries A then AAAA: two sends, one cached composite key.
    await resolver.resolve('Multi.CASE.example', 0)
    expect(calls).toHaveLength(4)
    resolver.invalidate('multi.case.EXAMPLE')
    const v4 = await resolver.resolve('multi.case.example', 4)
    const v6 = await resolver.resolve('multi.case.example', 6)
    const both = await resolver.resolve('multi.case.example', 0)
    expect(v4?.addresses[0]?.address).toBe('1.2.3.4')
    expect(v6?.addresses[0]?.address).toBe('::42')
    expect(both?.addresses).toHaveLength(2)
    expect(calls).toHaveLength(8)
  })

  it('keeps negative entries: a cached NXDOMAIN survives invalidate (10s respect)', async () => {
    const { send, calls } = scriptedSend({ '223.5.5.5': [{ Status: 3 }, { Status: 3 }] })
    const resolver = new DohResolver({ ...DEFAULTS, send })
    await resolver.resolve('gone.example', 4)
    resolver.invalidate('gone.example')
    const stillNeg = await resolver.resolve('gone.example', 4)
    expect(stillNeg?.negative).toBe(true)
    expect(stillNeg?.via).toBe('cache')
    expect(calls).toHaveLength(1)
  })
})
