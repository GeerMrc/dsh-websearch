import { describe, expect, it } from 'vitest'
import { BUILT_IN_MEMBER_ORDER, Config, ORDERABLE_SEARCH_MEMBER_ORDER, resolveConfig } from '../src/config.ts'

describe('resolveConfig', () => {
  it('applies the built-in member order to empty chains — five tools, no appended tail (ADR-0014)', () => {
    const resolved = resolveConfig({})
    expect(BUILT_IN_MEMBER_ORDER).toEqual([
      'dshws-tavily',
      'dshws-exa',
      'dshws-perplexity',
      'dshws-firecrawl',
      'dshws-anysearch',
    ])
    // The chain's last ready member IS the fallback; nothing is appended by default.
    expect(resolved.searchChain).toEqual(ORDERABLE_SEARCH_MEMBER_ORDER)
    expect(resolved.fallbackMember).toBe('auto')
    expect(resolved.fetchChain).toEqual(ORDERABLE_SEARCH_MEMBER_ORDER)
  })

  it('keeps an explicit chain verbatim, tolerating member ids that are not registered yet', () => {
    const resolved = resolveConfig({ searchChain: ['dshws-deepseek', 'dshws-not-registered-yet'] })
    // Dead ids (pre-S14c deepseek tail; the deleted free floor) are stripped,
    // never re-appended — deepseek joins only through the runtime guard.
    expect(resolved.searchChain).toEqual(['dshws-not-registered-yet'])
  })

  it('resolves search and fetch chains independently', () => {
    const resolved = resolveConfig({ searchChain: ['dshws-exa'], fetchChain: ['dshws-firecrawl'] })
    expect(resolved.searchChain).toEqual(['dshws-exa'])
    expect(resolved.fetchChain).toEqual(['dshws-firecrawl'])
  })

  it('pins a designated tool member at the tail, stripped from the rotation (ADR-0014)', () => {
    const designated = resolveConfig({ fallbackMember: 'dshws-exa' })
    expect(designated.searchChain).toEqual(['dshws-tavily', 'dshws-perplexity', 'dshws-firecrawl', 'dshws-anysearch', 'dshws-exa'])
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
    expect(resolved.tavily).toEqual({ enabled: true, apiKeyEnv: 'TAVILY_API_KEY', keySelection: 'round-robin' })
    expect(resolved.firecrawl).toEqual({ enabled: true, apiKeyEnv: 'FIRECRAWL_API_KEY', keySelection: 'round-robin' })
    expect(resolved.exa).toEqual({ enabled: true, apiKeyEnv: 'EXA_API_KEY', keySelection: 'round-robin' })
    expect(resolved.perplexity).toEqual({ enabled: true, apiKeyEnv: 'PERPLEXITY_API_KEY', keySelection: 'round-robin' })
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
