import type { HumanAnimationLayer } from '$lib/tour/humanAnimation'
import type { FightPose } from '../fightPose'
import { supportAnimation, type SupportChoreography } from './supportAnimation'
import type { KameoSlot } from './types'

const CONTENT: FightPose = {
  chest: [-0.025, -0.17, 0.015],
  head: [-0.025, 0, -0.025],
  leadShoulder: [-0.23, 0, 0.12],
  rearShoulder: [-0.22, 0, -0.1],
  leadElbow: [-1.05, 0, 0],
  rearElbow: [-1.08, 0, 0],
  leadWrist: [0.08, 0.22, 0],
  rearWrist: [0.08, -0.22, 0],
  leadHip: [-0.035, 0, 0.025],
  rearHip: [0.03, 0, -0.025],
  leadKnee: [0.09, 0, 0],
  rearKnee: [0.075, 0, 0],
}
const GREET: FightPose = {
  ...CONTENT,
  chest: [-0.03, -0.12, 0.02],
  head: [-0.035, 0, -0.04],
  leadShoulder: [-1.2, 0, 0.16],
  leadElbow: [-1.12, 0, 0],
  leadWrist: [0.1, 0.6, 0.12],
}
const INHALE: FightPose = {
  ...CONTENT,
  chest: [-0.065, -0.13, 0],
  head: [-0.07, 0, -0.015],
  leadShoulder: [-0.6, 0, 0.3],
  rearShoulder: [-0.58, 0, -0.28],
  leadElbow: [-1.1, 0, 0],
  rearElbow: [-1.1, 0, 0],
}
const EXPAND: FightPose = {
  ...CONTENT,
  chest: [-0.045, -0.28, 0.015],
  head: [-0.045, 0, -0.025],
  leadShoulder: [-0.95, 0, 0.65],
  rearShoulder: [-0.9, 0, -0.55],
  leadElbow: [-0.35, 0, 0],
  rearElbow: [-0.38, 0, 0],
  leadWrist: [0.16, 0.7, 0.12],
  rearWrist: [0.16, -0.7, -0.1],
  leadKnee: [0.18, 0, 0],
  rearKnee: [0.12, 0, 0],
}
const LEAVE: FightPose = {
  ...CONTENT,
  chest: [-0.015, -0.07, 0.015],
  head: [-0.015, 0.12, -0.025],
  leadHip: [0.06, 0, 0.025],
  rearHip: [-0.06, 0, -0.025],
  rearKnee: [0.13, 0, 0],
}
const STYLE: SupportChoreography = {
  stance: CONTENT,
  effort: 0.85,
  rightHanded: true,
  enter: [
    { phase: 'recovery', at: 0, pose: CONTENT },
    { phase: 'recovery', at: 0.5, pose: GREET },
    { phase: 'recovery', at: 1, pose: INHALE },
  ],
  act: [
    { phase: 'startup', at: 0, pose: INHALE },
    { phase: 'startup', at: 0.6, pose: INHALE },
    { phase: 'active', at: 0, pose: EXPAND, ease: 'out' },
    { phase: 'recovery', at: 0.2, pose: EXPAND },
    { phase: 'recovery', at: 1, pose: CONTENT },
  ],
  leave: [
    { phase: 'recovery', at: 0, pose: CONTENT },
    { phase: 'recovery', at: 1, pose: LEAVE },
  ],
}

/** A showy reaction to the guardian's smoke in its existing arcade support adaptation. */
export function salesaleAnimation(
  slot: KameoSlot,
  seconds: number,
  fallenProgress = 1,
): HumanAnimationLayer {
  return supportAnimation({ slot, seconds, fallenProgress, style: STYLE })
}
