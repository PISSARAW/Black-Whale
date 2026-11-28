import { motionOf } from './fighterMovement'
import type { ArcadeFighter } from './types'

/** Feitan's reference guard: calm, blade presented, free index raised. */
function freeIdleGuard(fighter: ArcadeFighter): boolean {
  return fighter.hitStun === 0 && fighter.blockStun === 0 && !fighter.blocking
}

export function feitanIconicIdle(fighter: ArcadeFighter): boolean {
  return Boolean(
    fighter.id === 'feitan' &&
    fighter.pose === 'idle' &&
    !fighter.attack &&
    !motionOf(fighter).dash &&
    fighter.y === 0 &&
    freeIdleGuard(fighter) &&
    !fighter.umbrellaFeintFrames &&
    !fighter.hatsuEffects.painPacker?.armour,
  )
}

export function feitanSpeedActive(fighter: ArcadeFighter): boolean {
  return fighter.id === 'feitan' && Boolean(motionOf(fighter).dash) && fighter.hitStun === 0
}

/**
 * Presentation-only shutter gaps. The collision body keeps travelling normally:
 * this is the two-frame disappearance used by the anime to sell acceleration.
 */
export function feitanSpeedBodyVisible(fighter: ArcadeFighter): boolean {
  if (!feitanSpeedActive(fighter)) return true
  const frame = motionOf(fighter).dash!.frame
  return ![2, 3, 7].includes(frame)
}

export function feitanWounded(fighter: ArcadeFighter): boolean {
  return (
    fighter.id === 'feitan' &&
    (fighter.hatsuEffects.painPacker?.injuries ?? 0) >= Math.max(20, fighter.maxHealth * 0.2) &&
    !fighter.hatsuEffects.painPacker?.armour
  )
}
