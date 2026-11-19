import type { IncomingMessage } from 'node:http'
import type { Duplex } from 'node:stream'
import { WebSocketServer, type RawData, type WebSocket } from 'ws'
import { clashPvpRegistry } from './clashPvp'
import { ClashRollbackRelay } from './clashRollbackRelay'

/** Socket of one match: `/fighting/pvp/socket/<matchId>`. The seat token never enters the URL. */
export const CLASH_SOCKET_PATH = '/fighting/pvp/socket/'
/** First subprotocol; the second one is the seat token (a UUID, valid as a protocol token). */
export const CLASH_SOCKET_PROTOCOL = 'clash-rollback-1'

type Upgrade = (request: IncomingMessage, socket: Duplex, head: Buffer) => boolean

const shared = globalThis as typeof globalThis & {
  __clashRollbackRelay?: ClashRollbackRelay
  __clashRollbackUpgrade?: Upgrade
}
const relay = (shared.__clashRollbackRelay ??= new ClashRollbackRelay({
  authorize: (matchId, token) => clashPvpRegistry.seatFor(matchId, token),
}))
const sockets = new WebSocketServer({
  noServer: true,
  maxPayload: 8192,
  handleProtocols: (protocols) =>
    protocols.has(CLASH_SOCKET_PROTOCOL) ? CLASH_SOCKET_PROTOCOL : false,
})

function protocols(request: IncomingMessage): string[] {
  const header = request.headers['sec-websocket-protocol']
  return (Array.isArray(header) ? header.join(',') : (header ?? ''))
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

/** Browsers always send Origin; a page from another site must not ride a player's token. */
function sameOrigin(request: IncomingMessage): boolean {
  const origin = request.headers.origin
  if (!origin) return true
  try {
    return new URL(origin).host === request.headers.host
  } catch {
    return false
  }
}

function refuse(socket: Duplex, status: 400 | 401 | 403) {
  const reason = { 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden' }[status]
  socket.end(`HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`)
}

function bytes(data: RawData): Uint8Array {
  if (Array.isArray(data)) return new Uint8Array(Buffer.concat(data))
  return data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data)
}

function attach(socket: WebSocket, matchId: string, token: string) {
  const connection = relay.connect(matchId, token, {
    send: (data) => socket.readyState === socket.OPEN && socket.send(data),
    close: (code, reason) => socket.close(code, reason),
  })
  socket.on('message', (data, binary) =>
    binary ? connection.receive(bytes(data)) : socket.close(4002, 'invalid'),
  )
  socket.on('close', () => connection.closed())
}

/** True when the request was this socket's to answer (accepted or refused). */
export const handleClashUpgrade: Upgrade = (request, socket, head) => {
  const path = new URL(request.url ?? '/', 'http://local').pathname
  if (!path.startsWith(CLASH_SOCKET_PATH)) return false
  const matchId = path.slice(CLASH_SOCKET_PATH.length)
  const offered = protocols(request)
  const token = offered.find((entry) => entry !== CLASH_SOCKET_PROTOCOL)
  if (!matchId || !token || !offered.includes(CLASH_SOCKET_PROTOCOL)) refuse(socket, 400)
  else if (!sameOrigin(request)) refuse(socket, 403)
  else {
    try {
      clashPvpRegistry.seatFor(matchId, token)
    } catch {
      refuse(socket, 401)
      return true
    }
    sockets.handleUpgrade(request, socket, head, (ws) => attach(ws, matchId, token))
  }
  return true
}

// Read by apps/web/server.js (production) and the Vite plugin (development), which own the
// HTTP server; SvelteKit itself exposes no upgrade hook.
shared.__clashRollbackUpgrade = handleClashUpgrade
