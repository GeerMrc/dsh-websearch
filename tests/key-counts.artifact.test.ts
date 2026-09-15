import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Built-artifact alignment smoke for the key-count Remote wire pair. The Host
 * gateway synthesizes the wire field from the BUILT `describeKeyCounts(refs)`
 * parameter list, and the client contribution hard-codes `wire: 'refs'` — a
 * bundler rename on either side breaks the pair only at the boundary. This
 * spec self-skips on a source-only tree; `pnpm build && pnpm test` covers it.
 */
const HOST_LIB = fileURLToPath(new URL('../lib/index.js', import.meta.url))
const CLIENT_LIB = fileURLToPath(new URL('../lib/client.js', import.meta.url))
/** A lib without the service at all is a stale pre-feature build, not a regression. */
const hostBuilt = existsSync(HOST_LIB) && readFileSync(HOST_LIB, 'utf8').includes('dshwsKeyCounts')
const clientBuilt = existsSync(CLIENT_LIB) && readFileSync(CLIENT_LIB, 'utf8').includes('dshws-websearch')

describe('built key-count remote artifacts (after pnpm build)', () => {
  it.skipIf(!hostBuilt)('host bundle keeps the describeKeyCounts(refs) parameter name', () => {
    expect(readFileSync(HOST_LIB, 'utf8')).toMatch(/describeKeyCounts\(\s*refs\b/)
  })

  it.skipIf(!clientBuilt)('client bundle keeps the refs wire field of the hand-written contribution', () => {
    expect(readFileSync(CLIENT_LIB, 'utf8')).toMatch(/wire:\s*["']refs["']/)
  })
})
