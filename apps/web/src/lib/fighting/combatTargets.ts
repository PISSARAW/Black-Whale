import { sleepingBody } from './hanzoProjection'
import type { ArcadeFighter } from './types'

export const MAX_JUGGLE_HITS = 3

/** Shared by strikes and projectiles, including simultaneous volleys. */
export function canReceiveCombatHit(fighter: ArcadeFighter, canHitDowned = false): boolean {
  if (fighter.clothCapture) return false
  if (fighter.hanzoProjection) return sleepingBody(fighter).health > 0
  if (fighter.health <= 0) return false
  if (fighter.y > 0) return fighter.juggleCount < MAX_JUGGLE_HITS
  return fighter.knockdownFrames === 0 || canHitDowned
}
