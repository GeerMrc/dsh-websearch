/**
 * Client-bundle identity contract (v0.2.3): the rc.5 client-modules pairing
 * is a three-way exact string equality — insert-row name == package manifest
 * name == the registration id built into `lib/client.js`'s
 * `window.__ModuleLoader__.load({ id })` banner. The host's shared client
 * preset stamps `id = manifest.name` the same way (host
 * `packages/client/tsdown.client.ts`, `const id = manifest.name`); this test
 * pins OUR client config to the same rule so no distribution form can drift.
 *
 * @module tests/client-identity
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import clientConfig from '../tsdown.client.config.ts'

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { name: string }
const config = clientConfig as { outputOptions?: { banner?: string } }

describe('client bundle registration id (three-way pairing leg 3)', () => {
  it('the load banner stamps the manifest name, not a hardcoded id', () => {
    expect(config.outputOptions?.banner).toContain(`id: ${JSON.stringify(manifest.name)}`)
  })
})
