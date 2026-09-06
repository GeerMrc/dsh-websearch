import { describe, expect, it } from 'vitest'
import { KeyPool } from '../src/keys.ts'
import type { KeyPoolPorts } from '../src/keys.ts'
import { MEMBER_ERROR_CODES } from '../src/errors.ts'

/**
 * Single-slot comma-value pool (ADR-0011): the member has ONE credential ref
 * whose value is `k1,k2,...,kN`; the pool splits, trims, filters empties,
 * enforces the limit, and selects per policy. Behavior map from the S09
 * multi-ref form (plan 011 T2): #2/#7/#8 kept, #3/#5 rewritten onto the key
 * sequence, #1 rewritten as missing-value fail-loud, #4 cursor modulo on
 * value change, #6 empty/comma-only fail-loud, #9 limit overage added.
 */
function makePool(overrides: {
  selection?: 'order' | 'round-robin' | 'random'
  value?: string | undefined
  rng?: () => number
} = {}) {
  const selection = overrides.selection ?? 'order'
  let value = overrides.value
  const ports: KeyPoolPorts = {
    ref: () => 'TAVILY_API_KEY',
    selection: () => selection,
    isReady: () => value !== undefined && value.length > 0,
    resolve: async () => value,
    label: 'Tavily',
    codes: MEMBER_ERROR_CODES.tavily,
    ...(overrides.rng !== undefined ? { rng: overrides.rng } : {}),
  }
  const pool = new KeyPool(ports)
  return {
    pool,
    setValue: (next: string | undefined) => {
      value = next
    },
  }
}

const codes = MEMBER_ERROR_CODES.tavily

