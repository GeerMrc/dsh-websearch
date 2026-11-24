/**
 * Client-bundle identity contract (v0.2.3): the rc.5 client-modules pairing
 * is a three-way exact string equality — insert-row name == package manifest
 * name == the registration id built into `lib/client.js`'s
 * `window.__ModuleLoader__.load({ id })` banner. The host's shared client
 * preset stamps `id = manifest.name` the same way (host
 * `packages/client/tsdown.client.ts`, `const id = manifest.name`); this test
 * pins OUR client config to the same rule so no distribution form can drift.
 * The second test pins the BUILT artifact the same way (skipIf no build —
 * the key-counts.artifact precedent), so a bundler upgrade that changes the
 * banner output shape cannot ship a silently-wrong id (review finding 🟡-3).
 *
 * @module tests/client-identity
 */
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import clientConfig from '../tsdown.client.config.ts'

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { name: string }
const config = clientConfig as { outputOptions?: { banner?: string } }

describe('client bundle registration id (three-way pairing leg 3)', () => {
  it('the load banner stamps the manifest name, not a hardcoded id', () => {
    expect(config.outputOptions?.banner).toContain(`id: ${JSON.stringify(manifest.name)}`)
  })

  it.skipIf(!existsSync(new URL('../lib/client.js', import.meta.url)))(
    'the built artifact carries the manifest name as its registration id',
    () => {
      const built = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
      expect(built.slice(0, 200)).toContain(`id: ${JSON.stringify(manifest.name)},`)
    },
  )
})
