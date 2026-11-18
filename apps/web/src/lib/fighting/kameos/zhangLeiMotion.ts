import type { HumanAnimationLayer } from '$lib/tour/humanAnimation'
import type { FightPose } from '../fightPose'
import { supportAnimation, type SupportChoreography } from './supportAnimation'
import type { KameoSlot } from './types'

// Art direction for the arcade support: measured acknowledgement of the guardian's bonus.
const COMPOSED: FightPose = {
  chest: [0.015, -0.14, 0],
  head: [0.025, 0, 0],
  leadShoulder: [-0.25, 0, 0.05],
  rearShoulder: [-0.22, 0, -0.05],
  leadElbow: [-1.05, 0, 0],
  rearElbow: [-1.1, 0, 0],
  leadWrist: [0.05, 0.3, 0],
  rearWrist: [0.05, -0.3, 0],
  leadHip: [-0.06, 0, 0.025],
  rearHip: [0.04, 0, -0.025],
  leadKnee: [0.1, 0, 0],
  rearKnee: [0.08, 0, 0],
}
const ACKNOWLEDGE: FightPose = {
  ...COMPOSED,
  chest: [0.055, -0.12, 0],
  head: [0.13, 0, 0],
  leadElbow: [-1.3, 0, 0],
  rearElbow: [-1.3, 0, 0],
}
const PREPARE: FightPose = {
  ...COMPOSED,
  chest: [0.025, -0.18, 0],
  head: [0.035, 0, 0],
  leadShoulder: [-0.55, 0, 0.1],
  leadElbow: [-1.25, 0, 0],
  leadWrist: [0.2, 0.65, 0.08],
}
const OFFER: FightPose = {
  ...COMPOSED,
  chest: [0.04, -0.28, 0],
  head: [-0.025, 0, 0.015],
  leadShoulder: [-1.03, 0, 0.13],
  leadElbow: [-0.5, 0, 0],
  leadWrist: [0.18, 0.85, 0.1],
  rearShoulder: [-0.3, 0, -0.08],
  rearElbow: [-1.35, 0, 0],
  leadKnee: [0.15, 0, 0],
  rearKnee: [0.08, 0, 0],
}
const WITHDRAW: FightPose = {
  ...COMPOSED,
  chest: [0.015, -0.08, 0],
  head: [0.055, 0.08, 0],
  leadShoulder: [-0.16, 0, 0.04],
  rearShoulder: [-0.18, 0, -0.04],
  leadHip: [0.08, 0, 0.02],
  rearHip: [-0.08, 0, -0.02],
  rearKnee: [0.17, 0, 0],
}
const STYLE: SupportChoreography = {
  stance: COMPOSED,
  effort: 0.72,
  rightHanded: true,
  enter: [
    { phase: 'recovery', at: 0, pose: COMPOSED },
    { phase: 'recovery', at: 0.5, pose: ACKNOWLEDGE },
    { phase: 'recovery', at: 1, pose: PREPARE },
  ],
  act: [
    { phase: 'startup', at: 0, pose: PREPARE },
    { phase: 'startup', at: 0.6, pose: { ...PREPARE, leadWrist: [0.2, 0.78, 0.08] } },
    { phase: 'active', at: 0, pose: OFFER, ease: 'out' },
    { phase: 'recovery', at: 0.2, pose: OFFER },
    { phase: 'recovery', at: 1, pose: COMPOSED },
  ],
  leave: [
    { phase: 'recovery', at: 0, pose: COMPOSED },
    { phase: 'recovery', at: 1, pose: WITHDRAW },
  ],
}

export function zhangLeiAnimation(
  slot: KameoSlot,
  seconds: number,
  fallenProgress = 1,
): HumanAnimationLayer {
  return supportAnimation({ slot, seconds, fallenProgress, style: STYLE })
}
