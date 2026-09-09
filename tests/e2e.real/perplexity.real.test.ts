import { describe, expect, it } from 'vitest'
import type { PerplexityMemberConfig } from '../../src/config.ts'
import {
  PERPLEXITY_DEFAULT_BASE_URL,
  PERPLEXITY_DEFAULT_MODEL,
  PERPLEXITY_MEMBER_ID,
  PerplexitySearchProvider,
  resolvePerplexityMemberOptions,
} from '../../src/providers/perplexity.ts'

/**
 * Real-API smoke for the `dshws-perplexity` member. Self-skips without
 * `$PERPLEXITY_API_KEY` (CI and local runs without a key skip; per the with-key
 * e2e policy). The key reaches the provider through the same seam the plugin
 * wires in production — a per-operation resolve thunk — here backed by the
 * process environment instead of the credentials service, so no credential
 * store is touched.
 */
const apiKey = process.env.PERPLEXITY_API_KEY
const maybe = apiKey !== undefined && apiKey.length > 0 ? describe : describe.skip

maybe('dshws-perplexity real API', () => {
  it('returns content and sources for a live query', async () => {
    const provider = new PerplexitySearchProvider(resolvePerplexityMemberOptions(
      { enabled: true, apiKeyEnv: 'PERPLEXITY_API_KEY'  },
      async () => apiKey,
    ))
    expect(provider.available()).toBe(true)
    expect(provider.id).toBe(PERPLEXITY_MEMBER_ID)
    const result = await provider.search({ query: 'DeepSeek Harness web search' })
    expect(result.sources.length).toBeGreaterThan(0)
    for (const source of result.sources) expect(source.url).toMatch(/^https?:\/\//u)
  }, 60_000)

  it('S17: raised maxTokens + recency filter serve a live answer', async () => {
    const provider = new PerplexitySearchProvider(resolvePerplexityMemberOptions(
      { enabled: true, apiKeyEnv: 'PERPLEXITY_API_KEY', maxTokens: 4096, searchRecencyFilter: 'month' } satisfies PerplexityMemberConfig,
      async () => apiKey,
    ))
    const result = await provider.search({ query: 'recent cordis framework releases' })
    expect(result.content).toBeDefined()
    expect(result.content!.length).toBeGreaterThan(0)
  }, 60_000)
})

describe('dshws-perplexity real-API default anchors', () => {
  it('keeps the documented endpoint and model anchors', () => {
    expect(PERPLEXITY_DEFAULT_BASE_URL).toBe('https://api.perplexity.ai')
    expect(PERPLEXITY_DEFAULT_MODEL).toBe('sonar')
  })
})
