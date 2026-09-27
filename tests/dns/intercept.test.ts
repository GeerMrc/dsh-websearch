import { describe, expect, it } from 'vitest'
import { createServer } from 'node:http'
import dnsDefault from 'node:dns'
import { installDnsLayer } from '../../src/dns/intercept.ts'
import type { DnsLayerDeps } from '../../src/dns/intercept.ts'
import type { DohResolution } from '../../src/dns/resolver.ts'
import type { ResolvedDnsConfig } from '../../src/config.ts'
import type { ResolvedDohNode } from '../../src/dns/transport.ts'

const ORIGINAL_LOOKUP = dnsDefault.lookup

function dnsConfig(overrides: Partial<ResolvedDnsConfig> = {}): ResolvedDnsConfig {
  return {
    mode: 'auto',
    scope: 'members',
    preset: 'custom',
    nodeTimeoutMs: 350,
    nodes: [{ host: '223.5.5.5', sni: 'dns.alidns.com', path: '/resolve', port: 443 }],
    probe: { enabled: false, timeoutMs: 350, cacheTtlS: 30 },
    cache: { posMinS: 30, posMaxS: 300, negS: 10 },
    poisonRanges: ['198.18.0.0/15'],
    ...overrides,
  }
}

/** A scripted system lookup backing the ORIGINAL path (both the canary and the delegated fallbacks). */
function scriptedSystem(table: Record<string, string[] | Error>) {
  const calls: string[] = []
  const systemLookup = (hostname: string, _options: unknown, callback: (err: Error | null, addresses?: { address: string; family: number }[]) => void) => {
    calls.push(hostname)
    const entry = table[hostname]
    if (entry instanceof Error) setImmediate(() => callback(entry))
    else setImmediate(() => callback(null, (entry ?? []).map((address) => ({ address, family: 4 }))))
    return
  }
  return { systemLookup, calls }
}

/** A fake resolver standing in for DohResolver; the scripted table decides per (name) outcomes. */
function scriptedResolver(table: Record<string, DohResolution | Error>) {
  const calls: string[] = []
  const resolve = async (name: string): Promise<DohResolution | null> => {
    calls.push(name)
    const entry = table[name]
    if (entry === undefined) return null
    if (entry instanceof Error) throw entry
    return entry
  }
  return { resolve, calls }
}

function outcome(ips: string[], family: 4 | 6 = 4): DohResolution {
  return { addresses: ips.map((address) => ({ address, family })), negative: false, via: '223.5.5.5', latencyMs: 12, droppedPoisoned: [] }
}

function makeDeps(overrides: Partial<DnsLayerDeps> = {}): DnsLayerDeps {
  const system = scriptedSystem({ 'api.tavily.com': ['104.18.1.1'], 'api.exa.ai': ['104.18.1.1'] })
  const resolver = scriptedResolver({ 'api.tavily.com': outcome(['5.5.5.5']) })
  return {
    config: () => dnsConfig(),
    scopeHosts: () => ['api.tavily.com'],
    env: {},
    systemLookup: system.systemLookup as unknown as typeof dnsDefault.lookup,
    canarySystemLookup: async (host) => {
      const entry = ({ 'api.tavily.com': ['104.18.1.1'] })[host] ?? ['104.18.1.1']
      return entry
    },
    makeResolver: () => resolver,
    bootstrap: async (pool: readonly ResolvedDohNode[]) => [...pool],
    ...overrides,
  } as DnsLayerDeps
}

function callLookup(layer: { lookup: typeof dnsDefault.lookup }, hostname: string, options: { all: boolean; family?: number }): Promise<unknown> {
  return new Promise((resolve, reject) => {
    layer.lookup(hostname, { ...options }, (err: Error | null, ...rest: unknown[]) => {
      if (err !== null) reject(err)
      else resolve(rest.length === 1 ? rest[0] : rest)
    })
  })
}

