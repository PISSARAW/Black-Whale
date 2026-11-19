import type { ArcadeFighter } from './types'

/** Ch. 399 exhausts the knives. Four carried knives is duel tuning, not a manga count. */
export const HINRIGH_KNIVES = 4

/** Borrowing Biohazard supplies no physical knives; ordinary ranged attacks keep the real body's kit. */
export function hinrighRangedBody(fighter: ArcadeFighter): ArcadeFighter {
  return ['hinrigh', 'tserriednich', 'halkenburg'].includes(fighter.id) && fighter.nenOwner
    ? { ...fighter, id: fighter.nenOwner }
    : fighter
}
declare module './types' {
  interface ArcadeFighter {
    hinrighKnives?: number
  }
}
export function hinrighCanThrow(fighter: ArcadeFighter): boolean {
  return fighter.id !== 'hinrigh' || (fighter.hinrighKnives ?? HINRIGH_KNIVES) > 0
}
export function spendHinrighKnife(fighter: ArcadeFighter): ArcadeFighter {
  return fighter.id === 'hinrigh'
    ? { ...fighter, hinrighKnives: Math.max(0, (fighter.hinrighKnives ?? HINRIGH_KNIVES) - 1) }
    : fighter
}
