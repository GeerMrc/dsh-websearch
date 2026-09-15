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
