import { describe, expect, it } from 'vitest'
import { BUILT_IN_MEMBER_ORDER, Config, resolveConfig } from '../src/config.ts'

describe('resolveConfig', () => {
  it('applies the built-in member order to empty chains (ADR-0004)', () => {
    const resolved = resolveConfig({})
    expect(BUILT_IN_MEMBER_ORDER).toEqual([
      'dshws-tavily',
      'dshws-exa',
      'dshws-perplexity',
      'dshws-firecrawl',
      'dshws-deepseek',
    ])
    expect(resolved.searchChain).toEqual(BUILT_IN_MEMBER_ORDER)
    expect(resolved.fetchChain).toEqual(BUILT_IN_MEMBER_ORDER)
  })

  it('keeps an explicit chain verbatim, tolerating member ids that are not registered yet', () => {
    const resolved = resolveConfig({ searchChain: ['dshws-deepseek', 'dshws-not-registered-yet'] })
    expect(resolved.searchChain).toEqual(['dshws-deepseek', 'dshws-not-registered-yet'])
  })

  it('resolves search and fetch chains independently', () => {
    const resolved = resolveConfig({ searchChain: ['dshws-exa'], fetchChain: ['dshws-firecrawl'] })
    expect(resolved.searchChain).toEqual(['dshws-exa'])
    expect(resolved.fetchChain).toEqual(['dshws-firecrawl'])
  })

  it('defaults perMemberTimeoutMs to 30000 and keeps an explicit budget', () => {
    expect(resolveConfig({}).perMemberTimeoutMs).toBe(30000)
    expect(resolveConfig({ perMemberTimeoutMs: 500 }).perMemberTimeoutMs).toBe(500)
  })

  it('defaults every provider section to enabled with its credential-ref env name', () => {
    const resolved = resolveConfig({})
    expect(resolved.deepseek).toEqual({ enabled: true, apiKeyEnv: 'DEEPSEEK_API_KEY' })
    expect(resolved.tavily).toEqual({ enabled: true, apiKeyEnv: 'TAVILY_API_KEY' })
    expect(resolved.firecrawl).toEqual({ enabled: true, apiKeyEnv: 'FIRECRAWL_API_KEY' })
    expect(resolved.exa).toEqual({ enabled: true, apiKeyEnv: 'EXA_API_KEY' })
    expect(resolved.perplexity).toEqual({ enabled: true, apiKeyEnv: 'PERPLEXITY_API_KEY' })
  })

  it('honors explicit provider section overrides and passes provider options through', () => {
    const resolved = resolveConfig({
      tavily: { enabled: false },
      exa: { apiKeyEnv: 'MY_EXA_KEY', baseURL: 'https://exa.example', numResults: 7 },
    })
    expect(resolved.tavily.enabled).toBe(false)
    expect(resolved.exa).toEqual({
      enabled: true,
      apiKeyEnv: 'MY_EXA_KEY',
      baseURL: 'https://exa.example',
      numResults: 7,
    })
  })
})

describe('Config schema', () => {
  it('normalizes an empty configuration object to the structural skeleton', () => {
    expect(Config({})).toEqual({
      searchChain: [],
      fetchChain: [],
      deepseek: {},
      tavily: {},
      firecrawl: {},
      exa: {},
      perplexity: {},
    })
  })

  it('rejects a timeout budget that is not a positive integer', () => {
    expect(() => Config({ perMemberTimeoutMs: 0 })).toThrow()
    expect(() => Config({ perMemberTimeoutMs: 1.5 })).toThrow()
    expect(() => Config({ perMemberTimeoutMs: -5 })).toThrow()
  })

  it('rejects a chain entry that is not a string at runtime', () => {
    // The static Config type already rejects non-strings; the cast targets the
    // runtime validator, which guards config loaded from YAML files.
    const hostile = { searchChain: ['dshws-tavily', 42] } as unknown as Config
    expect(() => Config(hostile)).toThrow()
  })
})
