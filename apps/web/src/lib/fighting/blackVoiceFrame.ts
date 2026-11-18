import { blackVoiceAvailable } from './blackVoiceControl'
import type { FightSide, FightState } from './types'

/** The physical antenna remains planted when the page is unavailable; control pauses. */
export function advanceBlackPrimaries(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) next = advance(next, side)
  return next
}

function advance(state: FightState, side: FightSide): FightState {
  const target = state[side]
  const owner = target.blackControlledBy
  if (!owner) return state
  const active = blackVoiceAvailable(state, owner) && state[owner].health > 0
  const direction = target.x >= state[owner].x ? 1 : -1
  return {
    ...state,
    [side]: {
      ...target,
      x: active ? Math.max(7, Math.min(93, target.x + direction * 0.3)) : target.x,
      attack: active ? null : target.attack,
      bufferedAttack: active ? null : target.bufferedAttack,
      blocking: active ? false : target.blocking,
      hitStun: active ? Math.max(target.hitStun, 2) : target.hitStun,
      hatsuEffects: { ...target.hatsuEffects, manipulatedFrames: active ? 1 : 0 },
    },
  }
}
