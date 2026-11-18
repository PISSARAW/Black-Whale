import { airRecoveryAvailable } from './airRecovery'
import { READY_ARMS } from './fightGestures'
import type { BodyPlan } from './fightPose'
import type { ArcadeFighter } from './types'

/** Gather the limbs into an active aerial guard on the first actionable frame. */
export function pursuitRecoveryPose(fighter: ArcadeFighter): BodyPlan | undefined {
  if (!airRecoveryAvailable(fighter)) return
  return {
    key: 'air-recovery-ready',
    plant: false,
    blend: 0,
    reactionFrame: 2,
    pose: {
      ...READY_ARMS,
      body: [0.12, 0, 0],
      chest: [0.08, -0.18, 0],
      leadHip: [-0.55, 0, 0.05],
      leadKnee: [0.7, 0, 0],
      rearHip: [0.05, 0, -0.06],
      rearKnee: [0.44, 0, 0],
    },
  }
}
