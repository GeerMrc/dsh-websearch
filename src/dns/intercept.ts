/**
 * The process-level dns.lookup interception (ADR-0022 D1/D4/D5/D7/D10): one
 * patch face on the callback-form `dns.lookup` module export — the seam the
 * spike proved undici's fetch consults per call (docs/sessions/audit-logs/
 * 2026-09-27-s35-t0-spike/). Everything routes through live-read config:
 * mode off / IP literals / out-of-scope hosts / proxy-suspended hosts pass
 * straight to the captured original; armed resolutions answer from the DoH
 * resolver with the egress precheck; a dead DoH plane falls back to the
 * original exactly once (never-worse). Auto mode triggers the canary lazily
 * on the FIRST in-scope lookup — never at apply — so装配-class tests stay
 * hermetic, and a skip decision uninstalls the patch entirely (zero-patch).
 *
 * @module dsh-websearch/dns/intercept
 */
import * as dnsNamespace from 'node:dns'
import { isIP } from 'node:net'
import { bootstrapNodes, proxySuspendsFor, runCanary } from './detect.ts'
import type { CanaryOutcome, SystemLookup } from './detect.ts'
import { EgressProbe } from './probe.ts'
import type { ProbeOutcome } from './probe.ts'
import { FULL_POOL, nodesForPreset } from './pool.ts'
import { DohResolver } from './resolver.ts'
import type { DohResolution } from './resolver.ts'
import type { ResolvedDnsConfig } from '../config.ts'
import { isPublicAddress } from '../fetch-gate.ts'
import type { ResolvedDohNode } from './transport.ts'

/** The mutable CJS exports object behind the `node:dns` ESM facade — the only writable patch face. */
type DnsModule = { lookup: typeof dnsNamespace.lookup }

const dnsModule: DnsModule = (dnsNamespace as unknown as { default?: DnsModule }).default
  ?? (dnsNamespace as unknown as DnsModule)

/** The structural resolver contract (DohResolver satisfies it; tests inject fakes). */
export interface DohResolverLike {
  resolve(name: string, family: 4 | 6 | 0): Promise<DohResolution | null>
  /** S36 (plan 036): drop positive cache entries; optional so existing fakes stay valid. */
  invalidate?(name: string): void
}

/** Structural bootstrap seam (the real bootstrapNodes satisfies it). */
export type BootstrapFn = (pool: readonly ResolvedDohNode[], options: { timeoutMs: number; take?: number }) => Promise<readonly ResolvedDohNode[]>

/** Observability events; the T7 sink sanitizes hosts before they reach any log or UI surface. */
export type DnsLayerEvent =
  | { kind: 'decision'; outcome: CanaryOutcome }
  | { kind: 'resolve'; host: string; via: string; latencyMs: number; kept: number; dropped: number; probeDropped: readonly string[] }
  | { kind: 'fallback'; host: string; reason: 'doh-dead' | 'neg' | 'error' }
  | { kind: 'suspend'; host: string }

/** Constructor seams; every one is injectable so the unit suite never touches the network. */
export interface DnsLayerDeps {
  /** Live resolved dns config (read per lookup — settings-hot). */
  readonly config: () => ResolvedDnsConfig
  /** Live member-host scope (member baseURL hosts — read per lookup, settings-hot). */
  readonly scopeHosts: () => readonly string[]
  /** Proxy environment to consult (process.env in production). */
  readonly env?: Readonly<Record<string, string | undefined>>
  /** The original callback-form lookup captured before patching (default: the module's current one). */
  readonly systemLookup?: DnsModule['lookup']
  /** The system lookup the canary probes through (default: wraps {@link DnsLayerDeps.systemLookup}). */
  readonly canarySystemLookup?: SystemLookup
  /** Resolver factory (default: constructs a DohResolver). */
  readonly makeResolver?: (nodes: readonly ResolvedDohNode[]) => DohResolverLike
  /** Pool bootstrap (default: the real parallel RTT-ranked prober). */
  readonly bootstrap?: BootstrapFn
  /** Event sink for the observability face. */
  readonly onEvent?: (event: DnsLayerEvent) => void
  /**
   * Boot warmup delay (plan 036): after this many ms the layer eagerly runs
   * the canary in the background and (when armed) pre-resolves every scope
   * host through the public lookup path — the first user search then hits a
   * warm cache instead of racing the lazy detection. Undefined = never warm
   * (vitest; see {@link resolveWarmupDelayMs}).
   */
  readonly warmupDelayMs?: number
}

