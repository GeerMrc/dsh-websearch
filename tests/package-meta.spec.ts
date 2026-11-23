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

/** Heading levels of a Markdown document, in order; a language-independent outline. */
function outline(document: string): number[] {
  return [...document.matchAll(/^(#{1,6}) /gm)].map((match) => match[1]!.length)
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
    const zh = outline(read(USER_DOCUMENTS.zh))
    const en = outline(read(USER_DOCUMENTS.en))
    expect(zh.length).toBeGreaterThan(3)
    expect(en).toEqual(zh)
  })

  it.each(Object.entries(USER_DOCUMENTS))('keeps %s free of raw HTML, which the plugin page omits', (_lang, path) => {
    expect(read(path)).not.toMatch(/<[a-z][^>]*>/i)
  })
})
