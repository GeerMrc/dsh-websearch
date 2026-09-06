import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Bundle patch content contract (ADR-0013): the shipped cordis.patch.yml is
 * load-bearing install behavior, not documentation — installing the plugin
 * must take over web_search (`searchProvider: dshws-chain`) while explicitly
 * restating `fetchProvider: http` (the fetch chain is single-member firecrawl
 * and must stay a documented manual opt-in), and must not carry a `name` guard
 * (a mismatched guard makes the host skip the entry silently).
 */
const patch = readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8')

describe('bundle patch content (ADR-0013 装即接管)', () => {
  it('inserts the plugin row (组装面不变)', () => {
    expect(patch).toContain('- id: dsh-websearch')
    expect(patch).toContain('name: dsh-websearch')
  })

  it('pins the web row config with both keys restated and no name guard', () => {
    expect(patch).toContain('- id: web')
    expect(patch).toContain('searchProvider: dshws-chain')
    // Whole-config replacement semantics: every shipped key must be restated,
    // so the http fetch default is carried explicitly, not inherited.
    expect(patch).toContain('fetchProvider: http')
    // A `name` guard on the web entry would skip silently on mismatch.
    expect(patch).not.toMatch(/- id: web\n\s+name:/)
  })

  it('does not pin the fetch chain (fetch 接线保持手动可选)', () => {
    expect(patch).not.toContain('fetchProvider: dshws-chain-fetch')
  })
})