describe('S35 T6: intercept — decision lifecycle (ADR-0022 D4/D5/D10)', () => {
  it('regression 1 — clean environment: the canary skips and the patch uninstalls, dns.lookup returns to the original', async () => {
    const layer = installDnsLayer(makeDeps())
    expect(dnsDefault.lookup).not.toBe(ORIGINAL_LOOKUP)
    await callLookup(layer, 'api.tavily.com', { all: true })
    await layer.whenSettled()
    expect(layer.state().decision?.action).toBe('skip')
    // Zero-patch assertion (R2): after the skip decision the module exports are restored.
    expect(dnsDefault.lookup).toBe(ORIGINAL_LOOKUP)
    layer.dispose()
    expect(dnsDefault.lookup).toBe(ORIGINAL_LOOKUP)
  })

  it('regression 2 — poisoned environment: the canary enables and in-scope lookups answer from DoH', async () => {
    const system = scriptedSystem({ 'api.tavily.com': ['198.18.0.5'], 'api.exa.ai': new Error('ENOTFOUND') })
    const resolver = scriptedResolver({ 'api.tavily.com': outcome(['5.5.5.5']) })
    const layer = installDnsLayer(makeDeps({
      systemLookup: system.systemLookup as unknown as typeof dnsDefault.lookup,
      canarySystemLookup: async (host) => (host === 'api.tavily.com' ? ['198.18.0.5'] : ['104.0.0.1']),
      makeResolver: () => resolver,
    }))
    const first = await callLookup(layer, 'api.tavily.com', { all: true })
    // The first lookup predates the decision — it delegates to the system answer.
    expect(first).toEqual([{ address: '198.18.0.5', family: 4 }])
    await layer.whenSettled()
    expect(layer.state().decision?.verdict).toBe('poisoned')
    const second = await callLookup(layer, 'api.tavily.com', { all: true })
    expect(second).toEqual([{ address: '5.5.5.5', family: 4 }])
    expect(resolver.calls).toEqual(['api.tavily.com'])
    layer.dispose()
  })

  it('regression 3 — hot switch: mode off delegates to the system immediately, mode on re-arms', async () => {
    let mode: 'on' | 'off' = 'on'
    const resolver = scriptedResolver({ 'api.tavily.com': outcome(['5.5.5.5']) })
    const layer = installDnsLayer(makeDeps({
      config: () => dnsConfig({ mode }),
      makeResolver: () => resolver,
      canarySystemLookup: async () => ['104.0.0.1'],
    }))
    expect(await callLookup(layer, 'api.tavily.com', { all: true })).toEqual([{ address: '5.5.5.5', family: 4 }])
    mode = 'off'
    expect(await callLookup(layer, 'api.tavily.com', { all: true })).toEqual([{ address: '104.18.1.1', family: 4 }])
    mode = 'on'
    expect(await callLookup(layer, 'api.tavily.com', { all: true })).toEqual([{ address: '5.5.5.5', family: 4 }])
    layer.dispose()
  })

  it('regression 4 — HMR safety: dispose/reinstall cycles keep the patch single-layered', async () => {
    const resolver = scriptedResolver({ 'api.tavily.com': outcome(['5.5.5.5']) })
    const deps = makeDeps({
      config: () => dnsConfig({ mode: 'on' }),
      makeResolver: () => resolver,
      canarySystemLookup: async () => ['104.0.0.1'],
    })
    const first = installDnsLayer(deps)
    first.dispose()
    expect(dnsDefault.lookup).toBe(ORIGINAL_LOOKUP)
    const second = installDnsLayer(deps)
    expect(dnsDefault.lookup).not.toBe(ORIGINAL_LOOKUP)
    second.dispose()
    expect(dnsDefault.lookup).toBe(ORIGINAL_LOOKUP)
  })

  it('regression 5 — scope is read live: removing a host from the member set reverts it to the system path', async () => {
    let hosts = ['api.tavily.com', 'api.exa.ai']
    const resolver = scriptedResolver({ 'api.tavily.com': outcome(['5.5.5.5']), 'api.exa.ai': outcome(['6.6.6.6']) })
    const layer = installDnsLayer(makeDeps({
      config: () => dnsConfig({ mode: 'on' }),
      scopeHosts: () => hosts,
      makeResolver: () => resolver,
      canarySystemLookup: async () => ['104.0.0.1'],
    }))
    await layer.whenArmed()
    expect(await callLookup(layer, 'api.exa.ai', { all: true })).toEqual([{ address: '6.6.6.6', family: 4 }])
    hosts = ['api.tavily.com']
    expect(await callLookup(layer, 'api.exa.ai', { all: true })).toEqual([{ address: '104.18.1.1', family: 4 }])
    layer.dispose()
  })

  it('passes IP literals, legacy call shapes, and out-of-scope hosts straight to the system lookup without triggering detection', async () => {
    const system = scriptedSystem({ '8.8.8.8': ['8.8.8.8'], 'elsewhere.example': ['9.9.9.9'] })
    const layer = installDnsLayer(makeDeps({
      systemLookup: system.systemLookup as unknown as typeof dnsDefault.lookup,
    }))
    await callLookup(layer, '8.8.8.8', { all: true })
    await callLookup(layer, 'elsewhere.example', { all: true })
    await new Promise((resolve) => setImmediate(resolve))
    // No in-scope lookup ever happened, so the lazy canary never fired.
    expect(layer.state().decision).toBeNull()
    expect(layer.state().armed).toBe(false)
    layer.dispose()
  })

  it('suspends under a proxy environment and resumes for NO_PROXY-exempt hosts', async () => {
    const resolver = scriptedResolver({ 'api.tavily.com': outcome(['5.5.5.5']), 'api.exa.ai': outcome(['6.6.6.6']) })
    const layer = installDnsLayer(makeDeps({
      config: () => dnsConfig({ mode: 'on' }),
      scopeHosts: () => ['api.tavily.com', 'api.exa.ai'],
      env: { HTTPS_PROXY: 'http://p:8080', NO_PROXY: 'exa.ai' },
      makeResolver: () => resolver,
      canarySystemLookup: async () => ['104.0.0.1'],
    }))
    expect(await callLookup(layer, 'api.tavily.com', { all: true })).toEqual([{ address: '104.18.1.1', family: 4 }])
    expect(await callLookup(layer, 'api.exa.ai', { all: true })).toEqual([{ address: '6.6.6.6', family: 4 }])
    layer.dispose()
  })

  it('falls back to the system lookup exactly once when the DoH plane is dead, and surfaces negative answers as ENOTFOUND', async () => {
    const system = scriptedSystem({ 'api.tavily.com': ['104.18.1.1'] })
    const dead = scriptedResolver({})
    const negative = scriptedResolver({ 'api.tavily.com': { addresses: [], negative: true, via: '223.5.5.5', latencyMs: 9, droppedPoisoned: [] } })
    let table = dead
    const layer = installDnsLayer(makeDeps({
      config: () => dnsConfig({ mode: 'on' }),
      systemLookup: system.systemLookup as unknown as typeof dnsDefault.lookup,
      makeResolver: () => ({ resolve: (name: string) => table.resolve(name) }),
      canarySystemLookup: async () => ['104.0.0.1'],
    }))
    expect(await callLookup(layer, 'api.tavily.com', { all: true })).toEqual([{ address: '104.18.1.1', family: 4 }])
    expect(system.calls).toEqual(['api.tavily.com'])
    table = negative
    await expect(callLookup(layer, 'api.tavily.com', { all: true })).rejects.toMatchObject({ code: 'ENOTFOUND' })
    layer.dispose()
  })
})

