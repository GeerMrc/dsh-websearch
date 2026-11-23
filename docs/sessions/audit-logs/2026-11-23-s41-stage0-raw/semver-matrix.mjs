// S41 stage-0 audit (f): semver dual-semantics matrix for the six @deepseek-ai/dsh-* peer ranges.
// Read-only: reads dsh-websearch/package.json, loads the semver copy already in the repo's store.
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

const REPO = '/Volumes/IPFSJK/Zcode/dsh-websearch'
const SEMVER_PATH = `${REPO}/node_modules/.pnpm/semver@7.8.5/node_modules/semver`
const require = createRequire(import.meta.url)
const semver = require(SEMVER_PATH)
const semverPkg = JSON.parse(readFileSync(`${SEMVER_PATH}/package.json`, 'utf8'))

const pkg = JSON.parse(readFileSync(`${REPO}/package.json`, 'utf8'))
const peers = pkg.peerDependencies
const dshKeys = Object.keys(peers).filter((k) => k.startsWith('@deepseek-ai/dsh-')).sort()
const ranges = dshKeys.map((k) => peers[k])
const allIdentical = ranges.every((r) => r === ranges[0])
const range = ranges[0]

const versions = ['0.2.0-rc.2', '0.2.1-rc.5', '0.2.2-rc.1', '0.2.2-rc.5', '0.2.2', '0.2.3-alpha.2']
const negatives = ['0.1.8', '0.3.0']

console.log(`semver used: ${SEMVER_PATH} (version ${semverPkg.version})`)
console.log(`package: ${pkg.name}@${pkg.version}`)
console.log(`dsh-* peer count: ${dshKeys.length} -> ${dshKeys.join(', ')}`)
console.log(`six ranges byte-identical: ${allIdentical}`)
console.log(`range: ${range}`)
console.log('valid range:', semver.validRange(range))
console.log('')
console.log('| version | default satisfies | includePrerelease satisfies | control |')
console.log('|---|---|---|---|')
for (const v of [...versions, ...negatives]) {
  const d = semver.satisfies(v, range)
  const p = semver.satisfies(v, range, { includePrerelease: true })
  const ctl = negatives.includes(v) ? 'negative' : 'probe'
  console.log(`| ${v} | ${d} | ${p} | ${ctl} |`)
}
console.log('')
// Per-package: confirm every package gives the same answer for every probe version.
let perPkgDivergence = 0
for (const v of [...versions, ...negatives]) {
  const ds = new Set(dshKeys.map((k) => semver.satisfies(v, peers[k])))
  const ps = new Set(dshKeys.map((k) => semver.satisfies(v, peers[k], { includePrerelease: true })))
  if (ds.size !== 1 || ps.size !== 1) perPkgDivergence++
}
console.log(`per-package answer divergence across six ranges: ${perPkgDivergence}`)
// Negative-control sanity: a control that passes would mean the matrix cannot detect out-of-domain versions.
const negDefault = negatives.map((v) => semver.satisfies(v, range))
const negPre = negatives.map((v) => semver.satisfies(v, range, { includePrerelease: true }))
console.log(`negative controls default: ${negatives.map((v, i) => `${v}=${negDefault[i]}`).join(', ')}`)
console.log(`negative controls includePrerelease: ${negatives.map((v, i) => `${v}=${negPre[i]}`).join(', ')}`)
