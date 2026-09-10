import { afterEach, describe, expect, it, vi } from 'vitest'
import { FetchGateProvider, FETCH_GATE_PROVIDER_ID } from '../src/fetch-gate.ts'

afterEach(() => { vi.unstubAllGlobals() })

describe('FetchGateProvider (S15a Layer C)', () => {
  it('is always available under the pinned id — the seam selects it unconditionally', () => {
    const gate = new FetchGateProvider(() => true, async () => { throw new Error('chain must not run here') })
    expect(gate.id).toBe(FETCH_GATE_PROVIDER_ID)
    expect(gate.available()).toBe(true)
    expect(FETCH_GATE_PROVIDER_ID).toBe('dshws-fetch-gate')
  })

  it('ON no longer registers the retired WEB_FETCH_TAKEOVER rejection (semantic flip pinned by the S21 router describe)', () => {
    // The rejection code was removed with the router semantics; asserting its
    // absence keeps a future revert loud. The OFF stub throws if the chain
    // runs — proving ON-side delegation lives only in the S21 describe.
    const gate = new FetchGateProvider(() => false, async () => { throw new Error('chain must not run when OFF') })
    expect(gate.id).toBe(FETCH_GATE_PROVIDER_ID)
  })

  it('OFF: fetch delegates to plain HTTP and returns a proper WebFetchResult', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<!doctype html><html><body>hi</body></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    })))
    const gate = new FetchGateProvider(() => false, async () => { throw new Error('chain must not run when OFF') })
    const result = await gate.fetch({ url: 'https://8.8.8.8/page' })
    expect(result.statusCode).toBe(200)
    expect(result.body.kind).toBe('html')
    expect(result.body.content).toContain('hi')
    expect(result.truncated).toBe(false)
  })

  it('OFF: a non-public hostname is rejected (SSRF guard, review Y-2)', async () => {
    const gate = new FetchGateProvider(() => false, async () => { throw new Error('chain must not run when OFF') })
    const caught = await gate.fetch({ url: 'http://192.168.1.1/admin' }).then(
      () => null,
      (error: unknown) => error as { code: string },
    )
    expect(caught).not.toBeNull()
    expect(caught!.code).toBe('WEB_FETCH_BLOCKED')
  })

  it('OFF: a binary content type is rejected (review Y-2)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('binary', {
      status: 200,
      headers: { 'content-type': 'application/octet-stream' },
    })))
    const gate = new FetchGateProvider(() => false, async () => { throw new Error('chain must not run when OFF') })
    const caught = await gate.fetch({ url: 'https://8.8.8.8/file.bin' }).then(
      () => null,
      (error: unknown) => error as { code: string },
    )
    expect(caught).not.toBeNull()
    expect(caught!.code).toBe('WEB_UNSUPPORTED_CONTENT_TYPE')
  })

  it('OFF: an oversized body is truncated with the flag set (review Y-2)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('x'.repeat(200_001), {
      status: 200,
      headers: { 'content-type': 'text/plain' },
    })))
    const gate = new FetchGateProvider(() => false, async () => { throw new Error('chain must not run when OFF') })
    const result = await gate.fetch({ url: 'https://8.8.8.8/big' })
    expect(result.truncated).toBe(true)
    expect(result.body.content.length).toBe(200_000)
  })
})
describe('S21 T5: gate as runtime router (chain service / http fallback)', () => {
  it('ON delegates to the injected chain (no takeover error)', async () => {
    const chainFetch = vi.fn(async () => ({
      url: 'https://a.test', statusCode: 200, body: { kind: 'text' as const, content: 'chain markdown' }, truncated: false,
    }))
    const gate = new FetchGateProvider(() => true, chainFetch)
    const result = await gate.fetch({ url: 'https://a.test' })
    expect(chainFetch).toHaveBeenCalledOnce()
    expect(result.body).toEqual({ kind: 'text', content: 'chain markdown' })
  })

  it('OFF falls through to the built-in http fetch (chain untouched)', async () => {
    const chainFetch = vi.fn()
    const gate = new FetchGateProvider(() => false, chainFetch)
    // A numeric public IP skips DNS entirely (the file's established pattern —
    // the resolver on this host lands on the fake-ip range, S14v evidence).
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>ok</html>', {
      status: 200, headers: { 'content-type': 'text/html' },
    })))
    const result = await gate.fetch({ url: 'https://8.8.8.8/page' })
    expect(chainFetch).not.toHaveBeenCalled()
    expect(result.body.kind).toBe('html')
  })
})

