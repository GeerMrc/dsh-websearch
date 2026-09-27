/**
 * Egress reachability precheck (ADR-0022 D3): a bare TCP handshake per
 * candidate address — no TLS, no SNI, no HTTP — so the service's application
 * layer never sees it (zero quota consumption, zero risk-control signal, zero
 * interaction with the multi-key pools). Verdicts cache per IP for cacheTtlS;
 * an all-failed probe keeps the original list (the precheck must never become
 * the outage itself).
 *
 * @module dsh-websearch/dns/probe
 */
import { connect as netConnect } from 'node:net'

/** Injectable handshake so unit tests never open sockets. */
export type TcpConnect = (ip: string, port: number, timeoutMs: number) => Promise<boolean>

/** Constructor inputs; every seam is injectable for the table-driven tests. */
export interface EgressProbeOptions {
  /** Destination port for the handshake (443 — the (SNI, IP)-filtered egress path). */
  readonly port: number
  /** Total per-probe budget. */
  readonly timeoutMs: number
  readonly cacheTtlS: number
  readonly connect?: TcpConnect
  readonly clock?: () => number
}

/** One filter pass: what survived, what the probe dropped, and whether any live handshake ran. */
export interface ProbeOutcome {
  readonly kept: readonly string[]
  readonly dropped: readonly string[]
  readonly cached: boolean
}

/**
 * The production handshake: TCP connect with the budget enforced on the
 * socket, destroyed the moment the verdict is known.
 * @param ip - the candidate address.
 * @param port - the destination port.
 * @param timeoutMs - the handshake budget.
 * @returns whether the TCP three-way handshake completed.
 */
export async function tcpConnect(ip: string, port: number, timeoutMs: number): Promise<boolean> {
  return await new Promise((resolve) => {
    const socket = netConnect({ host: ip, port })
    let settled = false
    const finish = (ok: boolean): void => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(ok)
    }
    socket.setTimeout(timeoutMs, () => finish(false))
    socket.once('connect', () => finish(true))
    socket.once('error', () => finish(false))
  })
}

/** The egress precheck; one instance owns the per-IP verdict cache. */
export class EgressProbe {
  readonly #port: number
  readonly #timeoutMs: number
  readonly #cacheTtlMs: number
  readonly #connect: TcpConnect
  readonly #clock: () => number
  readonly #verdicts = new Map<string, { ok: boolean; expiresAt: number }>()

  constructor(options: EgressProbeOptions) {
    this.#port = options.port
    this.#timeoutMs = options.timeoutMs
    this.#cacheTtlMs = options.cacheTtlS * 1000
    this.#connect = options.connect ?? tcpConnect
    this.#clock = options.clock ?? Date.now
  }

  /**
   * Filter one address list down to the egress-reachable entries. Every
   * uncached address is probed in parallel; a verdict cache hit skips the
   * handshake entirely. When nothing survives, the original list returns
   * intact (宁多勿无) with the drops recorded for diagnostics.
   * @param addresses - the candidate addresses for one resolution.
   * @returns the kept/dropped split and whether any live handshake ran.
   */
  async filterReachable(addresses: readonly string[]): Promise<ProbeOutcome> {
    if (addresses.length === 0) return { kept: [], dropped: [], cached: true }
    const now = this.#clock()
    const live: string[] = []
    const outcomes = await Promise.all(addresses.map(async (address) => {
      const hit = this.#verdicts.get(address)
      if (hit !== undefined && hit.expiresAt > now) return { address, ok: hit.ok, fresh: false }
      live.push(address)
      const ok = await this.#connect(address, this.#port, this.#timeoutMs)
      this.#verdicts.set(address, { ok, expiresAt: this.#clock() + this.#cacheTtlMs })
      return { address, ok, fresh: true }
    }))
    const kept = outcomes.filter((outcome) => outcome.ok).map((outcome) => outcome.address)
    const dropped = outcomes.filter((outcome) => !outcome.ok).map((outcome) => outcome.address)
    return {
      kept: kept.length > 0 ? kept : [...addresses],
      dropped,
      cached: live.length === 0,
    }
  }
}
