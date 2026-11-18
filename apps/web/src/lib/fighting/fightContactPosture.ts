import { addPoses, scalePose, type BodyPlan, type FightPose } from './fightPose'

const LEGS = ['leadHip', 'rearHip', 'leadKnee', 'rearKnee'] as const

/** A low entry owns a low contact variant until recovery; it never has to stand up inside a short cancel. */
export function contactPostureFrom(from: FightPose, plan: BodyPlan): FightPose | undefined {
  const contact = plan.attackFlow?.contact
  if (!plan.plant || !contact || kneeDepth(from) - kneeDepth(contact) < 0.3) return undefined
  const offset: FightPose = {}
  for (const joint of LEGS) {
    const a = from[joint] ?? [0, 0, 0],
      b = contact[joint] ?? [0, 0, 0]
    offset[joint] = [bounded((a[0] - b[0]) * 0.82), 0, bounded((a[2] - b[2]) * 0.5)]
  }
  return offset
}

export function withContactPosture(plan: BodyPlan, posture?: FightPose): BodyPlan {
  const attack = plan.attackFlow
  if (!posture || !attack) return plan
  const recovery = Math.max(0, attack.frame - attack.startup - (attack.active ?? 0))
  const p = Math.min(1, recovery / Math.max(1, attack.recovery ?? 12))
  const weight = 1 - p * p * (3 - 2 * p)
  return {
    ...plan,
    pose: addPoses(plan.pose, scalePose(posture, weight)),
    attackFlow: { ...attack, contact: attack.contact && addPoses(attack.contact, posture) },
  }
}

function kneeDepth(pose: FightPose): number {
  return ((pose.leadKnee?.[0] ?? 0) + (pose.rearKnee?.[0] ?? 0)) / 2
}

function bounded(value: number): number {
  return Math.max(-1.1, Math.min(1.1, value))
}
