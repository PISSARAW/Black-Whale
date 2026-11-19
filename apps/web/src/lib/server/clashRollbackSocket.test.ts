import { createServer, type Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import WebSocket from 'ws'
import { createFightEnvironment } from '$lib/fighting/fightEnvironment'
import { PVP_RULESET } from '$lib/fighting/pvp/types'
import { decodeRollbackWire, encodeRollbackWire } from '$lib/fighting/pvp/rollback/codec'
import { referenceChecksum } from '$lib/fighting/pvp/rollback/loopback'
import { longDuel, script } from '$lib/fighting/pvp/rollback/sessionFixture'
import { RollbackSocketClient } from '$lib/fighting/pvp/rollback/socketClient'
import { clashPvpRegistry } from './clashPvp'
import { CLASH_SOCKET_PATH, CLASH_SOCKET_PROTOCOL, handleClashUpgrade } from './clashRollbackSocket'
import type { FightSide } from '$lib/fighting/types'

let server: Server
let base = ''

beforeAll(async () => {
  server = createServer((_, response) => response.end())
  server.on('upgrade', (request, socket, head) => {
    if (!handleClashUpgrade(request, socket, head)) socket.destroy()
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  base = `ws://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`
})
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())))

function lobby() {
  const setup = {
    player: 'kurapika',
    opponent: 'hisoka',
    formatId: 'knockout',
    environment: createFightEnvironment(),
  } as const
  const host = clashPvpRegistry.create(setup)
  const guest = clashPvpRegistry.join(host.matchId, PVP_RULESET, {
    invitation: host.inviteHref.split('#')[1],
  })
  return { matchId: host.matchId, player: host.token, opponent: guest.token }
}

function open(matchId: string, protocols: string[], origin?: string) {
  return new WebSocket(`${base}${CLASH_SOCKET_PATH}${matchId}`, protocols, {
    headers: origin ? { origin } : {},
  })
}

function refusal(socket: WebSocket): Promise<number> {
  return new Promise((resolve) =>
    socket.on('unexpected-response', (_, res) => resolve(res.statusCode!)),
  )
}

/** `stepMs` paces the loop: the relay closes a seat past 150 datagrams a second. */
const until = async (done: () => boolean, options: { ms?: number; stepMs?: number } = {}) => {
  const started = Date.now()
  while (!done()) {
    if (Date.now() - started > (options.ms ?? 20_000)) throw Error('timeout')
    await new Promise((resolve) => setTimeout(resolve, options.stepMs ?? 1))
  }
}

describe('Clash rollback relay over a real WebSocket (lot L3)', () => {
  it('plays 600 frames between two clients that agree with the reference', async () => {
    const seats = lobby()
    const initial = longDuel('kurapika', 'hisoka')
    const frames = 600
    const clients = (['player', 'opponent'] as const).map(
      (side: FightSide) =>
        new RollbackSocketClient(
          open(seats.matchId, [CLASH_SOCKET_PROTOCOL, seats[side]]) as never,
          { initial, local: side, inputDelay: 2, maxRollback: 8 },
        ),
    )
    await until(() => clients.every((client) => client.status.open && client.status.peerConnected))
    await until(
      () => {
        for (const client of clients)
          client.tick(script(client.session.side, client.session.nextLocalFrame))
        return clients.every((client) => client.session.checksum(frames))
      },
      { stepMs: 9 },
    )
    expect(clients.map((client) => client.status.closeCode)).toEqual([null, null])
    const reference = referenceChecksum({ initial, script, frames })
    expect(clients.map((client) => client.session.checksum(frames))).toEqual([reference, reference])
    expect(clients.map((client) => client.session.desyncFrame)).toEqual([null, null])
    expect(clients[0].time.roundTripMs).not.toBeNull()
    for (const client of clients) client.close()
  }, 30_000)

  it('refuses a missing protocol, a wrong token and a foreign origin before upgrading', async () => {
    const seats = lobby()
    expect(await refusal(open(seats.matchId, ['other']))).toBe(400)
    expect(await refusal(open(seats.matchId, [CLASH_SOCKET_PROTOCOL, crypto.randomUUID()]))).toBe(
      401,
    )
    const foreign = open(
      seats.matchId,
      [CLASH_SOCKET_PROTOCOL, seats.player],
      'https://evil.example',
    )
    expect(await refusal(foreign)).toBe(403)
  })

  it('closes a seat that sends an invalid datagram, and a replaced connection', async () => {
    const seats = lobby()
    const first = open(seats.matchId, [CLASH_SOCKET_PROTOCOL, seats.player])
    const closed = (socket: WebSocket) =>
      new Promise<number>((resolve) => socket.on('close', resolve))
    await new Promise((resolve) => first.on('open', resolve))
    const replaced = closed(first)
    const second = open(seats.matchId, [CLASH_SOCKET_PROTOCOL, seats.player])
    const opened = new Promise((resolve) => second.on('open', resolve))
    expect(await replaced).toBe(4001)
    await opened
    const invalid = closed(second)
    second.send(new Uint8Array([1, 0, 255]))
    expect(await invalid).toBe(4002)
  })
})

describe('rollback wire codec', () => {
  it('round-trips frames, commands, checksums, pings and peer notices', () => {
    const frame = {
      type: 'frame',
      frame: 512,
      advantage: -1.25,
      message: {
        ack: 509,
        inputs: [
          { frame: 513, seat: { input: 37, commands: [] } },
          {
            frame: 514,
            seat: { input: 0, commands: [{ kind: 'talk', words: 'Ici, maintenant.' }] },
          },
        ],
        checksums: [[480, '0a1b2c3d']],
      },
    } as const
    expect(decodeRollbackWire(encodeRollbackWire(frame as never))).toEqual(frame)
    const ping = { type: 'ping', id: 7, sentAt: 1234.5 } as const
    expect(decodeRollbackWire(encodeRollbackWire(ping))).toEqual(ping)
    expect(decodeRollbackWire(encodeRollbackWire({ type: 'peer', connected: false }))).toEqual({
      type: 'peer',
      connected: false,
    })
    expect(decodeRollbackWire(new Uint8Array([2, 0]))).toBeNull()
    expect(decodeRollbackWire(encodeRollbackWire(ping).slice(0, 5))).toBeNull()
  })
})
