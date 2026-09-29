#!/usr/bin/env node
/**
 * Dual-name tarball packer (S36 T8): produces both distribution names in one
 * call — the scoped npm name (`@maricgeer/dsh-websearch`, npm rejected the
 * bare name) and the bare name (`dsh-websearch`, the plugin registration id
 * the dsh client-modules runner requires for profile installs). The bare
 * pack temporarily rewrites package.json's name field; the file is restored
 * byte-identical even when the pack fails.
 *
 * Usage: node scripts/pack.mjs   (run `pnpm run build` first)
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkgPath = join(repoRoot, 'package.json')
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
 * Run `fn` with package.json's name field rewritten to `name`, restoring the
 * original bytes afterwards — including on failure (a failed pack must never
 * leave the manifest corrupted).
 * @param path - package.json path.
 * @param name - temporary package name.
 * @param fn - action to run under the flipped name (typically `npm pack`).
 * @returns whatever `fn` resolves to; rethrows `fn`'s error after restoring.
 */
export async function withFlippedName(path, name, fn) {
  const original = await readFile(path, 'utf8')
  const flipped = original.replace(nameField, `$1${name}$2`)
  if (flipped === original && !original.includes(`"name": "${name}"`)) {
    throw new Error(`name field not found in ${path}; refusing to pack under ${name}`)
  }
  await writeFile(path, flipped)
  try {
    return await fn()
  } finally {
    await writeFile(path, original)
  }
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
    bareFile = await withFlippedName(pkgPath, bare, () => npmPack())
  }
  console.log(`packed ${scopedFile}${bareFile !== undefined ? ` + ${bareFile}` : ''} → dist-artifacts/`)
}

const isDirectRun = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]
if (isDirectRun) {
  await main()
}
