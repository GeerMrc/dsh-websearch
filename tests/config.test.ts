import { describe, expect, it } from 'vitest'
import { BUILT_IN_MEMBER_ORDER, Config, ORDERABLE_SEARCH_MEMBER_ORDER, resolveConfig } from '../src/config.ts'

describe('resolveConfig', () => {
  it('applies the built-in member order to empty chains — four tools (S19: perplexity removed), no appended tail (ADR-0014)', () => {
    const resolved = resolveConfig({})
    expect(BUILT_IN_MEMBER_ORDER).toEqual([
      'dshws-tavily',
      'dshws-exa',
      'dshws-firecrawl',
      'dshws-anysearch',
    ])
    // The chain's last ready member IS the fallback; nothing is appended by default.
    expect(resolved.searchChain).toEqual(ORDERABLE_SEARCH_MEMBER_ORDER)
    expect(resolved.fallbackMember).toBe('auto')
    expect(resolved.fetchChain).toEqual(['dshws-firecrawl', 'dshws-tavily', 'dshws-anysearch'])
  })

  it('keeps an explicit chain verbatim, tolerating member ids that are not registered yet', () => {
    const resolved = resolveConfig({ searchChain: ['dshws-deepseek', 'dshws-not-registered-yet'] })
    // Dead ids (pre-S14c deepseek tail; the deleted free floor) are stripped,
    // never re-appended — deepseek joins only through the runtime guard.
    expect(resolved.searchChain).toEqual(['dshws-not-registered-yet'])
  })

  it('S21: the fetch chain defaults to the fetch-capable three (Exa excluded, ADR-0019)', () => {
    const resolved = resolveConfig({})
    expect(resolved.fetchChain).toEqual(['dshws-firecrawl', 'dshws-tavily', 'dshws-anysearch'])
    // The search chain keeps the four orderable members (S19).
    expect(resolved.searchChain).toEqual(ORDERABLE_SEARCH_MEMBER_ORDER)
    // An explicit stored fetch chain survives verbatim (dead ids skipped at call time).
    expect(resolveConfig({ fetchChain: ['dshws-exa', 'dshws-tavily'] }).fetchChain).toEqual(['dshws-exa', 'dshws-tavily'])
  })

  it('resolves search and fetch chains independently', () => {
    const resolved = resolveConfig({ searchChain: ['dshws-exa'], fetchChain: ['dshws-firecrawl'] })
    expect(resolved.searchChain).toEqual(['dshws-exa'])
    expect(resolved.fetchChain).toEqual(['dshws-firecrawl'])
  })

  it('pins a designated tool member at the tail, stripped from the rotation (ADR-0014)', () => {
    const designated = resolveConfig({ fallbackMember: 'dshws-exa' })
    expect(designated.searchChain).toEqual(['dshws-tavily', 'dshws-firecrawl', 'dshws-anysearch', 'dshws-exa'])
    // A pinned chain naming the designated member elsewhere: same strip + pin.
    const pinned = resolveConfig({ searchChain: ['dshws-exa', 'dshws-tavily', 'dshws-firecrawl'], fallbackMember: 'dshws-exa' })
    expect(pinned.searchChain).toEqual(['dshws-tavily', 'dshws-firecrawl', 'dshws-exa'])
  })

  it('designating DeepSeek does NOT statically append it — participation is a runtime rule (ADR-0014)', () => {
    const resolved = resolveConfig({ fallbackMember: 'dshws-deepseek' })
    expect(resolved.searchChain).toEqual(ORDERABLE_SEARCH_MEMBER_ORDER)
    expect(resolved.fallbackMember).toBe('dshws-deepseek')
  })

  it('normalizes the legacy fallbackProvider alias and prefers an explicit fallbackMember (ADR-0014)', () => {
    expect(resolveConfig({ fallbackProvider: 'deepseek' }).fallbackMember).toBe('dshws-deepseek')
    for (const legacy of ['none', 'auto', 'fetch', undefined] as const) {
      expect(resolveConfig({ fallbackProvider: legacy }).fallbackMember).toBe('auto')
    }
    // Priority: fallbackMember (including its explicit 'auto') wins over the legacy field.
    expect(resolveConfig({ fallbackMember: 'auto', fallbackProvider: 'deepseek' }).fallbackMember).toBe('auto')
  })

  it('S19: a stored fallbackMember naming the removed perplexity member is a legacy alias that normalizes to auto', () => {
    const resolved = resolveConfig({ fallbackMember: 'dshws-perplexity' })
    expect(resolved.fallbackMember).toBe('auto')
    // The dead id never reaches the chain either.
    expect(resolved.searchChain).not.toContain('dshws-perplexity')
  })

  it('rejects invalid fallback values fail-loud at the schema (ADR-0014)', () => {
    expect(() => Config({ fallbackMember: 'banana' as never })).toThrow()
    expect(() => Config({ fallbackProvider: 'banana' as never })).toThrow()
  })

  it('defaults perMemberTimeoutMs to 30000 and keeps an explicit budget', () => {
    expect(resolveConfig({}).perMemberTimeoutMs).toBe(30000)
    expect(resolveConfig({ perMemberTimeoutMs: 500 }).perMemberTimeoutMs).toBe(500)
  })

  it('defaults every provider section to enabled with its credential-ref env name', () => {
    const resolved = resolveConfig({})
    expect(resolved.deepseek).toEqual({ enabled: false, apiKeyEnv: 'DEEPSEEK_API_KEY', keySelection: 'round-robin' })
    // S17 D4: tavily's answer feature defaults ON at the basic tier.
    expect(resolved.tavily).toEqual({ enabled: true, apiKeyEnv: 'TAVILY_API_KEY', keySelection: 'round-robin', includeAnswer: 'basic' })
    expect(resolved.firecrawl).toEqual({ enabled: true, apiKeyEnv: 'FIRECRAWL_API_KEY', keySelection: 'round-robin' })
    // S17 D4: exa's text fallback defaults ON (丢结果修复).
    expect(resolved.exa).toEqual({ enabled: true, apiKeyEnv: 'EXA_API_KEY', keySelection: 'round-robin', textFallback: true })
  })

  describe('S17 P1 parameter defaults and passthrough', () => {
    it('tavily: includeAnswer defaults basic; topic/timeRange/searchDepth absent until set', () => {
      const resolved = resolveConfig({})
      expect(resolved.tavily.includeAnswer).toBe('basic')
      expect(resolved.tavily.topic).toBeUndefined()
      expect(resolved.tavily.timeRange).toBeUndefined()
      expect(resolved.tavily.searchDepth).toBeUndefined()
    })

    it('tavily: explicit S17 fields pass through untouched', () => {
      const resolved = resolveConfig({
        tavily: { topic: 'news', timeRange: 'month', searchDepth: 'advanced', includeAnswer: 'advanced' },
      })
      expect(resolved.tavily.topic).toBe('news')
      expect(resolved.tavily.timeRange).toBe('month')
      expect(resolved.tavily.searchDepth).toBe('advanced')
      expect(resolved.tavily.includeAnswer).toBe('advanced')
    })

    it('tavily: invalid S17 enum values fail loud at the schema', () => {
      expect(() => Config({ tavily: { topic: 'banana' as never } })).toThrow()
      expect(() => Config({ tavily: { timeRange: 'decade' as never } })).toThrow()
      expect(() => Config({ tavily: { searchDepth: 'deep' as never } })).toThrow()
      expect(() => Config({ tavily: { includeAnswer: true as never } })).toThrow()
    })

    it('exa: textFallback defaults true (D4); type/startPublishedDate absent until set', () => {
      const resolved = resolveConfig({})
      expect(resolved.exa.textFallback).toBe(true)
      expect(resolved.exa.type).toBeUndefined()
      expect(resolved.exa.startPublishedDate).toBeUndefined()
    })

    it('exa: explicit type (current 6-value enum) and date floor pass through', () => {
      const resolved = resolveConfig({
        exa: { type: 'deep-reasoning', textFallback: false, startPublishedDate: '2026-01-15' },
      })
      expect(resolved.exa.type).toBe('deep-reasoning')
      expect(resolved.exa.textFallback).toBe(false)
      expect(resolved.exa.startPublishedDate).toBe('2026-01-15')
    })

    it('exa: removed enum values (keyword/neural) and bad types fail loud at the schema', () => {
      expect(() => Config({ exa: { type: 'keyword' as never } })).toThrow()
      expect(() => Config({ exa: { type: 'neural' as never } })).toThrow()
      expect(() => Config({ exa: { type: 'banana' as never } })).toThrow()
    })


    it('firecrawl: tbs/location absent until set; explicit values pass through; bad tbs fails loud', () => {
      expect(resolveConfig({}).firecrawl.tbs).toBeUndefined()
      expect(resolveConfig({}).firecrawl.location).toBeUndefined()
      const resolved = resolveConfig({ firecrawl: { tbs: 'qdr:m', location: 'Shanghai,China' } })
      expect(resolved.firecrawl.tbs).toBe('qdr:m')
      expect(resolved.firecrawl.location).toBe('Shanghai,China')
      expect(() => Config({ firecrawl: { tbs: 'last-week' as never } })).toThrow()
    })

    it("S20 T4: firecrawl member params — sources enum + clear sentinel, categories enum", () => {
      expect(resolveConfig({}).firecrawl.sources).toBeUndefined()
      expect(resolveConfig({}).firecrawl.categories).toBeUndefined()
      const resolved = resolveConfig({ firecrawl: { sources: 'web+news', categories: 'developer' } })
      expect(resolved.firecrawl.sources).toBe('web+news')
      expect(resolved.firecrawl.categories).toBe('developer')
      expect(resolveConfig({ firecrawl: { sources: '', categories: '' } }).firecrawl.sources).toBeUndefined()
      expect(resolveConfig({ firecrawl: { sources: '', categories: '' } }).firecrawl.categories).toBeUndefined()
      expect(() => Config({ firecrawl: { sources: 'images' as never } })).toThrow()
      expect(() => Config({ firecrawl: { categories: 'banana' as never } })).toThrow()
    })

    it("S20 T3: exa member params — category enum + clear sentinel, maxAgeHours bounds", () => {
      expect(resolveConfig({}).exa.category).toBeUndefined()
      expect(resolveConfig({}).exa.maxAgeHours).toBeUndefined()
      const resolved = resolveConfig({ exa: { category: 'financial report', maxAgeHours: 720 } })
      expect(resolved.exa.category).toBe('financial report')
      expect(resolved.exa.maxAgeHours).toBe(720)
      expect(resolveConfig({ exa: { category: '' } }).exa.category).toBeUndefined()
      expect(() => Config({ exa: { category: 'banana' as never } })).toThrow()
      expect(() => Config({ exa: { maxAgeHours: 721 } })).toThrow()
      expect(() => Config({ exa: { maxAgeHours: -2 } })).toThrow()
    })

    it('S20 T2: tavily member params — chunksPerSource bounds, filterByLanguage bool, includeDomainsMode enum', () => {
      const resolved = resolveConfig({ tavily: { chunksPerSource: 1, filterByLanguage: true, includeDomainsMode: 'boost' } })
      expect(resolved.tavily.chunksPerSource).toBe(1)
      expect(resolved.tavily.filterByLanguage).toBe(true)
      expect(resolved.tavily.includeDomainsMode).toBe('boost')
      expect(resolveConfig({}).tavily.chunksPerSource).toBeUndefined()
      expect(() => Config({ tavily: { chunksPerSource: 4 as never } })).toThrow()
      expect(() => Config({ tavily: { chunksPerSource: 0 } })).toThrow()
      expect(() => Config({ tavily: { includeDomainsMode: 'banana' as never } })).toThrow()
    })

    it('S20 T1: unified domain entry — comma strings parse to arrays; both set fails loud; blanks drop (ADR-0018)', () => {
      expect(resolveConfig({}).searchIncludeDomains).toEqual([])
      expect(resolveConfig({}).searchExcludeDomains).toEqual([])
      const resolved = resolveConfig({ searchIncludeDomains: ' example.com, *.foo.org , ' })
      expect(resolved.searchIncludeDomains).toEqual(['example.com', '*.foo.org'])
      expect(resolveConfig({ searchExcludeDomains: 'spam.test' }).searchExcludeDomains).toEqual(['spam.test'])
      // The two-lists-at-once state is rejected at the load boundary (cordis.yml path);
      // the settings path rejects it before persist through the validate hook.
      expect(() => resolveConfig({ searchIncludeDomains: 'a.test', searchExcludeDomains: 'b.test' })).toThrow(/include.*exclude|exclude.*include/i)
    })

    it('unified geo entry: absent by default; passthrough canonicalizes casing and drops blanks (ADR-0015)', () => {
      expect(resolveConfig({}).searchCountry).toBeUndefined()
      expect(resolveConfig({}).searchLanguage).toBeUndefined()
      const resolved = resolveConfig({ searchCountry: ' cn ', searchLanguage: 'ZH ' })
      expect(resolved.searchCountry).toBe('CN')
      expect(resolved.searchLanguage).toBe('zh')
      expect(resolveConfig({ searchCountry: '', searchLanguage: '' }).searchCountry).toBeUndefined()
      expect(resolveConfig({ searchCountry: '', searchLanguage: '' }).searchLanguage).toBeUndefined()
    })
  })

  it('passes through configured extra refs and key selection per member', () => {
    const resolved = resolveConfig({
      tavily: { keySelection: 'round-robin' },
      deepseek: { keySelection: 'random' },
    })
    expect(resolved.tavily.keySelection).toBe('round-robin')
    expect(resolved.deepseek.keySelection).toBe('random')
    expect(resolved.exa.keySelection).toBe('round-robin')
  })

  it('defaults the anysearch section like the other members (ADR-0009)', () => {
    const resolved = resolveConfig({})
    expect(resolved.anysearch).toEqual({
      enabled: true,
      apiKeyEnv: 'ANYSEARCH_API_KEY',
      keySelection: 'round-robin',
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
      keySelection: 'round-robin',
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
      keySelection: 'round-robin',
      // S17 D4: the text fallback default rides along on every resolution.
      textFallback: true,
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
      anysearch: {},
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

  it('rejects a chain entry that is not a string at runtime', () => {
    // The static Config type already rejects non-strings; the cast targets the
    // runtime validator, which guards config loaded from YAML files.
    const hostile = { searchChain: ['dshws-tavily', 42] } as unknown as Config
    expect(() => Config(hostile)).toThrow()
  })
})
