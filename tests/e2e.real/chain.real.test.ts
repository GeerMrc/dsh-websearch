import { describe, expect, it } from 'vitest'
import type { WebSearchProvider } from '@deepseek-ai/dsh-web'
import { ChainSearchProvider, MemberRegistry } from '../../src/chain/core.ts'
import { DeepSeekSearchProvider, resolveDeepSeekMemberOptions } from '../../src/providers/deepseek.ts'

/**
 * Chain-level real-API smoke: the meta provider over the single deepseek
 * member, both wired exactly as production does (registry + resolver + env
 * key thunk). Self-skips without `$DEEPSEEK_API_KEY` (the e2e.real tier
 * policy); with a key it proves the chain's served-by attribution end to end
 * against the real backend — the tier the S03 fake tests and the per-member
 * smokes below do not cover.
 */
const apiKey = process.env.DEEPSEEK_API_KEY
const maybe = apiKey !== undefined && apiKey.length > 0 ? describe : describe.skip

maybe('dshws-chain real API (deepseek member)', () => {
  it('serves a real query through the chain with the served-by first line', async () => {
    const members = new MemberRegistry()
    const disposer = members.register(new DeepSeekSearchProvider(resolveDeepSeekMemberOptions(
      { enabled: true, apiKeyEnv: 'DEEPSEEK_API_KEY' },
      async () => apiKey,
    )))
    try {
      const chain = new ChainSearchProvider({
        members: members.toResolver(),
        order: ['dshws-deepseek'],
        perMemberTimeoutMs: 120_000,
        log: () => {},
      })
      expect(chain.available()).toBe(true)
      const result = await chain.search({ query: 'DeepSeek Harness web search', maxResults: 5 })
      expect(result.content?.split('\n')[0]).toBe('[served-by: dshws-deepseek]')
      expect(result.sources.length).toBeGreaterThan(0)
      for (const source of result.sources) expect(source.url).toMatch(/^https?:\/\//u)
    } finally {
      disposer()
    }
  }, 120_000)

  it('keeps the member type surface intact (search provider contract)', () => {
    const chain: WebSearchProvider = new ChainSearchProvider({
      members: new MemberRegistry().toResolver(),
      order: [],
      perMemberTimeoutMs: 1000,
    })
    expect(chain.id).toBe('dshws-chain')
  })
})
