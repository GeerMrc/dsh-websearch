/**
 * Plugin-owned chain log file (S14z): the chain's observability lines
 * (draws, key rotation, degradation, served-by) already exist, but the host
 * CLI service attaches no info-level console exporter — they were emitted
 * into the void. This sink appends every line to
 * `<dshHome>/logs/dsh-websearch.log` so troubleshooting is a `tail` away,
 * independent of host logging configuration.
 *
 * @module dsh-websearch/chain-log
 */
import { appendFileSync, existsSync, mkdirSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

/** Rotate the log once it passes this size at sink construction (one `.old` generation kept). */
const ROTATE_ABOVE_BYTES = 1_000_000

/** Resolve the harness home the same way shipped plugins do: `$DSH_HOME` or `~/.dsh`. */
function dshHome(): string {
  return process.env.DSH_HOME ?? join(homedir(), '.dsh')
}

export interface ChainFileLog {
  /** Append one timestamped line. */
  (message: string): void
  /** The resolved log path (tests and diagnostics). */
  readonly path: string
}

/**
 * Create the chain file sink. Best-effort by design: a read-only home or a
 * full disk must never take the search chain down — a failing append is
 * swallowed after the first attempt and the sink turns into a no-op.
 *
 * @param enabled - false disables the sink entirely (the Config knob).
 * @param home - overrides the home resolution (tests).
 */
export function createChainFileLog(enabled = true, home: string = dshHome()): ChainFileLog {
  const noop: ChainFileLog = Object.assign(() => {}, { path: '' })
  if (!enabled) return noop
  const dir = join(home, 'logs')
  const path = join(dir, 'dsh-websearch.log')
  try {
    mkdirSync(dir, { recursive: true })
    if (existsSync(path) && statSync(path).size > ROTATE_ABOVE_BYTES) {
      renameSync(path, `${path}.old`)
    }
    if (!existsSync(path)) writeFileSync(path, '', 'utf8')
  } catch {
    return noop
  }
  let broken = false
  const sink: ChainFileLog = Object.assign((message: string) => {
    if (broken) return
    try {
      appendFileSync(path, `${new Date().toISOString()} ${message}\n`, 'utf8')
    } catch {
      // The chain must survive logging failures; drop the sink after the first.
      broken = true
    }
  }, { path })
  return sink
}
