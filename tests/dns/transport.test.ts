import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { buildRequestOptions, DOH_JSON_ACCEPT, dohQuery, extractDohRecords } from '../../src/dns/transport.ts'
import type { DohResponseEnvelope, NodeHttpsSend, ResolvedDohNode } from '../../src/dns/transport.ts'

const ALIDNS: ResolvedDohNode = { host: '223.5.5.5', sni: 'dns.alidns.com', path: '/resolve', port: 443 }

async function fixture(name: string): Promise<DohResponseEnvelope> {
  return JSON.parse(await readFile(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')) as DohResponseEnvelope
}

describe('S35 T2: extractDohRecords — golden contract on live-sampled and doc-locked DoH JSON (ADR-0022 D1/D6)', () => {
  it('extracts the tavily three-IP CDN rotation (live AliDNS sample; TTL 60, family 4, no CNAME)', async () => {
    const records = extractDohRecords(await fixture('alidns-tavily.json'), 1)
    expect(records.cnameChain).toEqual([])
    expect(records.addresses.map((entry) => entry.address).sort()).toEqual(['184.194.134.183', '54.243.194.162', '98.87.123.185'])
    expect(records.addresses.every((entry) => entry.family === 4 && entry.ttl === 60)).toBe(true)
  })

  it('follows the anysearch CNAME→GTM chain (live sample: type-5 row then the A row on the target name)', async () => {
    const records = extractDohRecords(await fixture('alidns-anysearch.json'), 1)
    expect(records.cnameChain).toEqual(['cn.gtm.anysearch.com.'])
    expect(records.addresses).toEqual([{ address: '179.255.102.224', family: 4, ttl: 1 }])
  })

  it('parses the DNSPod array-Question shape identically to the AliDNS object shape (live sample)', async () => {
    const records = extractDohRecords(await fixture('dnspod-firecrawl.json'), 1)
    expect(records.addresses).toEqual([{ address: '35.245.250.27', family: 4, ttl: 300 }])
    const tavily = extractDohRecords(await fixture('dnspod-tavily.json'), 1)
    expect(tavily.addresses).toHaveLength(3)
  })

  it('locks the doc-locked shapes for the endpoints blocked on this network (Cloudflare/Google/Quad9, provenance in fixtures/README.md)', async () => {
    expect(extractDohRecords(await fixture('cloudflare-doc.json'), 1).addresses).toHaveLength(2)
    expect(extractDohRecords(await fixture('google-doc.json'), 1).addresses).toHaveLength(3)
    expect(extractDohRecords(await fixture('quad9-doc.json'), 1).addresses).toEqual([{ address: '35.245.250.27', family: 4, ttl: 300 }])
  })

  it('maps AAAA rows to family 6', () => {
    const envelope: DohResponseEnvelope = {
      Status: 0,
      Answer: [
        { name: 'dual.example.', TTL: 120, type: 28, data: '2606:4700:4700::1111' },
        { name: 'dual.example.', TTL: 120, type: 1, data: '1.1.1.1' },
      ],
    }
    const v6 = extractDohRecords(envelope, 28)
    expect(v6.addresses).toEqual([{ address: '2606:4700:4700::1111', family: 6, ttl: 120 }])
    const v4 = extractDohRecords(envelope, 1)
    expect(v4.addresses).toEqual([{ address: '1.1.1.1', family: 4, ttl: 120 }])
  })

  it('returns empty addresses for a non-NOERROR envelope (NXDOMAIN respect is the resolver layer\u2019s call)', async () => {
    const records = extractDohRecords(await fixture('alidns-nxdomain.json'), 1)
    expect(records.addresses).toEqual([])
  })
})

describe('S35 T2: dohQuery — request build, error classification (ADR-0022 D1)', () => {
  it('queries the node path with the encoded name and type through the injectable send', async () => {
    const seen: Array<{ node: ResolvedDohNode; path: string; timeoutMs: number }> = []
    const send: NodeHttpsSend = async (node, path, timeoutMs) => {
      seen.push({ node, path, timeoutMs })
      return { status: 200, body: JSON.stringify({ Status: 0, Answer: [{ name: 'x.example.', TTL: 60, type: 1, data: '1.2.3.4' }] }) }
    }
    const envelope = await dohQuery(ALIDNS, { name: 'api.tavily.com', type: 1 }, 350, send)
    expect(envelope.Status).toBe(0)
    expect(seen).toEqual([{ node: ALIDNS, path: '/resolve?name=api.tavily.com&type=1', timeoutMs: 350 }])
  })

  it('encodes the query name into the path (captured form)', async () => {
    const paths: string[] = []
    const send: NodeHttpsSend = async (_node, path) => {
      paths.push(path)
      return { status: 200, body: JSON.stringify({ Status: 0 }) }
    }
    await dohQuery(ALIDNS, { name: 'odd name.example', type: 28 }, 350, send)
    expect(paths).toEqual([`/resolve?name=${encodeURIComponent('odd name.example')}&type=28`])
  })

  it('classifies non-200 as http and malformed bodies as parse', async () => {
    const http: NodeHttpsSend = async () => ({ status: 500, body: 'oops' })
    await expect(dohQuery(ALIDNS, { name: 'x.example', type: 1 }, 350, http)).rejects.toMatchObject({ kind: 'http' })
    const garbage: NodeHttpsSend = async () => ({ status: 200, body: '<html>' })
    await expect(dohQuery(ALIDNS, { name: 'x.example', type: 1 }, 350, garbage)).rejects.toMatchObject({ kind: 'parse' })
  })

  it('propagates pre-classified transport errors unchanged (timeout/network come from the send layer)', async () => {
    const send: NodeHttpsSend = async () => {
      throw Object.assign(new Error('node down'), { kind: 'network' })
    }
    await expect(dohQuery(ALIDNS, { name: 'x.example', type: 1 }, 350, send)).rejects.toMatchObject({ kind: 'network' })
  })
})

describe('S35 T2: buildRequestOptions — SNI/Host separation (ADR-0022 D1)', () => {
  it('connects to the node host while SNI and the HTTP Host header carry the TLS name', () => {
    const options = buildRequestOptions(ALIDNS, '/resolve?name=x&type=1')
    expect(options.host).toBe('223.5.5.5')
    expect(options.port).toBe(443)
    expect(options.servername).toBe('dns.alidns.com')
    expect(options.headers?.host).toBe('dns.alidns.com')
    expect(options.headers?.accept).toBe(DOH_JSON_ACCEPT)
    expect(options.method).toBe('GET')
  })

  it('honors the Quad9 non-standard port (documented :5053 JSON face)', () => {
    const quad9: ResolvedDohNode = { host: '9.9.9.9', sni: 'dns.quad9.net', path: '/dns-query', port: 5053 }
    const options = buildRequestOptions(quad9, '/dns-query?name=x&type=1')
    expect(options.port).toBe(5053)
    expect(options.host).toBe('9.9.9.9')
    expect(options.servername).toBe('dns.quad9.net')
    expect(options.headers?.host).toBe('dns.quad9.net')
  })
})
