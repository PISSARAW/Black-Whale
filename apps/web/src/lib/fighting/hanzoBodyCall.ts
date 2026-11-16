import { wakeHanzoBody } from './hanzoProjection'
import type { FightInput, FightSide, FightState } from './types'

/** Audible range is a duel abstraction; the words are directed at the body. */
export const HANZO_CALL_RANGE = 18

export function canCallHanzoBody(state: FightState, side: FightSide): boolean {
  const caller = state[side]
  const target = state[side === 'player' ? 'opponent' : 'player'].hanzoProjection
  if (state.phase !== 'fighting' || !target) return false
  if (caller.health <= 0 || caller.hitStun > 0) return false
  return Math.hypot(caller.x - target.bodyX, caller.y) <= HANZO_CALL_RANGE
}

export function callHanzoBody(state: FightState, side: FightSide): FightState {
  if (!canCallHanzoBody(state, side)) return state
  const target = side === 'player' ? 'opponent' : 'player'
  return { ...state, [target]: wakeHanzoBody(state[target]) }
}

/** Evaluate simultaneous calls before either double returns to its body. */
export function resolveHanzoBodyCalls(
  state: FightState,
  input: FightInput,
  opponentInput?: FightInput,
): FightState {
  const wakePlayer = opponentInput?.call && canCallHanzoBody(state, 'opponent')
  const wakeOpponent = input.call && canCallHanzoBody(state, 'player')
  if (!wakePlayer && !wakeOpponent) return state
  return {
    ...state,
    player: wakePlayer ? wakeHanzoBody(state.player) : state.player,
    opponent: wakeOpponent ? wakeHanzoBody(state.opponent) : state.opponent,
  }
}
