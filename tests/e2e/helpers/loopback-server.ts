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
  /**
   * Steps consumed in arrival order; once exhausted the LAST step repeats.
   * This is what lets one scenario show a member's healthy phase followed by
   * its failing phase (S14w primary/standby).
   */
  | { kind: 'sequence'; steps: LoopbackBehavior[] }

export interface LoopbackServer {
  readonly port: number
  /** `METHOD /path` entries in true arrival order across all endpoints. */
  readonly arrivals: readonly string[]
  /** `Authorization` header per request, in arrival order (key-rotation assertions). */
  readonly auths: readonly string[]
  /** Parsed JSON request body per arrival, `undefined` when none parsed (wire-parameter assertions). */
  readonly bodies: readonly (unknown | undefined)[]
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
  const bodies: (unknown | undefined)[] = []
  const queues = new Map<string, LoopbackBehavior[]>()
  const repeatLastStep = (steps: readonly LoopbackBehavior[]): LoopbackBehavior =>
    steps[steps.length - 1] ?? { kind: 'status', status: 500 }
  const nextAction = (path: string): LoopbackBehavior | undefined => {
    const scripted = behavior[path]
    if (scripted?.kind !== 'sequence') return scripted
    let queue = queues.get(path)
    if (queue === undefined) {
      queue = [...scripted.steps]
      queues.set(path, queue)
    }
    return queue.shift() ?? repeatLastStep(scripted.steps)
  }
  const server: Server = createServer((req: IncomingMessage, res: ServerResponse) => {
    arrivals.push(`${req.method ?? 'GET'} ${req.url ?? '/'}`)
    auths.push(String(req.headers.authorization ?? ''))
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => { chunks.push(chunk) })
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      try {
        bodies.push(raw.length > 0 ? JSON.parse(raw) as unknown : undefined)
      } catch {
        bodies.push(undefined)
      }
    })
    const action = nextAction(req.url ?? '/')
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
    if (action.kind === 'success') {
      respond(res, 200, action.body)
      return
    }
    respond(res, 500, { error: 'unhandled behavior kind' })
  })
  const port = await listen(server)
  return {
    port,
    arrivals,
    auths,
    bodies,
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
