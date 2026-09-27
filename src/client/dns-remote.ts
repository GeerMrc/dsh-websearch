/**
 * Client-side mounting of the plugin-owned `dshws-websearch` Remote
 * namespace's DNS face (host half: `src/dns/remote.ts`, S35 T7). Mirrors the
 * key-count contribution's cross-generation strict-codec pattern (S32
 * ADR-0021 family): 0.1.5/0.1.6 clients parse through `schema`, 0.1.7 loaders
 * call `create()` — both fields coexist so one bundle serves every host in
 * the peer range. Hosts without the service mount fine; every call answers
 * `ok: false` and the settings block degrades to the config-only view.
 *
 * @module dsh-websearch/client/dns-remote
 */
import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { z } from 'zod'

/** The sanitized decision view crossing the wire (hosts pre-sanitized host-side). */
export interface DnsDecisionView {
  action: 'enable' | 'skip'
  verdict: 'poisoned' | 'clean' | 'inconclusive' | 'empty'
  hits: { host: string; addresses: string[] }[]
  failures: { host: string; reason: string }[]
}

/** The composed status face for the settings block. */
export interface DnsStatusView {
  mode: 'auto' | 'on' | 'off'
  scope: 'members' | 'all'
  preset: 'auto' | 'cn' | 'global' | 'custom'
  armed: boolean
  proxyActive: boolean
  decision: DnsDecisionView | null
}

/** One sanitized ring entry (same shape the host observability produces). */
export interface DnsTraceEntryView {
  at: number
  kind: 'resolve' | 'decision' | 'fallback' | 'suspend'
  host: string
  via?: string
  latencyMs?: number
  kept?: number
  dropped?: number
  code?: string
  detail?: string
}

/** The mounted namespace face the controller consumes. */
export interface DnsNamespace {
  describeDnsStatus(): Promise<RemoteResult<DnsStatusView>>
  readDnsTrace(): Promise<RemoteResult<DnsTraceEntryView[]>>
  requestDnsRecheck(): Promise<RemoteResult<DnsStatusView>>
}

const verdictSchema = z.enum(['poisoned', 'clean', 'inconclusive', 'empty'])
const decisionSchema = z.object({
  action: z.enum(['enable', 'skip']),
  verdict: verdictSchema,
  hits: z.array(z.object({ host: z.string(), addresses: z.array(z.string()) })),
  failures: z.array(z.object({ host: z.string(), reason: z.string() })),
})
const statusSchema = z.object({
  mode: z.enum(['auto', 'on', 'off']),
  scope: z.enum(['members', 'all']),
  preset: z.enum(['auto', 'cn', 'global', 'custom']),
  armed: z.boolean(),
  proxyActive: z.boolean(),
  decision: decisionSchema.nullable(),
})
const traceSchema = z.array(z.object({
  at: z.number(),
  kind: z.enum(['resolve', 'decision', 'fallback', 'suspend']),
  host: z.string(),
  via: z.string().optional(),
  latencyMs: z.number().optional(),
  kept: z.number().optional(),
  dropped: z.number().optional(),
  code: z.string().optional(),
  detail: z.string().optional(),
}))

/** Cross-generation strict codecs (schema + create coexist, one bundle per ADR-0021). */
const statusCodec = { mode: 'strict' as const, typeSymbol: 'dsh-websearch#dshws-websearch/dns-status', schema: statusSchema, create: () => statusSchema }
const traceCodec = { mode: 'strict' as const, typeSymbol: 'dsh-websearch#dshws-websearch/dns-trace', schema: traceSchema, create: () => traceSchema }
const recheckResultCodec = { mode: 'strict' as const, typeSymbol: 'dsh-websearch#dshws-websearch/dns-recheck', schema: statusSchema, create: () => statusSchema }

/** The client contribution (exported for cross-generation shape tests). */
export const dnsContribution: TypertRemoteContribution = {
  package: 'dsh-websearch',
  descriptors: [
    {
      id: 'dsh-websearch#dshws-websearch/describeDnsStatus',
      service: 'dshwsDns',
      namespace: 'dshws-websearch',
      method: 'describeDnsStatus',
      invocation: { kind: 'direct' },
      parameters: [],
      result: statusCodec,
    },
    {
      id: 'dsh-websearch#dshws-websearch/readDnsTrace',
      service: 'dshwsDns',
      namespace: 'dshws-websearch',
      method: 'readDnsTrace',
      invocation: { kind: 'direct' },
      parameters: [],
      result: traceCodec,
    },
    {
      id: 'dsh-websearch#dshws-websearch/requestDnsRecheck',
      service: 'dshwsDns',
      namespace: 'dshws-websearch',
      method: 'requestDnsRecheck',
      invocation: { kind: 'direct' },
      // The host method takes no parameters — the descriptor's list mirrors
      // that parameter list exactly (wire-pair discipline, key-counts note).
      parameters: [],
      result: recheckResultCodec,
    },
  ],
}

/**
 * The DNS descriptors ride the SAME single mount as the key-count face
 * (key-counts-remote mounts the combined contribution): a second lazy $mount
 * of the already-mounted dshws-websearch namespace hung forever in the 3423
 * retest. mountContribution is designed for one grouped install, and the
 * plugin now performs exactly one.
 */
