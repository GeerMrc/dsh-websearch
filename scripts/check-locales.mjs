/**
 * En/zh locale parity gate: parses `src/client/locales.ts` as text and asserts
 * the `DshWsLocaleKey` union, the `en` dictionary, and the `zh` dictionary all
 * carry the same key set. Complements the compile-time `Record` parity (which
 * a type-cast could evade) and the runtime spec — this script runs in the
 * plain gate with no TypeScript toolchain.
 *
 * The parser anchors on the file's fixed declarations (`export type
 * DshWsLocaleKey`, `export const en: Record<...>`, `export const zh: ...`);
 * any restructuring that breaks those anchors must update this script in the
 * same change — an unparseable dictionary fails loud here, never silent-green.
 *
 * @module scripts/check-locales
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const localesPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'client', 'locales.ts')
const source = readFileSync(localesPath, 'utf8')

function fail(message) {
  console.error(`check-locales: ${message}`)
  process.exit(1)
}

function sliceAfter(marker, endMarker) {
  const start = source.indexOf(marker)
  if (start < 0) fail(`anchor not found: "${marker}"`)
  const from = start + marker.length
  const end = endMarker === undefined ? source.length : source.indexOf(endMarker, from)
  if (end < 0) fail(`end anchor not found: "${endMarker}"`)
  return source.slice(from, end)
}

function keysOfUnion(text) {
  return [...text.matchAll(/'([a-z][a-zA-Z]*)'/g)].map((match) => match[1])
}

function keysOfDictionary(name) {
  const text = sliceAfter(`export const ${name}: Record<DshWsLocaleKey, string> = {`, '\n}')
  return [...text.matchAll(/^\s{2}([a-z][a-zA-Z]*):/gm)].map((match) => match[1])
}

const unionKeys = keysOfUnion(sliceAfter('export type DshWsLocaleKey', 'declare module'))
const enKeys = keysOfDictionary('en')
const zhKeys = keysOfDictionary('zh')

for (const [label, keys] of [['union', unionKeys], ['en', enKeys], ['zh', zhKeys]]) {
  if (keys.length === 0) fail(`${label} key set parsed empty — dictionary format drifted`)
}

const union = new Set(unionKeys)
const en = new Set(enKeys)
const zh = new Set(zhKeys)

const enMissing = [...union].filter((key) => !en.has(key))
const enExtra = [...en].filter((key) => !union.has(key))
const zhMissing = [...union].filter((key) => !zh.has(key))
const zhExtra = [...zh].filter((key) => !union.has(key))

const problems = []
if (enMissing.length) problems.push(`en missing: ${enMissing.join(', ')}`)
if (enExtra.length) problems.push(`en extra: ${enExtra.join(', ')}`)
if (zhMissing.length) problems.push(`zh missing: ${zhMissing.join(', ')}`)
if (zhExtra.length) problems.push(`zh extra: ${zhExtra.join(', ')}`)

if (problems.length) {
  fail(`parity broken\n  ${problems.join('\n  ')}`)
}
console.log(`check-locales: ok — ${union.size} keys, union/en/zh parity holds`)
