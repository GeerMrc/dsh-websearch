import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Plugin display metadata contract (ADR-0025). The plugin page reads, per UI
 * language, `locale/<lang>.json` in the installed package and follows
 * `meta.detail` to a Markdown file; without it the page falls back to the
 * package README, which is developer documentation. A named file that is
 * missing from the package is a hard error with no README fallback, so the
 * detail documents must be shipped and the locale resources must be exported.
 */
interface LocaleMeta {
  meta: { title: unknown; description: unknown; detail: unknown }
}

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  files?: string[]
  exports?: Record<string, unknown>
}
const read = (relative: string): string => readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8')
const locale = (lang: string): LocaleMeta => JSON.parse(read(`locale/${lang}.json`)) as LocaleMeta

/** Languages the plugin page can resolve through the host's language chain (… → zh → en). */
const LANGUAGES = ['zh', 'en'] as const
const USER_DOCUMENTS = { zh: 'docs/plugin-page.zh.md', en: 'docs/plugin-page.en.md' } as const

/** The host's rules for `meta.detail`: `/`-separated, package-relative, no scheme, no backslash, no empty or dot segment, Markdown. */
function isValidDetailPath(path: string): boolean {
  if (path.includes('\\') || path.includes(':') || path.startsWith('/')) return false
  if (!/\.(md|markdown)$/.test(path)) return false
  const segments = path.split('/')
  return segments.length >= 2 && segments.every((segment) => segment !== '' && segment !== '.' && segment !== '..')
}

/**
 * Structural profile of a Markdown document, in order: each heading level, then
 * the number of list items and of table rows in the section it opens. Heading
 * levels alone would not notice a bullet or a table row present in one language
 * only.
 */
function structure(document: string): number[] {
  const profile: number[] = []
  let inCode = false
  let listItems = 0
  let tableRows = 0
  const closeSection = (): void => {
    profile.push(listItems, tableRows)
    listItems = 0
    tableRows = 0
  }
  for (const line of document.split('\n')) {
    if (line.startsWith('```')) inCode = !inCode
    if (inCode) continue
    const heading = /^(#{1,6}) /.exec(line)
    if (heading !== null) {
      closeSection()
      profile.push(heading[1]!.length)
    } else if (line.startsWith('- ')) {
      listItems += 1
    } else if (line.startsWith('|')) {
      tableRows += 1
    }
  }
  closeSection()
  return profile
}

describe('plugin display metadata (ADR-0025 插件页文档分离)', () => {
  it.each(LANGUAGES)('ships locale/%s.json with a non-empty title, description and detail path', (lang) => {
    const { meta } = locale(lang)
    // The page heading is the registration id, which does not change with the npm scope.
    expect(meta.title).toBe('dsh-websearch')
    expect(typeof meta.description).toBe('string')
    expect((meta.description as string).trim().length).toBeGreaterThan(0)
    expect(typeof meta.detail).toBe('string')
  })

  it.each(LANGUAGES)('points the %s detail at a valid path whose Markdown file ships in the package', (lang) => {
    const detail = locale(lang).meta.detail as string
    expect(isValidDetailPath(detail)).toBe(true)
    expect(detail).toBe(USER_DOCUMENTS[lang])
    expect(existsSync(new URL(`../${detail}`, import.meta.url))).toBe(true)
    expect(pkg.files).toContain(detail)
  })

  it('lists the locale resources in files without publishing the rest of docs/', () => {
    expect(pkg.files).toEqual(expect.arrayContaining(['locale', ...Object.values(USER_DOCUMENTS)]))
    // docs/ also holds the internal governance records; only the two user documents may ship.
    expect(pkg.files).not.toContain('docs')
  })

  it('exposes the locale resources and package.json so the host reader can resolve them', () => {
    expect(Object.keys(pkg.exports ?? {})).toEqual(expect.arrayContaining(['./locale/*.json', './package.json']))
  })

  it('keeps the two user documents structurally aligned', () => {
    const zh = structure(read(USER_DOCUMENTS.zh))
    const en = structure(read(USER_DOCUMENTS.en))
    expect(zh.length).toBeGreaterThan(3)
    expect(en).toEqual(zh)
  })

  it('notices a list item or a table row present in one language only', () => {
    // the profile's own negative control: a heading-only comparison would not tell these apart
    expect(structure('# 标题\n- 一\n')).not.toEqual(structure('# Title\n- one\n- two\n'))
    expect(structure('# 标题\n| a |\n')).not.toEqual(structure('# Title\n| a |\n| b |\n'))
    expect(structure('# 标题\n- 一\n```sh\n- 不是列表项\n```\n')).toEqual(structure('# Title\n- one\n```sh\n- not a list item\n```\n'))
  })

  it.each(Object.entries(USER_DOCUMENTS))('keeps %s free of raw HTML, which the plugin page omits', (_lang, path) => {
    expect(read(path)).not.toMatch(/<[a-z][^>]*>/i)
  })
})

describe('governance files are not clobbered (S41 incident guard)', () => {
  /**
   * Governance-file rewrites must never silently no-op or clobber. Two flavors
   * hit this session and were committed: a whole-file rewrite wrote the file's
   * own path as its content (`writeFileSync(t = f, ...)` evaluation-order slip),
   * and an append script's broken quoting replaced 98 lines with the file path
   * (patterns.md, the 5th incident of the class). A file that equals its own
   * path — or shrinks to a stub — must never reach a commit again.
   */
  it('keeps the governance corpus above stub size and free of self-path content', () => {
    const files = [
      'docs/STATUS.md',
      'docs/sessions/2026-11-23-session-41.md',
      'docs/session-roadmap.md',
      'docs/progress/progress-M7.md',
      'docs/patterns.md',
    ]
    for (const file of files) {
      const text = read(file)
      expect(text.length, file).toBeGreaterThan(2000)
      expect(text.startsWith(file), `${file}: content is the file's own path`).toBe(false)
    }
  })
})
