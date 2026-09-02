/**
 * Loopback stub server for the e2e tier (plan 008 D1/D4/D5): a real
 * `node:http` listener on 127.0.0.1 with an ephemeral port (`listen(0)` — no
 * fixed ports), one server per scenario, a behavior table keyed by request
 * path, and a cross-endpoint arrival log whose order is the sequence-assertion
 * source. Behavior forms:
 *
 * - `success` / `status` — scripted JSON responses;
 * - `hang` — never responds (the chain's per-member timeout is what ends it);
 * - `destroy` — 连接即断: the socket is destroyed as soon as the request is
 *   seen, so fetch fails with `TypeError: fetch failed` (observable-equal to
 *   ECONNREFUSED; a true refusal comes from {@link closedPort}).
 *
 * `close()` stops the listener and force-closes every connection, so a hung
 * handler cannot leak sockets past the scenario (closeAllConnections,
 * Node ≥18.2).
 *
 * @module tests/e2e/helpers/loopback-server
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { once } from 'node:events'

export type LoopbackBehavior =
  | { kind: 'success'; body: unknown }
  | { kind: 'status'; status: number; body?: unknown }
  | { kind: 'hang' }
  | { kind: 'destroy' }

export interface LoopbackServer {
  readonly port: number
  /** `METHOD /path` entries in true arrival order across all endpoints. */
  readonly arrivals: readonly string[]
  /** `Authorization` header per request, in arrival order (key-rotation assertions). */
  readonly auths: readonly string[]
  close(): Promise<void>
}

async function listen(server: Server): Promise<number> {
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('loopback server address is not TCP')
  return address.port
}

function respond(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

/** Start one scenario server; the behavior table is fixed for its lifetime. */
export async function startLoopback(behavior: Record<string, LoopbackBehavior>): Promise<LoopbackServer> {
  const arrivals: string[] = []
  const auths: string[] = []
  const server: Server = createServer((req: IncomingMessage, res: ServerResponse) => {
    arrivals.push(`${req.method ?? 'GET'} ${req.url ?? '/'}`)
    auths.push(String(req.headers.authorization ?? ''))
    const action = behavior[req.url ?? '/']
    if (action === undefined) {
      respond(res, 404, {})
      return
    }
    if (action.kind === 'destroy') {
      res.socket?.destroy()
      return
    }
    if (action.kind === 'hang') {
      // Never respond; the chain's timeout abort is what tears this down.
      return
    }
    if (action.kind === 'status') {
      respond(res, action.status, action.body ?? {})
      return
    }
    respond(res, 200, action.body)
  })
  const port = await listen(server)
  return {
    port,
    arrivals,
    auths,
    close: async () => {
      server.closeAllConnections()
      server.close()
      await once(server, 'close')
    },
  }
}

/**
 * A port that is guaranteed closed right now: bind, take the port, release.
 * The only source of a true connection refusal in the e2e tier (plan 008 D4);
 * the bind→use window is fail-loud by design — a hijack changes the failure
 * signature and the scenario's assertion goes red instead of silently passing.
 */
export async function closedPort(): Promise<number> {
  const server = createServer()
  const port = await listen(server)
  server.closeAllConnections()
  server.close()
  await once(server, 'close')
  return port
}
