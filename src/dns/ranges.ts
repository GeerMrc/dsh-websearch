/**
 * Shared reserved-range matching (ADR-0022 D2/D4): both the resolver's poison
 * filter and the canary detector decide on the same signal — an IPv4 answer
 * inside one of the configured reserved ranges (the side-router blackhole
 * signature). v6 passes untouched (the H7 follow-up owns v6).
 *
 * @module dsh-websearch/dns/ranges
 */

/** One parsed IPv4 CIDR block, both halves as unsigned 32-bit integers. */
export interface IpRange {
  readonly base: number
  readonly mask: number
}

/** Parse one dotted-quad into an unsigned 32-bit integer; -1 for anything else (v6, garbage). */
export function ipv4ToInt(address: string): number {
  const parts = address.split('.')
  if (parts.length !== 4) return -1
  let value = 0
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return -1
    const octet = Number(part)
    if (octet > 255) return -1
    value = (value << 8) | octet
  }
  return value >>> 0
}

/**
 * Parse CIDR strings into matchable ranges; unparseable entries drop out
 * loudly-by-absence (a bad range never silently matches everything).
 * @param cidrs - the configured reserved ranges (e.g. `198.18.0.0/15`).
 * @returns the parsed ranges.
 */
export function parseIpv4Ranges(cidrs: readonly string[]): readonly IpRange[] {
  return cidrs.flatMap((cidr) => {
    const [base, prefixText] = cidr.split('/')
    const prefix = prefixText === undefined ? 32 : Number(prefixText)
    const baseInt = ipv4ToInt(base)
    if (baseInt < 0 || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return []
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
    return [{ base: (baseInt & mask) >>> 0, mask }]
  })
}

/**
 * Whether the address falls inside any range; v6 and malformed inputs never match.
 * @param address - the answer address under test.
 * @param ranges - the parsed reserved ranges.
 * @returns reserved-range membership.
 */
export function isReservedIpv4(address: string, ranges: readonly IpRange[]): boolean {
  const value = ipv4ToInt(address)
  if (value < 0) return false
  return ranges.some((range) => (value & range.mask) >>> 0 === range.base)
}
