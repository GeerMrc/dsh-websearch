import { describe, expect, it } from 'vitest'
import { EXA_DEFAULT_BASE_URL, EXA_MEMBER_ID, ExaSearchProvider, resolveExaMemberOptions } from '../../src/providers/exa.ts'

/**
 * Real-API smoke for the `dshws-exa` member. Self-skips without
 * `$EXA_API_KEY` (CI and local runs without a key skip; per the with-key
 * e2e policy). The key reaches the provider through the same seam the plugin
 * wires in production — a per-operation resolve thunk — here backed by the
 * process environment instead of the credentials service, so no credential
 * store is touched.
 */
const apiKey = process.env.EXA_API_KEY
const maybe = apiKey !== undefined && apiKey.length > 0 ? describe : describe.skip

maybe('dshws-exa real API', () => {
  it('returns sources for a live query', async () => {
    const provider = new ExaSearchProvider(resolveExaMemberOptions(
      { enabled: true, apiKeyEnv: 'EXA_API_KEY' },
      async () => apiKey,
    ))
    expect(provider.available()).toBe(true)
    expect(provider.id).toBe(EXA_MEMBER_ID)
    const result = await provider.search({ query: 'DeepSeek Harness web search', maxResults: 5 })
    expect(result.sources.length).toBeGreaterThan(0)
    for (const source of result.sources) expect(source.url).toMatch(/^https?:\/\//u)
  }, 30_000)
})

describe('dshws-exa real-API default anchors', () => {
  it('keeps the documented endpoint anchor', () => {
    expect(EXA_DEFAULT_BASE_URL).toBe('https://api.exa.ai')
  })
})
