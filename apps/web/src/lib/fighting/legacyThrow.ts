import { canMove } from './fightActorState'
import type { AuraAttackOptions } from './auraAttackAction'
import { EMPTY_INPUT, type FightInput, type FightSide, type FightState } from './types'

export function performLegacyThrow(
  options: { state: FightState; side: FightSide; input?: FightInput },
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const { state, side, input = EMPTY_INPUT } = options
  const fighter = state[side]
  if (fighter.y > 0 || !canMove(fighter)) return state
  return perform({ state, side, kind: 'heavy', variant: 'throw', auraCharged: input.aura })
}
