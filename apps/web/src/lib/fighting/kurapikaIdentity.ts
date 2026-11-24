import { motionOf } from './fighterMovement'
import type { ArcadeFighter } from './types'

/** The anime speed cut is presentation only: Kurapika keeps an ordinary collidable dash. */
export function kurapikaSpeedActive(fighter: ArcadeFighter): boolean {
  return fighter.id === 'kurapika' && Boolean(motionOf(fighter).dash) && fighter.hitStun === 0
}

/** Two short shutter gaps reproduce the 1999 disappearance without granting a teleport or i-frames. */
export function kurapikaSpeedBodyVisible(fighter: ArcadeFighter): boolean {
  if (!kurapikaSpeedActive(fighter)) return true
  const frame = motionOf(fighter).dash!.frame
  return ![2, 3, 7].includes(frame)
}
