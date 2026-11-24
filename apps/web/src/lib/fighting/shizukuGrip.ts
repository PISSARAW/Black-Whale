import { Vector3, type Object3D } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { blinkyAvailable } from './blinky'
import { fightRigOf } from './fightRig'
import { reachLimb } from './fightLimbReach'
import type { ArcadeFighter } from './types'

/** Keep the free hand on the carried tool without stretching either arm or moving its mouth. */
export function supportBlinkyGrip(figure: Object3D, tool: Object3D, fighter: ArcadeFighter): void {
  const braced = fighter.pose === 'guard' || fighter.pose === 'jump'
  if (
    (!fighter.attack && !braced) ||
    fighter.attack?.variant === 'throw' ||
    !blinkyAvailable(fighter)
  )
    return
  const human = humanAnimationRig(figure)
  if (!human) return
  const rig = fightRigOf(human)
  tool.updateWorldMatrix(true, true)
  const support = tool.localToWorld(new Vector3(-0.08, 0.25, 0))
  reachLimb({ root: human.arms[0], hinge: rig.elbows[0], end: rig.wrists[0] }, support)
}
