'use strict'
/** S35 T10 latency leg: cold first-lookup wall time per fresh layer (DoH budget 350ms/node). */
import { installDnsLayer } from '/Volumes/IPFSJK/Zcode/dsh-websearch/src/dns/intercept.ts'
import { DEFAULT_DNS_POISON_RANGES } from '/Volumes/IPFSJK/Zcode/dsh-websearch/src/config.ts'

const config = {
  mode: 'on',
  scope: 'members',
  preset: 'auto',
  nodeTimeoutMs: 350,
  nodes: [],
  probe: { enabled: true, timeoutMs: 350, cacheTtlS: 30 },
  cache: { posMinS: 30, posMaxS: 300, negS: 10 },
  poisonRanges: [...DEFAULT_DNS_POISON_RANGES],
}

const samples = []
for (let round = 0; round < 5; round++) {
  const layer = installDnsLayer({ config: () => config, scopeHosts: () => ['api.tavily.com'] })
  await new Promise((resolve) => layer.lookup('api.tavily.com', { all: true }, () => resolve(undefined)))
  await layer.whenArmed()
  const startedAt = Date.now()
  await new Promise((resolve) => layer.lookup('api.tavily.com', { all: true }, () => resolve(undefined)))
  samples.push(Date.now() - startedAt)
  layer.dispose()
}
const sorted = [...samples].sort((a, b) => a - b)
console.log('[t10-latency] cold-lookup samples (ms):', JSON.stringify(samples), 'max:', sorted.at(-1))
console.log('[t10-latency] DONE max<=350:', sorted.at(-1) <= 350)
