import { attackData } from './frameData'
import { moveById } from './movesets'
import { CYCLOTRON_PUNCH, cyclotronNenActive } from './phinksCyclotron'
import type { ArcadeFighter } from './types'

/**
 * Combo release (Dix tours, un poing, signatureCombosBiscuitPhinks.ts): with at least one full
 * turn, the right punch may cancel a confirmed ordinary blow whose written chain names it. It
 * then steps in (CYCLOTRON_COMBO_LUNGE) and reaches the body that blow put down. Only the
 * release consumes the turns; the blow before it gained nothing. Duel tuning, not canon.
 */
export function cyclotronComboRelease(fighter: ArcadeFighter): boolean {
  const attack = fighter.attack
  if (!attack?.confirmedHit || fighter.hatsuEffects.cyclotronTurns <= 0) return false
  if (!cyclotronNenActive(fighter) || fighter.y > 0) return false
  const chained = moveById(attack.moveId)?.cancelInto.includes(CYCLOTRON_PUNCH)
  return Boolean(chained) && attack.frame <= attackData(attack.kind, fighter).cancelEnd
}
