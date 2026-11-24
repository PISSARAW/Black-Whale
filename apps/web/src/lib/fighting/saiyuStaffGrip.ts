import { Vector3, type Object3D } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { reachLimb } from './fightLimbReach'
import { fightRigOf } from './fightRig'
import type { ArcadeFighter } from './types'

const TWO_HANDED_SWINGS = new Set(['standingHeavy', 'lowHeavy', 'airHeavy', 'forwardHeavy'])

/** Keep the free hand near the shaft, without pulling the striking hand out of its pose. */
export function supportSaiyuStaff(
  fighter: ArcadeFighter,
  figure: Object3D | undefined,
  staff: Object3D,
): void {
  const human = figure && humanAnimationRig(figure)
  const slot = fighter.attack?.moveId?.split(':')[1] ?? ''
  if (!human || (!fighter.blocking && !TWO_HANDED_SWINGS.has(slot))) return
  const rig = fightRigOf(human)
  const rear = fighter.facing === 1 ? 0 : 1
  const chain = { root: human.arms[rear], hinge: rig.elbows[rear], end: rig.wrists[rear] }
  const hand = chain.end.getWorldPosition(new Vector3())
  const axis = new Vector3(0, 1, 0).applyQuaternion(staff.quaternion)
  const offset = hand.clone().sub(staff.position).dot(axis)
  const grip = staff.position.clone().addScaledVector(axis, Math.min(-0.2, Math.max(-0.54, offset)))
  reachLimb(chain, hand.lerp(grip, 0.72))
}
