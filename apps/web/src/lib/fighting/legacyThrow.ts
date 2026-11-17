import { canMove } from './fightActorState'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightSide, FightState } from './types'

export function performLegacyThrow(
  state: FightState,
  side: FightSide,
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const fighter = state[side]
  if (fighter.y > 0 || !canMove(fighter)) return state
  return perform({ state, side, kind: 'heavy', variant: 'throw', auraCharged: false })
}
