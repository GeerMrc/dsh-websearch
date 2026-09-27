'use strict'
/** S35 T10 chaos leg, corrected: arm the DEAD plane before measuring. */
import { installDnsLayer } from '/Volumes/IPFSJK/Zcode/dsh-websearch/src/dns/intercept.ts'
import { DEFAULT_DNS_POISON_RANGES } from '/Volumes/IPFSJK/Zcode/dsh-websearch/src/config.ts'

const base = {
  mode: 'on',
  scope: 'members',
  preset: 'custom',
  nodeTimeoutMs: 120,
  nodes: [{ host: '127.0.0.1', sni: 'dead.invalid', path: '/resolve', port: 9 }],
  probe: { enabled: true, timeoutMs: 350, cacheTtlS: 30 },
  cache: { posMinS: 30, posMaxS: 300, negS: 10 },
  poisonRanges: [...DEFAULT_DNS_POISON_RANGES],
}

const events = []
const layer = installDnsLayer({
  config: () => base,
  scopeHosts: () => ['api.exa.ai'],
  onEvent: (event) => events.push(event),
})
// Kick + await the arming pass (custom nodes are dead — arming still completes).
await new Promise((resolve) => layer.lookup('api.exa.ai', { all: true }, () => resolve(undefined)))
await layer.whenArmed()
console.log('[t10-chaos] armed:', layer.state().armed)
const answer = await new Promise((resolve) => {
  layer.lookup('api.exa.ai', { all: true }, (err, addresses) => err ? resolve({ err: err.code ?? err.message }) : resolve(addresses))
})
console.log('[t10-chaos] dead-plane lookup answer (system fallback, never-worse):', JSON.stringify(answer))
const fallbacks = events.filter((event) => event.kind === 'fallback')
console.log('[t10-chaos] fallback events:', JSON.stringify(fallbacks))
layer.dispose()
console.log('[t10-chaos] DONE')
