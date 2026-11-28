import { attackData } from './frameData'
import { moveById } from './movesets'
import { CYCLOTRON_PUNCH, cyclotronNenActive } from './phinksCyclotron'
import type { ArcadeFighter } from './types'

/**
 * Combo release (Dix tours, un poing, signatureCombosBiscuitPhinks.ts): with at least one full
 * turn, the right punch may cancel the confirmed hook while the arm is turning, or a confirmed
 * blow whose chain names the release. Only the release steps in and consumes those turns.
 */
export function cyclotronComboRelease(fighter: ArcadeFighter): boolean {
  const attack = fighter.attack
  if (!attack?.confirmedHit || fighter.hatsuEffects.cyclotronTurns <= 0) return false
  if (!cyclotronNenActive(fighter) || fighter.y > 0) return false
  return (
    canChainRelease(fighter, attack.moveId) &&
    attack.frame <= attackData(attack.kind, fighter).cancelEnd
  )
}

function canChainRelease(fighter: ArcadeFighter, moveId: string | undefined): boolean {
  if (moveId === 'phinks:standingHeavy' && fighter.cyclotronWindup) return true
  return moveById(moveId)?.cancelInto.includes(CYCLOTRON_PUNCH) ?? false
}
