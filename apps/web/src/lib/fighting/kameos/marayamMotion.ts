import type { HumanAnimationLayer } from '$lib/tour/humanAnimation'
import type { FightPose } from '../fightPose'
import { supportAnimation, type SupportChoreography } from './supportAnimation'
import type { KameoSlot } from './types'

// Game art direction: the child reacts to protection, rather than consciously casting his beast.
const SHY: FightPose = {
  chest: [0.02, -0.17, 0],
  head: [0.035, 0, -0.025],
  leadShoulder: [-0.12, 0, 0.06],
  rearShoulder: [-0.1, 0, -0.06],
  leadElbow: [-0.35, 0, 0],
  rearElbow: [-0.3, 0, 0],
  leadHip: [-0.03, 0, 0.02],
  rearHip: [0.03, 0, -0.02],
  leadKnee: [0.08, 0, 0],
  rearKnee: [0.07, 0, 0],
}
const WAVE: FightPose = {
  ...SHY,
  head: [-0.025, 0, 0.065],
  leadShoulder: [-2.1, 0.08, 0.45],
  leadElbow: [-0.65, 0, 0],
  leadWrist: [0.05, 0.15, 0.2],
}
const STARTLE: FightPose = {
  ...SHY,
  chest: [-0.035, -0.12, 0],
  head: [-0.045, 0, 0],
  leadShoulder: [-0.58, 0, 0.22],
  rearShoulder: [-0.52, 0, -0.22],
  leadElbow: [-1.05, 0, 0],
  rearElbow: [-0.95, 0, 0],
  leadKnee: [0.18, 0, 0],
  rearKnee: [0.17, 0, 0],
}
const PROTECTED: FightPose = {
  ...SHY,
  chest: [-0.055, -0.25, 0],
  head: [-0.025, 0, 0.025],
  leadShoulder: [-1.12, 0, 0.38],
  rearShoulder: [-1.03, 0, -0.38],
  leadElbow: [-0.55, 0, 0],
  rearElbow: [-0.65, 0, 0],
  leadWrist: [0.15, 0.45, 0.12],
  rearWrist: [0.15, -0.45, -0.12],
  leadKnee: [0.2, 0, 0],
  rearKnee: [0.18, 0, 0],
}
const WITHDRAW: FightPose = {
  ...SHY,
  chest: [0.01, -0.09, 0],
  head: [0.02, 0.13, -0.02],
  leadHip: [0.1, 0, 0.025],
  rearHip: [-0.1, 0, -0.025],
  rearKnee: [0.2, 0, 0],
}
const STYLE: SupportChoreography = {
  stance: SHY,
  effort: 0.72,
  rightHanded: true,
  enter: [
    { phase: 'recovery', at: 0, pose: SHY },
    { phase: 'recovery', at: 0.45, pose: WAVE },
    { phase: 'recovery', at: 0.65, pose: { ...WAVE, leadWrist: [0.05, 0.15, -0.15] } },
    { phase: 'recovery', at: 1, pose: STARTLE },
  ],
  act: [
    { phase: 'startup', at: 0, pose: STARTLE },
    { phase: 'startup', at: 0.6, pose: { ...STARTLE, head: [-0.07, 0, 0] } },
    { phase: 'active', at: 0, pose: PROTECTED, ease: 'out' },
    { phase: 'recovery', at: 0.2, pose: PROTECTED },
    { phase: 'recovery', at: 1, pose: SHY },
  ],
  leave: [
    { phase: 'recovery', at: 0, pose: SHY },
    { phase: 'recovery', at: 1, pose: WITHDRAW },
  ],
}

export function marayamAnimation(
  slot: KameoSlot,
  seconds: number,
  fallenProgress = 1,
): HumanAnimationLayer {
  return supportAnimation({ slot, seconds, fallenProgress, style: STYLE })
}
