import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { bareName, withFlippedName } from '../scripts/pack.mjs'

describe('scripts/pack.mjs dual-name helpers', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'dshws-pack-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('strips the scope for the bare name and is idempotent on bare input', () => {
    expect(bareName('@maricgeer/dsh-websearch')).toBe('dsh-websearch')
    expect(bareName('dsh-websearch')).toBe('dsh-websearch')
  })

  it('flips the name field on disk during fn and restores the file byte-identical afterwards', async () => {
    const pkgPath = join(dir, 'package.json')
    const original = [
      '{',
      '  "name": "@maricgeer/dsh-websearch",',
      '  "version": "0.2.0-rc.15"',
      '}',
    ].join('\n')
    await writeFile(pkgPath, original)

    let seenDuringFn = ''
    await withFlippedName(pkgPath, 'dsh-websearch', async () => {
      seenDuringFn = await readFile(pkgPath, 'utf8')
    })

    expect(seenDuringFn).toContain('"name": "dsh-websearch"')
    expect(seenDuringFn).not.toContain('@maricgeer/dsh-websearch')
    expect(await readFile(pkgPath, 'utf8')).toBe(original)
  })

  it('restores the original file even when fn throws, and rethrows the error', async () => {
    const pkgPath = join(dir, 'package.json')
    const original = '{"name": "@maricgeer/dsh-websearch"}'
    await writeFile(pkgPath, original)

    await expect(withFlippedName(pkgPath, 'dsh-websearch', async () => {
      throw new Error('pack exploded')
    })).rejects.toThrow('pack exploded')

    expect(await readFile(pkgPath, 'utf8')).toBe(original)
  })

  it('fails loud when no name field is present and leaves the file untouched', async () => {
    const pkgPath = join(dir, 'package.json')
    const original = '{"version": "0.2.0-rc.15"}'
    await writeFile(pkgPath, original)

    await expect(withFlippedName(pkgPath, 'dsh-websearch', async () => {}))
      .rejects.toThrow(/name field/)
    expect(await readFile(pkgPath, 'utf8')).toBe(original)
  })
})
