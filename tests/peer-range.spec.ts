import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { satisfies } from 'semver'

/**
 * Peer-domain contract (ADR-0027). The host compatibility gate evaluates plugin
 * peers with `includePrerelease: true`, so an explicit pre-release pin is not a
 * gate requirement: it is the record that this version was rehearsed. Every
 * `@deepseek-ai/dsh-*` peer range is asserted in three classes:
 *
 * - rehearsed, or a stable version inside the declared window: admitted under both
 *   semantics;
 * - rejected by the default semantics although the host gate admits it: unrehearsed
 *   0.2.x pre-releases and the pre-release of the upper bound;
 * - rejected under both semantics.
 */
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  peerDependencies: Record<string, string>
}

const PEER_PREFIX = '@deepseek-ai/dsh-'
const peers = Object.entries(pkg.peerDependencies).filter(([name]) => name.startsWith(PEER_PREFIX))
/** Options the host gate passes to `semver.satisfies` (plugin-compatibility.ts). */
const GATE = { includePrerelease: true } as const

/** Versions carrying an explicit pin because they were rehearsed (S32, S33, S38, S41). */
const REHEARSED = [
  '0.1.5-rc.1', '0.1.5-rc.2', '0.1.5-rc.3',
  '0.1.6-alpha.1', '0.1.6-alpha.2',
  '0.1.7-alpha.1', '0.1.7-alpha.2', '0.1.7-rc.1', '0.1.7-rc.2',
  '0.2.0-rc.1', '0.2.0-rc.2',
  '0.2.2-rc.5',
] as const
/** Stable versions inside the declared stable window (range probes, not release claims). */
const STABLE_WINDOW = ['0.2.0', '0.2.9'] as const
/**
 * Versions the declared range rejects by default semantics although the host gate
 * admits them: unrehearsed 0.2.x pre-releases, and the pre-release of the upper bound.
 */
const GATE_ADMITS = ['0.2.1-rc.5', '0.2.2-rc.1', '0.2.2-rc.4', '0.2.3-alpha.2', '0.3.0-rc.1'] as const
/** Versions rejected under both semantics. */
const OUTSIDE = ['0.1.4.0', '0.1.8', '0.3.0'] as const

/** The six host seams this plugin binds; each declares the same peer range. */
const PEER_NAMES = [
  '@deepseek-ai/dsh-agent',
  '@deepseek-ai/dsh-credentials',
  '@deepseek-ai/dsh-settings',
  '@deepseek-ai/dsh-system-prompt',
  '@deepseek-ai/dsh-tools',
  '@deepseek-ai/dsh-web',
]

describe('peer domain contract (ADR-0027)', () => {
  it('declares the six host seams with one identical range', () => {
    expect(peers.map(([name]) => name).sort()).toEqual(PEER_NAMES)
    expect(new Set(peers.map(([, range]) => range)).size).toBe(1)
  })

  it.each([...REHEARSED, ...STABLE_WINDOW])('admits %s under both semantics', (version) => {
    for (const [, range] of peers) {
      expect(satisfies(version, range), `${version} default / ${range}`).toBe(true)
      expect(satisfies(version, range, GATE), `${version} gate / ${range}`).toBe(true)
    }
  })

  it.each(GATE_ADMITS)('lets the host gate admit %s although the declared range rejects it by default semantics', (version) => {
    for (const [, range] of peers) {
      expect(satisfies(version, range), `${version} default`).toBe(false)
      expect(satisfies(version, range, GATE), `${version} gate`).toBe(true)
    }
  })

  it.each(OUTSIDE)('rejects %s under both semantics', (version) => {
    for (const [, range] of peers) {
      expect(satisfies(version, range), `${version} default`).toBe(false)
      expect(satisfies(version, range, GATE), `${version} gate`).toBe(false)
    }
  })
})
