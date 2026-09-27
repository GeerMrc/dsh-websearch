/**
 * Canary auto-detection, pool bootstrap, and proxy-environment suspension
 * (ADR-0022 D4/D6/D7). The detector runs the ORIGINAL system lookup against
 * the member host set — reserved-range membership is the only enabling signal
 * (probe failures never are, guarding against the side-router's flaky virtual
 * endpoints); the decision table's five branches live here, the lazy trigger
 * timing (first in-scope lookup, never apply()) lives in the intercept layer.
 *
 * @module dsh-websearch/dns/detect
 */
import { isReservedIpv4, parseIpv4Ranges } from './ranges.ts'
import type { IpRange } from './ranges.ts'
import { dohQuery } from './transport.ts'
import type { NodeHttpsSend, ResolvedDohNode } from './transport.ts'

/** The system lookup the canary probes through — the intercept layer captures the original before patching. */
export type SystemLookup = (host: string) => Promise<readonly string[]>

/** Detector inputs; the lookup and range seams are injectable for the decision-table tests. */
export interface CanaryOptions {
  readonly systemLookup: SystemLookup
  readonly poisonRanges: readonly string[]
}

/** One reserved-range hit, the enabling evidence. */
export interface CanaryHit {
  readonly host: string
  readonly addresses: readonly string[]
}

/** One system-resolution failure, diagnostics only — never an enabling signal on its own. */
export interface CanaryFailure {
  readonly host: string
  readonly reason: string
}

/** The five-branch decision: `enable` arms the DoH layer, `skip` leaves the system path untouched. */
export interface CanaryOutcome {
  readonly action: 'enable' | 'skip'
  readonly verdict: 'poisoned' | 'clean' | 'inconclusive' | 'empty'
  readonly hits: readonly CanaryHit[]
  readonly failures: readonly CanaryFailure[]
}

/**
 * Run the canary decision table over the member host set:
 * ① all clean → skip/clean; ② any reserved-range hit → enable/poisoned (hits
 * are the evidence); ③ every sample unobtainable → enable/inconclusive (a
 * blind resolver beats a poisoned one); ④ mixed clean+failed with zero hits →
 * skip/clean (a clean sample proves no poisoning; failures record as
 * diagnostics); ⑤ empty canary set → skip/empty without probing.
 * @param hosts - the canary set (the live member baseURL hosts).
 * @param options - the system lookup and reserved ranges.
 * @returns the decision with its evidence.
 */
export async function runCanary(hosts: readonly string[], options: CanaryOptions): Promise<CanaryOutcome> {
  if (hosts.length === 0) return { action: 'skip', verdict: 'empty', hits: [], failures: [] }
  const ranges: readonly IpRange[] = parseIpv4Ranges(options.poisonRanges)
  const hits: CanaryHit[] = []
  const failures: CanaryFailure[] = []
  for (const host of hosts) {
    try {
      const addresses = await options.systemLookup(host)
      const poisoned = addresses.filter((address) => isReservedIpv4(address, ranges))
      if (poisoned.length > 0) hits.push({ host, addresses: poisoned })
    } catch (err) {
      failures.push({ host, reason: (err as Error).message })
    }
  }
  if (hits.length > 0) return { action: 'enable', verdict: 'poisoned', hits, failures }
  if (failures.length === hosts.length) {
    return { action: 'enable', verdict: 'inconclusive', hits, failures }
  }
  return { action: 'skip', verdict: 'clean', hits, failures }
}

/** Bootstrap inputs; the send and clock seams are injectable. */
export interface BootstrapOptions {
  readonly timeoutMs: number
  readonly send?: NodeHttpsSend
  readonly clock?: () => number
  /** How many survivors to keep; default 2 (primary + standby). */
  readonly take?: number
}

/**
 * Probe every pool node in parallel with one neutral query and rank the
 * Status-0 responders by measured RTT; unreachable nodes drop out. The
 * trimmed list becomes the resolver's node order.
 * @param pool - the candidate nodes.
 * @param options - budget, seams, and the take count.
 * @returns the reachable nodes, fastest first.
 */
export async function bootstrapNodes(pool: readonly ResolvedDohNode[], options: BootstrapOptions): Promise<readonly ResolvedDohNode[]> {
  const clock = options.clock ?? Date.now
  const probeName = 'example.com'
  const probed = await Promise.all(pool.map(async (node) => {
    const startedAt = clock()
    try {
      const envelope = await dohQuery(node, { name: probeName, type: 1 }, options.timeoutMs, options.send)
      if (envelope.Status !== 0) return null
      return { node, rttMs: clock() - startedAt }
    } catch {
      return null
    }
  }))
  return probed
    .filter((entry): entry is { node: ResolvedDohNode; rttMs: number } => entry !== null)
    .sort((a, b) => a.rttMs - b.rttMs)
    .slice(0, options.take ?? 2)
    .map((entry) => entry.node)
}

/** The proxy variable names the suspension honors (upper and lower case). */
const PROXY_VARS = ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy', 'ALL_PROXY', 'all_proxy'] as const

/** The no-proxy variable names read in order. */
const NO_PROXY_VARS = ['NO_PROXY', 'no_proxy'] as const

/**
 * Whether any standard proxy variable is set to a non-blank value.
 * @param env - the environment to read (process.env by default at the caller).
 * @returns proxy-environment presence.
 */
export function proxyEnvActive(env: Readonly<Record<string, string | undefined>>): boolean {
  return PROXY_VARS.some((name) => (env[name] ?? '').trim().length > 0)
}

/**
 * NO_PROXY matching (ADR-0022 D7): a CSV list; an entry matches by equality or
 * dot-suffix (`api.tavily.com` matches `tavily.com`, not `avily.com`); `*`
 * exempts everything; matching is case-insensitive.
 * @param host - the host the resolution targets.
 * @param noProxy - the raw NO_PROXY value.
 * @returns exemption from the proxy suspension.
 */
export function matchesNoProxy(host: string, noProxy: string | undefined): boolean {
  const raw = (noProxy ?? '').trim()
  if (raw.length === 0) return false
  const target = host.toLowerCase()
  return raw.split(',').some((entryRaw) => {
    const entry = entryRaw.trim().toLowerCase()
    if (entry.length === 0) return false
    if (entry === '*') return true
    return target === entry || target.endsWith(`.${entry}`)
  })
}

/**
 * Whether the DNS layer must suspend for this host: a proxy environment is
 * present AND the host is not NO_PROXY-exempt (under a proxy, resolution and
 * the TCP precheck both move to the proxy side — local DoH is meaningless and
 * the precheck would misread).
 * @param host - the host the resolution targets.
 * @param env - the environment to read.
 * @returns suspension verdict for this resolution.
 */
export function proxySuspendsFor(host: string, env: Readonly<Record<string, string | undefined>>): boolean {
  if (!proxyEnvActive(env)) return false
  return !NO_PROXY_VARS.some((name) => matchesNoProxy(host, env[name]))
}
