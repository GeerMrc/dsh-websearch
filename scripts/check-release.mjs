#!/usr/bin/env node
/**
 * Release consistency gate (ADR-0026). One place decides whether a tag, the
 * manifest, the changelog, the user agent and the shipped tarballs tell the
 * same story, so the same rules run locally and in the release workflow:
 *
 *   node scripts/check-release.mjs --tag vX.Y.Z       tag, manifest, changelog, user agent, tag placement
 *   node scripts/check-release.mjs --tarballs <dir>   contents of both distribution tarballs
 *
 * Every run also scans the committed tree (HEAD) for host token values. At least
 * one group must be requested: a run that checks nothing must not report success.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Files both distribution tarballs must carry; the plugin page breaks without the locale and user documents. */
export const REQUIRED_ENTRIES = [
  'package.json',
  'lib/index.js',
  'lib/client.js',
  'cordis.patch.yml',
  'locale/zh.json',
  'locale/en.json',
  'docs/plugin-page.zh.md',
  'docs/plugin-page.en.md',
]

/** Entries that never belong in a distribution tarball: every document under docs/ except the two user documents, and the sources. */
export const FORBIDDEN_ENTRY = /^(?:docs\/(?!plugin-page\.(?:zh|en)\.md$)|src\/|tests\/|scripts\/|\.github\/|node_modules\/)/

/** A host process token with its value; the redacted marker does not match. */
const TOKEN_VALUE = /token=[A-Za-z0-9._~+/=-]{8,}/

const DATED_HEADING = /^## \d{4}-\d{2}-\d{2}/
const STABLE_VERSION = /^\d+\.\d+\.\d+$/

/**
 * Whether a tag names exactly the v-prefixed stable package version.
 * @param tag - The tag the release is cut from.
 * @param version - The version in package.json.
 * @returns True when the tag is `v<version>` and the version is a stable triple.
 */
export function tagMatchesVersion(tag, version) {
  return STABLE_VERSION.test(version) && tag === `v${version}`
}

/**
 * Whether the single user-agent constant carries the package version.
 * @param source - The text of `src/providers/shared.ts`.
 * @param version - The version in package.json.
 * @returns True when `USER_AGENT` equals `dsh-websearch/<version>`.
 */
export function userAgentMatchesVersion(source, version) {
  const match = /USER_AGENT\s*=\s*['"]dsh-websearch\/([^'"]+)['"]/.exec(source)
  return match !== null && match[1] === version
}

/**
 * Whether the changelog opens with an entry for the version. Only the first
 * dated heading counts: the changelog carries old, unprefixed mentions of
 * versions, so a substring search would be satisfied by history.
 * @param changelog - The text of CHANGELOG.md.
 * @param version - The version in package.json.
 * @returns True when the first `## YYYY-MM-DD` heading mentions `v<version>`.
 */
