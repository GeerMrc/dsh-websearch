import { spawnSync } from 'node:child_process'
import { copyFile, mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  FORBIDDEN_ENTRY,
  REQUIRED_ENTRIES,
  changelogHasVersion,
  forbiddenEntries,
  identityProblems,
  main,
  missingRequiredEntries,
  tagMatchesVersion,
  tokenFiles,
  userAgentMatchesVersion,
} from '../scripts/check-release.mjs'

/**
 * Release consistency gate (ADR-0026). Nothing here trusts a substring: the
 * CHANGELOG rule reads only the first dated heading (the repository already
 * mentions an unprefixed "0.2.1" in an old entry), the tarball rule names the
 * file it misses, and every rule has a negative control that must fail.
 */
const VERSION = '0.2.1'

/**
 * A token-shaped value for the scanner's fixtures, built by interpolation so
 * this file never holds a matchable `token=<value>` literal: the release
 * gate's token scan covers the tests like every other tracked file.
 */
const FAKE_TOKEN = 'FAKEfake0FAKEfake1FAKEfake2FAKEfake3FAKEfake4FAKE'
const FAKE_TOKEN_URL = `dsh web: http://127.0.0.1:3434/?token=${FAKE_TOKEN}`

function git(cwd: string, ...args: string[]): void {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`)
}

/**
 * Stage every required entry under `<dir>/stage/package`, let `decorate` add or
 * change files, then pack the two distribution tarballs for VERSION into `<dir>`.
 */
async function packTarballs(dir: string, decorate: (stage: string, form: 'scoped' | 'bare') => Promise<void> | void = () => {}): Promise<void> {
  // Both distribution forms, each carrying its own three identity legs (PC6):
  // the scoped tarball all-scoped, the bare tarball all-bare.
  const forms = [
    { form: 'scoped' as const, file: `maricgeer-dsh-websearch-${VERSION}.tgz`, name: '@maricgeer/dsh-websearch' },
    { form: 'bare' as const, file: `dsh-websearch-${VERSION}.tgz`, name: 'dsh-websearch' },
  ]
  for (const { form, file, name } of forms) {
    const stage = join(dir, 'stage', form, 'package')
    for (const entry of REQUIRED_ENTRIES) {
      await mkdir(join(stage, entry, '..'), { recursive: true })
      await writeFile(join(stage, entry), 'x')
    }
    await writeFile(join(stage, 'package.json'), JSON.stringify({ name, version: VERSION }, null, 2))
    await writeFile(join(stage, 'cordis.patch.yml'), `- insert:\n    - id: dsh-websearch\n      name: ${name.startsWith('@') ? `'${name}'` : name}\n`)
    await writeFile(join(stage, 'lib', 'client.js'), `window.__ModuleLoader__.load({\n\tid: ${JSON.stringify(name)},\n\tfactory: (require) => { /* body */ return module.exports; } });\n`)
    await decorate(stage, form)
    const result = spawnSync('tar', ['-czf', join(dir, file), 'package'], { cwd: join(dir, 'stage', form), encoding: 'utf8' })
    if (result.status !== 0) throw new Error(result.stderr)
  }
}

/** Throwaway repositories made by `makeRepo` during the current test; removed in afterEach. */
const createdRepos: string[] = []

/** A throwaway git repository whose tracked files are the given map, committed on master. */
async function makeRepo(files: Record<string, string | Uint8Array>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'dshws-release-'))
  createdRepos.push(dir)
  for (const [path, content] of Object.entries(files)) {
    await mkdir(join(dir, path, '..'), { recursive: true })
    await writeFile(join(dir, path), content)
  }
  git(dir, 'init', '-q', '-b', 'master')
  git(dir, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'add', '.')
  git(dir, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'commit', '-q', '-m', 'init')
  return dir
}

describe('version rules', () => {
  it('accepts a tag only when it is the v-prefixed package version', () => {
    expect(tagMatchesVersion('v0.2.1', VERSION)).toBe(true)
    expect(tagMatchesVersion('0.2.1', VERSION)).toBe(false)
    expect(tagMatchesVersion('v0.2.0', VERSION)).toBe(false)
    expect(tagMatchesVersion('v0.2.1-beta.1', VERSION)).toBe(false)
    expect(tagMatchesVersion('v0.2.10', VERSION)).toBe(false)
  })

  it('requires the user agent to carry the package version', () => {
    const source = (version: string) => `export const USER_AGENT = 'dsh-websearch/${version}'`
    expect(userAgentMatchesVersion(source(VERSION), VERSION)).toBe(true)
    expect(userAgentMatchesVersion(source('0.2.0'), VERSION)).toBe(false)
  })

  it('reads the version from the first dated heading only', () => {
    expect(changelogHasVersion(`# Changelog\n\n## 2026-11-25 — v${VERSION} 发布\n`, VERSION)).toBe(true)
    expect(changelogHasVersion(`## 2026-11-25 — release v${VERSION} (fix)\n\n## 2026-09-09 — 0.2.1\n`, VERSION)).toBe(true)
  })

  it('is not satisfied by a historical mention of the bare version', () => {
    const historical = `# Changelog\n\n## 2026-09-30 — 官方桌面端采用批\n\n## 2026-09-09 — 全模式 web_fetch 接管 ${VERSION}\n`
    expect(changelogHasVersion(historical, VERSION)).toBe(false)
  })

  it('rejects a first dated heading that names another version or lacks the v prefix', () => {
    expect(changelogHasVersion(`## 2026-11-25 — v0.2.0 发布\n`, VERSION)).toBe(false)
    expect(changelogHasVersion(`## 2026-11-25 — ${VERSION} 发布\n`, VERSION)).toBe(false)
    expect(changelogHasVersion(`# Changelog\n\nno dated heading at all\n`, VERSION)).toBe(false)
  })
})

