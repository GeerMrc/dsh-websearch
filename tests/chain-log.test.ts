import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, statSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createChainFileLog } from '../src/chain-log.ts'

let dir: string | undefined
afterEach(() => {
  if (dir !== undefined) rmSync(dir, { recursive: true, force: true })
  dir = undefined
})

describe('createChainFileLog (S14z)', () => {
  it('appends timestamped lines to <home>/logs/dsh-websearch.log', () => {
    dir = mkdtempSync(join(tmpdir(), 'dshws-log-'))
    const sink = createChainFileLog(true, dir)
    expect(sink.path).toBe(join(dir, 'logs', 'dsh-websearch.log'))
    sink('[dshws-chain] served-by: dshws-tavily')
    sink('[dsh-websearch] key draw dshws-tavily …ab12')
    const lines = readFileSync(sink.path, 'utf8').trim().split('\n')
    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[dshws-chain\] served-by: dshws-tavily$/)
    expect(lines[1]).toContain('key draw dshws-tavily …ab12')
  })

  it('disabled returns a no-op sink that writes nothing', () => {
    dir = mkdtempSync(join(tmpdir(), 'dshws-log-'))
    const sink = createChainFileLog(false, dir)
    expect(sink.path).toBe('')
    sink('line')
    expect(existsSync(join(dir, 'logs'))).toBe(false)
  })

  it('rotates an oversized log to .old once at construction', () => {
    dir = mkdtempSync(join(tmpdir(), 'dshws-log-'))
    const sink = createChainFileLog(true, dir)
    writeFileSync(sink.path, 'x'.repeat(1_000_001), 'utf8')
    const rotated = createChainFileLog(true, dir)
    expect(existsSync(`${sink.path}.old`)).toBe(true)
    expect(statSync(`${sink.path}.old`).size).toBeGreaterThan(1_000_000)
    expect(statSync(rotated.path).size).toBe(0)
  })

  it('a failing append disables the sink silently — the chain survives logging failures', () => {
    dir = mkdtempSync(join(tmpdir(), 'dshws-log-'))
    const sink = createChainFileLog(true, dir)
    // Make the log path unwritable by replacing it with a directory.
    rmSync(sink.path)
    mkdirSync(sink.path)
    expect(() => sink('first (fails, swallowed)')).not.toThrow()
    expect(() => sink('second (no-op)')).not.toThrow()
  })
})
