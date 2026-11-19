import { canMove } from './fightActorState'
import type { AuraAttackOptions } from './auraAttackAction'
import { EMPTY_INPUT, type FightInput, type FightSide, type FightState } from './types'

export function performLegacyThrow(
  state: FightState,
  side: FightSide,
  perform: (options: AuraAttackOptions) => FightState,
  input: FightInput = EMPTY_INPUT,
): FightState {
  const fighter = state[side]
  if (fighter.y > 0 || !canMove(fighter)) return state
  return perform({ state, side, kind: 'heavy', variant: 'throw', auraCharged: input.aura })
}
