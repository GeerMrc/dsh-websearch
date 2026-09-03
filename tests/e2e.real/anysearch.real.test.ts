import { describe, expect, it } from 'vitest'
import {
  ANYSEARCH_DEFAULT_BASE_URL,
  AnysearchSearchProvider,
  resolveAnysearchMemberOptions,
} from '../../src/providers/anysearch.ts'

/**
 * Real-API smoke for the `dshws-anysearch` member. Self-skips without
 * `$ANYSEARCH_API_KEY` (the e2e.real tier policy). The key reaches the
 * provider through the same seam the plugin wires in production — a
 * per-operation resolve thunk — here backed by the process environment
 * instead of the credentials service, so no credential store is touched.
 */
const apiKey = process.env.ANYSEARCH_API_KEY
const maybe = apiKey !== undefined && apiKey.length > 0 ? describe : describe.skip

maybe('dshws-anysearch real API', () => {
  it('returns sources for a live query', async () => {
    const provider = new AnysearchSearchProvider(resolveAnysearchMemberOptions(
      { enabled: true, apiKeyEnv: 'ANYSEARCH_API_KEY' , keySelection: 'order' },
      async () => apiKey,
    ))
    expect(provider.available()).toBe(true)
    expect(provider.id).toBe('dshws-anysearch')
    const result = await provider.search({ query: 'DeepSeek Harness web search', maxResults: 5 })
    expect(result.sources.length).toBeGreaterThan(0)
    for (const source of result.sources) expect(source.url).toMatch(/^https?:\/\//u)
  }, 30_000)
})

describe('dshws-anysearch real-API default anchors', () => {
  it('keeps the documented endpoint anchor', () => {
    expect(ANYSEARCH_DEFAULT_BASE_URL).toBe('https://api.anysearch.com')
  })
})
