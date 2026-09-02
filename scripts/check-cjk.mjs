/**
 * CJK-literal gate: scans `src/**\/*.{ts,tsx}` (every product surface, node and
 * client) for CJK characters outside `locales.ts` — the one file allowed to
 * carry CJK, because it is the dictionary. User-visible copy must route
 * through the typed dictionaries (plan 007 D7); CJK in comments and JSDoc is
 * legitimate house style and is exempted by stripping comments before the
 * scan, keeping string-literal contents.
 *
 * The stripper is a small state machine (line/block comments, ', ", ` strings
 * with escapes). Known limitation: a comment hidden inside a `${...}`
 * interpolation is not stripped; the repo's controlled style has none, and a
 * false negative here would still be caught at review — a false positive is
 * impossible for string contents, which are always kept.
 *
 * @module scripts/check-cjk
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcRoot = join(root, 'src')
const EXCEPTION = 'locales.ts'
// CJK unified ideographs, extensions, compatibility, plus CJK punctuation and
// fullwidth forms — the net the dictionary's own copy stays inside.
const CJK = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/u

function fail(message) {
  console.error(`check-cjk: ${message}`)
  process.exit(1)
}

/** Remove comments while keeping string-literal contents (see module JSDoc). */
function stripComments(source) {
  let out = ''
  let mode = 'code'
  let i = 0
  while (i < source.length) {
    const ch = source[i]
    const next = source[i + 1]
    if (mode === 'code') {
      if (ch === '/' && next === '/') { mode = 'line'; i += 2; continue }
      if (ch === '/' && next === '*') { mode = 'block'; i += 2; continue }
      if (ch === "'" || ch === '"' || ch === '`') { mode = ch; out += ch; i += 1; continue }
      out += ch; i += 1; continue
    }
    if (mode === 'line') {
      if (ch === '\n') { mode = 'code'; out += ch }
      i += 1; continue
    }
    if (mode === 'block') {
      if (ch === '*' && next === '/') { mode = 'code'; i += 2; continue }
      // Emit comment-block newlines so reported line numbers stay true.
      if (ch === '\n') out += '\n'
      i += 1; continue
    }
    if (ch === '\\') { out += source.slice(i, i + 2); i += 2; continue }
    if (ch === mode) { mode = 'code'; out += ch; i += 1; continue }
    out += ch; i += 1
  }
  return out
}

function collectFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...collectFiles(full))
    else if (/\.(ts|tsx)$/.test(entry.name) && entry.name !== EXCEPTION) files.push(full)
  }
  return files
}

let files
try {
  files = collectFiles(srcRoot)
} catch (error) {
  fail(`cannot read src/: ${error?.message ?? error}`)
}

const hits = []
for (const file of files) {
  const stripped = stripComments(readFileSync(file, 'utf8'))
  const lines = stripped.split('\n')
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(CJK)
    if (match) hits.push(`${relative(root, file)}:${index + 1} — "${match[0]}"`)
  }
}

if (hits.length) {
  fail(`CJK literal(s) outside ${EXCEPTION} — route copy through the dictionary\n  ${hits.join('\n  ')}`)
}
console.log(`check-cjk: ok — ${files.length} files, zero CJK literals outside the dictionary`)