describe('tarball rules', () => {
  it('lists the required entries that are missing, by name', () => {
    expect(missingRequiredEntries(REQUIRED_ENTRIES)).toEqual([])
    const missing = missingRequiredEntries(REQUIRED_ENTRIES.filter((entry) => entry !== 'docs/plugin-page.en.md'))
    expect(missing).toEqual(['docs/plugin-page.en.md'])
  })

  it('flags internal governance documents and sources, never the two user documents', () => {
    expect(forbiddenEntries(['docs/plugin-page.zh.md', 'docs/plugin-page.en.md', 'lib/index.js'])).toEqual([])
    expect(forbiddenEntries(['docs/sessions/2026-11-23-session-41.md'])).toEqual(['docs/sessions/2026-11-23-session-41.md'])
    expect(forbiddenEntries(['src/index.ts', 'tests/patch.test.ts', 'scripts/pack.mjs'])).toHaveLength(3)
  })
})

describe('identity rules (three-way client identity, PC6)', () => {
  const scoped = '@maricgeer/dsh-websearch'
  const scopedPatch = `- insert:\n    - id: dsh-websearch\n      name: '${scoped}'\n`
  const barePatch = `- insert:\n    - id: dsh-websearch\n      name: dsh-websearch\n`
  const client = (id: string) => `window.__ModuleLoader__.load({\n\tid: ${JSON.stringify(id)},\n\tfactory: (require) => {`

  it('accepts matching legs in both quoting forms (scoped quoted, bare unquoted)', () => {
    expect(identityProblems(scoped, scopedPatch, client(scoped))).toEqual([])
    expect(identityProblems('dsh-websearch', barePatch, client('dsh-websearch'))).toEqual([])
  })

  it('rejects a drifting insert-row name or client registration id, naming the leg', () => {
    expect(identityProblems(scoped, barePatch, client(scoped))).toEqual([
      `cordis.patch.yml: insert-row name "dsh-websearch" does not match the manifest name "${scoped}" (three-way client identity, PC6)`,
    ])
    expect(identityProblems(scoped, scopedPatch, client('dsh-websearch'))).toEqual([
      `lib/client.js: registration id "dsh-websearch" does not match the manifest name "${scoped}" (three-way client identity, PC6)`,
    ])
  })

  it('rejects unreadable legs rather than passing silently', () => {
    expect(identityProblems(scoped, 'nameless', client(scoped))).toEqual([
      'cordis.patch.yml: insert-row name not found (three-way client identity, PC6)',
    ])
    expect(identityProblems(scoped, scopedPatch, 'no banner')).toEqual([
      'lib/client.js: __ModuleLoader__ registration id not found (three-way client identity, PC6)',
    ])
  })
})

