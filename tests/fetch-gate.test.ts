import { afterEach, describe, expect, it, vi } from 'vitest'
import { FetchGateProvider, FETCH_GATE_PROVIDER_ID } from '../src/fetch-gate.ts'

afterEach(() => { vi.unstubAllGlobals() })

describe('FetchGateProvider (S15a Layer C)', () => {
  it('is always available under the pinned id — the seam selects it unconditionally', () => {
    const gate = new FetchGateProvider(() => true)
    expect(gate.id).toBe(FETCH_GATE_PROVIDER_ID)
    expect(gate.available()).toBe(true)
    expect(FETCH_GATE_PROVIDER_ID).toBe('dshws-fetch-gate')
  })

  it('ON: fetch rejects with guidance naming web_search (review M2 pin)', async () => {
    const gate = new FetchGateProvider(() => true)
    const caught = await gate.fetch({ url: 'https://example.com' }).then(
      () => null,
      (error: unknown) => error as { code: string; message: string },
    )
    expect(caught).not.toBeNull()
    expect(caught!.code).toBe('WEB_FETCH_TAKEOVER')
    expect(caught!.message).toContain('web_search')
  })

  it('OFF: fetch delegates to plain HTTP and returns a proper WebFetchResult', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<!doctype html><html><body>hi</body></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    })))
    const gate = new FetchGateProvider(() => false)
    const result = await gate.fetch({ url: 'https://8.8.8.8/page' })
    expect(result.statusCode).toBe(200)
    expect(result.body.kind).toBe('html')
    expect(result.body.content).toContain('hi')
    expect(result.truncated).toBe(false)
  })

  it('OFF: a non-public hostname is rejected (SSRF guard, review Y-2)', async () => {
    const gate = new FetchGateProvider(() => false)
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
    const gate = new FetchGateProvider(() => false)
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
    const gate = new FetchGateProvider(() => false)
    const result = await gate.fetch({ url: 'https://8.8.8.8/big' })
    expect(result.truncated).toBe(true)
    expect(result.body.content.length).toBe(200_000)
  })
})
