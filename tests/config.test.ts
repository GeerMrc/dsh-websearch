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
      'dshws-anysearch',
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
    expect(resolved.deepseek).toEqual({ enabled: true, apiKeyEnv: 'DEEPSEEK_API_KEY', extraApiKeyEnvs: [], keySelection: 'order' })
    expect(resolved.tavily).toEqual({ enabled: true, apiKeyEnv: 'TAVILY_API_KEY', extraApiKeyEnvs: [], keySelection: 'order' })
    expect(resolved.firecrawl).toEqual({ enabled: true, apiKeyEnv: 'FIRECRAWL_API_KEY', extraApiKeyEnvs: [], keySelection: 'order' })
    expect(resolved.exa).toEqual({ enabled: true, apiKeyEnv: 'EXA_API_KEY', extraApiKeyEnvs: [], keySelection: 'order' })
    expect(resolved.perplexity).toEqual({ enabled: true, apiKeyEnv: 'PERPLEXITY_API_KEY', extraApiKeyEnvs: [], keySelection: 'order' })
  })

  it('pools default to empty extras with order selection (ADR-0008)', () => {
    const resolved = resolveConfig({})
    for (const member of [resolved.tavily, resolved.exa, resolved.perplexity, resolved.firecrawl, resolved.deepseek]) {
      expect(member.extraApiKeyEnvs).toEqual([])
      expect(member.keySelection).toBe('order')
    }
  })

  it('passes through configured extra refs and key selection per member', () => {
    const resolved = resolveConfig({
      tavily: { extraApiKeyEnvs: ['TAVILY_API_KEY_2', 'TAVILY_POOL_BACKUP'], keySelection: 'round-robin' },
      deepseek: { extraApiKeyEnvs: ['DEEPSEEK_SPARE'], keySelection: 'random' },
    })
    expect(resolved.tavily.extraApiKeyEnvs).toEqual(['TAVILY_API_KEY_2', 'TAVILY_POOL_BACKUP'])
    expect(resolved.tavily.keySelection).toBe('round-robin')
    expect(resolved.deepseek.extraApiKeyEnvs).toEqual(['DEEPSEEK_SPARE'])
    expect(resolved.deepseek.keySelection).toBe('random')
    expect(resolved.exa.keySelection).toBe('order')
  })

  it('defaults the anysearch section like the other members (ADR-0009)', () => {
    const resolved = resolveConfig({})
    expect(resolved.anysearch).toEqual({
      enabled: true,
      apiKeyEnv: 'ANYSEARCH_API_KEY',
      extraApiKeyEnvs: [],
      keySelection: 'order',
    })
  })

  it('passes through anysearch overrides including zone (ADR-0009)', () => {
    const resolved = resolveConfig({
      anysearch: { apiKeyEnv: 'MY_ANYSEARCH_KEY', baseURL: 'https://anysearch.example', zone: 'cn' },
    })
    expect(resolved.anysearch).toEqual({
      enabled: true,
      apiKeyEnv: 'MY_ANYSEARCH_KEY',
      baseURL: 'https://anysearch.example',
      zone: 'cn',
      extraApiKeyEnvs: [],
      keySelection: 'order',
    })
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
      extraApiKeyEnvs: [],
      keySelection: 'order',
    })
  })
})

describe('Config schema', () => {
  it('normalizes an empty configuration object to the structural skeleton', () => {
    expect(Config({})).toEqual({
      searchChain: [],
      fetchChain: [],
      deepseek: { extraApiKeyEnvs: [] },
      tavily: { extraApiKeyEnvs: [] },
      firecrawl: { extraApiKeyEnvs: [] },
      exa: { extraApiKeyEnvs: [] },
      perplexity: { extraApiKeyEnvs: [] },
      anysearch: { extraApiKeyEnvs: [] },
    })
  })

  it('rejects a timeout budget that is not a positive integer', () => {
    expect(() => Config({ perMemberTimeoutMs: 0 })).toThrow()
    expect(() => Config({ perMemberTimeoutMs: 1.5 })).toThrow()
    expect(() => Config({ perMemberTimeoutMs: -5 })).toThrow()
  })

  it('rejects an invalid key selection at the schema', () => {
    // Runtime-only rejection surface: the static type already refuses these
    // shapes, so the casts target the YAML-facing validator.
    const bogus = { tavily: { keySelection: 'bogus' } } as unknown as Config
    const numeric = { exa: { keySelection: 42 } } as unknown as Config
    expect(() => Config(bogus)).toThrow()
    expect(() => Config(numeric)).toThrow()
  })

  it('rejects an invalid anysearch zone at the schema', () => {
    const hostile = { anysearch: { zone: 'mars' } } as unknown as Config
    expect(() => Config(hostile)).toThrow()
  })

  it('rejects a non-string extra pool ref at runtime', () => {
    // Same guard posture as the chain test: the runtime validator defends the
    // YAML-loaded config surface, the static type covers in-tree callers.
    const hostile = { tavily: { extraApiKeyEnvs: ['TAVILY_API_KEY_2', 42] } } as unknown as Config
    expect(() => Config(hostile)).toThrow()
  })

  it('rejects a chain entry that is not a string at runtime', () => {
    // The static Config type already rejects non-strings; the cast targets the
    // runtime validator, which guards config loaded from YAML files.
    const hostile = { searchChain: ['dshws-tavily', 42] } as unknown as Config
    expect(() => Config(hostile)).toThrow()
  })
})
