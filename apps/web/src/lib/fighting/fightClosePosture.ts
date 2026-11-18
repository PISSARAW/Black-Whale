import type { BodyPlan, FightPose } from './fightPose'
import type { ArcadeFighter } from './types'

/** Fold through the chest at close range instead of pushing the whole trunk through the rival. */
export function closeBodyPlan(
  plan: BodyPlan,
  fighter: ArcadeFighter,
  rival?: ArcadeFighter,
): BodyPlan {
  if (!rival || !plan.plant || fighter.hanzoProjection || rival.hanzoProjection) return plan
  const room = Math.min(1, Math.max(0, (Math.abs(fighter.x - rival.x) - 4) / 7))
  const weight = 1 - room * room * (3 - 2 * room)
  if (weight === 0) return plan
  const pose = confineLean(plan.pose, weight)
  const attack = plan.attackFlow
  return {
    ...plan,
    pose,
    attackFlow: attack?.contact
      ? { ...attack, contact: confineLean(attack.contact, weight) }
      : attack,
  }
}

function confineLean(pose: FightPose, weight: number): FightPose {
  if (!pose.body || pose.body[0] <= 0.12) return pose
  const removed = (pose.body[0] - 0.12) * weight * 0.75
  const chest = pose.chest ?? [0, 0, 0]
  return {
    ...pose,
    body: [pose.body[0] - removed, pose.body[1], pose.body[2]],
    chest: [chest[0] + removed * 0.45, chest[1], chest[2]],
  }
}
