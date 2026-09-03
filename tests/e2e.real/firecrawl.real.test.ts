import { describe, expect, it } from 'vitest'
import {
  FIRECRAWL_DEFAULT_BASE_URL,
  FIRECRAWL_MEMBER_ID,
  FirecrawlProvider,
  resolveFirecrawlMemberOptions,
} from '../../src/providers/firecrawl.ts'

/**
 * Real-API smoke for the `dshws-firecrawl` member, both capability faces.
 * Self-skips without `$FIRECRAWL_API_KEY` (CI and local runs without a key
 * skip; per the with-key e2e policy). The key reaches the provider through
 * the same seam the plugin wires in production — a per-operation resolve
 * thunk — here backed by the process environment instead of the credentials
 * service, so no credential store is touched.
 */
const apiKey = process.env.FIRECRAWL_API_KEY
const maybe = apiKey !== undefined && apiKey.length > 0 ? describe : describe.skip

maybe('dshws-firecrawl real API', () => {
  it('returns sources for a live search query', async () => {
    const provider = new FirecrawlProvider(resolveFirecrawlMemberOptions(
      { enabled: true, apiKeyEnv: 'FIRECRAWL_API_KEY'  },
      async () => apiKey,
    ))
    expect(provider.available()).toBe(true)
    expect(provider.id).toBe(FIRECRAWL_MEMBER_ID)
    const result = await provider.search({ query: 'DeepSeek Harness web search', maxResults: 5 })
    expect(result.sources.length).toBeGreaterThan(0)
    for (const source of result.sources) expect(source.url).toMatch(/^https?:\/\//u)
  }, 60_000)

  it('fetches a page as text through the scrape face', async () => {
    const provider = new FirecrawlProvider(resolveFirecrawlMemberOptions(
      { enabled: true, apiKeyEnv: 'FIRECRAWL_API_KEY'  },
      async () => apiKey,
    ))
    const result = await provider.fetch({ url: 'https://example.com' })
    expect(result.statusCode).toBe(200)
    expect(result.body.kind).toBe('text')
    if (result.body.kind === 'text') expect(result.body.content.length).toBeGreaterThan(0)
  }, 60_000)
})

describe('dshws-firecrawl real-API default anchors', () => {
  it('keeps the documented endpoint anchor', () => {
    expect(FIRECRAWL_DEFAULT_BASE_URL).toBe('https://api.firecrawl.dev')
  })
})
