import {
  addPoses,
  lerpPose,
  pickJoints,
  scalePose,
  UPPER_JOINTS,
  type FightPose,
} from './fightPose'
import { transferAttackWeight, type AttackWeightTransfer } from './fightWeightTransfer'

/** A cancel carries the support and torso while the striking arm finishes its outgoing arc. */
export function linkedStrikePose(input: {
  from: FightPose
  contact: FightPose
  load: FightPose
  velocity: FightPose
  transfer?: AttackWeightTransfer
  progress: number
  frames: number
}): FightPose {
  const { from, contact, progress: progress, transfer } = input
  const p = Math.min(1, Math.max(0, progress))
  if (p === 0) return from
  if (p === 1) return contact
  const torso = lerpPose(from, contact, smooth(Math.min(1, p * 1.16)))
  const arms = pickJoints(lerpPose(from, contact, smooth(p)), UPPER_JOINTS)
  const carry = scalePose(input.velocity, p * (1 - p) ** 2 * Math.min(4, input.frames))
  const gather = scalePose(input.load, 0.38 * 16 * p * p * (1 - p) ** 2)
  const pose = addPoses({ ...torso, ...arms }, carry, gather)
  return transfer ? transferAttackWeight({ from, pose, transfer, progress: p }) : pose
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t)
}
