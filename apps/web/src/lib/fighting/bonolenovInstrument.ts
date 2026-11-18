import { battleBodyAvailable, battleMindAvailable } from './battleCantabileRules'
import { emptyBattleCantabile } from './battleCantabileTypes'
import { freeCombatBody } from './fightActorState'
import type { ArcadeFighter } from './types'

/** Physical body music needs his own uncovered Gyudondond body, not a copied Hatsu. */
export function bonolenovInstrumentExposed(fighter: ArcadeFighter): boolean {
  if (!battleBodyAvailable(fighter) || fighter.battleCantabile?.form) return false
  const battle = fighter.battleCantabile
  return Boolean(battle?.unwrapped || battle?.preparation || battle?.prologue)
}

export function bonolenovBodyMoving(fighter: ArcadeFighter): boolean {
  if (!instrumentBodyReady(fighter)) return false
  return Boolean(
    fighter.battleCantabile?.preparation ||
    fighter.attack ||
    fighter.pose === 'walk' ||
    fighter.y > 0,
  )
}

function instrumentBodyReady(fighter: ArcadeFighter): boolean {
  return (
    battleBodyAvailable(fighter) &&
    freeCombatBody(fighter) &&
    battleMindAvailable(fighter) &&
    !fighter.blocking &&
    !fighter.battleCantabile?.form
  )
}

/** One simulated transition, rather than rewrapping the body between every punch. */
export function unwrapBonolenovInstrument(fighter: ArcadeFighter): ArcadeFighter {
  if (fighter.battleCantabile?.unwrapped || !bonolenovBodyMoving(fighter)) return fighter
  return {
    ...fighter,
    battleCantabile: { ...(fighter.battleCantabile ?? emptyBattleCantabile()), unwrapped: true },
  }
}
