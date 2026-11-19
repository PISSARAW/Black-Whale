import { fightReplayHash } from '../../fightReplayHash'
import { IDLE_SEAT, stepPvpFrame, type PvpFrameInput, type PvpSeatFrame } from './frameInput'
import type { FightSide, FightState } from '../../types'

export interface RollbackSessionOptions {
  initial: FightState
  /** The seat this client drives; the other seat is predicted then confirmed. */
  local: FightSide
  /** Frames between a local press and the frame it drives (plan D3). Both seats share it. */
  inputDelay: number
  /** How far the simulation may run past the last confirmed remote frame before it waits. */
  maxRollback: number
  /** Cadence, in frames, of the confirmed-state checksums exchanged to detect a desync. */
  checksumEvery?: number
}

export interface FrameMessage {
  frame: number
  seat: PvpSeatFrame
}

/** One datagram: unacknowledged local inputs (redundant), an ack, recent checksums. */
export interface RollbackMessage {
  inputs: FrameMessage[]
  /** Every remote frame up to this one has been received. */
  ack: number
  checksums: Array<[frame: number, hash: string]>
}

export interface RollbackStats {
  rollbacks: number
  resimulatedFrames: number
  longestRollback: number
  stalls: number
}

const MAX_SENT_INPUTS = 32
const SENT_CHECKSUMS = 4

function sameSeat(a: PvpSeatFrame | undefined, b: PvpSeatFrame): boolean {
  if (!a || a.input !== b.input || a.commands.length !== b.commands.length) return false
  return a.commands.length === 0 || JSON.stringify(a.commands) === JSON.stringify(b.commands)
}

/**
 * Lot L2 of docs/clash-netcode-rollback.md. Pure and transport-free: the caller feeds local
 * inputs and received messages, calls `advance` once per local frame and sends `outgoing`.
 * States are kept by reference: the engine never mutates a state it returned (lot L0).
 */
export class RollbackSession {
  /** Next frame to simulate: `state` is the state before this frame. */
  frame = 0
  desyncFrame: number | null = null
  readonly stats: RollbackStats = {
    rollbacks: 0,
    resimulatedFrames: 0,
    longestRollback: 0,
    stalls: 0,
  }
  private readonly remoteSide: FightSide
  private readonly every: number
  private states = new Map<number, FightState>()
  private localInputs = new Map<number, PvpSeatFrame>()
  private remoteInputs = new Map<number, PvpSeatFrame>()
  private usedRemote = new Map<number, PvpSeatFrame>()
  private checksums = new Map<number, string>()
  private remoteChecksums = new Map<number, string>()
  private remoteContiguous: number
  private localAcked: number
  private checkedUpTo = 0
  private rollbackFrom: number | null = null

  constructor(private readonly options: RollbackSessionOptions) {
    this.remoteSide = options.local === 'player' ? 'opponent' : 'player'
    this.every = options.checksumEvery ?? 30
    this.states.set(0, options.initial)
    // Frames before the shared delay carry no input from either seat.
    for (let frame = 0; frame < options.inputDelay; frame++) {
      this.localInputs.set(frame, IDLE_SEAT)
      this.remoteInputs.set(frame, IDLE_SEAT)
    }
    this.remoteContiguous = options.inputDelay - 1
    this.localAcked = options.inputDelay - 1
  }

  get state(): FightState {
    return this.states.get(this.frame)!
  }
  /** States before this frame no longer depend on any prediction. */
  get confirmedFrame(): number {
    return Math.min(this.frame, this.remoteContiguous + 1)
  }
  /** The frame the next local input drives. */
  get nextLocalFrame(): number {
    return this.frame + this.options.inputDelay
  }
  checksum(frame: number): string | undefined {
    return this.checksums.get(frame)
  }

  /** Records the local seat for `nextLocalFrame`; false if that frame already has one. */
  addLocalInput(seat: PvpSeatFrame): boolean {
    const frame = this.nextLocalFrame
    if (this.localInputs.has(frame)) return false
    this.localInputs.set(frame, seat)
    return true
  }

