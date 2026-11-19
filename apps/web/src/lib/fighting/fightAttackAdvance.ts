import type { ArcadeFighter } from './types'

declare module './types' {
  interface ArcadeFighter {
    attackDrive?: { total: number; applied: number }
  }
}
/** Logical movement follows the wind-up and reaches its authored range at contact. */
export function beginAttackDrive(
  fighter: ArcadeFighter,
  input: { distance: number; immediate: boolean },
) {
  return {
    x: input.immediate ? bounded(fighter.x + fighter.facing * input.distance) : fighter.x,
    attackDrive: input.immediate ? undefined : { total: input.distance, applied: 0 },
  }
}
export function advanceAttackDrive(fighter: ArcadeFighter, startup: number): ArcadeFighter {
  const drive = fighter.attackDrive,
    attack = fighter.attack
  if (!drive || !attack || drive.applied === drive.total) return fighter
  const p = Math.min(1, Math.max(0, (attack.frame / Math.max(1, startup) - 0.25) / 0.75))
  const applied = drive.total * p * p * (3 - 2 * p)
  return {
    ...fighter,
    x: bounded(fighter.x + fighter.facing * (applied - drive.applied)),
    attackDrive: { ...drive, applied },
  }
}
function bounded(x: number) {
  return Math.max(7, Math.min(93, x))
}
