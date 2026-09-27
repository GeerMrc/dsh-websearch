/**
 * DNS Remote: the `dshws-websearch` Typert Remote namespace extension backing
 * the settings page's DNS resilience block and the Inspect trace (S35 T7,
 * ADR-0022). Three methods — `describeDnsStatus` (config slice + layer state
 * + sanitized decision), `readDnsTrace` (the sanitized ring), and
 * `requestDnsRecheck` (the UI re-check button). Hosts are sanitized by the
 * port BEFORE crossing this seam; the raw canary evidence never leaves the
 * host process in plaintext for sensitive hosts.
 *
 * @module dsh-websearch/dns/remote
 */
import type { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type { CanaryOutcome } from './detect.ts'
import type { DnsTraceEntry } from './observability.ts'
import type { DnsMode, DnsPreset, DnsScope } from '../config.ts'

/** The wire namespace this Remote joins (same namespace as the key-count face). */
export const DNS_REMOTE_NAMESPACE = 'dshws-websearch'

/** Constructor ports; all layer access goes through them. */
export interface DnsRemotePorts {
  /** Live layer state (armed / cached decision / proxy presence). */
  readonly status: () => { armed: boolean; decision: CanaryOutcome | null; proxyActive: boolean }
  /** Live dns config slice crossing the wire. */
  readonly config: () => { mode: DnsMode; scope: DnsScope; preset: DnsPreset }
  /** The sanitized ring, oldest first. */
  readonly trace: () => readonly DnsTraceEntry[]
  /** Force a fresh canary pass (the re-check button). */
  readonly recheck: () => Promise<CanaryOutcome>
  /** The host sanitizer applied to decision evidence before it crosses. */
  readonly sanitize: (host: string) => string
}

/** The sanitized decision form crossing the wire. */
export interface DnsDecisionView {
  readonly action: 'enable' | 'skip'
  readonly verdict: CanaryOutcome['verdict']
  readonly hits: readonly { host: string; addresses: readonly string[] }[]
  readonly failures: readonly { host: string; reason: string }[]
}

/** The composed status face for the settings block. */
export interface DnsStatusSnapshot {
  readonly mode: DnsMode
  readonly scope: DnsScope
  readonly preset: DnsPreset
  readonly armed: boolean
  readonly proxyActive: boolean
  readonly decision: DnsDecisionView | null
}

/**
 * Host service for the DNS resilience UI. The gateway invokes Remote methods
 * with the context's traceable proxy as the receiver, so method bodies read
 * only public members — no `#private` state.
 */
export class DshWsDnsRemote extends TypertRemoteService {
  readonly ports: DnsRemotePorts

  /** @param ctx - owning Cordis Context (the plugin's fiber owns disposal). */
  constructor(ctx: Context, ports: DnsRemotePorts) {
    super(ctx, 'dshwsDns', { namespace: DNS_REMOTE_NAMESPACE })
    this.ports = ports
    for (const initializer of dnsRemoteInitializers) initializer.call(this)
  }

  /** Compose the current status for the settings block. */
  async describeDnsStatus(): Promise<DnsStatusSnapshot> {
    return this.#snapshot()
  }

  /** The sanitized trace ring, oldest first. */
  async readDnsTrace(): Promise<readonly DnsTraceEntry[]> {
    return this.ports.trace()
  }

  /** Force a fresh canary pass and answer the refreshed status. */
  async requestDnsRecheck(): Promise<DnsStatusSnapshot> {
    await this.ports.recheck()
    return this.#snapshot()
  }

  #snapshot(): DnsStatusSnapshot {
    const state = this.ports.status()
    const decision: DnsDecisionView | null = state.decision === null ? null : {
      action: state.decision.action,
      verdict: state.decision.verdict,
      hits: state.decision.hits.map((hit) => ({ host: this.ports.sanitize(hit.host), addresses: hit.addresses })),
      failures: state.decision.failures.map((failure) => ({ host: this.ports.sanitize(failure.host), reason: failure.reason })),
    }
    return { ...this.ports.config(), armed: state.armed, proxyActive: state.proxyActive, decision }
  }
}

/** Constructor-phase initializers captured by the runtime `Remote` marking below (rolldown keeps stage-3 decorators out). */
const dnsRemoteInitializers: Array<(this: DshWsDnsRemote) => void> = []

for (const method of ['describeDnsStatus', 'readDnsTrace', 'requestDnsRecheck'] as const) {
  Remote(
    Object.getOwnPropertyDescriptor(DshWsDnsRemote.prototype, method)!.value,
    {
      kind: 'method',
      name: method,
      static: false,
      private: false,
      access: {
        has: (target: DshWsDnsRemote) => target[method] !== undefined,
        get: (target: DshWsDnsRemote) => target[method] as () => Promise<DnsStatusSnapshot>,
      },
      addInitializer: (initializer: (this: DshWsDnsRemote) => void) => {
        dnsRemoteInitializers.push(initializer)
      },
      metadata: {},
    },
  )
}
