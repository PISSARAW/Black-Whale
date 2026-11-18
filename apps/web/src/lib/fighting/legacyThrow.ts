import { canMove } from './fightActorState'
import type { AuraAttackOptions } from './auraAttackAction'
import { EMPTY_INPUT, type FightInput, type FightSide, type FightState } from './types'

export function performLegacyThrow(
  { state, side, input = EMPTY_INPUT }: { state: FightState; side: FightSide; input?: FightInput },
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const fighter = state[side]
  if (fighter.y > 0 || !canMove(fighter)) return state
  return perform({
    state,
    side,
    kind: 'heavy',
    variant: 'throw',
    auraCharged: fighter.id === 'bonolenov' && input.aura,
  })
}
