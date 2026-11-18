import type { BodyPlan, FightPose } from './fightPose'
import type { ArcadeFighter } from './types'

/** The Zazan footage starts with the sword in the left hand, umbrella in the right. */
export function feitanHandedPlan(plan: BodyPlan, fighter: ArcadeFighter): BodyPlan {
  if (fighter.facing === -1) return plan
  const attack = plan.attackFlow
  return {
    ...plan,
    pose: leftWeaponPose(plan.pose),
    attackFlow: attack?.contact ? { ...attack, contact: leftWeaponPose(attack.contact) } : attack,
  }
}

/** Keep the anatomical arm and its outward bend when changing the viewing side. */
function leftWeaponPose(pose: FightPose): FightPose {
  const next = { ...pose }
  for (const joint of ['Shoulder', 'Elbow', 'Wrist'] as const) {
    const lead = `lead${joint}` as const,
      rear = `rear${joint}` as const
    delete next[lead]
    delete next[rear]
    if (pose[lead]) next[rear] = [pose[lead][0], -pose[lead][1], -pose[lead][2]]
    if (pose[rear]) next[lead] = [pose[rear][0], -pose[rear][1], -pose[rear][2]]
  }
  return next
}
