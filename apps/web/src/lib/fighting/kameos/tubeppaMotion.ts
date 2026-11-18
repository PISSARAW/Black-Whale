import type { HumanAnimationLayer } from '$lib/tour/humanAnimation'
import type { FightPose } from '../fightPose'
import type { MoveTimeline } from '../keyPoseTimeline'
import type { KameoSlot } from './types'
import { tubeppaGlassesMotion } from './tubeppaContacts'
import { supportAnimation, type SupportChoreography } from './supportAnimation'

// Art direction for the support adaptation: no new canon ability or combat action.
const COMPOSED: FightPose = {
  chest: [0.015, -0.2, 0],
  head: [0.015, 0, 0],
  leadShoulder: [-0.18, 0, 0.06],
  rearShoulder: [-0.12, 0, -0.08],
  leadElbow: [-0.45, 0, 0],
  rearElbow: [-0.35, 0, 0],
  leadHip: [-0.07, 0, 0.025],
  rearHip: [0.06, 0, -0.025],
  leadKnee: [0.09, 0, 0],
  rearKnee: [0.06, 0, 0],
}
const ADJUST_GLASSES: FightPose = {
  ...COMPOSED,
  chest: [0.015, -0.16, 0],
  head: [0.035, 0, 0.015],
  leadShoulder: [-1.9, 0, -0.25],
  leadElbow: [-1.75, 0, 0],
  leadWrist: [0.12, 0.1, 0.05],
}
const PREPARE: FightPose = {
  ...COMPOSED,
  chest: [0.055, -0.12, 0],
  head: [0.09, 0, 0],
  leadShoulder: [-0.52, -0.1, 0.13],
  rearShoulder: [-0.48, 0.1, -0.13],
  leadElbow: [-1.5, 0, 0],
  rearElbow: [-1.4, 0, 0],
  leadWrist: [0.2, 0.3, 0],
  rearWrist: [0.15, -0.3, 0],
}
const DELIVER: FightPose = {
  ...COMPOSED,
  chest: [0.08, -0.32, 0],
  head: [-0.035, 0, 0],
  leadShoulder: [-1.18, 0, 0.11],
  leadElbow: [-0.42, 0, 0],
  leadWrist: [0.2, 0.35, 0.1],
  rearShoulder: [-0.45, 0, -0.1],
  rearElbow: [-1.5, 0, 0],
  rearWrist: [0.12, -0.2, 0],
  leadKnee: [0.16, 0, 0],
  rearKnee: [0.08, 0, 0],
}
const EXIT: FightPose = {
  ...COMPOSED,
  chest: [0.01, -0.08, 0],
  leadShoulder: [-0.1, 0, 0.04],
  rearShoulder: [0.08, 0, -0.04],
  leadHip: [0.11, 0, 0.02],
  rearHip: [-0.12, 0, -0.02],
  rearKnee: [0.18, 0, 0],
}
const ENTER: MoveTimeline = [
  { phase: 'recovery', at: 0, pose: COMPOSED },
  { phase: 'recovery', at: 0.5, pose: ADJUST_GLASSES },
  { phase: 'recovery', at: 1, pose: PREPARE },
]
const ACT: MoveTimeline = [
  { phase: 'startup', at: 0, pose: PREPARE },
  { phase: 'startup', at: 0.6, pose: { ...PREPARE, chest: [0.07, -0.09, 0] } },
  { phase: 'active', at: 0, pose: DELIVER, ease: 'out' },
  { phase: 'recovery', at: 0.2, pose: DELIVER },
  { phase: 'recovery', at: 1, pose: COMPOSED },
]
const LEAVE: MoveTimeline = [
  { phase: 'recovery', at: 0, pose: COMPOSED },
  { phase: 'recovery', at: 1, pose: EXIT },
]
const STYLE: SupportChoreography = {
  stance: COMPOSED,
  enter: ENTER,
  act: ACT,
  leave: LEAVE,
  effort: 0.8,
  rightHanded: true,
  contact: tubeppaGlassesMotion,
}

export function tubeppaAnimation(
  slot: KameoSlot,
  seconds: number,
  fallenProgress = 1,
): HumanAnimationLayer {
  return supportAnimation({ slot, seconds, fallenProgress, style: STYLE })
}
