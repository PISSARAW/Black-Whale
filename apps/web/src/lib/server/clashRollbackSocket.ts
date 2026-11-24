import type { IncomingMessage } from 'node:http'
import type { Duplex } from 'node:stream'
import { WebSocketServer, type RawData, type WebSocket } from 'ws'
import { clashPvpRegistry } from './clashPvp'
import { ClashRollbackRelay } from './clashRollbackRelay'

import { CLASH_SOCKET_PATH, CLASH_SOCKET_PROTOCOL } from '$lib/fighting/pvp/rollback/experimental'
import { MAX_ROLLBACK_PAYLOAD } from '$lib/fighting/pvp/rollback/codec'

export { CLASH_SOCKET_PATH, CLASH_SOCKET_PROTOCOL }

function readChannel(channel: string) {
  const [id, epoch] = channel.split('/')
  return { id, epoch: epoch === undefined ? null : Number(epoch) }
}

type Upgrade = (request: IncomingMessage, socket: Duplex, head: Buffer) => boolean

const shared = globalThis as typeof globalThis & {
  __clashRollbackRelay?: ClashRollbackRelay
  __clashRollbackUpgrade?: Upgrade
}
const relay = (shared.__clashRollbackRelay ??= new ClashRollbackRelay({
  authorize: (channel, token) => {
    const { id, epoch } = readChannel(channel)
    return clashPvpRegistry.rollbackSeat(id, token, epoch)
  },
  receiveFrames: (channel, side, wire) => {
    const { id, epoch } = readChannel(channel)
    return (
      epoch === null ||
      clashPvpRegistry.receiveRollback(id, epoch, { side, frames: wire.message.inputs })
    )
  },
  disconnect: (channel) => {
    const { id, epoch } = readChannel(channel)
    if (epoch !== null) clashPvpRegistry.disconnectRollback(id, epoch)
  },
}))
const sockets = new WebSocketServer({
  noServer: true,
  maxPayload: MAX_ROLLBACK_PAYLOAD,
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
  socket.on('message', (data, binary) => {
    try {
      if (binary) connection.receive(bytes(data))
      else socket.close(4002, 'invalid')
    } catch {
      socket.close(1011, 'rollback stream failed')
    }
  })
  socket.on('error', () => socket.terminate())
  socket.on('close', () => connection.closed())
}

function validEpoch(value: string | null, epoch: number | null) {
  return (
    value === null ||
    (epoch !== null && Number.isSafeInteger(epoch) && epoch > 0 && String(epoch) === value)
  )
}

function validUpgrade(details: {
  matchId: string
  epoch: string | null
  epochNumber: number | null
  offered: string[]
}) {
  const { matchId, epoch, epochNumber, offered } = details
  return (
    Boolean(matchId) &&
    !matchId.includes('/') &&
    validEpoch(epoch, epochNumber) &&
    offered.includes(CLASH_SOCKET_PROTOCOL)
  )
}

/** True when the request was this socket's to answer (accepted or refused). */
export const handleClashUpgrade: Upgrade = (request, socket, head) => {
  const { pathname: path, searchParams } = new URL(request.url ?? '/', 'http://local')
  if (!path.startsWith(CLASH_SOCKET_PATH)) return false
  const matchId = path.slice(CLASH_SOCKET_PATH.length)
  const epoch = searchParams.get('epoch')
  const epochNumber = epoch === null ? null : Number(epoch)
  const channel = epoch === null ? matchId : `${matchId}/${epoch}`
  const offered = protocols(request)
  const token = offered.find((entry) => entry !== CLASH_SOCKET_PROTOCOL)
  if (!token || !validUpgrade({ matchId, epoch, epochNumber, offered })) refuse(socket, 400)
  else if (!sameOrigin(request)) refuse(socket, 403)
  else {
    try {
      clashPvpRegistry.rollbackSeat(matchId, token, epochNumber)
    } catch {
      refuse(socket, 401)
      return true
    }
    sockets.handleUpgrade(request, socket, head, (ws) => attach(ws, channel, token))
  }
  return true
}

// Read by apps/web/server.js (production) and the Vite plugin (development), which own the
// HTTP server; SvelteKit itself exposes no upgrade hook.
shared.__clashRollbackUpgrade = handleClashUpgrade
