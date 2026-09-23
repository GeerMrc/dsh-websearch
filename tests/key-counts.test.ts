import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import { DshWsKeyCountsRemote } from '../src/key-counts.ts'

/** Build the service over value-table ports; allowed = the five member refs. */
function makeService(values: Record<string, string | undefined>, allowed = ['TAVILY_API_KEY', 'EXA_API_KEY', 'FIRECRAWL_API_KEY', 'DEEPSEEK_API_KEY', 'ANYSEARCH_API_KEY']) {
  const resolve = vi.fn(async (ref: string) => values[ref])
  const service = new DshWsKeyCountsRemote(new Context(), {
    allowedRefs: () => new Set(allowed),
    resolve,
  })
  return { service, resolve }
}

describe('DshWsKeyCountsRemote.describeKeyCounts', () => {
  it('counts trimmed, non-empty comma segments (the splitKeys rule)', async () => {
    const { service } = makeService({ TAVILY_API_KEY: ' k1 , k2 ,, k3 ,' })
    await expect(service.describeKeyCounts(['TAVILY_API_KEY'])).resolves.toEqual({ TAVILY_API_KEY: 3 })
  })

  it('answers 0 for an unconfigured whitelisted ref and never resolves its value', async () => {
    const { service, resolve } = makeService({})
    await expect(service.describeKeyCounts(['EXA_API_KEY'])).resolves.toEqual({ EXA_API_KEY: 0 })
    expect(resolve).toHaveBeenCalledWith('EXA_API_KEY')
  })

  it('answers 0 for refs outside the member whitelist (no cross-credential probing)', async () => {
    const { service, resolve } = makeService({ DEEPSEEK_API_KEY: 'sk-1' })
    await expect(service.describeKeyCounts(['DEEPSEEK_API_KEY', 'SOME_OTHER_SECRET'])).resolves.toEqual({
      DEEPSEEK_API_KEY: 1,
      SOME_OTHER_SECRET: 0,
    })
    // Only the whitelisted ref reached the resolver — the probe never resolves a value.
    expect(resolve.mock.calls.map(([ref]) => ref)).toEqual(['DEEPSEEK_API_KEY'])
  })

  it('reports counts above the pool cap verbatim (overage is the pool layer\'s loud failure, not this seam\'s)', async () => {
    const { service } = makeService({ TAVILY_API_KEY: 'a,b,c,d,e,f,g,h,i,j,k' })
    await expect(service.describeKeyCounts(['TAVILY_API_KEY'])).resolves.toEqual({ TAVILY_API_KEY: 11 })
  })

  it('a resolve failure answers the conservative 0 without failing the batch', async () => {
    const resolve = vi.fn(async () => { throw new Error('provider down') })
    const service = new DshWsKeyCountsRemote(new Context(), {
      allowedRefs: () => new Set(['TAVILY_API_KEY']),
      resolve,
    })
    await expect(service.describeKeyCounts(['TAVILY_API_KEY'])).resolves.toEqual({ TAVILY_API_KEY: 0 })
  })

  it('deduplicates repeated refs in one batch', async () => {
    const { service, resolve } = makeService({ TAVILY_API_KEY: 'k1,k2' })
    await expect(service.describeKeyCounts(['TAVILY_API_KEY', 'TAVILY_API_KEY'])).resolves.toEqual({ TAVILY_API_KEY: 2 })
    expect(resolve).toHaveBeenCalledTimes(1)
  })
})

describe('cross-generation strict codec (S32 ADR-0021 family, 3434 drill finding)', () => {
  it('carries BOTH the zod instance (0.1.5/0.1.6 clients parse inputs through codec.schema) and the create factory (0.1.7 loaders)', async () => {
    const { keyCountsContribution } = await import('../src/client/key-counts-remote.ts')
    const descriptor = keyCountsContribution.descriptors[0]
    const codec = descriptor.parameters[0].codec as unknown as Record<string, unknown>
    expect(codec.mode).toBe('strict')
    // 0.1.5/0.1.6 client: parseInput calls codec.schema.parse(value) — a
    // missing schema is an undefined.parse crash at call time (the silent
    // badge loss the 015rc3 drill caught).
    const schema = codec.schema as { _zod?: unknown, parse?: (value: unknown) => unknown }
    expect(schema).toBeDefined()
    expect('_zod' in schema).toBe(true)
    expect(typeof schema.parse).toBe('function')
    // 0.1.7 loader: requireStrictCodec demands create().
    const create = codec.create as () => unknown
    expect(typeof create).toBe('function')
    expect('_zod' in (create() as Record<string, unknown>)).toBe(true)
    // The result codec rides the same dual shape.
    const result = descriptor.result as unknown as Record<string, unknown>
    expect('_zod' in (result.schema as Record<string, unknown>)).toBe(true)
    expect(typeof result.create).toBe('function')
  })
})
