#!/usr/bin/env node
// Compare the plugin detail page a11y snapshots taken on the rc.5 scratch
// instance against the HEAD candidate package's locale files, user documents
// and README. Usage: node v3-compare.mjs <evidenceDir> <extractedHeadPackageDir>
// Text is compared after removing all whitespace and normalizing quote
// characters, because the a11y tree splits inline emphasis, code and links
// into separate nodes.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [evDir, pkgDir] = process.argv.slice(2)
const read = (file) => readFileSync(file, 'utf8')
// Whitespace, backticks (inline code in Markdown) and ASCII double quotes (the
// a11y tree quotes values that start with punctuation) carry no content here.
const squash = (text) => text.replace(/[\u2019\u2018]/gu, "'").replace(/[`"\\*\s]+/gu, '')
const unrole = (line) => line
  .replace(/^\s*-\s*heading "(.*?)"( \[level=\d+\])?(:.*)?$/u, '$1')
  .replace(/^\s*-\s*(?:paragraph|text|strong|cell|row|link|columnheader|code|listitem|menuitem|blockquote|table|rowgroup|list)(?::\s*|\s+)/u, '')
  .replace(/^\s*-\s*/u, '')
  .trim()
const region = (snap, startRe, endRe) => {
  const lines = snap.split('\n')
  const start = lines.findIndex((line) => startRe.test(line))
  const end = lines.findIndex((line, index) => index > start && endRe.test(line))
  if (start < 0 || end < 0) throw new Error(`detail region not found (start=${start}, end=${end})`)
  return lines.slice(start, end).map(unrole)
}
const headText = (line) => /^#{1,6}\s+(.*)$/u.exec(line)?.[1]?.replace(/\*\*/gu, '') ?? null

const report = []
const cases = [
  { lang: 'zh', snap: 'm1-v3-detail-zh-headcandidate-after-pagereload.txt', region: [/- region "详细介绍"/u, /^- heading "包含的组件"/u] },
  { lang: 'en', snap: 'm1-v3-detail-en-headcandidate.txt', region: [/- region "Details"/u, /^- heading "Components"/u] },
]
let failed = 0
const check = (name, ok, detail = '') => { report.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -- ' + detail : ''}`); if (!ok) failed += 1 }

for (const c of cases) {
  const snap = read(join(evDir, c.snap))
  const locale = JSON.parse(read(join(pkgDir, 'locale', `${c.lang}.json`)))
  const doc = read(join(pkgDir, 'docs', `plugin-page.${c.lang}.md`))
  const readme = read(join(pkgDir, 'README.md'))
  const nodes = region(snap, c.region[0], c.region[1])
  const flat = squash(nodes.join(''))
  report.push(`== ${c.lang}: ${c.snap} (detail region: ${nodes.length} a11y nodes)`)
  check(`locale meta.title ("${locale.meta.title}") is the page heading`, new RegExp(`^- heading "${locale.meta.title.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}" \\[level=3\\]$`, 'mu').test(snap))
  check('locale meta.description appears verbatim on the page', snap.includes(`- paragraph: ${locale.meta.description}`) || snap.includes(`- paragraph: "${locale.meta.description}"`))
  check('locale meta.detail names the rendered document', locale.meta.detail === `docs/plugin-page.${c.lang}.md`)
  const docHeadings = doc.split('\n').map(headText).filter((h) => h !== null)
  for (const h of docHeadings) check(`document heading rendered: "${h}"`, nodes.includes(h))
  const prose = doc.split('\n').filter((line) => line.trim() !== '' && !line.startsWith('|') && !line.startsWith('#') && !line.startsWith('|---'))
    .map((line) => line.replace(/^\s*[-*\s]+/u, '').replace(/\*\*/gu, '').replace(/\[([^\]]*)\]\([^)]*\)/gu, '$1').replace(/\[([^\]]*)\]/gu, '$1'))
  // A link is three separate a11y nodes (link name, /url, text), so the line is
  // checked without its URL and the URL is checked on its own.
  const urls = prose.flatMap((line) => line.match(/https?:\/\/[^\s)]+/gu) ?? [])
  const missingProse = prose.filter((line) => !flat.includes(squash(line.replace(/https?:\/\/[^\s)]+/gu, '')))).concat(urls.filter((url) => !flat.includes(squash(url))))
  check(`every prose line (${prose.length}) and link (${urls.length}) of docs/plugin-page.${c.lang}.md is inside the detail region`, missingProse.length === 0, missingProse.length === 0 ? '' : `missing: ${JSON.stringify(missingProse)}`)
  const cells = doc.split('\n').filter((line) => line.startsWith('|')).slice(2).flatMap((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
  const missingCells = cells.filter((cell) => !flat.includes(squash(cell)))
  check(`every table cell (${cells.length}) of the document is inside the detail region`, missingCells.length === 0, JSON.stringify(missingCells))
  const readmeHeadings = readme.split('\n').map(headText).filter((h) => h !== null).map((h) => h.replace(/\*\*/gu, '')).filter((h) => !docHeadings.includes(h))
  const leaked = readmeHeadings.filter((h) => nodes.includes(h))
  check(`no README-only heading (${readmeHeadings.length} candidates, exact node match) is inside the detail region`, leaked.length === 0, leaked.length === 0 ? '' : `leaked: ${JSON.stringify(leaked)}`)
  const readmeMarkers = ['语言权威声明', '治理看板', 'docs/STATUS.md', 'pnpm ', 'Language authority', 'governance board']
  const markerHits = readmeMarkers.filter((marker) => flat.includes(squash(marker)))
  check('README-only markers are absent from the detail region', markerHits.length === 0, JSON.stringify(markerHits))
  const must = c.lang === 'zh'
    ? ['清除方法', '两个键一起删掉', '用命令行卸载本插件同样不会清除这个选择', '它与列表里的开关不是同一个操作']
    : ['To clear it', 'under the', 'leaves this choice in place as well', 'it is a different operation from the list switch']
  const missingMust = must.filter((fragment) => !flat.includes(squash(fragment)))
  check(`current copy present ("${must[0]}" …)`, missingMust.length === 0, JSON.stringify(missingMust))
  const gone = c.lang === 'zh'
    ? ['在恢复出来的官方页里重新选一个提供方即可', '也是唯一的关闭入口', '本插件的设置会保留，重新启用即恢复', '关闭即自动交还官方']
    : ['重新选', 'is the only entry', 'restores it when disabled. This plugin\'s settings']
  const still = gone.filter((fragment) => flat.includes(squash(fragment)) || squash(snap).includes(squash(fragment)))
  check('none of the pre-2df185d sentences is rendered on the page', still.length === 0, JSON.stringify(still))
  check('no "包元信息错误" / metadata error status on the page', !/包元信息错误|Plugin metadata for/u.test(snap))
  check('code source is the HEAD candidate tarball', snap.includes('file:/tmp/dshws-s41/stage5/candidates/head/dsh-websearch-0.2.0.tgz'))
}
const text = report.join('\n') + `\n== ${failed === 0 ? 'ALL CHECKS PASS' : `${failed} CHECK(S) FAILED`}\n`
writeFileSync(join(evDir, 'm1-v3-text-comparison.txt'), `# Output of tools/v3-compare.mjs (a11y snapshot vs HEAD candidate package files).\n${text}`)
console.log(text)
process.exitCode = failed === 0 ? 0 : 1
