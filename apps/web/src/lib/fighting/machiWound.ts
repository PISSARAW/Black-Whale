import type { ArcadeFighter, FightState } from './types'

/**
 * Fil court (SIGNATURE_COMBOS.md): Machi's Seamstress Elbow that lands inside a combo opens a
 * real wound (openWounds + 1), which Nen Stitches can later suture. As an opener it does not:
 * the wound needs a body already held by the combo. Duel tuning, not canon.
 */
export function machiElbowWound(fighter: ArcadeFighter, hit: FightState['impact']): boolean {
  return (
    fighter.id === 'machi' &&
    fighter.attack?.moveId === 'machi:standingHeavy' &&
    (hit?.comboHits ?? 0) >= 2
  )
}
