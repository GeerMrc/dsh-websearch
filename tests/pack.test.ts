import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { bareName, flipPatchInsertName, flipClientRegistrationId, withFlippedName } from '../scripts/pack.mjs'

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

  it('flips the patch insert name and the client registration id between forms, failing loud on missing anchors (v0.2.3 three-way pairing)', () => {
    const scoped = '@scope/pkg'
    const bare = 'pkg'

    const patch = ['comment:', '- insert:', '    - id: pkg', `      name: '${scoped}'`, ''].join('\n')
    const patchFlipped = flipPatchInsertName(patch, scoped, bare)
    expect(patchFlipped).toContain('name: pkg\n')
    expect(patchFlipped).not.toContain(`name: '${scoped}'`)
    expect(() => flipPatchInsertName(patch.replace(`name: '${scoped}'`, 'name: other'), scoped, bare))
      .toThrow(/insert-row name/)

    const client = 'window.__ModuleLoader__.load({\n\tid: "@scope/pkg",\n\tfactory: (require) => {'
    const clientFlipped = flipClientRegistrationId(client, scoped, bare)
    expect(clientFlipped).toContain('id: "pkg"')
    expect(clientFlipped).not.toContain('id: "@scope/pkg"')
    expect(() => flipClientRegistrationId('no banner here', scoped, bare)).toThrow(/registration id/)
  })

  it('still packs when invoked through a symlinked path, instead of exiting 0 with nothing packed', async () => {
    // Node resolves `import.meta.url` through symlinks but leaves `process.argv[1]` as typed
    // (macOS: /tmp → /private/tmp). A literal entry-point comparison turned the packer into a
    // silent no-op for every clone under such a path.
    const real = join(dir, 'real')
    await mkdir(join(real, 'scripts'), { recursive: true })
    await mkdir(join(real, 'lib'), { recursive: true })
    await writeFile(join(real, 'package.json'), '{"name":"@scope/pkg","version":"1.0.0"}\n')
    // The bare flip rewrites all three identity legs; lay down the other two.
    await writeFile(join(real, 'cordis.patch.yml'), `- insert:\n    - id: pkg\n      name: '@scope/pkg'\n`)
    await writeFile(join(real, 'lib', 'client.js'), 'window.__ModuleLoader__.load({\n\tid: "@scope/pkg",\n\tfactory: (require) => { /* body */ return module.exports; } });\n')
    await copyFile(new URL('../scripts/pack.mjs', import.meta.url), join(real, 'scripts', 'pack.mjs'))
    const link = join(dir, 'link')
    await symlink(real, link, 'dir')

    // npm's own log directory is redirected so the two real packs leave nothing under the user's home.
    const result = spawnSync(process.execPath, [join(link, 'scripts', 'pack.mjs')], {
      encoding: 'utf8',
      env: { ...process.env, npm_config_cache: join(dir, 'npm-cache') },
    })

    expect(result.stdout).toMatch(/packed scope-pkg-1\.0\.0\.tgz \+ pkg-1\.0\.0\.tgz/)
    expect(existsSync(join(real, 'dist-artifacts', 'scope-pkg-1.0.0.tgz'))).toBe(true)
    const bareTarball = join(real, 'dist-artifacts', 'pkg-1.0.0.tgz')
    expect(existsSync(bareTarball)).toBe(true)

    // The bare tarball must carry the bare identity on ALL three legs.
    const bareExtract = spawnSync('tar', ['-xzOf', bareTarball, 'package/package.json', ], { encoding: 'utf8' })
    expect(bareExtract.stdout).toMatch(/"name":\s*"pkg"/)
    const barePatch = spawnSync('tar', ['-xzOf', bareTarball, 'package/cordis.patch.yml'], { encoding: 'utf8' })
    expect(barePatch.stdout).toContain('name: pkg')
    expect(barePatch.stdout).not.toContain('@scope/pkg')
    const bareClient = spawnSync('tar', ['-xzOf', bareTarball, 'package/lib/client.js'], { encoding: 'utf8' })
    expect(bareClient.stdout).toContain('id: "pkg"')
    expect(bareClient.stdout).not.toContain('id: "@scope/pkg"')

    // The scoped tarball keeps the scoped identity on all three legs.
    const scopedTarball = join(real, 'dist-artifacts', 'scope-pkg-1.0.0.tgz')
    const scopedPatch = spawnSync('tar', ['-xzOf', scopedTarball, 'package/cordis.patch.yml'], { encoding: 'utf8' })
    expect(scopedPatch.stdout).toContain(`name: '@scope/pkg'`)
    const scopedClient = spawnSync('tar', ['-xzOf', scopedTarball, 'package/lib/client.js'], { encoding: 'utf8' })
    expect(scopedClient.stdout).toContain('id: "@scope/pkg"')

    // And the working tree is restored byte-identical on all three files.
    expect(await readFile(join(real, 'cordis.patch.yml'), 'utf8')).toContain(`name: '@scope/pkg'`)
    expect(await readFile(join(real, 'lib', 'client.js'), 'utf8')).toContain('id: "@scope/pkg"')
  }, 20_000)
})
