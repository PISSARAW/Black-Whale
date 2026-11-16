import type { FightPose } from './fightPose'

/** Skill Hunter stays in the actual right hand when the fighter changes sides. */
export function chrolloHandedPose(pose: FightPose): FightPose {
  const next = { ...pose }
  for (const joint of ['Shoulder', 'Elbow', 'Wrist'] as const) {
    const lead = `lead${joint}` as const
    const rear = `rear${joint}` as const
    delete next[lead]
    delete next[rear]
    if (pose[rear]) next[lead] = pose[rear]
    if (pose[lead]) next[rear] = pose[lead]
  }
  return next
}
