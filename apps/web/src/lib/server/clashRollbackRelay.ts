import { parsePvpPacket } from '$lib/fighting/pvp/protocol'
import {
  decodeRollbackWire,
  encodeRollbackWire,
  type RollbackWire,
} from '$lib/fighting/pvp/rollback/codec'
import type { FightSide } from '$lib/fighting/types'

/** What the relay needs from a socket; `ws` and the tests both provide it. */
export interface RelaySocket {
  send(bytes: Uint8Array): void
  close(code: number, reason: string): void
}

export interface RelayConnection {
  side: FightSide
  receive(bytes: Uint8Array): void
  closed(): void
}

export interface RelayOptions {
  /** Seat of a token in a match; throws when the token holds none. */
  authorize: (matchId: string, token: string) => FightSide
  receiveFrames?: (
    channel: string,
    side: FightSide,
    wire: Extract<RollbackWire, { type: 'frame' }>,
  ) => boolean
  disconnect?: (channel: string) => void
  now?: () => number
  /** Datagrams per seat per second; a 60 Hz client sends 60 frames plus pings. */
  rate?: number
}

const CLOSE_REPLACED = 4001
const CLOSE_INVALID = 4002
const CLOSE_RATE = 4003
const MAX_FRAME = 60 * 60 * 30

interface Seat {
  socket: RelaySocket
  window: number
  count: number
}

const other = (side: FightSide): FightSide => (side === 'player' ? 'opponent' : 'player')

/** Shape is checked by the codec; here, frame bounds and every command's own contract. */
function validFrame(wire: Extract<RollbackWire, { type: 'frame' }>): boolean {
  const { message } = wire
  if (wire.frame < 0 || wire.frame > MAX_FRAME || message.ack < -1) return false
  return message.inputs.every(
    ({ frame, seat }) =>
      frame >= 0 &&
      frame <= MAX_FRAME &&
      parsePvpPacket({ sequence: 0, input: seat.input, commands: seat.commands }) !== null,
  )
}

/**
 * Lot L3 of docs/clash-netcode-rollback.md: forwards each validated datagram to the other
 * seat of the same match, at once and unchanged. Pings travel to the peer and back, so the
 * measured round trip is the one between the two players. The referee (L4) hooks in here.
 */
export class ClashRollbackRelay {
  private matches = new Map<string, Partial<Record<FightSide, Seat>>>()
  private readonly now: () => number
  private readonly rate: number

  constructor(private readonly options: RelayOptions) {
    this.now = options.now ?? (() => Date.now())
    this.rate = options.rate ?? 150
  }

  /** Throws when the token holds no seat in this match. */
  connect(matchId: string, token: string, socket: RelaySocket): RelayConnection {
    const side = this.options.authorize(matchId, token)
    const seats = this.matches.get(matchId) ?? {}
    seats[side]?.socket.close(CLOSE_REPLACED, 'replaced')
    const seat: Seat = { socket, window: this.now(), count: 0 }
    seats[side] = seat
    this.matches.set(matchId, seats)
    this.tell(seats[other(side)], { type: 'peer', connected: true })
    if (seats[other(side)]) this.tell(seat, { type: 'peer', connected: true })
    return {
      side,
      receive: (bytes) => this.receive({ matchId, side, seat }, bytes),
      closed: () => this.closed(matchId, side, seat),
    }
  }

  private receive(from: { matchId: string; side: FightSide; seat: Seat }, bytes: Uint8Array) {
    const { seat } = from
    if (this.matches.get(from.matchId)?.[from.side] !== seat) return
    if (!this.withinRate(seat)) return seat.socket.close(CLOSE_RATE, 'rate')
    const wire = decodeRollbackWire(bytes)
    if (!wire || !this.acceptWire(from.matchId, from.side, wire))
      return seat.socket.close(CLOSE_INVALID, 'invalid')
    this.matches.get(from.matchId)?.[other(from.side)]?.socket.send(bytes)
  }

  private acceptWire(channel: string, side: FightSide, wire: RollbackWire) {
    if (wire.type === 'peer') return false
    if (wire.type !== 'frame') return true
    return validFrame(wire) && this.options.receiveFrames?.(channel, side, wire) !== false
  }

  private withinRate(seat: Seat): boolean {
    const now = this.now()
    if (now - seat.window >= 1000) {
      seat.window = now
      seat.count = 0
    }
    return ++seat.count <= this.rate
  }

  private closed(matchId: string, side: FightSide, seat: Seat) {
    const seats = this.matches.get(matchId)
    if (seats?.[side] !== seat) return
    delete seats[side]
    this.options.disconnect?.(matchId)
    this.tell(seats[other(side)], { type: 'peer', connected: false })
    if (!seats[other(side)]) this.matches.delete(matchId)
  }

  private tell(seat: Seat | undefined, wire: RollbackWire) {
    seat?.socket.send(encodeRollbackWire(wire))
  }
}
