/**
 * Install-form guard tests (v0.2.2 Plan B): a profile install under the
 * scoped npm name silently loses the client half on current dsh hosts
 * (PC6/M1, 2026-11-25) — the guard turns that silent half-install into a
 * loud startup warning while the host half keeps working. The dev tree
 * (a source checkout with `.git`) and the bare-name tarball stay quiet.
 *
 * @module tests/install-guard
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installFormWarning, packageRootOf, warnInstallForm } from '../src/install-guard.ts'

/** Scratch package roots created per test; removed in afterEach. */
const roots: string[] = []
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

/** Lay down a minimal package dir with the given manifest name and `.git` presence. */
function fakePackage(name: string, vcs: boolean): string {
  const root = mkdtempSync(join(tmpdir(), 'dshws-guard-'))
  roots.push(root)
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name, version: '0.0.0-test' }))
  if (vcs) mkdirSync(join(root, '.git'))
  return root
}

describe('installFormWarning', () => {
  it('fires for a scoped npm install (no .git): names the lost UI and the bare-tarball fix', () => {
    const warning = installFormWarning(fakePackage('@maricgeer/dsh-websearch', false))
    expect(warning).toContain('@maricgeer/dsh-websearch')
    expect(warning).toContain('settings section and tool badges')
    expect(warning).toContain('https://github.com/GeerMrc/dsh-websearch/releases')
  })

  it('stays quiet for the bare-name tarball form (manifest name is the plugin id)', () => {
    expect(installFormWarning(fakePackage('dsh-websearch', false))).toBeUndefined()
  })

  it('stays quiet for a source checkout (scoped name but .git present — the dev form)', () => {
    expect(installFormWarning(fakePackage('@maricgeer/dsh-websearch', true))).toBeUndefined()
  })

  it('stays quiet for this repo itself: scoped manifest, .git checkout (self-consistency)', () => {
    const repoRoot = packageRootOf(new URL('../src/index.ts', import.meta.url).href)
    expect(installFormWarning(repoRoot)).toBeUndefined()
  })

  it('stays quiet for a git worktree too: .git as a FILE (worktree pointer), not a directory', () => {
    const root = fakePackage('@maricgeer/dsh-websearch', false)
    writeFileSync(join(root, '.git'), 'gitdir: /elsewhere/main/.git\n')
    expect(installFormWarning(root)).toBeUndefined()
  })

  it('throws on a package root without a manifest (strict probe; the caller decides to swallow)', () => {
    const bare = mkdtempSync(join(tmpdir(), 'dshws-nopkg-'))
    roots.push(bare)
    expect(() => installFormWarning(bare)).toThrow()
  })
})

describe('packageRootOf', () => {
  it('resolves a lib/<entry>.js module URL to the package root (installed form)', () => {
    expect(packageRootOf('file:///pnpm/store/x/node_modules/@maricgeer/dsh-websearch/lib/index.js'))
      .toBe('/pnpm/store/x/node_modules/@maricgeer/dsh-websearch')
  })

  it('resolves a src/<entry>.ts module URL to the repo root (source form, same depth)', () => {
    // fileURLToPath of a directory URL keeps a trailing slash; packageRootOf returns a clean path.
    const repoRoot = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '')
    expect(packageRootOf(new URL('../src/index.ts', import.meta.url).href)).toBe(repoRoot)
  })
})

describe('warnInstallForm', () => {
  it('warns through BOTH channels for the scoped install form: ctx.logger.warn and the plugin-owned file log (rc.5 hosts attach no console exporter — chain-log.ts)', () => {
    const warn = vi.fn()
    const fileLines: string[] = []
    const root = fakePackage('@maricgeer/dsh-websearch', false)
    warnInstallForm({ logger: { warn } }, (line) => void fileLines.push(line), `file://${root}/lib/index.js`)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]![0]).toContain('@maricgeer/dsh-websearch')
    expect(fileLines).toHaveLength(1)
    expect(fileLines[0]).toMatch(/^\[dshws-install\] /)
    expect(fileLines[0]).toContain('@maricgeer/dsh-websearch')
  })

  it('is silent in the source checkout (neither channel fires)', () => {
    const warn = vi.fn()
    const fileLines: string[] = []
    warnInstallForm({ logger: { warn } }, (line) => void fileLines.push(line), new URL('../src/index.ts', import.meta.url).href)
    expect(warn).not.toHaveBeenCalled()
    expect(fileLines).toHaveLength(0)
  })

  it('swallows an unreadable manifest — diagnostics must never keep the plugin from loading', () => {
    const warn = vi.fn()
    const fileLines: string[] = []
    const bare = mkdtempSync(join(tmpdir(), 'dshws-nopkg2-'))
    roots.push(bare)
    expect(() => warnInstallForm({ logger: { warn } }, (line) => void fileLines.push(line), `file://${bare}/lib/index.js`)).not.toThrow()
    expect(warn).not.toHaveBeenCalled()
    expect(fileLines).toHaveLength(0)
  })
})