describe('token scan', () => {
  it('reads the per-file counts of git grep -z -c without losing paths that contain colons', () => {
    // `git grep -z -c <pattern> HEAD` emits `path NUL count LF` records, every path prefixed with the tree name.
    const counts = ['HEAD:evidence.log\0 2\n'.replace('\0 ', '\0'), 'HEAD:dir:x/notes.md\0 1\n'.replace('\0 ', '\0'), 'HEAD:HEAD:lead/notes.md\0 1\n'.replace('\0 ', '\0')].join('')
    expect(tokenFiles(counts)).toEqual([
      { path: 'evidence.log', count: 2 },
      { path: 'dir:x/notes.md', count: 1 },
      { path: 'HEAD:lead/notes.md', count: 1 },
    ])
  })

  it('refuses a listing whose fields do not come as a tree-prefixed path followed by a count', () => {
    expect(() => tokenFiles('HEAD:evidence.log\0')).toThrow(/unexpected git grep output/)
    expect(() => tokenFiles('evidence.log\0 1\n'.replace('\0 ', '\0'))).toThrow(/unexpected git grep output/)
    expect(() => tokenFiles('HEAD:evidence.log\0many\n')).toThrow(/unexpected git grep output/)
    expect(() => tokenFiles('HEAD:\0 3\n'.replace('\0 ', '\0'))).toThrow(/unexpected git grep output/)
  })
})

