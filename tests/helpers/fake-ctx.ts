/**
 * Shared fake cordis ctx for plugin-assembly tests: captures `ctx.web`
 * registrations, backs the credentials seam with an in-memory configured-ref
 * set, forwards the logger into an inspectable array, and (when a settings
 * service announces itself) records the installSection hooks so tests can
 * simulate committed section changes. `apply.test.ts` uses it as-is; the
 * loopback e2e adds configured refs and reads `logLines`/`providers`.
 *
 * @module tests/helpers/fake-ctx
 */
import { vi } from 'vitest'
import type { CredentialInfo, CredentialRef } from '@deepseek-ai/dsh-credentials'
import type { WebFetchProvider, WebSearchProvider } from '@deepseek-ai/dsh-web'

interface SettingsHooks {
  setSource: (source: () => unknown) => void
  onChange: () => void
}

export interface FakeCtx {
  logger: { info: (message: string) => void }
  web: {
    registerSearchProvider: (provider: WebSearchProvider) => () => void
    registerFetchProvider: (provider: WebFetchProvider) => () => void
  }
  credentials: {
    describe: (ref: CredentialRef) => Promise<CredentialInfo>
    resolve: (ref: CredentialRef) => Promise<{ value: string; source: string } | undefined>
  }
  inject: (names: readonly string[], cb: (sctx: { settings: { installSection: (...args: never[]) => void } }) => void) => void
  on: (event: string, handler: (ref: CredentialRef) => void) => () => void
}

export interface FakeCtxHandle {
  ctx: FakeCtx
  /** Search-provider registration order (ids). */
  readonly search: string[]
  /** Fetch-provider registration order (ids). */
  readonly fetch: string[]
  /** Every registered provider by id (chain + members; members are the same instances the chain resolves). */
  readonly providers: Map<string, WebSearchProvider | WebFetchProvider>
  /** Configured credential refs; mutate between events to simulate credential writes. */
  readonly configured: Set<string>
  /** Every logger.info line, in order (chain observability assertions). */
  readonly logLines: string[]
  emitUpdated(ref: string): void
  /** Simulate a committed settings section: the service re-reads the source, then notifies. */
  commitSettings(section: unknown): void
}

export function fakeCtx(options?: { withSettings?: boolean; values?: Record<string, string> }): FakeCtxHandle {
  const search: string[] = []
  const fetch: string[] = []
  const providers = new Map<string, WebSearchProvider | WebFetchProvider>()
  const configured = new Set<string>()
  const eventHandlers = new Set<(ref: CredentialRef) => void>()
  const logLines: string[] = []
  const values: Record<string, string> = options?.values ?? {}
  let settingsHooks: SettingsHooks | undefined
  const ctx: FakeCtx = {
    logger: { info: (message) => void logLines.push(message) },
    web: {
      registerSearchProvider: (provider) => {
        search.push(provider.id)
        providers.set(provider.id, provider)
        return () => {}
      },
      registerFetchProvider: (provider) => {
        fetch.push(provider.id)
        providers.set(provider.id, provider)
        return () => {}
      },
    },
    credentials: {
      describe: async (ref) => ({
        configured: configured.has(String(ref)),
        writable: true,
        ...(configured.has(String(ref)) ? { source: 'env' } : {}),
      }),
      resolve: async (ref) => configured.has(String(ref)) ? { value: values[String(ref)] ?? 'fake-key', source: 'env' } : undefined,
    },
    inject: (names, cb) => {
      if (options?.withSettings === false) return
      if (names.includes('settings')) {
        cb({
          settings: {
            installSection: (...args: never[]) => {
              settingsHooks = args[4] as SettingsHooks
            },
            // S14z2 takeover probe face: the roster default reads through
            // describe(); the fake exposes no agent-presets namespace, so the
            // effective default stays 'standard' and (with no installed
            // shipped-preset package under the repo) the write never fires.
            describe: () => [],
            update: () => Promise.resolve(),
          },
        })
      }
    },
    on: (event, handler) => {
      if (event === 'credentials/reference-updated') eventHandlers.add(handler)
      return () => eventHandlers.delete(handler)
    },
  }
  const emitUpdated = (ref: string) => {
    for (const handler of eventHandlers) handler(ref as CredentialRef)
  }
  const commitSettings = (section: unknown) => {
    settingsHooks!.setSource(() => section)
    settingsHooks!.onChange()
  }
  return { ctx, search, fetch, providers, configured, logLines, emitUpdated, commitSettings }
}

/** Let the entry's background credential-gate prime settle before availability assertions. */
export async function flushGate(): Promise<void> {
  await vi.waitFor(() => {})
}