  receive(message: RollbackMessage): void {
    for (const input of message.inputs) this.receiveInput(input)
    while (this.remoteInputs.has(this.remoteContiguous + 1)) this.remoteContiguous++
    this.localAcked = Math.max(this.localAcked, message.ack)
    for (const [frame, hash] of message.checksums) {
      this.remoteChecksums.set(frame, hash)
      this.compareChecksum(frame)
    }
  }

  outgoing(): RollbackMessage {
    const inputs: FrameMessage[] = []
    const last = Math.min(this.nextLocalFrame, this.localAcked + MAX_SENT_INPUTS)
    for (let frame = this.localAcked + 1; frame <= last; frame++) {
      const seat = this.localInputs.get(frame)
      if (seat) inputs.push({ frame, seat })
    }
    const checksums = [...this.checksums.entries()].slice(-SENT_CHECKSUMS)
    return { inputs, ack: this.remoteContiguous, checksums }
  }

  /** Simulates one frame, after any pending resimulation. False when it has to wait. */
  advance(): boolean {
    const ahead = this.frame - (this.remoteContiguous + 1)
    if (ahead >= this.options.maxRollback || !this.localInputs.has(this.frame)) {
      this.stats.stalls++
      return false
    }
    this.resolveRollback()
    this.simulate(this.frame)
    this.frame++
    this.confirm()
    return true
  }

  private receiveInput({ frame, seat }: FrameMessage): void {
    if (frame <= this.remoteContiguous || this.remoteInputs.has(frame)) return
    this.remoteInputs.set(frame, seat)
    if (frame < this.frame && !sameSeat(this.usedRemote.get(frame), seat))
      this.rollbackFrom = Math.min(this.rollbackFrom ?? frame, frame)
  }

  private predictRemote(frame: number): PvpSeatFrame {
    const known = this.remoteInputs.get(frame)
    if (known) return known
    const last = this.remoteInputs.get(this.remoteContiguous) ?? IDLE_SEAT
    // Held controls persist; one-shot panel commands are never predicted.
    return last.commands.length ? { input: last.input, commands: [] } : last
  }

  private simulate(frame: number): void {
    const remote = this.predictRemote(frame)
    this.usedRemote.set(frame, remote)
    const local = this.localInputs.get(frame)!
    const input = {
      [this.options.local]: local,
      [this.remoteSide]: remote,
    } as unknown as PvpFrameInput
    this.states.set(frame + 1, stepPvpFrame(this.states.get(frame)!, input))
  }

  private resolveRollback(): void {
    const from = this.rollbackFrom
    if (from === null) return
    this.rollbackFrom = null
    const length = this.frame - from
    this.stats.rollbacks++
    this.stats.resimulatedFrames += length
    this.stats.longestRollback = Math.max(this.stats.longestRollback, length)
    for (let frame = from; frame < this.frame; frame++) this.simulate(frame)
  }

  /** Hashes newly final states on the checksum cadence, then forgets what can no longer change. */
  private confirm(): void {
    const final = this.confirmedFrame
    const first = Math.ceil((this.checkedUpTo + 1) / this.every) * this.every
    for (let frame = first; frame <= final; frame += this.every) {
      this.checksums.set(frame, fightReplayHash(this.states.get(frame)!))
      this.compareChecksum(frame)
    }
    this.checkedUpTo = Math.max(this.checkedUpTo, final)
    this.prune(final)
  }

  private compareChecksum(frame: number): void {
    const local = this.checksums.get(frame)
    const remote = this.remoteChecksums.get(frame)
    if (local === undefined || remote === undefined || local === remote) return
    this.desyncFrame = Math.min(this.desyncFrame ?? frame, frame)
  }

  private prune(final: number): void {
    // The last contiguous remote input stays: it is the prediction for every later frame.
    const kept = (frame: number) => frame >= final || frame === this.remoteContiguous
    dropFrames(this.states, kept)
    for (const map of [this.usedRemote, this.remoteInputs]) dropFrames(map, kept)
    dropFrames(this.localInputs, (frame) => frame > this.localAcked || frame >= final)
    const recent = (frame: number) => frame >= final - this.every * 8
    for (const map of [this.checksums, this.remoteChecksums]) dropFrames(map, recent)
  }
}

function dropFrames<T>(map: Map<number, T>, kept: (frame: number) => boolean): void {
  for (const frame of map.keys()) if (!kept(frame)) map.delete(frame)
}