describe('main', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'dshws-release-cli-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
    for (const repo of createdRepos.splice(0)) await rm(repo, { recursive: true, force: true })
  })

  const manifest = (version: string) => JSON.stringify({ name: '@maricgeer/dsh-websearch', version }, null, 2)
  const userAgent = (version: string) => `export const USER_AGENT = 'dsh-websearch/${version}'\n`

  it('refuses to run when no check was requested', async () => {
    await expect(main([], dir)).rejects.toThrow(/nothing to check/)
  })

  it('passes the tag checks when tag, manifest, changelog and user agent agree and the tag sits on HEAD in master', async () => {
    const repo = await makeRepo({
      'package.json': manifest(VERSION),
      'CHANGELOG.md': `# Changelog\n\n## 2026-11-25 — v${VERSION}\n`,
      'src/providers/shared.ts': userAgent(VERSION),
    })
    git(repo, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'tag', '-a', `v${VERSION}`, '-m', 'release')
    await expect(main(['--tag', `v${VERSION}`], repo)).resolves.toEqual([])
  })

  it('fails the tag checks while the changelog lacks a v-prefixed entry for the version', async () => {
    const repo = await makeRepo({
      'package.json': manifest(VERSION),
      'CHANGELOG.md': `## 2026-09-09 — 全模式 web_fetch 接管 ${VERSION}\n`,
      'src/providers/shared.ts': userAgent(VERSION),
    })
    git(repo, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'tag', '-a', `v${VERSION}`, '-m', 'release')
    const problems = await main(['--tag', `v${VERSION}`], repo)
    expect(problems).toEqual([expect.stringMatching(/CHANGELOG.*first dated heading.*v0\.2\.1/)])
  })

  it('fails the tag checks when the tag does not exist yet', async () => {
    const repo = await makeRepo({
      'package.json': manifest(VERSION),
      'CHANGELOG.md': `## 2026-11-25 — v${VERSION}\n`,
      'src/providers/shared.ts': userAgent(VERSION),
    })
    const problems = await main(['--tag', `v${VERSION}`], repo)
    expect(problems).toEqual([expect.stringMatching(/^tag v0\.2\.1 does not exist in this repository$/)])
  })

  it('fails the tag checks when the tag names a version the manifest does not carry', async () => {
    const repo = await makeRepo({
      'package.json': manifest('0.2.0'),
      'CHANGELOG.md': `## 2026-11-25 — v${VERSION}\n`,
      'src/providers/shared.ts': userAgent(VERSION),
    })
    const problems = await main(['--tag', `v${VERSION}`], repo)
    expect(problems).toEqual([expect.stringMatching(/tag v0\.2\.1.*package\.json.*0\.2\.0/)])
  })

  it('fails when the tag does not point at HEAD or HEAD is not on master', async () => {
    const repo = await makeRepo({
      'package.json': manifest(VERSION),
      'CHANGELOG.md': `## 2026-11-25 — v${VERSION}\n`,
      'src/providers/shared.ts': userAgent(VERSION),
    })
    // A second commit on a side branch: master stays behind, and the tag is placed on the older commit.
    git(repo, 'checkout', '-q', '-b', 'release')
    await writeFile(join(repo, 'CHANGELOG.md'), `## 2026-11-26 — v${VERSION}\n`)
    git(repo, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'commit', '-q', '-am', 'bump')
    git(repo, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'tag', '-a', `v${VERSION}`, '-m', 'release', 'master')
    const problems = await main(['--tag', `v${VERSION}`], repo)
    expect(problems).toEqual(expect.arrayContaining([
      expect.stringMatching(/tag .* does not point at HEAD/),
      expect.stringMatching(/HEAD is not contained by master/),
    ]))
  })

  it('fails on a tracked file that carries a host token value, whatever else was requested', async () => {
    const repo = await makeRepo({
      'package.json': manifest(VERSION),
      'evidence.log': `${FAKE_TOKEN_URL}\n`,
    })
    await packTarballs(dir, () => {})
    const problems = await main(['--tarballs', dir], repo)
    expect(problems).toEqual([expect.stringMatching(/^evidence\.log:1 carries a host token value/)])
    // the gate's own output goes to CI logs, so it names the place and never the value
    expect(problems.join('\n')).not.toContain(FAKE_TOKEN)
  })

  it('refuses to pass the token scan outside a git repository', async () => {
    const outside = await mkdtemp(join(tmpdir(), 'dshws-release-nogit-'))
    await writeFile(join(outside, 'package.json'), manifest(VERSION))
    await packTarballs(dir)
    try {
      await expect(main(['--tarballs', dir], outside)).rejects.toThrow(/token scan did not run/)
    } finally {
      await rm(outside, { recursive: true, force: true })
    }
  })

  it('accepts tarballs whose three identity legs agree with their distribution form', async () => {
    const repo = await makeRepo({ 'package.json': manifest(VERSION) })
    await packTarballs(dir)
    await expect(main(['--tarballs', dir], repo)).resolves.toEqual([])
  })

  it('rejects a tarball whose insert-row name departs from its manifest name (integration negative control)', async () => {
    const repo = await makeRepo({ 'package.json': manifest(VERSION) })
    await packTarballs(dir, async (stage, form) => {
      if (form === 'scoped') {
        // A drifted leg: the scoped tarball's patch still carries the bare name.
        await writeFile(join(stage, 'cordis.patch.yml'), `- insert:\n    - id: dsh-websearch\n      name: dsh-websearch\n`)
      }
    })
    const problems = await main(['--tarballs', dir], repo)
    expect(problems).toEqual([
      expect.stringMatching(/maricgeer-dsh-websearch-0\.2\.1\.tgz: cordis\.patch\.yml: insert-row name "dsh-websearch" does not match the manifest name "@maricgeer\/dsh-websearch"/),
    ])
  })

  it('rejects a tarball whose manifest name departs from its distribution form', async () => {
    const repo = await makeRepo({ 'package.json': manifest(VERSION) })
    await packTarballs(dir, async (stage, form) => {
      if (form === 'bare') {
        // The bare tarball must carry the bare identity; a scoped manifest inside defeats the form.
        await writeFile(join(stage, 'package.json'), JSON.stringify({ name: '@maricgeer/dsh-websearch', version: VERSION }, null, 2))
      }
    })
    const problems = await main(['--tarballs', dir], repo)
    expect(problems).toEqual([
      expect.stringMatching(/dsh-websearch-0\.2\.1\.tgz: manifest name "@maricgeer\/dsh-websearch" does not match the bare distribution form "dsh-websearch"/),
    ])
  })

  it('still runs as a command when its path goes through a symlink, instead of exiting 0 unchecked', async () => {
    // Node resolves `import.meta.url` through symlinks but leaves `process.argv[1]` as typed
    // (macOS: /tmp → /private/tmp). An entry-point test that compares the two literally turns the
    // gate into a silent no-op for every clone under such a path.
    const repo = await makeRepo({ 'package.json': manifest('0.2.0') })
    const real = await mkdtemp(join(tmpdir(), 'dshws-release-real-'))
    const link = `${real}-link`
    await symlink(real, link, 'dir')
    await copyFile(new URL('../scripts/check-release.mjs', import.meta.url), join(real, 'check-release.mjs'))
    try {
      const result = spawnSync(process.execPath, [join(link, 'check-release.mjs'), '--tag', `v${VERSION}`], { cwd: repo, encoding: 'utf8' })
      expect(result.status).toBe(1)
      expect(result.stderr).toMatch(/does not name the package\.json version/)
    } finally {
      await rm(link, { force: true })
      await rm(real, { recursive: true, force: true })
      await rm(repo, { recursive: true, force: true })
    }
  })

  it('still finds a token value in a tracked file that is missing from the working tree', async () => {
    // The scan covers the committed tree, which is what a tag would publish; a
    // working-tree search reads a deleted or unreadable file as clean.
    const repo = await makeRepo({
      'package.json': manifest(VERSION),
      'evidence.log': `${FAKE_TOKEN_URL}\n`,
    })
    await rm(join(repo, 'evidence.log'))
    await packTarballs(dir, () => {})
    const problems = await main(['--tarballs', dir], repo)
    expect(problems).toEqual(['evidence.log:1 carries a host token value'])
  })

  it('reports matches under paths that contain colons and in binary files, where a colon-split parser finds nothing', async () => {
    const repo = await makeRepo({
      'package.json': manifest(VERSION),
      'dir:x/evidence.log': `${FAKE_TOKEN_URL}\n`,
      'HEAD:lead/notes.md': `${FAKE_TOKEN_URL}\n`,
      'blob.bin': new Uint8Array([0, 1, ...Buffer.from(FAKE_TOKEN_URL), 0]),
    })
    await packTarballs(dir, () => {})
    const problems = await main(['--tarballs', dir], repo)
    expect(problems).toEqual([
      'HEAD:lead/notes.md:1 carries a host token value',
      'blob.bin carries a host token value (binary file)',
      'dir:x/evidence.log:1 carries a host token value',
    ])
  })

  it('gives every matching line of one file its own line number', async () => {
    const repo = await makeRepo({
      'package.json': manifest(VERSION),
      'evidence.log': `first\n${FAKE_TOKEN_URL}\nplain\n  ${FAKE_TOKEN_URL}\n`,
    })
    await packTarballs(dir, () => {})
    const problems = await main(['--tarballs', dir], repo)
    expect(problems).toEqual(['evidence.log:2 carries a host token value', 'evidence.log:4 carries a host token value'])
  })

  it('finds token values next to bytes that are not valid UTF-8, as inside compressed or image files', async () => {
    // Under a UTF-8 locale git's regex does not match a line that holds an invalid byte; the scan runs under LC_ALL=C.
    const token = Buffer.from(FAKE_TOKEN_URL)
    const repo = await makeRepo({
      'package.json': manifest(VERSION),
      'trailer.bin': new Uint8Array([...token, 0xff, 0x0a]),
      'gzip-like.bin': new Uint8Array([0x1f, 0x8b, 0x08, 0x00, ...token, 0x0a]),
    })
    await packTarballs(dir, () => {})
    const problems = await main(['--tarballs', dir], repo)
    expect(problems).toEqual(['gzip-like.bin carries a host token value (binary file)', 'trailer.bin:1 carries a host token value'])
  })

  it('scans the committed tree only: a staged or an uncommitted token value is not reported', async () => {
    // A tag publishes HEAD, so that is what the gate reads. Locally the check therefore has to
    // run after the commit that would be tagged.
    const repo = await makeRepo({ 'package.json': manifest(VERSION) })
    await writeFile(join(repo, 'staged.log'), `${FAKE_TOKEN_URL}\n`)
    git(repo, 'add', 'staged.log')
    await writeFile(join(repo, 'unstaged.log'), `${FAKE_TOKEN_URL}\n`)
    await packTarballs(dir, () => {})
    await expect(main(['--tarballs', dir], repo)).resolves.toEqual([])
  })

  it('names the cause when git is not available, instead of failing on an accidental TypeError', async () => {
    const repo = await makeRepo({ 'package.json': manifest(VERSION) })
    const real = await mkdtemp(join(tmpdir(), 'dshws-release-nogit-bin-'))
    const emptyPath = join(real, 'empty-bin')
    await mkdir(emptyPath)
    await copyFile(new URL('../scripts/check-release.mjs', import.meta.url), join(real, 'check-release.mjs'))
    try {
      const result = spawnSync(process.execPath, [join(real, 'check-release.mjs'), '--tarballs', dir], {
        cwd: repo,
        encoding: 'utf8',
        env: { PATH: emptyPath },
      })
      expect(result.status).toBe(2)
      expect(result.stderr).toMatch(/token scan did not run: git is not available/)
    } finally {
      await rm(real, { recursive: true, force: true })
      await rm(repo, { recursive: true, force: true })
    }
  })

  it('fails when the tarballs are missing, incomplete or ship internal documents', async () => {
    const repo = await makeRepo({ 'package.json': manifest(VERSION) })
    const stage = join(dir, 'stage', 'package')
    await mkdir(stage, { recursive: true })
    for (const entry of REQUIRED_ENTRIES) {
      await mkdir(join(stage, entry, '..'), { recursive: true })
      await writeFile(join(stage, entry), 'x')
    }
    const pack = (name: string, entries: string[]) => {
      const result = spawnSync('tar', ['-czf', join(dir, name), ...entries], { cwd: join(dir, 'stage'), encoding: 'utf8' })
      if (result.status !== 0) throw new Error(result.stderr)
    }
    await mkdir(join(stage, 'docs', 'sessions'), { recursive: true })
    await writeFile(join(stage, 'docs', 'sessions', 'session.md'), 'internal')
    pack('maricgeer-dsh-websearch-0.2.1.tgz', ['package'])
    pack('dsh-websearch-0.2.1.tgz', ['package/lib', 'package/package.json'])
    const problems = await main(['--tarballs', dir], repo)
    expect(problems).toEqual(expect.arrayContaining([
      expect.stringMatching(/maricgeer-dsh-websearch-0\.2\.1\.tgz.*ships internal file docs\/sessions\/session\.md/),
      expect.stringMatching(/^dsh-websearch-0\.2\.1\.tgz: missing cordis\.patch\.yml/),
      expect.stringMatching(/^dsh-websearch-0\.2\.1\.tgz: missing docs\/plugin-page\.en\.md/),
    ]))
  })

  it('passes the tarball checks when both tarballs carry exactly the required files', async () => {
    const repo = await makeRepo({ 'package.json': manifest(VERSION) })
    await packTarballs(dir, () => {})
    await expect(main(['--tarballs', dir], repo)).resolves.toEqual([])
  })
})

describe('constants', () => {
  it('names every shipped artifact as required and keeps the forbidden rule narrow', () => {
    expect(REQUIRED_ENTRIES).toEqual(expect.arrayContaining(['lib/index.js', 'lib/client.js', 'cordis.patch.yml', 'locale/zh.json', 'locale/en.json', 'docs/plugin-page.zh.md', 'docs/plugin-page.en.md']))
    expect(FORBIDDEN_ENTRY.test('docs/sessions/x.md')).toBe(true)
    expect(FORBIDDEN_ENTRY.test('docs/plugin-page.zh.md')).toBe(false)
  })
})
