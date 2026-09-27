/**
 * Built-in DoH region pools (ADR-0022 D6): the cn pool holds the vendors this
 * network reaches (AliDNS dual + DNSPod dual), the global pool the overseas
 * tier (Cloudflare/Google on 443, Quad9 on its documented `:5053` JSON face),
 * and the auto preset exposes the full pool for bootstrap trimming.
 *
 * @module dsh-websearch/dns/pool
 */
import type { DohNode, DnsPreset } from '../config.ts'
import type { ResolvedDohNode } from './transport.ts'

/** China-mainland-reachable pool (JSON faces verified 2026-09-27, see tests/dns/fixtures/README.md). */
export const CN_POOL: readonly ResolvedDohNode[] = [
  { host: '223.5.5.5', sni: 'dns.alidns.com', path: '/resolve', port: 443 },
  { host: '223.6.6.6', sni: 'dns.alidns.com', path: '/resolve', port: 443 },
  { host: '120.53.53.53', sni: 'doh.pub', path: '/dns-query', port: 443 },
  { host: '119.29.29.29', sni: 'doh.pub', path: '/dns-query', port: 443 },
]

/** Overseas pool; Quad9's JSON API lives on the documented non-standard port 5053. */
export const GLOBAL_POOL: readonly ResolvedDohNode[] = [
  { host: '1.1.1.1', sni: 'cloudflare-dns.com', path: '/dns-query', port: 443 },
  { host: '1.0.0.1', sni: 'cloudflare-dns.com', path: '/dns-query', port: 443 },
  { host: '8.8.8.8', sni: 'dns.google', path: '/resolve', port: 443 },
  { host: '8.8.4.4', sni: 'dns.google', path: '/resolve', port: 443 },
  { host: '9.9.9.9', sni: 'dns.quad9.net', path: '/dns-query', port: 5053 },
]

/** The auto preset's candidate set: cn first (this network's only reachable tier), overseas after. */
export const FULL_POOL: readonly ResolvedDohNode[] = [...CN_POOL, ...GLOBAL_POOL]

/**
 * Map a preset onto its node list. Custom nodes get the path/port defaults
 * filled (`/dns-query`, 443); the custom-non-empty cross-field rule itself is
 * validated in config (dual-path).
 * @param preset - the configured region preset.
 * @param customNodes - the user-supplied node list (custom preset only).
 * @returns the complete endpoints for the resolver.
 */
export function nodesForPreset(preset: DnsPreset, customNodes: readonly DohNode[]): readonly ResolvedDohNode[] {
  if (preset === 'cn') return CN_POOL
  if (preset === 'global') return GLOBAL_POOL
  if (preset === 'custom') {
    return customNodes.map((node) => ({ path: '/dns-query', port: 443, ...node }))
  }
  return FULL_POOL
}
