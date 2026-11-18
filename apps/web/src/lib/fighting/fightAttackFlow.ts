import { lerpPose, type FightPose } from './fightPose'
import type { PursuitGesture } from './pursuitMotion'
import type { AttackWeightTransfer } from './fightWeightTransfer'

export interface AttackFlowFrame {
  frame: number
  startup: number
  pursuit?: PursuitGesture
  loadAt?: number
  facing: 1 | -1
  contact?: FightPose
  transfer?: AttackWeightTransfer
}

export const COMBO_LINK_SECONDS = 7 / 60

/** During a cancel, the torso leads and the hands finish the previous gesture. */
export function flowIntoAttack(options: {
  from: FightPose
  to: FightPose
  progress: number
  chained: boolean
}): FightPose {
  const { from, to, progress, chained } = options
  if (progress <= 0) return from
  if (progress >= 1) return to
  if (!chained) return lerpPose(from, to, easeOut(Math.min(1, progress * 2.5)))
  const drawn = lerpPose(from, to, easeOut(progress))
  const arms = lerpPose(from, to, progress * progress * (3 - 2 * progress))
  return {
    ...drawn,
    leadShoulder: arms.leadShoulder,
    rearShoulder: arms.rearShoulder,
    leadElbow: arms.leadElbow,
    rearElbow: arms.rearElbow,
    leadWrist: arms.leadWrist,
    rearWrist: arms.rearWrist,
  }
}

function easeOut(value: number): number {
  return 1 - (1 - value) ** 3
}
