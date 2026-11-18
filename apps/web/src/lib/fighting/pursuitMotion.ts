import { addPoses, scalePose, type FightPose } from './fightPose'
import type { ArcadeFighter } from './types'

const LOADS = {
  'hisoka:finisher': {
    root: [0, -0.07, -0.07],
    body: [0.21, 0.12, 0],
    chest: [-0.07, -0.28, 0.07],
    leadHip: [-0.28, 0, 0.04],
    leadKnee: [0.88, 0, 0],
    rearKnee: [0.19, 0, 0],
  },
  'kurapika:forwardSpecial': {
    body: [0.02, 0.19, 0],
    chest: [0.04, 0.47, -0.06],
    leadKnee: [0.19, 0, 0],
    rearKnee: [0.26, 0, 0],
  },
} as const satisfies Record<string, FightPose>

export type PursuitGesture = keyof typeof LOADS

export function pursuitGesture(attack: ArcadeFighter['attack']): PursuitGesture | undefined {
  if (attack?.directionalChain !== 'pursuit-technique') return
  if (attack.moveId === 'hisoka:finisher' || attack.moveId === 'kurapika:forwardSpecial')
    return attack.moveId
}

/** Keep the launching silhouette at the entrance and the authored contact at the exit. */
export function pursuitLoad(pose: FightPose, gesture: PursuitGesture, progress: number): FightPose {
  const weight = pursuitLoadWeight(progress)
  return weight ? addPoses(pose, scalePose(LOADS[gesture], weight)) : pose
}

export function pursuitLoadWeight(progress: number): number {
  if (progress <= 0 || progress >= 1) return 0
  return 16 * progress ** 2 * (1 - progress) ** 2
}

export function pursuitSupport(gesture: PursuitGesture, facing: 1 | -1): 0 | 1 {
  const front = facing === 1 ? 1 : 0
  return gesture === 'kurapika:forwardSpecial' ? front : facing === 1 ? 0 : 1
}