/** The layer handle: the installed lookup plus lifecycle and observability seams. */
export interface DnsLayer {
  /** The wrapped function installed on the dns module export. */
  readonly lookup: DnsModule['lookup']
  /** Armed = answering from DoH; the decision is the cached canary outcome (null before the lazy trigger). */
  state(): { armed: boolean; decision: CanaryOutcome | null; proxyActive: boolean }
  /** Resolves once the pending (lazy or forced) canary decision has settled. */
  whenSettled(): Promise<void>
  /** Resolves once an arming pass (mode on, or post-canary enable) has completed. */
  whenArmed(): Promise<void>
  /** Force a fresh canary pass (the UI re-check button); reinstalls the patch when needed. */
  recheck(): Promise<CanaryOutcome>
  /** The fetch-gate SSRF seam (ADR-0022 D8): DoH truth when active for the host, system otherwise. */
  resolveForGuard(hostname: string): Promise<readonly string[]>
  /** S36 (plan 036): drop the host's positive resolver cache (connect-failure feedback); no-op unarmed. */
  invalidateHost(hostname: string): void
  /** Restore the original module export (settings off-switch, HMR teardown). */
  dispose(): void
}

/** The one installed layer at a time — a defensive reinstall disposes its predecessor (HMR single-layer guarantee). */
let activeLayer: DnsLayer | null = null

/** Promisify one original-lookup call into the all-form address list. */
function systemAddresses(systemLookup: DnsModule['lookup'], hostname: string): Promise<readonly string[]> {
  return new Promise((resolve, reject) => {
    systemLookup(hostname, { all: true, family: 0 }, (err, addresses) => {
      if (err !== null) reject(err)
      else resolve((addresses as { address: string }[]).map((entry) => entry.address))
    })
  })
}

/**
 * The boot-warmup gate (plan 036): warm only outside a vitest worker — the
 * warmup is a network side effect and the unit-suite hermeticity red line
 * (ADR-0022 D4) outranks it. New-introduced pattern for this repo, declared
 * in the ADR addendum.
 * @param env - the environment to consult (process.env in production).
 * @returns the warmup delay in ms, or undefined to never warm.
 */
export function resolveWarmupDelayMs(env: Readonly<Record<string, string | undefined>>): number | undefined {
  return env.VITEST === undefined ? 2500 : undefined
}

/**
 * Install the interception. Auto mode installs the (pass-through) wrapper now
 * and decides lazily; mode on arms asynchronously (bootstrap for the auto
 * preset trims the pool); mode off never installs. Disposal restores the
 * original export no matter which state the layer reached.
 * @param deps - the live config/scope/env seams.
 * @returns the layer handle.
 */
