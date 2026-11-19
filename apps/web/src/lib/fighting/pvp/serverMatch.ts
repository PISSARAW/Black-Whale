import { stepPvpFrame, type PvpFrameInput, type PvpSeatFrame } from './rollback/frameInput'
import type { FightSide, FightState } from '../types'
import type { PvpCommand, PvpInputPacket } from './types'
import { createMatchPractice } from '../career/practice'

const SIDES = ['player', 'opponent'] as const
/** Only this server instance advances time. No client state, tick, or verdict is accepted. */
export class AuthoritativeClashMatch {
  private pending: Record<FightSide, Array<{ command: PvpCommand; sequence: number }>> = {
    player: [],
    opponent: [],
  }
  private inputs = { player: 0, opponent: 0 }
  private sequences = { player: 0, opponent: 0 }
  private applied = { player: 0, opponent: 0 }
  private appliedTick = { player: 0, opponent: 0 }
  private receipts: Record<FightSide, Map<number, string>> = {
    player: new Map(),
    opponent: new Map(),
  }
  private inputAt = { player: 0, opponent: 0 }
  tick = 0
  private inputEpoch = 0
  private practice = createMatchPractice()
  constructor(private current: FightState) {}
  snapshot(): FightState {
    return structuredClone(this.current)
  }
  get roundNumber() {
    return this.current.roundNumber
  }
  replaceRound(state: FightState) {
    this.current = state
    this.release()
  }
  nextSequence(side: FightSide) {
    return this.sequences[side]
  }
  acknowledgement(side: FightSide) {
    return {
      inputEpoch: this.inputEpoch,
      appliedSequence: this.applied[side],
      appliedAtTick: this.appliedTick[side],
    }
  }
  summary() {
    return this.practice.snapshot()
  }
  submit(
    side: FightSide,
    packet: PvpInputPacket,
    now: number,
  ): 'accepted' | 'duplicate' | 'sequence' | 'busy' {
    const signature = JSON.stringify(packet)
    if (this.receipts[side].get(packet.sequence) === signature) return 'duplicate'
    if (packet.sequence !== this.sequences[side]) return 'sequence'
    if (this.pending[side].length + packet.commands.length > 16) return 'busy'
    this.inputs[side] = packet.input
    this.inputAt[side] = now
    this.pending[side].push(
      ...packet.commands.map((command) => ({ command, sequence: packet.sequence })),
    )
    this.receipts[side].set(packet.sequence, signature)
    if (this.receipts[side].size > 64)
      this.receipts[side].delete(this.receipts[side].keys().next().value!)
    this.sequences[side] += 1
    return 'accepted'
  }
  release() {
    this.inputEpoch++
    this.pending = { player: [], opponent: [] }
    this.inputs = { player: 0, opponent: 0 }
    for (const side of SIDES) this.acknowledge(side)
  }
  private acknowledge(side: FightSide) {
    const completed = this.pending[side][0]?.sequence ?? this.sequences[side]
    if (completed === this.applied[side]) return
    this.applied[side] = completed
    this.appliedTick[side] = this.tick
  }
  advance(now: number) {
    if (this.current.phase !== 'fighting') return
    const before = this.current
    this.current = stepPvpFrame(this.current, this.frameInput(now))
    this.tick += 1
    for (const side of SIDES) this.acknowledge(side)
    this.practice.observe(before, this.current)
  }
  /** Server policy only: at most 8 queued commands per seat, held input expires after 250 ms. */
  private frameInput(now: number): PvpFrameInput {
    const seat = (side: FightSide): PvpSeatFrame => {
      const commands = this.pending[side].splice(0, 8).map(({ command }) => command)
      if (now - this.inputAt[side] > 250) this.inputs[side] = 0
      return { input: this.inputs[side], commands }
    }
    return { player: seat('player'), opponent: seat('opponent') }
  }
}
