/**
 * Client-side mounting of the plugin-owned `dshws-websearch` Remote namespace
 * — the key-count badge channel (see `src/key-counts.ts` on the host half).
 * The contribution below is hand-written to mirror the Host gateway's
 * source-mode descriptor: the wire field name comes from the built
 * `describeKeyCounts(refs)` parameter list, so `name`/`wire` must stay
 * identical to that parameter name; a rename on either side breaks the wire
 * pair (the built-artifact smoke in `tests/` guards it).
 *
 * Old-host tolerance: mounting is client-only, so a host without the service
 * mounts fine and every call answers `ok: false` — the controller keeps
 * `keyCount` undefined and the badge stays hidden instead of erroring.
 *
 * @module dsh-websearch/client/key-counts-remote
 */
import type { Context } from '@deepseek-ai/cordis'
// Side-effect types: the mounted-Remote service face on Context (`ctx.remote`)
// arrives through the gateway client types that dsh-api-remotes re-exports;
// importing it here keeps this module self-contained in either tsconfig
// project (the node project reaches it via tests).
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { z } from 'zod'

/** The mounted namespace face the controller consumes. */
export interface KeyCountsNamespace {
  describeKeyCounts(refs: string[]): Promise<RemoteResult<Record<string, number>>>
}

const refsSchema = z.array(z.string())
const resultSchema = z.record(z.string(), z.number())

/**
 * Cross-generation strict codec (S32 ADR-0021 family): 0.1.5/0.1.6 clients
 * parse call inputs client-side through the `schema` zod instance (their
 * `parseInput` calls `codec.schema.parse` — a missing schema crashes at call
 * time, surfaced by the 015rc3 drill as the silently hidden badge), while
 * 0.1.7 loaders require a `create()` factory instead. Both fields coexist:
 * each generation validates and reads only its own (no exhaustive-key
 * rejection on either side), so one bundle serves every host in the peer
 * range.
 */
const refsCodec = { mode: 'strict' as const, typeSymbol: 'dsh-websearch#dshws-websearch/describeKeyCounts:refs', schema: refsSchema, create: () => refsSchema }

const resultCodec = { mode: 'strict' as const, typeSymbol: 'dsh-websearch#dshws-websearch/describeKeyCounts:result', schema: resultSchema, create: () => resultSchema }

/** The client contribution (exported for cross-generation shape tests). */
export const keyCountsContribution: TypertRemoteContribution = {
  package: 'dsh-websearch',
  descriptors: [
    {
      id: 'dsh-websearch#dshws-websearch/describeKeyCounts',
      service: 'dshwsKeyCounts',
      namespace: 'dshws-websearch',
      method: 'describeKeyCounts',
      invocation: { kind: 'direct' },
      // The Client Gateway requires strict codecs on mounted contributions;
      // the schemas mirror the Host method's declared types exactly.
      parameters: [
        { name: 'refs', wire: 'refs', source: 'json', codec: refsCodec },
      ],
      result: resultCodec,
    },
  ],
}

/**
 * Mount the namespace in the caller's fiber and return its typed caller.
 * @param ctx - client Context carrying the `remote` service.
 * @returns the namespace face (`remote.dshws-websearch`).
 */
export async function mountKeyCountsRemote(ctx: Context): Promise<KeyCountsNamespace> {
  await ctx.effect(() => ctx.remote.$mount(keyCountsContribution), 'dsh-websearch.keyCounts')
  return ctx.get('remote.dshws-websearch') as KeyCountsNamespace
}
