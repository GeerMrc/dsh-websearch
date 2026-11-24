#!/usr/bin/env node
/**
 * Dual-name tarball packer (S36 T8): produces both distribution names in one
 * call — the scoped npm name (`@maricgeer/dsh-websearch`, npm rejected the
 * bare name) and the bare name (`dsh-websearch`, the plugin registration id
 * the dsh client-modules runner requires for profile installs).
 *
 * v0.2.3: the bare pack temporarily rewrites ALL THREE identity legs — the
 * package.json name field, the cordis.patch.yml insert-row name, and the
 * client bundle's `__ModuleLoader__.load({ id })` registration literal in
 * lib/client.js — because the rc.5 client-modules pairing is a three-way
 * exact string equality (insert name == manifest name == registration id).
 * Every flipped file is restored byte-identical even when the pack fails.
 *
 * Usage: node scripts/pack.mjs   (run `pnpm run build` first)
 */
import { existsSync, realpathSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkgPath = join(repoRoot, 'package.json')
const patchPath = join(repoRoot, 'cordis.patch.yml')
const clientPath = join(repoRoot, 'lib', 'client.js')
const nameField = /("name"\s*:\s*")[^"]+(")/

/**
 * Strip an npm scope: `@scope/pkg` → `pkg`; bare input passes through.
 * @param name - package name, scoped or bare.
 * @returns the bare package name.
 */
export function bareName(name) {
  const slash = name.indexOf('/')
  return slash >= 0 ? name.slice(slash + 1) : name
}

/**
 * Rewrite the insert-row loader-entry name between forms. Scoped names are
 * YAML-quoted (a bare @-scalar does not parse); bare names are unquoted.
 * Fails loud when the scoped anchor is absent — a silent no-op here ships a
 * tarball whose patch leg contradicts its manifest leg.
 * @param text - cordis.patch.yml content.
 * @param from - the name currently carried by the insert row.
 * @param to - the name to write.
 * @returns the rewritten patch text.
 */
export function flipPatchInsertName(text, from, to) {
  // The anchor is form-aware: scoped names live quoted in the patch, bare
  // names unquoted; either direction must find its current form.
  const quoted = `name: '${from}'`
  const plain = `name: ${from}\n`
  const anchor = text.includes(quoted) ? quoted : (text.includes(plain) ? plain : undefined)
  if (anchor === undefined) {
    throw new Error(`insert-row name anchor for "${from}" not found; refusing to pack ${to}`)
  }
  // Scoped targets are re-quoted: a bare @-scalar is invalid YAML and makes
  // the host skip the whole overlay silently (M4 lesson).
  const target = to.startsWith('@') ? `name: '${to}'\n` : `name: ${to}\n`
  return text.replace(anchor, target)
}

/**
 * Rewrite the client bundle's registration id literal between forms. Fails
 * loud when the anchor is absent (no built client, or a changed banner
 * format) — a silent no-op ships a client half that registers under the
 * wrong id and is silently dropped by the host.
 * @param text - lib/client.js content.
 * @param from - the id currently built into the banner.
 * @param to - the id to write.
 * @returns the rewritten client bundle text.
 */
export function flipClientRegistrationId(text, from, to) {
  const anchor = `id: ${JSON.stringify(from)},`
  if (!text.includes(anchor)) {
    throw new Error(`client registration id anchor "${anchor}" not found; refusing to pack ${to}`)
  }
  return text.replace(anchor, `id: ${JSON.stringify(to)},`)
}

/**
 * Run `fn` with one file's content rewritten by `flip`, restoring the
 * original bytes afterwards — including on failure (a failed pack must never
 * leave a half-flipped tree).
 * @param path - the file to rewrite.
 * @param flip - `(text) => text` rewrite; throws on a missing anchor.
 * @param fn - action to run under the flipped content (typically `npm pack`).
 * @returns whatever `fn` resolves to; rethrows `fn`'s error after restoring.
 */
async function withFlippedFile(path, flip, fn) {
  const original = await readFile(path, 'utf8')
  await writeFile(path, flip(original))
  try {
    return await fn()
  } finally {
    await writeFile(path, original)
  }
}

/**
 * Run `fn` with package.json's name field rewritten to `name`, restoring the
 * original bytes afterwards — including on failure (a failed pack must never
 * leave the manifest corrupted).
 * @param path - package.json path.
 * @param name - temporary package name.
 * @param fn - action to run under the flipped name (typically `npm pack`).
 * @returns whatever `fn` resolves to; rethrows `fn`'s error after restoring.
 */
export async function withFlippedName(path, name, fn) {
  return withFlippedFile(path, (text) => {
    const flipped = text.replace(nameField, `$1${name}$2`)
    if (flipped === text && !text.includes(`"name": "${name}"`)) {
      throw new Error(`name field not found in ${path}; refusing to pack under ${name}`)
    }
    return flipped
  }, fn)
}

/**
 * Run `fn` with ALL THREE identity legs flipped to the bare name (manifest,
 * patch insert-row name, client registration id), restoring every file
 * afterwards — including on failure.
 * @param scoped - the scoped distribution name (the repo's current legs).
 * @param bare - the bare distribution name to pack under.
 * @param fn - action to run under the flipped identity (typically `npm pack`).
 * @returns whatever `fn` resolves to; rethrows `fn`'s error after restoring.
 */
export async function withBareIdentity(scoped, bare, fn) {
  return withFlippedName(pkgPath, bare, async () =>
    withFlippedFile(patchPath, (text) => flipPatchInsertName(text, scoped, bare), async () =>
      withFlippedFile(clientPath, (text) => flipClientRegistrationId(text, scoped, bare), fn),
    ),
  )
}

/**
 * Invoke `npm pack` in the repo root, failing loud on a non-zero exit.
 * @returns the single produced tarball filename from npm's JSON output.
 */
function npmPack() {
  const result = spawnSync('npm', ['pack', '--json', '--pack-destination', 'dist-artifacts'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error(`npm pack exited ${result.status}: ${result.stderr}`)
  }
  const files = JSON.parse(result.stdout).flatMap(entry => entry.filename)
  if (files.length !== 1) throw new Error(`npm pack produced ${files.length} files, expected 1: ${files.join(', ')}`)
  return files[0]
}

async function main() {
  // npm pack requires its destination directory to exist; dist-artifacts/ is
  // git-ignored, so fresh CI checkouts never have it.
  await mkdir(join(repoRoot, 'dist-artifacts'), { recursive: true })
  const pkg = JSON.parse(await readFile(pkgPath, 'utf8'))
  const scoped = pkg.name
  const bare = bareName(scoped)
  const scopedFile = npmPack()
  let bareFile
  if (bare !== scoped) {
    bareFile = await withBareIdentity(scoped, bare, () => npmPack())
  }
  console.log(`packed ${scopedFile}${bareFile !== undefined ? ` + ${bareFile}` : ''} → dist-artifacts/`)
}

/**
 * Whether this module is the process entry point. Both paths go through realpath: Node resolves
 * `import.meta.url` through symlinks but leaves `process.argv[1]` as typed, and on macOS `/tmp`
 * is a symlink to `/private/tmp`. A literal comparison made the packer exit 0 with nothing packed.
 */
function isEntryPoint() {
  const invoked = process.argv[1]
  if (invoked === undefined) return false
  const script = resolve(invoked)
  return existsSync(script) && realpathSync(script) === realpathSync(fileURLToPath(import.meta.url))
}

if (isEntryPoint()) {
  await main()
}
