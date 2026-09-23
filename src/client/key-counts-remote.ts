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
import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { z } from 'zod'

/** The mounted namespace face the controller consumes. */
export interface KeyCountsNamespace {
  describeKeyCounts(refs: string[]): Promise<RemoteResult<Record<string, number>>>
}

const keyCountsContribution: TypertRemoteContribution = {
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
        { name: 'refs', wire: 'refs', source: 'json', codec: { mode: 'strict', typeSymbol: 'dsh-websearch#dshws-websearch/describeKeyCounts:refs', create: () => z.array(z.string()) } },
      ],
      result: { mode: 'strict', typeSymbol: 'dsh-websearch#dshws-websearch/describeKeyCounts:result', create: () => z.record(z.string(), z.number()) },
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
