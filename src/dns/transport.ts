/**
 * DoH JSON transport (ADR-0022 D1/D6): one DNS question against one node over
 * HTTPS, with SNI and the connect target separated — the connect goes to the
 * node host (an IP literal, so the resolver never needs itself to resolve),
 * while `servername` and the HTTP `Host` header carry the TLS name. The accept
 * header is the fixed `application/dns-json` constant (harmless for the
 * path-style JSON endpoints AliDNS/Google expose).
 *
 * @module dsh-websearch/dns/transport
 */
import { request } from 'node:https'
import type { DohNode } from '../config.ts'

/**
 * The fixed JSON-DoH accept header every vendor's JSON face honors (Quad9's
 * documented form even works without it); path-style endpoints ignore it.
 */
export const DOH_JSON_ACCEPT = 'application/dns-json'

/** DoH JSON record-type numbering for the families the resolver asks for: A = 1, AAAA = 28. */
export type DohRecordType = 1 | 28

/** One DNS question. */
export interface DohQuery {
  readonly name: string
  readonly type: DohRecordType
}

/** One answer row as the Google-style DoH JSON APIs return it. */
export interface DohAnswerRow {
  readonly name: string
  readonly type: number
  readonly TTL?: number
  readonly data: string
}

/**
 * The envelope subset the resolver consumes. `Status` uses DoH numbering
 * (0 = NOERROR, 3 = NXDOMAIN); `Question` is an object at AliDNS/Google and an
 * ARRAY at DNSPod — both are accepted because only `Status`/`Answer` are read.
 */
export interface DohResponseEnvelope {
  readonly Status: number
  readonly Answer?: readonly DohAnswerRow[]
}

/** A complete endpoint: pool construction fills every optional {@link DohNode} field. */
export type ResolvedDohNode = Required<DohNode>

/** Failure classification the resolver's cooldown logic consumes. */
export type DohTransportErrorKind = 'timeout' | 'network' | 'http' | 'parse'

/** A classified transport failure; `kind` drives node cooldown and fallback. */
export class DohTransportError extends Error {
  readonly kind: DohTransportErrorKind

  constructor(kind: DohTransportErrorKind, message: string) {
    super(message)
    this.name = 'DohTransportError'
    this.kind = kind
  }
}

/** Extracted records: address rows for the requested family plus the CNAME chain traversed. */
export interface DohRecords {
  readonly addresses: readonly { readonly address: string; readonly family: 4 | 6; readonly ttl: number }[]
  readonly cnameChain: readonly string[]
}

/**
 * Pull the requested family's address rows out of a NOERROR envelope, keeping
 * the CNAME chain traversed on the way (the anysearch GTM shape). Non-NOERROR
 * envelopes yield empty records — NXDOMAIN respect is the resolver layer's
 * decision, not the extractor's.
 * @param envelope - the parsed DoH JSON body.
 * @param type - the requested family (1 = A, 28 = AAAA).
 * @returns the address rows and CNAME chain for that family.
 */
export function extractDohRecords(envelope: DohResponseEnvelope, type: DohRecordType): DohRecords {
  if (envelope.Status !== 0) return { addresses: [], cnameChain: [] }
  const family: 4 | 6 = type === 28 ? 6 : 4
  const cnameChain: string[] = []
  const addresses: { address: string; family: 4 | 6; ttl: number }[] = []
  for (const row of envelope.Answer ?? []) {
    if (row.type === 5) {
      cnameChain.push(row.data)
      continue
    }
    if (row.type === type) {
      addresses.push({ address: row.data, family, ttl: Math.max(1, Math.floor(row.TTL ?? 60)) })
    }
  }
  return { addresses, cnameChain }
}

/**
 * Build the https.request options for one query: connect to the node host,
 * SNI and HTTP Host both to the TLS name — the separation that reaches real
 * resolvers through (SNI, IP)-filtered egress paths.
 * @param node - the complete endpoint.
 * @param path - the query path with encoded name and type.
 * @returns the request options for node:https.
 */
export function buildRequestOptions(node: ResolvedDohNode, path: string): {
  host: string
  port: number
  servername: string
  method: 'GET'
  path: string
  headers: { host: string; accept: string }
} {
  return {
    host: node.host,
    port: node.port,
    servername: node.sni,
    method: 'GET',
    path,
    headers: { host: node.sni, accept: DOH_JSON_ACCEPT },
  }
}

/**
 * The production send: one https GET against the node with the timeout
 * enforced on the socket. Network and timeout failures leave as classified
 * {@link DohTransportError}s; HTTP status and body pass through for
 * {@link dohQuery} to classify.
 * @param node - the complete endpoint.
 * @param path - the query path.
 * @param timeoutMs - the per-node budget.
 * @returns the HTTP status and body.
 */
export async function httpsSend(node: ResolvedDohNode, path: string, timeoutMs: number): Promise<{ status: number; body: string }> {
  return await new Promise((resolve, reject) => {
    const req = request(buildRequestOptions(node, path), (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8') }))
      res.on('error', (err: Error) => reject(new DohTransportError('network', `doh response stream failed: ${err.message}`)))
    })
    req.setTimeout(timeoutMs, () => {
      req.destroy(new DohTransportError('timeout', `doh node ${node.host} timed out after ${timeoutMs}ms`))
    })
    req.on('error', (err: Error) => {
      reject(err instanceof DohTransportError ? err : new DohTransportError('network', `doh node ${node.host} unreachable: ${err.message}`))
    })
    req.end()
  })
}

/** Injectable send so unit tests never touch the network. */
export type NodeHttpsSend = typeof httpsSend

/**
 * Run one query against one node and parse the JSON envelope. Non-200 bodies
 * classify as `http`, malformed bodies as `parse`; errors the send layer
 * already classified (timeout/network) propagate unchanged.
 * @param node - the complete endpoint.
 * @param query - the DNS question.
 * @param timeoutMs - the per-node budget handed to the send layer.
 * @param send - the transport function; the production https send by default.
 * @returns the parsed envelope (Status/Answer subset).
 */
export async function dohQuery(node: ResolvedDohNode, query: DohQuery, timeoutMs: number, send: NodeHttpsSend = httpsSend): Promise<DohResponseEnvelope> {
  const path = `${node.path}?name=${encodeURIComponent(query.name)}&type=${query.type}`
  const { status, body } = await send(node, path, timeoutMs)
  if (status !== 200) {
    throw new DohTransportError('http', `doh node ${node.host} answered HTTP ${status}`)
  }
  try {
    return JSON.parse(body) as DohResponseEnvelope
  } catch (err) {
    throw new DohTransportError('parse', `doh node ${node.host} returned a malformed JSON body: ${(err as Error).message}`)
  }
}
