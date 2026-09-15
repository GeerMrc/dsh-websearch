/**
 * Key-count Remote: the `dshws-websearch` Typert Remote namespace backing the
 * settings page's per-member API-key count badge. One direct method answers
 * `Record<ref, count>` where count is the trimmed, non-empty comma segment
 * count of the pool value (ADR-0011 single-slot comma value, same split as
 * `splitKeys`). Secret values never cross this seam — only the integer count.
 *
 * Refs are whitelisted to the five members' currently resolved refs
 * (`apiKeyEnv ?? defaultRef`), so a caller cannot probe key counts of
 * unrelated host credentials; an off-list name answers 0, the same answer an
 * unconfigured whitelisted ref gives.
 *
 * @module dsh-websearch/key-counts
 */
import type { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { splitKeys } from './keys.ts'

/** Constructor ports for the count Remote; all host access goes through them. */
export interface KeyCountsPorts {
  /** The refs currently owned by the five members, read live per call. */
  readonly allowedRefs: () => ReadonlySet<string>
  /** Per-call value resolution (the credentials service; never cached). */
  readonly resolve: (ref: string) => Promise<string | undefined>
}

/** Wire namespace of this plugin's Remote (`remote.dshws-websearch` client-side). */
export const KEY_COUNTS_NAMESPACE = 'dshws-websearch'

/** Count one ref's keys; a resolve failure answers the conservative 0. */
async function countKeys(resolve: KeyCountsPorts['resolve'], ref: string): Promise<number> {
  try {
    const value = await resolve(ref)
    return value === undefined ? 0 : splitKeys(value).length
  } catch {
    // A resolve failure must not crash the badge batch: 0 is the
    // conservative answer and nothing else can reach this call.
    return 0
  }
}

/**
 * Host service exposing the per-ref key counts to the settings page. The
 * gateway discovers it through its `typertRemote` binding (source-mode
 * discovery), so no assembly change is needed on the host side.
 *
 * The gateway invokes Remote methods with the context's traceable proxy as
 * the receiver, so the method body reads only public members — no `#private`
 * state (private-field access through that proxy throws).
 */
export class DshWsKeyCountsRemote extends TypertRemoteService {
  readonly ports: KeyCountsPorts

  /** @param ctx - owning Cordis Context (the plugin's fiber owns disposal). */
  constructor(ctx: Context, ports: KeyCountsPorts) {
    super(ctx, 'dshwsKeyCounts', { namespace: KEY_COUNTS_NAMESPACE })
    this.ports = ports
    // The bundler (rolldown) does not lower stage-3 decorator syntax, so the
    // method is marked at runtime through the decorator's public call face
    // below — same markers, no source-level decorator.
    for (const initializer of keyCountsInitializers) initializer.call(this)
  }

  /**
   * Count the configured keys for several references. Counts only — the
   * stored value stays in the host process.
   * @param refs - reference names; a name outside the member whitelist answers 0.
   * @returns one count per requested name, keyed by that name.
   */
  async describeKeyCounts(refs: string[]): Promise<Record<string, number>> {
    const ports = this.ports
    const allowed = ports.allowedRefs()
    const entries = await Promise.all([...new Set(refs)].map(async (ref) =>
      [ref, allowed.has(ref) ? await countKeys(ports.resolve, ref) : 0] as const))
    return Object.fromEntries(entries)
  }
}

/** Constructor-phase initializers captured by the runtime `Remote` marking below. */
const keyCountsInitializers: Array<(this: DshWsKeyCountsRemote) => void> = []

Remote(
  Object.getOwnPropertyDescriptor(DshWsKeyCountsRemote.prototype, 'describeKeyCounts')!.value,
  {
    kind: 'method',
    name: 'describeKeyCounts',
    static: false,
    private: false,
    access: {
      has: (target: DshWsKeyCountsRemote) => target.describeKeyCounts !== undefined,
      get: (target: DshWsKeyCountsRemote) => target.describeKeyCounts,
    },
    addInitializer: (initializer: (this: DshWsKeyCountsRemote) => void) => {
      keyCountsInitializers.push(initializer)
    },
    metadata: {},
  },
)
