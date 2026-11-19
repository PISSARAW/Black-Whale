import { fightReplayHash } from '../../fightReplayHash'
import { IDLE_SEAT, stepPvpFrame, type PvpSeatFrame } from './frameInput'
import { RollbackSession, type RollbackMessage, type RollbackStats } from './session'
import type { FightSide, FightState } from '../../types'

/** Test bench only: two sessions joined by a lossy, jittery, reordering in-memory channel. */
export interface LinkProfile {
  /** One-way delay; half the simulated round trip. */
  delayMs: number
  jitterMs: number
  /** Probability that a datagram is dropped. */
  loss: number
  seed: number
}

export type SeatScript = (side: FightSide, frame: number) => PvpSeatFrame

export interface LoopbackOptions {
  initial: FightState
  script: SeatScript
  frames: number
  link: LinkProfile
  inputDelay?: number
  maxRollback?: number
  /** Replaces B's start state, to prove that a desync is detected. */
  initialB?: FightState
}

export interface LoopbackResult {
  /** Checksum of the state before `frames`, on A, B and the straight reference. */
  a: string | undefined
  b: string | undefined
  reference: string
  desync: { a: number | null; b: number | null }
  stats: { a: RollbackStats; b: RollbackStats }
  ticks: number
}

const FRAME_MS = 1000 / 60

function random(seed: number) {
  let value = seed >>> 0
  return () => {
    value = (value + 0x6d2b79f5) >>> 0
    let t = Math.imul(value ^ (value >>> 15), 1 | value)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

class Link {
  private queue: Array<{ to: FightSide; at: number; message: RollbackMessage }> = []
  private readonly next: () => number
  constructor(private readonly profile: LinkProfile) {
    this.next = random(profile.seed)
  }
  send(to: FightSide, message: RollbackMessage, now: number) {
    if (this.next() < this.profile.loss) return
    const jitter = (this.next() * 2 - 1) * this.profile.jitterMs
    // A copy, as the wire would carry: no object is shared between the two sessions.
    this.queue.push({
      to,
      at: now + this.profile.delayMs + jitter,
      message: structuredClone(message),
    })
  }
  deliver(to: FightSide, now: number): RollbackMessage[] {
    const due = this.queue.filter((entry) => entry.to === to && entry.at <= now)
    this.queue = this.queue.filter((entry) => !due.includes(entry))
    return due.map((entry) => entry.message)
  }
}

/** The straight simulation every client must agree with, from the same scripted inputs. */
export function referenceChecksum(options: LoopbackOptions): string {
  const delay = options.inputDelay ?? 2
  let state = options.initial
  for (let frame = 0; frame < options.frames; frame++) {
    const seat = (side: FightSide) => (frame < delay ? IDLE_SEAT : options.script(side, frame))
    state = stepPvpFrame(state, { player: seat('player'), opponent: seat('opponent') })
  }
  return fightReplayHash(state)
}

function sessions(options: LoopbackOptions) {
  const shared = { inputDelay: options.inputDelay ?? 2, maxRollback: options.maxRollback ?? 8 }
  return {
    player: new RollbackSession({ ...shared, initial: options.initial, local: 'player' }),
    opponent: new RollbackSession({
      ...shared,
      initial: options.initialB ?? options.initial,
      local: 'opponent',
    }),
  }
}

/** One wall-clock frame for one client: input, receive, simulate, send. */
function tickClient(
  options: { side: FightSide; session: RollbackSession; run: LoopbackOptions },
  link: Link,
  now: number,
) {
  const { side, session, run } = options
  const other = side === 'player' ? 'opponent' : 'player'
  session.addLocalInput(run.script(side, session.nextLocalFrame))
  for (const message of link.deliver(side, now)) session.receive(message)
  session.advance()
  link.send(other, session.outgoing(), now)
}

/** Runs both clients on the same 60 Hz clock until each has confirmed `frames`. */
export function runLoopback(options: LoopbackOptions): LoopbackResult {
  const link = new Link(options.link)
  const pair = sessions(options)
  const done = () => pair.player.checksum(options.frames) && pair.opponent.checksum(options.frames)
  const limit = options.frames * 4 + 600
  let ticks = 0
  while (!done() && ticks < limit) {
    const now = ticks * FRAME_MS
    tickClient({ side: 'player', session: pair.player, run: options }, link, now)
    tickClient({ side: 'opponent', session: pair.opponent, run: options }, link, now)
    ticks++
  }
  return {
    a: pair.player.checksum(options.frames),
    b: pair.opponent.checksum(options.frames),
    reference: referenceChecksum(options),
    desync: { a: pair.player.desyncFrame, b: pair.opponent.desyncFrame },
    stats: { a: pair.player.stats, b: pair.opponent.stats },
    ticks,
  }
}