export function changelogHasVersion(changelog, version) {
  const heading = changelog.split('\n').find((line) => DATED_HEADING.test(line))
  if (heading === undefined) return false
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\bv${escaped}\\b`).test(heading)
}

/**
 * List the required tarball entries that are absent.
 * @param entries - Tarball member paths with the `package/` prefix removed.
 * @returns The missing required entries, in REQUIRED_ENTRIES order.
 */
export function missingRequiredEntries(entries) {
  const present = new Set(entries)
  return REQUIRED_ENTRIES.filter((entry) => !present.has(entry))
}

/**
 * List the tarball entries that must not ship.
 * @param entries - Tarball member paths with the `package/` prefix removed.
 * @returns The offending entries, in tarball order.
 */
export function forbiddenEntries(entries) {
  return entries.filter((entry) => FORBIDDEN_ENTRY.test(entry))
}

/**
 * Parse `git grep -z -c <pattern> HEAD`: `path NUL count LF` records in which every path carries
 * the tree name as a prefix. The NUL after the path keeps a path that contains colons intact.
 * @param text - The listing.
 * @returns `{ path, count }` for every matching file, tree prefix removed, in git's order.
 * @throws When two fields are not a tree-prefixed path followed by a count: a listing that cannot
 *   be parsed must not read as "no match". The fields are not echoed; they are paths, but the
 *   parser must never be the reason a value reaches a log.
 */
export function tokenFiles(text) {
  const files = []
  for (const record of text.split('\n').filter((record) => record !== '')) {
    const [path, count, extra] = record.split('\0')
    if (path === undefined || path.length <= 'HEAD:'.length || !path.startsWith('HEAD:') || count === undefined || !/^\d+$/.test(count) || extra !== undefined) {
      throw new Error('token scan did not run: unexpected git grep output (expected path and count records)')
    }
    files.push({ path: path.slice('HEAD:'.length), count: Number(count) })
  }
  return files
}

/**
 * The environment of the three `git grep` calls. Under a UTF-8 locale the regex does not match a
 * line that holds a byte which is not valid UTF-8, which is what a token inside a compressed or
 * image file looks like; `LC_ALL=C` makes every byte matchable.
 */
const GREP_ENV = { ...process.env, LC_ALL: 'C' }

/**
 * Line numbers of the token values in one committed file.
 * @param path - Path in the HEAD tree.
 * @param cwd - The repository root.
 * @returns The line numbers, or undefined when git reports the file as binary. Each record of the
 *   per-file listing is `path NUL line number NUL content LF`, with the path repeated on every record.
 */
function tokenLines(path, cwd) {
  const result = run('git', ['grep', '-z', '-n', '-E', TOKEN_VALUE.source, 'HEAD', '--', `:(literal)${path}`], cwd, GREP_ENV)
  const records = (result.stdout ?? '').split('\n').filter((record) => record !== '')
  if (records[0]?.startsWith('Binary file ')) return undefined
  return records.map((record) => Number(record.split('\0')[1]))
}

/** Run a command and return its exit status with both output streams; `env` replaces the environment when given. */
function run(command, args, cwd, env) {
  return spawnSync(command, args, { cwd, encoding: 'utf8', ...(env === undefined ? {} : { env }) })
}

/** Run a command, returning its stdout, or undefined when it exits non-zero. */
function capture(command, args, cwd) {
  const result = run(command, args, cwd)
  return result.status === 0 ? result.stdout : undefined
}

/** Names of the two distribution tarballs a version produces (scripts/pack.mjs). */
function tarballNames(name, version) {
  const scoped = `${name.replace(/^@/, '').replace('/', '-')}-${version}.tgz`
  const bare = `${name.split('/').pop()}-${version}.tgz`
  return scoped === bare ? [scoped] : [scoped, bare]
}

/** Members of a tarball with the `package/` prefix and directory entries removed. */
function tarballEntries(file) {
  const listing = capture('tar', ['-tzf', file], process.cwd())
  if (listing === undefined) return undefined
  return listing.split('\n').filter((line) => line !== '' && !line.endsWith('/')).map((line) => line.replace(/^package\//, ''))
}

/** Problems found in the tag group: identity of tag, manifest, changelog, user agent and tag placement. */
function tagProblems(tag, cwd) {
  const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'))
  const version = pkg.version
  if (typeof version !== 'string' || !tagMatchesVersion(tag, version)) {
    return [`tag ${tag} does not name the package.json version (${version}); expected v<version> with a stable triple`]
  }
  const problems = []
  if (!changelogHasVersion(readFileSync(join(cwd, 'CHANGELOG.md'), 'utf8'), version)) {
    problems.push(`CHANGELOG's first dated heading does not mention v${version}`)
  }
  if (!userAgentMatchesVersion(readFileSync(join(cwd, 'src/providers/shared.ts'), 'utf8'), version)) {
    problems.push(`USER_AGENT in src/providers/shared.ts does not carry ${version}`)
  }
  const tagged = capture('git', ['rev-parse', '--verify', `${tag}^{commit}`], cwd)
  if (tagged === undefined) {
    problems.push(`tag ${tag} does not exist in this repository`)
  } else if (tagged.trim() !== capture('git', ['rev-parse', 'HEAD'], cwd)?.trim()) {
    problems.push(`tag ${tag} does not point at HEAD`)
  }
  const onMaster = ['origin/master', 'master'].some((ref) => capture('git', ['merge-base', '--is-ancestor', 'HEAD', ref], cwd) !== undefined)
  if (!onMaster) {
    problems.push('HEAD is not contained by master (or origin/master)')
  }
  return problems
}

