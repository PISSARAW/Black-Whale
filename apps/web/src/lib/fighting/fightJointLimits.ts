import type { Object3D } from 'three'
import type { FightRig } from './fightRig'
import type { Turn } from './fightPose'
import { HUMAN_JOINT_LIMITS, limitEuler } from '$lib/tour/humanJointLimits'
export { HUMAN_JOINT_LIMITS, keepHumanJoint } from '$lib/tour/humanJointLimits'

function limitPair(
  parts: readonly Object3D[],
  range: (typeof HUMAN_JOINT_LIMITS)[keyof typeof HUMAN_JOINT_LIMITS],
): void {
  parts.forEach((part, index) => limitEuler(part.rotation, range, index === 0 ? -1 : 1))
}

/** The chest turn, clamped before it moves the pivot and counter-turns the head. */
export function humanChestTurn(turn: Turn): Turn {
  const { chest } = HUMAN_JOINT_LIMITS
  return [
    Math.min(chest.x[1], Math.max(chest.x[0], turn[0])),
    Math.min(chest.y[1], Math.max(chest.y[0], turn[1])),
    Math.min(chest.z[1], Math.max(chest.z[0], turn[2])),
  ]
}

/** Bring every articulated joint of a posed fighter back inside human range. */
export function keepHumanJoints(rig: FightRig): void {
  const { human } = rig
  limitEuler(rig.chest.rotation, HUMAN_JOINT_LIMITS.chest, 1)
  limitEuler(human.head.rotation, HUMAN_JOINT_LIMITS.head, 1)
  limitPair(human.arms, HUMAN_JOINT_LIMITS.shoulder)
  limitPair(rig.elbows, HUMAN_JOINT_LIMITS.elbow)
  limitPair(rig.wrists, HUMAN_JOINT_LIMITS.wrist)
  limitPair(human.legs, HUMAN_JOINT_LIMITS.hip)
  limitPair(human.knees, HUMAN_JOINT_LIMITS.knee)
  limitPair(rig.ankles, HUMAN_JOINT_LIMITS.ankle)
}
