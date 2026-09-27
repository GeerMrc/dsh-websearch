import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import { DNS_ERROR_CODES } from '../../src/errors.ts'
import { DnsObservability, sanitizeHostFactory } from '../../src/dns/observability.ts'
import type { DnsLayerEvent } from '../../src/dns/intercept.ts'
import { DshWsDnsRemote } from '../../src/dns/remote.ts'
import type { CanaryOutcome } from '../../src/dns/detect.ts'

describe('S35 T7: host sanitization — the privacy red line (ADR-0022 D9, R7)', () => {
  const sanitize = sanitizeHostFactory((host) => host !== 'api.tavily.com')

  it('keeps non-sensitive hosts verbatim', () => {
    expect(sanitize('api.tavily.com')).toBe('api.tavily.com')
  })

  it('truncates sensitive hosts to a stable hash plus the last two labels — never the plaintext', () => {
    const first = sanitize('secret.example.net')
    const second = sanitize('secret.example.net')
    expect(first).toBe(second)
    expect(first).not.toContain('secret')
    expect(first.endsWith('example.net')).toBe(true)
    expect(first).toMatch(/^[0-9a-f]{4}…/)
  })

  it('degrades gracefully for single-label hosts', () => {
    const masked = sanitize('localhost')
    expect(masked).not.toBe('localhost')
    expect(masked.length).toBeGreaterThan(0)
  })
})

describe('S35 T7: DnsObservability — log lines, ring buffer, code mapping (ADR-0022 D11)', () => {
  function makeSink(sanitize = (host: string) => host) {
    const lines: string[] = []
    const sink = new DnsObservability({ log: (line) => void lines.push(line), ringLimit: 3 })
    const record = (event: DnsLayerEvent) => sink.record(event, sanitize)
    return { sink, lines, record }
  }

  it('renders a resolve line with the latency figure and the [dshws-dns] prefix', () => {
    const { lines, record } = makeSink()
    record({ kind: 'resolve', host: 'api.tavily.com', via: '223.5.5.5', latencyMs: 93, kept: 2, dropped: 1, probeDropped: ['54.243.194.162'] })
    expect(lines).toEqual(['[dshws-dns] resolve host=api.tavily.com via=223.5.5.5 kept=2 dropped=1 probeDrop=1 latencyMs=93'])
  })

  it('maps decision events onto the diagnostic codes: poisoned enable / clean skip / inconclusive', () => {
    const { lines, record } = makeSink()
    const poisoned: CanaryOutcome = { action: 'enable', verdict: 'poisoned', hits: [{ host: 'api.anysearch.com', addresses: ['198.18.0.23'] }], failures: [] }
    const clean: CanaryOutcome = { action: 'skip', verdict: 'clean', hits: [], failures: [] }
    const inconclusive: CanaryOutcome = { action: 'enable', verdict: 'inconclusive', hits: [], failures: [{ host: 'api.exa.ai', reason: 'ENOTFOUND' }] }
    record({ kind: 'decision', outcome: poisoned })
    record({ kind: 'decision', outcome: clean })
    record({ kind: 'decision', outcome: inconclusive })
    expect(lines[0]).toContain(DNS_ERROR_CODES.autoEnabled)
    expect(lines[0]).toContain('api.anysearch.com→198.18.0.23')
    expect(lines[1]).toContain(DNS_ERROR_CODES.autoSkipped)
    expect(lines[2]).toContain(DNS_ERROR_CODES.detectInconclusive)
  })

  it('renders the doh-dead fallback as the DOH_UNREACHABLE then FALLBACK_SYSTEM sequence (R4)', () => {
    const { sink, lines, record } = makeSink()
    record({ kind: 'fallback', host: 'api.tavily.com', reason: 'doh-dead' })
    expect(lines.map((line) => line.includes(DNS_ERROR_CODES.dohUnreachable) || line.includes(DNS_ERROR_CODES.fallbackSystem))).toEqual([true, true])
    const codes = sink.trace().map((entry) => entry.code)
    expect(codes).toEqual([DNS_ERROR_CODES.dohUnreachable, DNS_ERROR_CODES.fallbackSystem])
  })

  it('renders suspension with SUSPENDED_PROXY and sanitizes the host before any surface sees it', () => {
    const sanitize = sanitizeHostFactory(() => true)
    const { lines, sink, record } = makeSink(sanitize)
    record({ kind: 'suspend', host: 'api.secret.example' })
    expect(lines[0]).toContain(DNS_ERROR_CODES.suspendedProxy)
    expect(lines.join('\n')).not.toContain('api.secret.example')
    expect(sink.trace()[0]?.host).not.toBe('api.secret.example')
  })

  it('caps the ring at the configured limit, newest last', () => {
    const { sink, record } = makeSink()
    for (let i = 0; i < 5; i++) {
      record({ kind: 'resolve', host: `h${i}.example`, via: 'x', latencyMs: i, kept: 1, dropped: 0, probeDropped: [] })
    }
    expect(sink.trace().map((entry) => entry.host)).toEqual(['h2.example', 'h3.example', 'h4.example'])
  })
})

describe('S35 T7: DshWsDnsRemote — the three-method face (describeDnsStatus / readDnsTrace / requestDnsRecheck)', () => {
  function makeRemote(overrides: Partial<ConstructorParameters<typeof DshWsDnsRemote>[1]> = {}) {
    const trace = [{ at: 1, kind: 'resolve' as const, host: 'api.tavily.com', via: '223.5.5.5', latencyMs: 9, kept: 1, dropped: 0 }]
    const decision: CanaryOutcome = { action: 'enable', verdict: 'poisoned', hits: [{ host: 'api.anysearch.com', addresses: ['198.18.0.23'] }], failures: [] }
    const recheck = vi.fn(async () => decision)
    const remote = new DshWsDnsRemote(new Context(), {
      status: () => ({ armed: true, decision, proxyActive: false }),
      config: () => ({ mode: 'auto', scope: 'members', preset: 'auto' }),
      trace: () => trace,
      recheck,
      sanitize: (host: string) => host,
      ...overrides,
    })
    return { remote, recheck }
  }

  it('describeDnsStatus composes the config slice with the layer state and a sanitized decision', async () => {
    const { remote } = makeRemote({ sanitize: () => 'masked…example.com' })
    const status = await remote.describeDnsStatus()
    expect(status).toMatchObject({ mode: 'auto', scope: 'members', preset: 'auto', armed: true, proxyActive: false })
    expect(status.decision?.hits[0]?.host).toBe('masked…example.com')
  })

  it('readDnsTrace returns the sanitized ring entries', async () => {
    const { remote } = makeRemote()
    expect(await remote.readDnsTrace()).toHaveLength(1)
  })

  it('requestDnsRecheck forces the layer recheck and answers the refreshed status', async () => {
    const { remote, recheck } = makeRemote()
    const status = await remote.requestDnsRecheck()
    expect(recheck).toHaveBeenCalledTimes(1)
    expect(status.decision?.verdict).toBe('poisoned')
  })
})
