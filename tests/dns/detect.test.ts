import { describe, expect, it } from 'vitest'
import { CN_POOL, FULL_POOL, GLOBAL_POOL, nodesForPreset } from '../../src/dns/pool.ts'
import { bootstrapNodes, matchesNoProxy, proxyEnvActive, proxySuspendsFor, runCanary } from '../../src/dns/detect.ts'
import type { NodeHttpsSend, ResolvedDohNode } from '../../src/dns/transport.ts'

const RANGES = ['198.18.0.0/15', '192.0.2.0/24', '203.0.113.0/24', '0.0.0.0/8', '240.0.0.0/4']

/** A scripted system lookup: the host table decides answers (arrays) or failures (Error values). */
function scriptedLookup(table: Record<string, string[] | Error>) {
  const calls: string[] = []
  const systemLookup = async (host: string) => {
    calls.push(host)
    const entry = table[host]
    if (entry instanceof Error) throw entry
    return entry
  }
  return { systemLookup, calls }
}

describe('S35 T5: runCanary — 5-branch decision table (ADR-0022 D4)', () => {
  it('branch 1: every canary answers clean public IPs → skip / clean', async () => {
    const { systemLookup, calls } = scriptedLookup({
      'api.tavily.com': ['104.18.1.1'],
      'api.exa.ai': ['172.66.43.165'],
    })
    const outcome = await runCanary(['api.tavily.com', 'api.exa.ai'], { systemLookup, poisonRanges: RANGES })
    expect(outcome).toMatchObject({ action: 'skip', verdict: 'clean' })
    expect(outcome.hits).toEqual([])
    expect(calls).toEqual(['api.tavily.com', 'api.exa.ai'])
  })

  it('branch 2: any reserved-range hit → enable / poisoned, with the hit list as evidence', async () => {
    const { systemLookup } = scriptedLookup({
      'api.tavily.com': ['184.194.134.183'],
      'api.anysearch.com': ['198.18.0.23', '198.19.4.42'],
    })
    const outcome = await runCanary(['api.tavily.com', 'api.anysearch.com'], { systemLookup, poisonRanges: RANGES })
    expect(outcome.action).toBe('enable')
    expect(outcome.verdict).toBe('poisoned')
    expect(outcome.hits).toEqual([{ host: 'api.anysearch.com', addresses: ['198.18.0.23', '198.19.4.42'] }])
  })

  it('branch 3: every sample unobtainable (system resolution fails outright) → enable / inconclusive (blind beats poisoned)', async () => {
    const { systemLookup } = scriptedLookup({
      'api.tavily.com': new Error('ENOTFOUND'),
      'api.exa.ai': new Error('ETIMEOUT'),
    })
    const outcome = await runCanary(['api.tavily.com', 'api.exa.ai'], { systemLookup, poisonRanges: RANGES })
    expect(outcome).toMatchObject({ action: 'enable', verdict: 'inconclusive' })
    expect(outcome.failures).toHaveLength(2)
    expect(outcome.hits).toEqual([])
  })

  it('branch 4: mixed — some clean samples plus some failures with zero hits → skip (a clean sample proves no poisoning); failures recorded as diagnostics', async () => {
    const { systemLookup } = scriptedLookup({
      'api.tavily.com': ['104.18.1.1'],
      'api.anysearch.com': new Error('ESERVFAIL'),
    })
    const outcome = await runCanary(['api.tavily.com', 'api.anysearch.com'], { systemLookup, poisonRanges: RANGES })
    expect(outcome).toMatchObject({ action: 'skip', verdict: 'clean' })
    expect(outcome.failures).toEqual([{ host: 'api.anysearch.com', reason: 'ESERVFAIL' }])
    expect(outcome.hits).toEqual([])
  })

  it('branch 5: an empty canary set skips detection without any lookup', async () => {
    const { systemLookup, calls } = scriptedLookup({})
    const outcome = await runCanary([], { systemLookup, poisonRanges: RANGES })
    expect(outcome).toMatchObject({ action: 'skip', verdict: 'empty' })
    expect(calls).toEqual([])
  })

  it('poison evidence outranks a concurrent failure: a hit with any failures still enables', async () => {
    const { systemLookup } = scriptedLookup({
      'api.tavily.com': ['198.18.9.9'],
      'api.exa.ai': new Error('ENOTFOUND'),
    })
    const outcome = await runCanary(['api.tavily.com', 'api.exa.ai'], { systemLookup, poisonRanges: RANGES })
    expect(outcome).toMatchObject({ action: 'enable', verdict: 'poisoned' })
  })
})

