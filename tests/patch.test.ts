import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Bundle patch content contract (ADR-0013, ADR-0024): the shipped
 * cordis.patch.yml is load-bearing install behavior, not documentation —
 * installing the plugin must take over web_search (`searchProvider:
 * dshws-chain`) while explicitly restating `fetchProvider: dshws-fetch-gate`,
 * and must hide the official "web search and fetch" settings page. No entry
 * may carry a `name` guard (a mismatched guard makes the host skip the entry
 * silently). The layer is derived state: disabling the bundle removes it and
 * every official row returns, which is why runtime rows are never disabled.
 */
const patch = readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8')

/** Top-level patch entries, in file order (insert lists are indented and excluded). */
const overrideIds = [...patch.matchAll(/^- id: (\S+)/gm)].map((match) => match[1])

describe('bundle patch content (ADR-0013 装即接管, ADR-0024 接管设置页)', () => {
  it('inserts the plugin row with the loader-entry name equal to the manifest name (client-modules pairing leg 1, v0.2.3)', () => {
    expect(patch).toContain('- id: dsh-websearch')
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { name: string }
    // The rc.5 client-modules rule is a three-way exact string equality:
    // insert-row name == manifest name == the client bundle's registration id.
    // Scoped names are YAML-quoted (a bare @-scalar does not parse).
    expect(patch).toContain(`name: '${pkg.name}'`)
  })

  it('pins the web row config with both keys restated and no name guard', () => {
    expect(patch).toContain('- id: web')
    expect(patch).toContain('searchProvider: dshws-chain')
    // Whole-config replacement semantics: every shipped key must be restated,
    // so the http fetch default is carried explicitly, not inherited.
    expect(patch).toContain('fetchProvider: dshws-fetch-gate')
    // A `name` guard on the web entry would skip silently on mismatch.
    expect(patch).not.toMatch(/- id: web\n\s+name:/)
  })

  it('does not pin the fetch chain (fetch 接线保持手动可选)', () => {
    expect(patch).not.toContain('fetchProvider: dshws-chain-fetch')
  })

  it('retires the official legacy search entry via row-level disable (ADR-0013 Decision 7, S14c)', () => {
    // Install = the host web-search-deepseek row is disabled and its
    // `deepseek-official` provider unregisters; removing the plugin restores
    // it. On hosts up to 0.2.0-rc.2 the official settings card disappeared with
    // that row; since 0.2.2-rc.5 the card is served while the `web` namespace
    // is, so the card is hidden by its own row below instead.
    expect(patch).toMatch(/^- id: web-search-deepseek\s*\n\s*disabled: true\s*$/m)
    // The always-available http fetch row must NOT be touched.
    expect(patch).not.toContain('- id: web-fetch-http')
  })

  it('hides the official web search and fetch settings page via row-level disable (ADR-0024)', () => {
    expect(patch).toMatch(/^- id: ui-settings-web-search\s*\n\s*disabled: true\s*$/m)
  })

  it.each([
    ['web', 'the seam this plugin, the preset tool rows and the official providers all inject'],
    ['web-fetch-http', 'the official fetch provider that takes over once this bundle is off'],
    ['web-deepseek-api', 'the official DeepSeek Search API provider'],
    ['tool-web', 'the web_search and web_fetch tools'],
  ])('never disables the %s row (%s)', (id) => {
    expect(patch).not.toMatch(new RegExp(`^- id: ${id}\\s*\\n\\s*disabled:`, 'm'))
  })

  it('overrides exactly the seam pin, the legacy search row and the settings page row', () => {
    // Locks the whole override set: adding another official row here needs a
    // deliberate decision, and so does dropping one.
    expect(overrideIds).toEqual(['web', 'web-search-deepseek', 'ui-settings-web-search'])
  })
})
