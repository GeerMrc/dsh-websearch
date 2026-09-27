'use strict'
/**
 * S35 T10 live acceptance — real-network measured baselines (R3/R4), run on
 * THIS machine's side-router network. Uses the plugin's real modules (not
 * mocks): the real transport, the real canary against the live system
 * resolver, the real TCP-443 precheck. Prints the measured table.
 */
import { connect } from 'node:net'
import { installDnsLayer } from '/Volumes/IPFSJK/Zcode/dsh-websearch/src/dns/intercept.ts'
import { DEFAULT_DNS_POISON_RANGES } from '/Volumes/IPFSJK/Zcode/dsh-websearch/src/config.ts'

const MEMBER_HOSTS = ['api.tavily.com', 'api.exa.ai', 'api.firecrawl.dev', 'api.anysearch.com']

function tcpOk(ip, port = 443, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const sock = connect({ host: ip, port })
    let done = false
    const finish = (ok) => { if (!done) { done = true; sock.destroy(); resolve(ok) } }
    sock.setTimeout(timeoutMs, () => finish(false))
    sock.once('connect', () => finish(true))
    sock.once('error', () => finish(false))
  })
}

const config = (overrides = {}) => ({
  mode: 'auto',
  scope: 'members',
  preset: 'auto',
  nodeTimeoutMs: 350,
  nodes: [],
  probe: { enabled: true, timeoutMs: 350, cacheTtlS: 30 },
  cache: { posMinS: 30, posMaxS: 300, negS: 10 },
  poisonRanges: [...DEFAULT_DNS_POISON_RANGES],
  ...overrides,
})

const events = []
const layer = installDnsLayer({
  config: () => config(),
  scopeHosts: () => MEMBER_HOSTS,
  onEvent: (event) => events.push(event),
})

// 1. Trigger the lazy canary with one real in-scope lookup (goes to system).
const first = await new Promise((resolve, reject) => {
  layer.lookup('api.tavily.com', { all: true }, (err, addresses) => err ? reject(err) : resolve(addresses))
})
console.log('[t10] first lookup (pre-decision, system path):', JSON.stringify(first))
await layer.whenSettled()
const decision = layer.state().decision
console.log('[t10] canary decision:', JSON.stringify(decision))
console.log('[t10] armed:', layer.state().armed)

// 2. R3 baselines: 10 rounds of resolve+probe reachability per member host.
const rounds = {}
for (const host of MEMBER_HOSTS) {
  let ok = 0
  const latencies = []
  for (let i = 0; i < 10; i++) {
    const answer = await new Promise((resolve, reject) => {
      layer.lookup(host, { all: true }, (err, addresses) => err ? reject(err) : resolve(addresses))
    })
    const ip = answer?.[0]?.address
    if (typeof ip === 'string' && await tcpOk(ip)) ok++
    latencies.push(answer?.length ?? 0)
  }
  rounds[host] = { okOf10: ok }
  console.log(`[t10] R3 ${host}: ${ok}/10 TCP-443 reachable through the layer`)
}

// 3. Guard seam: fetch-gate view of a member host (real DoH when armed).
const guard = await layer.resolveForGuard('api.tavily.com')
console.log('[t10] resolveForGuard(api.tavily.com):', JSON.stringify(guard))

// 4. R4 chaos: switch to a dead DoH plane (custom nodes pointing at a dead
// port), one fresh host, assert the fallback-to-system path and codes.
let cfg = config()
const chaos = installDnsLayer({
  config: () => cfg,
  scopeHosts: () => MEMBER_HOSTS,
  onEvent: (event) => events.push(event),
})
await chaos.whenArmed().catch(() => {})
cfg = config({ mode: 'on', preset: 'custom', nodes: [{ host: '127.0.0.1', sni: 'dead.invalid', path: '/resolve', port: 9 }], nodeTimeoutMs: 120 })
const chaosAnswer = await new Promise((resolve) => {
  chaos.lookup('api.exa.ai', { all: true }, (err, addresses) => err ? resolve({ err: err.code ?? err.message }) : resolve(addresses))
})
console.log('[t10] R4 chaos (dead DoH plane) answer for api.exa.ai:', JSON.stringify(chaosAnswer))
const codes = events.filter((event) => event.kind === 'fallback').map((event) => `${event.reason}:${event.host}`)
console.log('[t10] R4 fallback events:', JSON.stringify(codes.slice(0, 8)))

// 5. R4 proxy suspension: arm again then set the env.
cfg = config({ mode: 'on' })
process.env.HTTPS_PROXY = 'http://127.0.0.1:1'
const suspended = await new Promise((resolve) => {
  chaos.lookup('api.tavily.com', { all: true }, (err, addresses) => err ? resolve({ err: err.code }) : resolve(addresses))
})
console.log('[t10] R4 proxy-suspended lookup still answers (system path):', JSON.stringify(suspended))
delete process.env.HTTPS_PROXY

layer.dispose()
chaos.dispose()
console.log('[t10] DONE')
