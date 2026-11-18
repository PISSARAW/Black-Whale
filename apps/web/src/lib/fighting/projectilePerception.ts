import { senseDeprived } from './saiyuSenses'
import { insideEn, perceivesProjectile } from './nenPerception'
import { voluntaryNenAvailable } from './nenAccess'
import type { ArcadeFighter, FightProjectile, FightSide, FightState } from './types'

export function seesProjectile(viewer: ArcadeFighter, shot: FightProjectile): boolean {
  return (
    !senseDeprived(viewer, 'sight') &&
    !viewer.parallelEyesClosed &&
    (shot.matter === 'object' ||
      !shot.concealed ||
      (voluntaryNenAvailable(viewer) && perceivesProjectile(viewer, shot)))
  )
}

/** Current public manifestations only; no buried path, future shot or private target. */
export function perceivedProjectiles(state: FightState, side: FightSide): FightProjectile[] {
  const viewer = state[side]
  return state.projectiles.filter(
    (shot) =>
      shot.owner !== side &&
      shot.y >= 0 &&
      (seesProjectile(viewer, shot) ||
        (insideEn(viewer, shot) && (shot.matter === 'object' || !shot.concealed))),
  )
}
