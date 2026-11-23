import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

/**
 * Workflow contract (ADR-0026). The release workflow runs for the first time
 * on the tag that publishes, so its defects can only be fixed by releasing
 * another version. These tests pin what cannot be rehearsed: OIDC instead of
 * a stored token, a full checkout for the tag-placement check, the order of
 * the gates, and the exact release-check invocations that the runbook repeats
 * locally before the push.
 */
interface Step {
  uses?: string
  run?: string
  env?: Record<string, unknown>
  with?: Record<string, unknown>
}

interface Workflow {
  on?: Record<string, unknown>
  permissions?: Record<string, unknown>
  jobs?: Record<string, { steps?: Step[] }>
}

interface LoadedWorkflow {
  text: string
  on: Record<string, unknown>
  permissions: Record<string, unknown>
  with: Record<string, unknown>[]
  /** `run` commands of every step, in job and step order. */
  runs: string[]
}

function load(name: string): LoadedWorkflow {
  const text = readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url), 'utf8')
  const doc = parse(text) as Workflow
  const steps = Object.values(doc.jobs ?? {}).flatMap((job) => job.steps ?? [])
  return {
    text,
    on: doc.on ?? {},
    permissions: doc.permissions ?? {},
    with: steps.map((step) => step.with ?? {}),
    runs: steps.map((step) => step.run).filter((run): run is string => run !== undefined),
  }
}

/** Index of the first `run` command matching `pattern`, or -1. */
const first = (runs: string[], pattern: RegExp): number => runs.findIndex((run) => pattern.test(run))

describe('release workflow (ADR-0026)', () => {
  const release = load('release.yml')

  it('publishes through OIDC trusted publishing, never a stored token', () => {
    expect(release.permissions['id-token']).toBe('write')
    expect(release.permissions.contents).toBe('write')
    expect(release.text).not.toMatch(/NPM_TOKEN|NODE_AUTH_TOKEN/)
  })

  it('is triggered by v* tags only and checks out the full history', () => {
    expect(release.on).toEqual({ push: { tags: ['v*'] } })
    expect(release.with.some((options) => options['fetch-depth'] === 0)).toBe(true)
  })

  it('runs the gates in order: typecheck, lint, tests, i18n, build, tag check, pack, tarball check, release, publish', () => {
    const gates: readonly [string, RegExp][] = [
      ['typecheck', /pnpm run typecheck$/],
      ['lint', /pnpm run lint$/],
      ['tests', /pnpm test$/],
      ['i18n', /pnpm run check:i18n$/],
      ['build', /pnpm run build$/],
      ['tag consistency', /node scripts\/check-release\.mjs --tag "\$GITHUB_REF_NAME"$/],
      ['pack', /node scripts\/pack\.mjs$/],
      ['tarball check', /node scripts\/check-release\.mjs --tarballs dist-artifacts$/],
      ['GitHub release', /gh release (create|upload) /],
      ['npm publish', /npm publish /],
    ]
    const positions = gates.map(([label, pattern]) => {
      const index = first(release.runs, pattern)
      return { label, index }
    })
    expect(positions.filter((gate) => gate.index < 0).map((gate) => gate.label)).toEqual([])
    const order = positions.map((gate) => gate.index)
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  it('installs npm 11 before the consistency check and the publish', () => {
    const npm11 = first(release.runs, /npm install -g npm@11$/)
    expect(npm11).toBeGreaterThan(-1)
    expect(npm11).toBeLessThan(first(release.runs, /npm publish /))
  })

  it('publishes the scoped tarball to the npmjs registry with provenance', () => {
    const publish = release.runs.find((run) => /npm publish /.test(run))
    expect(publish).toMatch(/\.\/dist-artifacts\/maricgeer-dsh-websearch-\*\.tgz/)
    expect(publish).toMatch(/--registry https:\/\/registry\.npmjs\.org/)
    expect(publish).toMatch(/--provenance/)
    expect(publish).toMatch(/--access public/)
  })
})

describe('CI workflow', () => {
  const ci = load('ci.yml')

  it('runs on every pull request and on pushes to master', () => {
    expect(Object.keys(ci.on)).toEqual(expect.arrayContaining(['pull_request', 'push']))
    expect(ci.on.push).toEqual({ branches: ['master'] })
  })

  it('rehearses the release without publishing: build, pack, tarball check', () => {
    expect(first(ci.runs, /node scripts\/pack\.mjs$/)).toBeGreaterThan(first(ci.runs, /pnpm run build$/))
    expect(ci.runs).toContain('node scripts/check-release.mjs --tarballs dist-artifacts')
    expect(ci.runs.some((run) => /npm publish|gh release /.test(run))).toBe(false)
    expect(ci.text).not.toMatch(/NPM_TOKEN|NODE_AUTH_TOKEN|id-token/)
  })
})
