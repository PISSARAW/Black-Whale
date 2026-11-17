import { voluntaryNenAvailable } from '../nenAccess'
import type { ArcadeFighter, FightInput } from '../types'
import { enProfile } from './profiles'
export function enBodyAvailable(fighter: ArcadeFighter): boolean {
  return (
    voluntaryNenAvailable(fighter, { requireHatsu: false, requireReserve: true }) &&
    ![
      fighter.hitStun,
      fighter.knockdownFrames,
      fighter.hanzoProjection,
      fighter.nen.ko,
      fighter.nen.ken,
    ].some(Boolean)
  )
}
export function canMaintainEn(fighter: ArcadeFighter, input: FightInput): boolean {
  const profile = enProfile(fighter)
  if (profile.radiusUnits === null || !enBodyAvailable(fighter)) return false
  return (
    !profile.unstable ||
    ![input.left, input.right, input.jump, fighter.motion?.velocityX].some(Boolean)
  )
}
/** Reject stale/forged fields and clamp to the represented range, never a supposed canonical maximum. */
export function activeEnRadius(fighter: ArcadeFighter): number {
  const requested = fighter.nen.en?.radius
  const configured = enProfile(fighter).radiusUnits
  if (!requested || !Number.isFinite(requested) || requested < 0 || configured === null) return 0
  return fighter.nen.mode === 'ren' && enBodyAvailable(fighter)
    ? Math.min(requested, configured)
    : 0
}
export function enContains(fighter: ArcadeFighter, point: { x: number; y: number }): boolean {
  const radius = activeEnRadius(fighter)
  return radius > 0 && Math.hypot(point.x - fighter.x, point.y - fighter.y) <= radius
}

/** Phinks loses concentration when he attacks; no blanket prohibition is assigned to Hinrigh. */
export function enDuringAttack(fighter: ArcadeFighter) {
  return enProfile(fighter).unstable ? null : fighter.nen.en
}
