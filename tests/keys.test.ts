import { describe, expect, it } from 'vitest'
import { KeyPool } from '../src/keys.ts'
import type { KeyPoolPorts } from '../src/keys.ts'
import { MEMBER_ERROR_CODES } from '../src/errors.ts'

/**
 * Fake of the pool's credential face: a readiness set (the gate's describe
 * cache) plus a per-ref value table (the service's per-operation resolve).
 * `refs`/`selection` are plain mutable cells so tests flip the live state the
 * way a settings commit would.
 */
function makePool(overrides: {
  refs?: string[]
  selection?: 'order' | 'round-robin' | 'random'
  ready?: string[]
  values?: Record<string, string | undefined>
  rng?: () => number
} = {}) {
  const refs = overrides.refs ?? ['TAVILY_API_KEY']
  const selection = overrides.selection ?? 'order'
  const ready = new Set(overrides.ready ?? refs)
  const values: Record<string, string | undefined> = { ...overrides.values }
  const ports: KeyPoolPorts = {
    refs: () => refs,
    selection: () => selection,
    isReady: (ref) => ready.has(ref),
    resolve: async (ref) => values[ref],
    label: 'Tavily',
    codes: MEMBER_ERROR_CODES.tavily,
    ...(overrides.rng !== undefined ? { rng: overrides.rng } : {}),
  }
  const pool = new KeyPool(ports)
  return {
    pool,
    setReady: (ref: string, isReady: boolean) => {
      if (isReady) ready.add(ref)
      else ready.delete(ref)
    },
    setValue: (ref: string, value: string | undefined) => {
      values[ref] = value
    },
  }
}

const codes = MEMBER_ERROR_CODES.tavily

describe('KeyPool (ADR-0008)', () => {
  it('order picks the first ready ref and skips an unready head', async () => {
    const { pool } = makePool({
      refs: ['TAVILY_API_KEY', 'TAVILY_API_KEY_2'],
      ready: ['TAVILY_API_KEY_2'],
      values: { TAVILY_API_KEY_2: 'key-two' },
    })
    await expect(pool.resolveApiKey()).resolves.toBe('key-two')
  })

  it('order keeps serving the head while it stays ready (single-ref behavior unchanged)', async () => {
    const { pool, setValue } = makePool({ refs: ['TAVILY_API_KEY', 'TAVILY_API_KEY_2'] })
    setValue('TAVILY_API_KEY', 'key-one')
    await expect(pool.resolveApiKey()).resolves.toBe('key-one')
    await expect(pool.resolveApiKey()).resolves.toBe('key-one')
  })

  it('round-robin rotates across the ready refs in pool order', async () => {
    const { pool } = makePool({
      refs: ['TAVILY_API_KEY', 'TAVILY_API_KEY_2', 'TAVILY_API_KEY_3'],
      values: { TAVILY_API_KEY: 'k1', TAVILY_API_KEY_2: 'k2', TAVILY_API_KEY_3: 'k3' },
      selection: 'round-robin',
    })
    const seen: string[] = []
    for (let index = 0; index < 3; index += 1) seen.push(await pool.resolveApiKey())
    expect(seen).toEqual(['k1', 'k2', 'k3'])
  })

  it('round-robin keeps rotating modulo the ready set when it shrinks and regrows', async () => {
    const { pool, setReady, setValue } = makePool({
      refs: ['TAVILY_API_KEY', 'TAVILY_API_KEY_2'],
      values: { TAVILY_API_KEY: 'k1', TAVILY_API_KEY_2: 'k2' },
      selection: 'round-robin',
    })
    expect(await pool.resolveApiKey()).toBe('k1')
    setReady('TAVILY_API_KEY', false)
    setValue('TAVILY_API_KEY_2', 'k2b')
    expect(await pool.resolveApiKey()).toBe('k2b')
    setReady('TAVILY_API_KEY', true)
    setValue('TAVILY_API_KEY', 'k1b')
    // The cursor rebuilt modulo the ready sequence in pool order.
    expect(await pool.resolveApiKey()).toBe('k1b')
    expect(await pool.resolveApiKey()).toBe('k2b')
  })

  it('random samples inside the ready set through the injected rng', async () => {
    const head = makePool({
      refs: ['TAVILY_API_KEY', 'TAVILY_API_KEY_2'],
      values: { TAVILY_API_KEY: 'k1', TAVILY_API_KEY_2: 'k2' },
      selection: 'random',
      rng: () => 0,
    })
    await expect(head.pool.resolveApiKey()).resolves.toBe('k1')
    const tail = makePool({
      refs: ['TAVILY_API_KEY', 'TAVILY_API_KEY_2'],
      values: { TAVILY_API_KEY: 'k1', TAVILY_API_KEY_2: 'k2' },
      selection: 'random',
      rng: () => 0.999,
    })
    await expect(tail.pool.resolveApiKey()).resolves.toBe('k2')
  })

  it('an empty ready set fails loud naming the primary and the whole pool', async () => {
    const { pool } = makePool({
      refs: ['TAVILY_API_KEY', 'TAVILY_API_KEY_2'],
      ready: [],
    })
    const thrown = await pool.resolveApiKey().then(() => null, (error: unknown) => error as Error)
    expect(thrown).not.toBeNull()
    const failure = thrown as unknown as { code: string; message: string }
    expect(failure.code).toBe(codes.credentialMissing)
    expect(failure.message).toContain('TAVILY_API_KEY')
    expect(failure.message).toContain('TAVILY_API_KEY_2')
  })

  it('a selected ref whose value vanished after the gate read fails loud naming that ref', async () => {
    const { pool } = makePool({
      refs: ['TAVILY_API_KEY', 'TAVILY_API_KEY_2'],
      values: {},
    })
    const thrown = await pool.resolveApiKey().then(() => null, (error: unknown) => error as Error)
    expect((thrown as unknown as { code: string }).code).toBe(codes.credentialMissing)
    expect(thrown!.message).toContain('TAVILY_API_KEY')
  })

  it('a rejecting resolver surfaces as the member request-failure code', async () => {
    const ports: KeyPoolPorts = {
      refs: () => ['TAVILY_API_KEY'],
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
    const { pool } = makePool({ refs: ['TAVILY_API_KEY'], ready: [] })
    const controller = new AbortController()
    controller.abort()
    const thrown = await pool.resolveApiKey(controller.signal).then(() => null, (error: unknown) => error as Error)
    expect((thrown as unknown as { code: string }).code).toBe(codes.aborted)
  })
})
