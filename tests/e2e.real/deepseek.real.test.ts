import { describe, expect, it } from 'vitest'
import { DeepSeekSearchProvider, DEEPSEEK_DEFAULT_BASE_URL, DEEPSEEK_DEFAULT_MODEL, resolveDeepSeekMemberOptions } from '../../src/providers/deepseek.ts'

/**
 * Real-API smoke for the `dshws-deepseek` member. Self-skips without
 * `$DEEPSEEK_API_KEY` (CI and local runs without a key skip; per the
 * with-key e2e policy). The key reaches the provider through the same seam
 * the plugin wires in production — a per-operation resolve thunk — here
 * backed by the process environment instead of the credentials service, so
 * no credential store is touched.
 */
const apiKey = process.env.DEEPSEEK_API_KEY
const maybe = apiKey !== undefined && apiKey.length > 0 ? describe : describe.skip

maybe('dshws-deepseek real API', () => {
  it('returns sources for a live query', async () => {
    const provider = new DeepSeekSearchProvider(resolveDeepSeekMemberOptions(
      { enabled: true, apiKeyEnv: 'DEEPSEEK_API_KEY' },
      async () => apiKey,
    ))
    expect(provider.available()).toBe(true)
    expect(provider.id).toBe('dshws-deepseek')
    const result = await provider.search({ query: 'DeepSeek Harness web search', maxResults: 5 })
    expect(result.sources.length).toBeGreaterThan(0)
    for (const source of result.sources) expect(source.url).toMatch(/^https?:\/\//u)
  }, 120_000)
})

describe('dshws-deepseek real-API default anchors', () => {
  it('keeps the documented endpoint and model anchors', () => {
    expect(DEEPSEEK_DEFAULT_BASE_URL).toBe('https://api.deepseek.com/anthropic/v1')
    expect(DEEPSEEK_DEFAULT_MODEL).toBe('deepseek-v4-flash')
  })
})
