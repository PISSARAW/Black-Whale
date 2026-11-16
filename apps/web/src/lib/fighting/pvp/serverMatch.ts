import { tickFight } from '../engine'
import { FIXED_STEP } from '../fightClock'
import { unpackReplayInput } from '../fightReplayInput'
import { applyPvpCommand } from './commands'
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
  private receipts: Partial<Record<FightSide, string>> = {}
  private inputAt = { player: 0, opponent: 0 }
  tick = 0
  private practice = createMatchPractice()
  constructor(private current: FightState) {}
  snapshot(): FightState {
    return structuredClone(this.current)
  }
  replaceRound(state: FightState) {
    this.current = state
    this.release()
  }
  nextSequence(side: FightSide) {
    return this.sequences[side]
  }
  acknowledgement(side: FightSide) {
    return { appliedSequence: this.applied[side], appliedAtTick: this.appliedTick[side] }
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
    if (packet.sequence === this.sequences[side] - 1 && this.receipts[side] === signature)
      return 'duplicate'
    if (packet.sequence !== this.sequences[side]) return 'sequence'
    if (this.pending[side].length + packet.commands.length > 16) return 'busy'
    this.inputs[side] = packet.input
    this.inputAt[side] = now
    this.pending[side].push(
      ...packet.commands.map((command) => ({ command, sequence: packet.sequence })),
    )
    this.receipts[side] = signature
    this.sequences[side] += 1
    return 'accepted'
  }
  release() {
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
    for (const side of SIDES) {
      const commands = this.pending[side].splice(0, 8)
      for (const { command } of commands)
        this.current = applyPvpCommand(this.current, side, command)
      if (now - this.inputAt[side] > 250) this.inputs[side] = 0
    }
    this.current = tickFight(this.current, unpackReplayInput(this.inputs.player), {
      dt: FIXED_STEP,
      opponentInput: unpackReplayInput(this.inputs.opponent),
      ai: false,
    })
    this.tick += 1
    for (const side of SIDES) this.acknowledge(side)
    this.practice.observe(before, this.current)
  }
}
