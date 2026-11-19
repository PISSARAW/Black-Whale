import { tickFight } from '../../engine'
import { FIXED_STEP } from '../../fightClock'
import { unpackReplayInput } from '../../fightReplayInput'
import { applyPvpCommand } from '../commands'
import type { FightSide, FightState } from '../../types'
import type { PvpCommand } from '../types'

/** What one seat contributes to one simulated frame: held controls and its panel commands. */
export interface PvpSeatFrame {
  /** Held controls, packed with `packReplayInput`. */
  input: number
  commands: readonly PvpCommand[]
}

/** Everything that decides one PvP frame. Two simulations fed the same list agree exactly. */
export interface PvpFrameInput {
  player: PvpSeatFrame
  opponent: PvpSeatFrame
}

/** Fixed order between seats: place 1's commands resolve before place 2's, then the tick. */
export const PVP_SEAT_ORDER: readonly FightSide[] = ['player', 'opponent']

export const IDLE_SEAT: PvpSeatFrame = Object.freeze({ input: 0, commands: Object.freeze([]) })

export function applyPvpFrameCommands(state: FightState, frame: PvpFrameInput): FightState {
  let next = state
  for (const side of PVP_SEAT_ORDER)
    for (const command of frame[side].commands) next = applyPvpCommand(next, side, command)
  return next
}

/** The one PvP frame step shared by the referee and, from lot L2, the rollback session. */
export function stepPvpFrame(state: FightState, frame: PvpFrameInput): FightState {
  return tickFight(applyPvpFrameCommands(state, frame), unpackReplayInput(frame.player.input), {
    dt: FIXED_STEP,
    opponentInput: unpackReplayInput(frame.opponent.input),
    ai: false,
  })
}
