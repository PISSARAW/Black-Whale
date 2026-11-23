import assert from 'node:assert/strict'
import { once } from 'node:events'
import WebSocket, { WebSocketServer } from 'ws'

const FRAME = 0
const PONG = 2

export function rollbackNetworkProfile() {
  const rtt = Number(process.env.CLASH_TEST_RTT_MS ?? 0)
  const jitter = Number(process.env.CLASH_TEST_JITTER_MS ?? (rtt ? 10 : 0))
  const loss = Number(process.env.CLASH_TEST_LOSS ?? (rtt ? 0.02 : 0))
  assert.ok(Number.isFinite(rtt) && rtt >= 0)
  assert.ok(Number.isFinite(jitter) && jitter >= 0)
  assert.ok(Number.isFinite(loss) && loss >= 0 && loss < 1)
  return { rtt, jitter, loss }
}

function random(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 0x1_0000_0000
  }
}

const SOCKET_PATH = '/fighting/pvp/socket/'
const CALIBRATION_BATCH = 20
export const RTT_TOLERANCE_MS = 5

export function percentile(samples, fraction) {
  const sorted = samples.toSorted((a, b) => a - b)
  return sorted[Math.floor(sorted.length * fraction)]
}

function bridgeSockets(browser, relay, options) {
  const timers = new Set()
  const pending = []
  relay.on('open', () => {
    for (const [data, binary] of pending.splice(0)) relay.send(data, { binary })
  })
  for (const [source, destination] of [
    [browser, relay],
    [relay, browser],
  ]) {
    forward(source, destination, { ...options, timers, pending })
    source.on('error', () => source.terminate())
    source.on('close', (code, reason) => {
      for (const timer of timers) clearTimeout(timer)
      timers.clear()
      if (destination.readyState === WebSocket.CONNECTING) destination.terminate()
      else if (destination.readyState === WebSocket.OPEN)
        destination.close(code === 1005 || code === 1006 ? 1011 : code, reason)
    })
  }
}

function forward(source, destination, { peer, profile, delay, timers, pending }) {
  let due = 0
  source.on('message', (data, binary) => {
    if (binary && data[1] === FRAME) {
      peer.stats.attempted++
      if (peer.loss() < profile.loss) {
        peer.stats.dropped++
        return
      }
    }
    const now = performance.now()
    const lag = Math.max(0, delay() + (peer.jitter() - 0.5) * profile.jitter)
    // Keep each WebSocket leg ordered when jitter changes between messages.
    due = Math.max(due, now + lag)
    const timer = setTimeout(() => {
      timers.delete(timer)
      if (destination.readyState === WebSocket.OPEN) destination.send(data, { binary })
      else if (destination.readyState === WebSocket.CONNECTING) pending.push([data, binary])
    }, due - now)
    timers.add(timer)
  })
}

/** A local WebSocket bridge keeps combat packets off the Playwright event queue. */
export async function createRollbackNetwork(base, profile) {
  if (!profile.rtt && !profile.jitter && !profile.loss) return null
  const peers = new Map()
  const readings = []
  let legDelay = profile.rtt / 4
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0, perMessageDeflate: false })
  server.on('connection', (browser, request) => {
    const target = new URL(request.url, base)
    const peer = peers.get(target.searchParams.get('benchPeer'))
    if (!peer) {
      browser.close(1008, 'unknown bench peer')
      return
    }
    target.searchParams.delete('benchPeer')
    target.protocol = target.protocol === 'https:' ? 'wss:' : 'ws:'
    const protocols = request.headers['sec-websocket-protocol']
      .split(',')
      .map((part) => part.trim())
    const relay = new WebSocket(target, protocols, {
      origin: request.headers.origin,
      perMessageDeflate: false,
    })
    bridgeSockets(browser, relay, {
      peer,
      profile,
      delay: () => legDelay,
    })
  })
  await once(server, 'listening')
  return {
    get legDelay() {
      return legDelay
    },
    async install(page, seed, stats) {
      peers.set(String(seed), { stats, loss: random(seed), jitter: random(seed + 1009) })
      await page.exposeFunction('recordClashRtt', (sample) => {
        stats.rtts.push(sample)
        readings.push(sample)
        if (!profile.rtt || readings.length < CALIBRATION_BATCH) return
        const error = profile.rtt - percentile(readings.splice(0), 0.5)
        // Correct a shared delay across four hops. Bound adjustments after transient stalls.
        legDelay = Math.max(
          0,
          Math.min(profile.rtt / 4 + 5, legDelay + Math.max(-4, Math.min(4, error / 4))),
        )
      })
      await page.addInitScript(
        ({ port, seed, path, pong }) => {
          const NativeWebSocket = window.WebSocket
          window.WebSocket = new Proxy(NativeWebSocket, {
            construct(target, args) {
              const url = new URL(args[0], location.href)
              if (!url.pathname.startsWith(path)) return Reflect.construct(target, args)
              url.host = `127.0.0.1:${port}`
              url.protocol = 'ws:'
              url.searchParams.set('benchPeer', seed)
              const socket = Reflect.construct(target, [url.href, args[1]])
              socket.addEventListener('message', ({ data }) => {
                if (!(data instanceof ArrayBuffer) || data.byteLength !== 14) return
                const packet = new DataView(data)
                if (packet.getUint8(1) === pong)
                  void window.recordClashRtt(performance.now() - packet.getFloat64(6))
              })
              return socket
            },
          })
        },
        { port: server.address().port, seed, path: SOCKET_PATH, pong: PONG },
      )
    },
    close: () =>
      new Promise((resolve) => {
        for (const socket of server.clients) socket.terminate()
        server.close(resolve)
      }),
  }
}

/** Inspect periodic confirmed-state hashes that the actual browser clients sent. */
export function recordConfirmedHashes(payload, epoch, hashes) {
  if (!Buffer.isBuffer(payload) || payload[1] !== FRAME) return
  let offset = 15
  for (let index = 0; index < payload[14]; index++) offset += 10 + payload.readUInt16BE(offset + 8)
  const count = payload[offset++]
  for (let index = 0; index < count; index++, offset += 8)
    hashes.set(`${epoch}/${payload.readInt32BE(offset)}`, payload.readUInt32BE(offset + 4))
}
