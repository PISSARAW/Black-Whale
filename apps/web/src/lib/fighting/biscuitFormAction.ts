import { BISCUIT_FORM_MOVE, isBiscuitFormMove } from './biscuitForm'
import { canStartFighterAttack } from './fighterAttacks'
import type { AttackKind, FightSide, FightState } from './types'

/** Revealing her body neither hits the opponent nor spends aura on Cookie. */
export function performBiscuitFormAction(options: {
  state: FightState
  side: FightSide
  kind: AttackKind
  moveId?: string
}): FightState | null {
  const { state, side, kind, moveId } = options
  const fighter = state[side]
  if (kind !== 'special' || !isBiscuitFormMove(fighter, moveId)) return null
  if (fighter.y > 0 || fighter.attack) return state
  if (!canStartFighterAttack(fighter, 'special', BISCUIT_FORM_MOVE)) return state
  return { ...state, [side]: { ...fighter, biscuitTrueForm: true } }
}