describe('S35 T5: region pools and preset mapping (ADR-0022 D6)', () => {
  it('cn pool: AliDNS dual + DNSPod dual, path-style split (AliDNS /resolve, DNSPod /dns-query)', () => {
    expect(CN_POOL).toEqual([
      { host: '223.5.5.5', sni: 'dns.alidns.com', path: '/resolve', port: 443 },
      { host: '223.6.6.6', sni: 'dns.alidns.com', path: '/resolve', port: 443 },
      { host: '120.53.53.53', sni: 'doh.pub', path: '/dns-query', port: 443 },
      { host: '119.29.29.29', sni: 'doh.pub', path: '/dns-query', port: 443 },
    ])
  })

  it('global pool: Cloudflare/Google on 443 plus Quad9 on the documented :5053 JSON face', () => {
    expect(GLOBAL_POOL).toEqual([
      { host: '1.1.1.1', sni: 'cloudflare-dns.com', path: '/dns-query', port: 443 },
      { host: '1.0.0.1', sni: 'cloudflare-dns.com', path: '/dns-query', port: 443 },
      { host: '8.8.8.8', sni: 'dns.google', path: '/resolve', port: 443 },
      { host: '8.8.4.4', sni: 'dns.google', path: '/resolve', port: 443 },
      { host: '9.9.9.9', sni: 'dns.quad9.net', path: '/dns-query', port: 5053 },
    ])
  })

  it('auto preset exposes the full pool for bootstrap trimming; custom fills path/port defaults', () => {
    expect(nodesForPreset('auto', [])).toEqual(FULL_POOL)
    expect(nodesForPreset('cn', [])).toEqual(CN_POOL)
    expect(nodesForPreset('global', [])).toEqual(GLOBAL_POOL)
    expect(nodesForPreset('custom', [{ host: '10.1.1.1', sni: 'dns.corp.example' }])).toEqual([
      { host: '10.1.1.1', sni: 'dns.corp.example', path: '/dns-query', port: 443 },
    ])
    expect(nodesForPreset('custom', [{ host: '10.1.1.1', sni: 'dns.corp.example', path: '/resolve', port: 8443 }])).toEqual([
      { host: '10.1.1.1', sni: 'dns.corp.example', path: '/resolve', port: 8443 },
    ])
  })
})

describe('S35 T5: bootstrapNodes — probe the pool, rank by RTT (ADR-0022 D6)', () => {
  function node(host: string): ResolvedDohNode {
    return { host, sni: 'dns.alidns.com', path: '/resolve', port: 443 }
  }

  it('keeps Status-0 responders only, ranked by RTT ascending, trimmed to the take count', async () => {
    let now = 0
    const clock = () => now
    const send: NodeHttpsSend = async (target) => {
      if (target.host === '223.5.5.5') { now += 90; return { status: 200, body: JSON.stringify({ Status: 0 }) } }
      if (target.host === '223.6.6.6') { now += 30; return { status: 200, body: JSON.stringify({ Status: 0 }) } }
      throw Object.assign(new Error('blocked'), { kind: 'network' as const })
    }
    const picked = await bootstrapNodes([node('223.5.5.5'), node('223.6.6.6'), node('1.1.1.1')], { timeoutMs: 350, send, clock, take: 2 })
    expect(picked.map((entry) => entry.host)).toEqual(['223.6.6.6', '223.5.5.5'])
  })

  it('an empty result when nothing answers — the resolver falls back to the system path', async () => {
    const send: NodeHttpsSend = async () => {
      throw Object.assign(new Error('blocked'), { kind: 'network' as const })
    }
    expect(await bootstrapNodes([node('1.1.1.1')], { timeoutMs: 350, send, take: 2 })).toEqual([])
  })
})

describe('S35 T5: proxy environment suspension (ADR-0022 D7)', () => {
  it('activates on any standard proxy variable and stays off without one', () => {
    expect(proxyEnvActive({ HTTPS_PROXY: 'http://p:8080' })).toBe(true)
    expect(proxyEnvActive({ https_proxy: 'http://p:8080' })).toBe(true)
    expect(proxyEnvActive({ HTTP_PROXY: 'http://p:8080' })).toBe(true)
    expect(proxyEnvActive({ ALL_PROXY: 'socks5://p:1080' })).toBe(true)
    expect(proxyEnvActive({})).toBe(false)
    expect(proxyEnvActive({ HTTPS_PROXY: '  ' })).toBe(false)
  })

  it('NO_PROXY matches by equality or dot-suffix, honors the * wildcard, case-insensitively', () => {
    expect(matchesNoProxy('api.tavily.com', 'tavily.com')).toBe(true)
    expect(matchesNoProxy('api.tavily.com', 'api.tavily.com')).toBe(true)
    expect(matchesNoProxy('api.tavily.com', 'avily.com')).toBe(false)
    expect(matchesNoProxy('api.tavily.com', 'example.com,tavily.com')).toBe(true)
    expect(matchesNoProxy('anything.dev', '*')).toBe(true)
    expect(matchesNoProxy('api.tavily.com', 'TAVILY.COM')).toBe(true)
    expect(matchesNoProxy('api.tavily.com', undefined)).toBe(false)
    expect(matchesNoProxy('api.tavily.com', '')).toBe(false)
  })

  it('the layer suspends for non-exempt hosts and keeps resolving NO_PROXY-exempt ones', () => {
    const env = { HTTPS_PROXY: 'http://p:8080', NO_PROXY: 'tavily.com' }
    expect(proxySuspendsFor('api.tavily.com', env)).toBe(false)
    expect(proxySuspendsFor('api.exa.ai', env)).toBe(true)
    expect(proxySuspendsFor('api.exa.ai', {})).toBe(false)
  })
})
