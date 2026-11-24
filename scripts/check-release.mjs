#!/usr/bin/env node
/**
 * Release consistency gate (ADR-0026). One place decides whether a tag, the
 * manifest, the changelog, the user agent and the shipped tarballs tell the
 * same story, so the same rules run locally and in the release workflow:
 *
 *   node scripts/check-release.mjs --tag vX.Y.Z       tag, manifest, changelog, user agent, tag placement
 *   node scripts/check-release.mjs --tarballs <dir>   contents of both distribution tarballs
 *
 * Every run also scans the tracked files for host token values. At least one
 * group must be requested: a run that checks nothing must not report success.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
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
 * Locate the lines that carry a host token with its value.
 * @param text - The lines a `git grep -n` over the tracked files returned, each `file:line:content`.
 * @returns The `file:line` of every offending line. The content is left out so that the value never reaches a log.
 */
export function tokenFindings(text) {
  const locations = []
  for (const line of text.split('\n')) {
    const location = /^([^:]+):\d+:/.exec(line)
    if (location !== null && TOKEN_VALUE.test(line.slice(location[0].length))) locations.push(location[0].slice(0, -1))
  }
  return locations
}

/** Run a command and return its exit status with both output streams. */
function run(command, args, cwd) {
  return spawnSync(command, args, { cwd, encoding: 'utf8' })
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
 * Locations of the tracked lines that carry a host token value.
 * @param cwd - The repository root to scan.
 * @returns The `file:line` of every offending line.
 * @throws When the scan itself cannot run, for example outside a git repository. `git grep` exits 1 both
 *   for "no match" and for a fatal error, so only status 1 with a repository may read as clean.
 */
function tokenLocations(cwd) {
  const result = run('git', ['grep', '-nE', TOKEN_VALUE.source], cwd)
  if (result.status === 1) return []
  if (result.status !== 0) {
    const reason = result.stderr.trim().split('\n')[0]
    throw new Error(`token scan did not run: git grep exited with ${result.status}${reason === '' ? '' : ` (${reason})`}`)
  }
  return tokenFindings(result.stdout)
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
  problems.push(...tokenLocations(cwd).map((location) => `${location} carries a host token value`))
  return problems
}

const isDirectRun = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]
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