describe('KeyPool single-slot comma value (ADR-0011)', () => {
  it('serves the single key when the value has no comma (单 key 语义不变)', async () => {
    const { pool } = makePool({ value: 'k1' })
    await expect(pool.resolveApiKey()).resolves.toBe('k1')
    await expect(pool.resolveApiKey()).resolves.toBe('k1')
  })

  it('splits the comma value and rotates under round-robin', async () => {
    const { pool } = makePool({ value: 'k1, k2, k3', selection: 'round-robin' })
    const seen: string[] = []
    for (let index = 0; index < 3; index += 1) seen.push(await pool.resolveApiKey())
    expect(seen).toEqual(['k1', 'k2', 'k3'])
  })

  it('rebuilds the rotation modulo the new sequence when the value changes', async () => {
    const { pool, setValue } = makePool({ value: 'k1,k2', selection: 'round-robin' })
    expect(await pool.resolveApiKey()).toBe('k1')
    setValue('k1b')
    expect(await pool.resolveApiKey()).toBe('k1b')
    setValue('k1b,k2b')
    // Cursor modulo the new two-key sequence.
    expect(await pool.resolveApiKey()).toBe('k1b')
    expect(await pool.resolveApiKey()).toBe('k2b')
  })

  it('random samples inside the split sequence through the injected rng', async () => {
    const head = makePool({ value: 'k1,k2', selection: 'random', rng: () => 0 })
    await expect(head.pool.resolveApiKey()).resolves.toBe('k1')
    const tail = makePool({ value: 'k1,k2', selection: 'random', rng: () => 0.999 })
    await expect(tail.pool.resolveApiKey()).resolves.toBe('k2')
  })

  it('random draws without replacement within a deck cycle, reshuffling per cycle (ADR-0012 变体 B)', async () => {
    // rng ≡ 0 pins the ascending Fisher-Yates to the identity permutation, so the
    // deck order equals the split order and each cycle must serve k1,k2,k3 once.
    const { pool } = makePool({ value: 'k1,k2,k3', selection: 'random', rng: () => 0 })
    const firstCycle: string[] = []
    for (let index = 0; index < 3; index += 1) firstCycle.push(await pool.resolveApiKey())
    expect([...firstCycle].sort()).toEqual(['k1', 'k2', 'k3'])
    const secondCycle: string[] = []
    for (let index = 0; index < 3; index += 1) secondCycle.push(await pool.resolveApiKey())
    expect([...secondCycle].sort()).toEqual(['k1', 'k2', 'k3'])
  })

  it('rebuilds the random deck when the split sequence changes (热改池值)', async () => {
    const { pool, setValue } = makePool({ value: 'k1,k2,k3', selection: 'random', rng: () => 0 })
    expect(await pool.resolveApiKey()).toBe('k1')
    setValue('a1,a2')
    const after: string[] = []
    for (let index = 0; index < 2; index += 1) after.push(await pool.resolveApiKey())
    expect([...after].sort()).toEqual(['a1', 'a2'])
  })

  it('rebuilds the random deck when duplicate multiplicities shift (S13 阶段 4/5 🟡-1)', async () => {
    // k1,k1,k2 → k1,k2,k2 keeps the same key set; only the multiplicities move.
    // The stale deck [k1,k1,k2] must be rebuilt immediately (ADR-0012 D2): with
    // rng ≡ 0 the rebuilt identity deck draws k1 first — the stale deck's tail
    // would serve k2 and keep the old multiplicities until natural exhaustion.
    const { pool, setValue } = makePool({ value: 'k1,k1,k2', selection: 'random', rng: () => 0 })
    expect(await pool.resolveApiKey()).toBe('k1')
    expect(await pool.resolveApiKey()).toBe('k1')
    setValue('k1,k2,k2')
    expect(await pool.resolveApiKey()).toBe('k1')
    expect(await pool.resolveApiKey()).toBe('k2')
    expect(await pool.resolveApiKey()).toBe('k2')
  })

  it('a consumed draw is not re-offered to the next attempt (失败不回牌钉牌——S13 🟢 S14 T2 清偿)', async () => {
    // Contract pin (src/keys.ts #select): a failed request consumes its draw —
    // no same-member retry, the chain degrades instead. The pool has no
    // failure-feedback channel by design, so the observable is: the resolve
    // right after a (failed) attempt never re-serves the same card while
    // others remain, under both rotating policies.
    const rr = makePool({ value: 'k1,k2', selection: 'round-robin' })
    await rr.pool.resolveApiKey() // k1 — fails upstream, chain degrades
    await expect(rr.pool.resolveApiKey()).resolves.toBe('k2')
    const random = makePool({ value: 'k1,k2', selection: 'random', rng: () => 0 })
    await random.pool.resolveApiKey() // k1 — fails upstream
    await expect(random.pool.resolveApiKey()).resolves.toBe('k2')
  })

  it('fails loud naming the ref when the value is missing (主值未存)', async () => {
    const { pool } = makePool({ value: undefined })
    const thrown = await pool.resolveApiKey().then(() => null, (error: unknown) => error as Error)
    expect((thrown as unknown as { code: string }).code).toBe(codes.credentialMissing)
    expect(thrown!.message).toContain('TAVILY_API_KEY')
  })

  it('fails loud when the value is empty or comma-only after splitting (空/纯逗号)', async () => {
    for (const value of ['', ' , , ']) {
      const { pool } = makePool({ value })
      const thrown = await pool.resolveApiKey().then(() => null, (error: unknown) => error as Error)
      expect((thrown as unknown as { code: string }).code).toBe(codes.credentialMissing)
      expect(thrown!.message).toContain('TAVILY_API_KEY')
    }
  })

  it('enforces the 10-key limit with a loud overage error (#9)', async () => {
    const value = Array.from({ length: 11 }, (_, index) => `k${index}`).join(',')
    const { pool } = makePool({ value })
    const thrown = await pool.resolveApiKey().then(() => null, (error: unknown) => error as Error)
    expect((thrown as unknown as { code: string }).code).toBe(codes.requestFailed)
    expect(thrown!.message).toContain('10')
  })

  it('a rejecting resolver surfaces as the member request-failure code', async () => {
    const ports: KeyPoolPorts = {
      ref: () => 'TAVILY_API_KEY',
      selection: () => 'order',
      isReady: () => true,
      resolve: async () => {
        throw new Error('credentials store offline')
      },
      label: 'Tavily',
      codes,
    }
    const thrown = await new KeyPool(ports).resolveApiKey().then(() => null, (error: unknown) => error as Error)
    expect((thrown as unknown as { code: string }).code).toBe(codes.requestFailed)
  })

  it('a pre-aborted caller signal wins before any credential work', async () => {
    const { pool } = makePool({ value: 'k1' })
    const controller = new AbortController()
    controller.abort()
    const thrown = await pool.resolveApiKey(controller.signal).then(() => null, (error: unknown) => error as Error)
    expect((thrown as unknown as { code: string }).code).toBe(codes.aborted)
  })
})
