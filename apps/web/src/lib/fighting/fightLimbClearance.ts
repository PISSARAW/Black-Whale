import { Vector3, type Box3, type Object3D } from 'three'
import { coreBoxes, bodySurfaceBox } from './fightBodySeparation'
import { fightStrikeLimb } from './fightStrikeLimb'
import { reachLimb } from './fightLimbReach'
import type { FightRig } from './fightRig'
import type { ArcadeFighter } from './types'

/** Resting forearms fold to their own body when the rival occupies their space; the striking limb stays free. */
export function clearPassiveArms(rig: FightRig, rival: Object3D, fighter: ArcadeFighter): void {
  if (dedicatedBody(fighter)) return
  const cores = coreBoxes(rival)
  const striking = fighter.attack ? fightStrikeLimb(fighter, 'hands') : undefined
  for (const index of [0, 1]) {
    if (striking === 'both' || striking === (index === 0 ? 'left' : 'right')) continue
    const parts = [
      rig.human.arms[index].children[0],
      rig.elbows[index].children[0],
      rig.wrists[index],
    ]
    if (!parts.some((part) => cores.some((core) => penetrates(bodySurfaceBox(part), core))))
      continue
    const target = rig.wrists[index].getWorldPosition(new Vector3())
    const own = bodySurfaceBox(rig.human.torso)
    target.x = fighter.facing === 1 ? own.min.x : own.max.x
    target.z = rig.human.arms[index].getWorldPosition(new Vector3()).z
    reachLimb(
      { root: rig.human.arms[index], hinge: rig.elbows[index], end: rig.wrists[index] },
      target,
    )
  }
}

function dedicatedBody(fighter: ArcadeFighter): boolean {
  return Boolean(
    fighter.attack?.variant === 'throw' ||
    fighter.luiniPassage ||
    fighter.clothCapture ||
    fighter.maryCapture ||
    fighter.biohazardRestraint,
  )
}

export function clearFootTarget(target: Vector3, rival: Object3D, facing: 1 | -1): Vector3 {
  for (const side of ['left', 'right']) {
    const knee = rival.getObjectByName(`knee-${side}`)
    if (!knee) continue
    const box = bodySurfaceBox(knee.children[1]).expandByScalar(0.045)
    if (box.containsPoint(target)) target.x = facing === 1 ? box.min.x - 0.02 : box.max.x + 0.02
  }
  return target
}

function penetrates(a: Box3, b: Box3): boolean {
  return (
    Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x) > 0.025 &&
    Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y) > 0.025 &&
    Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z) > 0.025
  )
}