export function installDnsLayer(deps: DnsLayerDeps): DnsLayer {
  activeLayer?.dispose()
  // The restore target is whatever the module export holds at install time —
  // never the delegation seam, which tests replace with fakes.
  const restoreTarget = dnsModule.lookup
  const originalLookup = deps.systemLookup ?? restoreTarget
  const makeResolver = deps.makeResolver ?? ((nodes: readonly ResolvedDohNode[]) => new DohResolver({
    nodes,
    nodeTimeoutMs: deps.config().nodeTimeoutMs,
    cache: deps.config().cache,
    poisonRanges: deps.config().poisonRanges,
  }))
  const bootstrap: BootstrapFn = deps.bootstrap ?? (async (pool, options) => await bootstrapNodes(pool, { timeoutMs: options.timeoutMs, take: options.take ?? 2 }))

  let installed = false
  let disposed = false
  let armed = false
  let decision: CanaryOutcome | null = null
  let resolver: DohResolverLike | null = null
  let settling: Promise<void> | null = null
  let armingPromise: Promise<void> | null = null
  let dohInFlight = 0
  let warmupTimer: ReturnType<typeof setTimeout> | undefined

  const env = (): Readonly<Record<string, string | undefined>> => deps.env ?? process.env

  function install(): void {
    if (installed || disposed) return
    installed = true
    dnsModule.lookup = layerLookup as unknown as DnsModule['lookup']
  }

  function uninstall(): void {
    if (!installed) return
    installed = false
    dnsModule.lookup = restoreTarget
  }

  /**
   * Prewarm one pass over the scope hosts (plan 036): each host goes through
   * the PUBLIC lookup path — the same family-0 cache key the first real
   * search will use, and the same resolve-event stream into the chain log —
   * with a no-op consumer discarding the answer. Serial by design so the
   * dohInFlight self-recursion guard never sees its own warm traffic.
   */
  async function prewarm(): Promise<void> {
    if (disposed || !armed || resolver === null) return
    for (const host of deps.scopeHosts()) {
      if (disposed) return
      await new Promise<void>((resolve) => {
        (layerLookup as (hostname: string, options: { all: boolean }, callback: () => void) => unknown)(host, { all: true }, () => resolve())
      })
    }
  }

  /**
   * The eager boot pass (plan 036): run the lazy machinery ahead of the first
   * user search. Mode on already armed at install, so the timer only waits
   * for that arming; auto triggers the canary (a settled decision makes this
   * a no-op). Prewarm runs unconditionally after — a skip decision leaves it
   * a harmless system-path pass through the uninstalled wrapper.
   */
  function scheduleWarmup(): void {
    if (deps.warmupDelayMs === undefined || disposed) return
    warmupTimer = setTimeout(() => {
      warmupTimer = undefined
      void (async () => {
        if (disposed) return
        let mode: ResolvedDnsConfig['mode']
        try {
          mode = deps.config().mode
        } catch {
          return
        }
        if (mode === 'off') return
        if (mode === 'on') {
          if (armingPromise !== null) await armingPromise
        } else {
          await triggerDetection()
        }
        if (disposed) return
        await prewarm()
      })()
    }, deps.warmupDelayMs)
  }

  async function arm(): Promise<void> {
    armingPromise ??= (async (): Promise<void> => {
      const config = deps.config()
    let nodes: readonly ResolvedDohNode[]
    if (config.preset === 'auto') {
      const trimmed = await bootstrap(FULL_POOL, { timeoutMs: config.nodeTimeoutMs, take: 2 })
      nodes = trimmed.length > 0 ? trimmed : FULL_POOL
    } else {
      nodes = nodesForPreset(config.preset, config.nodes)
    }
    if (disposed) return
      resolver = makeResolver(nodes)
      armed = true
    })()
    return armingPromise
  }

  function triggerDetection(): Promise<void> {
    if (settling !== null || disposed) return settling ?? Promise.resolve()
    settling = (async () => {
      const outcome = await runCanary(deps.scopeHosts(), {
        systemLookup: deps.canarySystemLookup ?? (async (host) => await systemAddresses(originalLookup, host)),
        poisonRanges: deps.config().poisonRanges,
      })
      decision = outcome
      deps.onEvent?.({ kind: 'decision', outcome })
      if (outcome.action === 'enable') {
        await arm()
      } else {
        // Clean verdict: zero-patch — the wrapper's whole purpose evaporates.
        uninstall()
      }
    })()
    return settling
  }

  function inScope(hostname: string): boolean {
    try {
      const config = deps.config()
      return config.scope === 'all' || deps.scopeHosts().includes(hostname)
    } catch {
      // Same stage-5 C4 guard: an unreadable config must read as out-of-scope.
      return false
    }
  }

  /** Delegate one call to the captured original with the caller's exact arguments. */
  function delegate(this: unknown, args: unknown[]): void {
    (originalLookup as (...callArgs: unknown[]) => unknown).apply(this, args)
  }

  function layerLookup(this: unknown, ...args: unknown[]): unknown {
    if (disposed || dohInFlight > 0) return delegate.call(this, args)
    const [hostname, options, maybeCallback] = args as [string, unknown, unknown]
    const callback = typeof options === 'function' ? options : maybeCallback
    if (typeof hostname !== 'string' || typeof callback !== 'function' || typeof options === 'number' || isIP(hostname) > 0) {
      return delegate.call(this, args)
    }
    // Stage-5 C4: the volatile settings path has no validate hook, so a
    // hostile out-of-UI write can make every config read throw — this patch
    // face must degrade to the system path, never break process-wide lookup.
    let config: ResolvedDnsConfig
    try {
      config = deps.config()
    } catch {
      return delegate.call(this, args)
    }
    if (config.mode === 'off' || proxySuspendsFor(hostname, env()) || !inScope(hostname)) {
      if (config.mode !== 'off' && proxySuspendsFor(hostname, env())) deps.onEvent?.({ kind: 'suspend', host: hostname })
      return delegate.call(this, args)
    }
    if (!armed) {
      if (config.mode === 'on') void arm()
      else if (decision === null) void triggerDetection()
      return delegate.call(this, args)
    }
    // Stage-5 C2: the three-arg form may pass null/undefined explicitly —
    // the original lookup tolerates it, so the wrapper must too.
    const lookupOptions = (options ?? {}) as { all?: boolean; family?: number }
    const family: 4 | 6 | 0 = lookupOptions.family === 4 ? 4 : lookupOptions.family === 6 ? 6 : 0
    const startedWallMs = Date.now()
    void (async () => {
      try {
        dohInFlight += 1
        const resolution = resolver !== null ? await resolver.resolve(hostname, family) : null
        if (resolution === null) {
          deps.onEvent?.({ kind: 'fallback', host: hostname, reason: 'doh-dead' })
          return delegate.call(this, args)
        }
        if (resolution.negative) {
          const error = Object.assign(new Error(`getaddrinfo ENOTFOUND ${hostname}`), { code: 'ENOTFOUND' })
          deps.onEvent?.({ kind: 'fallback', host: hostname, reason: 'neg' })
          return void (callback as (err: Error | null) => void)(error)
        }
        let candidates = resolution.addresses
        if (family === 4 || family === 6) candidates = candidates.filter((entry) => entry.family === family)
        if (candidates.length === 0) {
          deps.onEvent?.({ kind: 'fallback', host: hostname, reason: 'error' })
          return delegate.call(this, args)
        }
        let kept = candidates
        let probeOutcome: ProbeOutcome | null = null
        if (config.probe.enabled) {
          // T10 measured finding: the DoH leg and the precheck leg must share
          // ONE cold-path budget (serial legs at full budget measured 410–493ms
          // against the 350ms target) — the probe gets the node-budget
          // remainder, floored at 50ms so a slow DoH answer still gets a
          // meaningful handshake window.
          const probeBudget = Math.max(50, config.nodeTimeoutMs - (Date.now() - startedWallMs))
          const probe = new EgressProbe({ port: 443, timeoutMs: Math.min(config.probe.timeoutMs, probeBudget), cacheTtlS: config.probe.cacheTtlS })
          // Stage-5 S2: probe only globally-reachable addresses — a rebinding
          // answer must not turn this process into a private-range SYN probe.
          // Non-public addresses are never probed and always stay in the
          // ANSWER (never-worse); the public ones filter by verdict.
          const publicCandidates = candidates.filter((entry) => isPublicAddress(entry.address))
          dohInFlight -= 1
          try {
            if (publicCandidates.length > 0) {
              const verdict = await probe.filterReachable(publicCandidates.map((entry) => entry.address))
              const verdictKept = new Set(verdict.kept)
              kept = candidates.filter((entry) => !isPublicAddress(entry.address) || verdictKept.has(entry.address))
              probeOutcome = verdict
            }
          } finally {
            dohInFlight += 1
          }
          kept = candidates.filter((entry) => probeOutcome!.kept.includes(entry.address))
        }
        deps.onEvent?.({
          kind: 'resolve',
          host: hostname,
          via: resolution.via,
          latencyMs: resolution.latencyMs,
          kept: kept.length,
          dropped: resolution.droppedPoisoned.length,
          probeDropped: probeOutcome?.dropped ?? [],
        })
        if (lookupOptions.all === true) {
          (callback as unknown as (err: null, addresses: { address: string; family: number }[]) => void)(null, kept.map((entry) => ({ address: entry.address, family: entry.family })))
        } else {
          (callback as unknown as (err: null, address: string, family: number) => void)(null, kept[0].address, kept[0].family)
        }
      } catch {
        deps.onEvent?.({ kind: 'fallback', host: hostname, reason: 'error' })
        delegate.call(this, args)
      } finally {
        dohInFlight -= 1
      }
    })()
    return undefined
  }

  const layer: DnsLayer = {
    lookup: layerLookup as unknown as DnsModule['lookup'],
    state: () => ({
      armed,
      decision,
      // Proxy presence for the state face ignores NO_PROXY — per-host exemption shows up in behavior.
      proxyActive: ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy', 'ALL_PROXY', 'all_proxy'].some((name) => (env()[name] ?? '').trim().length > 0),
    }),
    whenSettled: async () => {
      if (settling !== null) await settling
    },
    whenArmed: async () => {
      if (armingPromise !== null) await armingPromise
    },
    recheck: async () => {
      if (disposed) throw new Error('dns layer disposed')
      decision = null
      settling = null
      install()
      await triggerDetection()
      if (decision === null) throw new Error('dns canary decision missing after recheck')
      return decision
    },
    invalidateHost: (hostname: string) => {
      resolver?.invalidate?.(hostname)
    },
    resolveForGuard: async (hostname: string) => {
      if (isIP(hostname) > 0) return [hostname]
      let config: ResolvedDnsConfig
      try {
        config = deps.config()
      } catch {
        return await systemAddresses(originalLookup, hostname)
      }
      if (config.mode === 'off' || !armed || resolver === null || proxySuspendsFor(hostname, env()) || !inScope(hostname)) {
        return await systemAddresses(originalLookup, hostname)
      }
      dohInFlight += 1
      try {
        const resolution = await resolver.resolve(hostname, 0)
        if (resolution === null) return await systemAddresses(originalLookup, hostname)
        if (resolution.negative) {
          throw Object.assign(new Error(`getaddrinfo ENOTFOUND ${hostname}`), { code: 'ENOTFOUND' })
        }
        return resolution.addresses.map((entry) => entry.address)
      } finally {
        dohInFlight -= 1
      }
    },
    dispose: () => {
      disposed = true
      if (warmupTimer !== undefined) {
        clearTimeout(warmupTimer)
        warmupTimer = undefined
      }
      uninstall()
      armed = false
      resolver = null
      decision = null
      settling = null
      if (activeLayer === layer) activeLayer = null
    },
  }

  activeLayer = layer
  const initialMode = deps.config().mode
  if (initialMode === 'off') {
    // Zero overhead: no patch, no detection — the layer only becomes real on a hot on/auto switch.
  } else {
    install()
    if (initialMode === 'on') void arm()
  }
  scheduleWarmup()
  return layer
}