describe('S35 T6: resolveForGuard — the fetch-gate SSRF seam (ADR-0022 D8)', () => {
  it('inactive layer answers from the system path; an armed layer answers from DoH; a negative answer throws ENOTFOUND', async () => {
    const system = scriptedSystem({ 'a.example': ['10.1.2.3'], 'b.example': ['5.5.5.5'] })
    const resolver = scriptedResolver({
      'b.example': { addresses: [{ address: '203.0.113.9', family: 4 }], negative: false, via: '223.5.5.5', latencyMs: 5, droppedPoisoned: [] },
      'gone.example': { addresses: [], negative: true, via: '223.5.5.5', latencyMs: 5, droppedPoisoned: [] },
    })
    const layer = installDnsLayer(makeDeps({
      config: () => dnsConfig({ mode: 'on' }),
      scopeHosts: () => ['b.example', 'gone.example'],
      systemLookup: system.systemLookup as unknown as typeof dnsDefault.lookup,
      makeResolver: () => resolver,
      canarySystemLookup: async () => ['104.0.0.1'],
    }))
    await expect(layer.resolveForGuard('a.example')).resolves.toEqual(['10.1.2.3'])
    await expect(layer.resolveForGuard('b.example')).resolves.toEqual(['203.0.113.9'])
    await expect(layer.resolveForGuard('gone.example')).rejects.toMatchObject({ code: 'ENOTFOUND' })
    layer.dispose()
  })
})

describe('S35 T6: end-to-end seam proof — the patched module answer drives a real global fetch (spike lock)', () => {
  it('an armed layer resolves the hostname to the loopback address and fetch completes against the local server', async () => {
    const server = createServer((req, res) => {
      res.writeHead(200, { 'content-type': 'text/plain' })
      res.end('spike-ok')
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const port = (server.address() as { port: number }).port
    const resolver = scriptedResolver({ 'doh-spike.test': outcome(['127.0.0.1']) })
    const layer = installDnsLayer(makeDeps({
      config: () => dnsConfig({ mode: 'on' }),
      scopeHosts: () => ['doh-spike.test'],
      makeResolver: () => resolver,
      canarySystemLookup: async () => ['104.0.0.1'],
    }))
    await layer.whenArmed()
    try {
      // Patch the real module exports (what the layer does at install): the
      // patched dns.lookup must be the one undici's fetch consults.
      const response = await fetch(`http://doh-spike.test:${port}/locked`)
      expect(response.status).toBe(200)
      expect(await response.text()).toBe('spike-ok')
    } finally {
      layer.dispose()
      server.close()
    }
    expect(dnsDefault.lookup).toBe(ORIGINAL_LOOKUP)
  })
})
