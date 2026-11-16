import type { FightPose } from './fightPose'

/** Preserve the anatomical hand of a held prop when a lead/rear pose is mirrored. */
export function rightHandedPose(pose: FightPose): FightPose {
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