/** Problems found in the tarball group: presence, required entries, forbidden entries. */
function tarballProblems(dir, cwd) {
  const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'))
  const problems = []
  for (const name of tarballNames(pkg.name, pkg.version)) {
    const file = join(dir, name)
    if (!existsSync(file)) {
      problems.push(`${name}: tarball not found in ${dir}`)
      continue
    }
    const entries = tarballEntries(file)
    if (entries === undefined) {
      problems.push(`${name}: tarball cannot be listed`)
      continue
    }
    for (const entry of missingRequiredEntries(entries)) problems.push(`${name}: missing ${entry}`)
    for (const entry of forbiddenEntries(entries)) problems.push(`${name}: ships internal file ${entry}`)
  }
  return problems
}

/**
 * Locations of the committed lines that carry a host token value.
 * @param cwd - The repository root to scan.
 * @returns A location for every match in the HEAD tree, which is what a tag would publish: `file:line`
 *   for text, the file alone for binary content. Only locations are built here, so the value never
 *   reaches a log.
 * @throws When the scan itself cannot run: no git, no commit, or any `git grep` failure. `git grep`
 *   exits 1 for "no match", so only status 1 with nothing on stderr may read as clean. The HEAD tree
 *   is scanned rather than the working tree, where a deleted or unreadable tracked file reads as clean.
 */
function tokenLocations(cwd) {
  const result = run('git', ['grep', '-z', '--full-name', '-c', '-E', TOKEN_VALUE.source, 'HEAD', '--', '.'], cwd, GREP_ENV)
  if (result.error !== undefined) {
    throw new Error(`token scan did not run: git is not available (${result.error.message})`)
  }
  const stderr = (result.stderr ?? '').trim()
  if (result.status === 1 && stderr === '') return []
  if (result.status !== 0) {
    throw new Error(`token scan did not run: git grep exited with ${result.status}${stderr === '' ? '' : ` (${stderr.split('\n')[0]})`}`)
  }
  const files = tokenFiles(result.stdout)
  // Status 0 means at least one match, so an empty listing is an output the parser does not understand.
  if (files.length === 0) throw new Error('token scan did not run: unexpected git grep output (empty listing after a match)')
  return files.flatMap(({ path }) => {
    const lines = tokenLines(path, cwd)
    if (lines === undefined) return [`${path} carries a host token value (binary file)`]
    // git listed the file, so a line list that is not all integers means the per-file pass did not read as expected.
    if (lines.length === 0 || lines.some((line) => !Number.isInteger(line))) return [`${path} carries a host token value (line not located)`]
    return lines.map((line) => `${path}:${line} carries a host token value`)
  })
}

/**
 * Run the requested check groups.
 * @param argv - The command-line arguments after the script name.
 * @param cwd - The repository root to check.
 * @returns The problems found, each one sentence naming the offending file, line or value.
 * @throws When no check group was requested, or when the token scan cannot run.
 */
export async function main(argv, cwd = process.cwd()) {
  const tagIndex = argv.indexOf('--tag')
  const tarballsIndex = argv.indexOf('--tarballs')
  const tag = tagIndex >= 0 ? argv[tagIndex + 1] : undefined
  const tarballsDir = tarballsIndex >= 0 ? argv[tarballsIndex + 1] : undefined
  if (tag === undefined && tarballsDir === undefined) throw new Error('nothing to check: pass --tag vX.Y.Z and/or --tarballs <dir>')
  const problems = []
  if (tag !== undefined) problems.push(...tagProblems(tag, cwd))
  if (tarballsDir !== undefined) problems.push(...tarballProblems(tarballsDir, cwd))
  problems.push(...tokenLocations(cwd))
  return problems
}

/**
 * Whether this module is the process entry point. Both paths go through realpath: Node resolves
 * `import.meta.url` through symlinks but leaves `process.argv[1]` as typed, and on macOS `/tmp`
 * is a symlink to `/private/tmp`. A literal comparison made the gate exit 0 unchecked from such a path.
 */
function isEntryPoint() {
  const invoked = process.argv[1]
  if (invoked === undefined) return false
  const script = resolve(invoked)
  return existsSync(script) && realpathSync(script) === realpathSync(fileURLToPath(import.meta.url))
}

const isDirectRun = isEntryPoint()
if (isDirectRun) {
  main(process.argv.slice(2)).then((problems) => {
    for (const problem of problems) console.error(`check-release: ${problem}`)
    if (problems.length > 0) {
      console.error(`check-release: ${problems.length} problem(s)`)
      process.exitCode = 1
    } else {
      console.log('check-release: ok')
    }
  }, (error) => {
    console.error(`check-release: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 2
  })
}
