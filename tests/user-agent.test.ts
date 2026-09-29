import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { USER_AGENT } from '../src/providers/shared.ts'

/**
 * S37 T5 drift guard: USER_AGENT is a single pinned constant in shared.ts
 * (deliberately NOT derived from package.json at runtime — that import
 * would need resolveJsonModule, NodeNext JSON import attributes, and
 * bundler inlining to agree). This test reads package.json on the TEST
 * side and pins the two together: a version bump that forgets the
 * constant fails here, loudly.
 */
describe('USER_AGENT single-source drift guard', () => {
  it('matches the package version', async () => {
    const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as { version: string }
    expect(USER_AGENT).toBe(`dsh-websearch/${pkg.version}`)
  })
})
