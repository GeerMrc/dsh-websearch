import { describe, expect, it } from 'vitest'
import type { TavilyMemberConfig } from '../../src/config.ts'
import { TavilySearchProvider, TAVILY_DEFAULT_BASE_URL, resolveTavilyMemberOptions } from '../../src/providers/tavily.ts'

/**
 * Real-API smoke for the `dshws-tavily` member. Self-skips without
 * `$TAVILY_API_KEY` (CI and local runs without a key skip; per the with-key
 * e2e policy). The key reaches the provider through the same seam the plugin
 * wires in production — a per-operation resolve thunk — here backed by the
 * process environment instead of the credentials service, so no credential
 * store is touched.
 */
const apiKey = process.env.TAVILY_API_KEY
const maybe = apiKey !== undefined && apiKey.length > 0 ? describe : describe.skip

maybe('dshws-tavily real API', () => {
  it('returns sources for a live query', async () => {
    const provider = new TavilySearchProvider(resolveTavilyMemberOptions(
      { enabled: true, apiKeyEnv: 'TAVILY_API_KEY'  },
      async () => apiKey,
    ))
    expect(provider.available()).toBe(true)
    expect(provider.id).toBe('dshws-tavily')
    const result = await provider.search({ query: 'DeepSeek Harness web search', maxResults: 5 })
    expect(result.sources.length).toBeGreaterThan(0)
    for (const source of result.sources) expect(source.url).toMatch(/^https?:\/\//u)
  }, 30_000)

  it('S17: news topic + include_answer returns news sources and a synthesized answer (roadmap 验收例)', async () => {
    const provider = new TavilySearchProvider(resolveTavilyMemberOptions(
      { enabled: true, apiKeyEnv: 'TAVILY_API_KEY', topic: 'news', timeRange: 'month' } satisfies TavilyMemberConfig,
      async () => apiKey,
    ))
    const result = await provider.search({ query: 'latest AI news', maxResults: 5 })
    expect(result.sources.length).toBeGreaterThan(0)
    // The news topic carries published dates; the synthesized answer becomes content (S17 D4).
    expect(result.content).toBeDefined()
    expect(result.content!.length).toBeGreaterThan(0)
  }, 30_000)

  it('S21: extract face fetches a live URL as markdown', async () => {
    const provider = new TavilySearchProvider(resolveTavilyMemberOptions(
      { enabled: true, apiKeyEnv: 'TAVILY_API_KEY'  },
      async () => apiKey,
    ))
    const result = await provider.fetch({ url: 'https://example.com' })
    expect(result.statusCode).toBe(200)
    expect(result.body.kind).toBe('text')
    if (result.body.kind === 'text') expect(result.body.content).toContain('Example Domain')
  }, 30_000)
})

describe('dshws-tavily real-API default anchors', () => {
  it('keeps the documented endpoint anchor', () => {
    expect(TAVILY_DEFAULT_BASE_URL).toBe('https://api.tavily.com')
  })
})
