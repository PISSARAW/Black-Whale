import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'

/** Aim, brief recoil, then lower the handgun; no conjuration or aura discharge gesture. */
const HANDGUN_SHOT: MoveTimeline = [
  {
    phase: 'startup',
    at: 0.5,
    pose: {
      chest: [0.04, -0.15, 0],
      leadShoulder: [-0.4, 0, 0],
      leadElbow: [0.4, 0, 0],
      leadWrist: [0.7, 0, 0],
      rearShoulder: [-1.65, 0, -0.1],
      rearElbow: [1.35, 0, 0],
      rearWrist: [0.08, 0, 0],
    },
  },
  {
    phase: 'active',
    at: 0,
    ease: 'snap',
    pose: {
      chest: [0.02, -0.15, 0],
      leadShoulder: [-0.4, 0, 0],
      leadElbow: [0.4, 0, 0],
      leadWrist: [0.6, 0, 0],
      rearShoulder: [-1.73, 0, -0.1],
      rearElbow: [1.15, 0, 0],
      rearWrist: [-0.08, 0, 0],
    },
  },
  { phase: 'recovery', at: 0.8, pose: {} },
]
export const THETA_SHOT_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  neutralSpecial: HANDGUN_SHOT,
  forwardSpecial: HANDGUN_SHOT,
  downSpecial: HANDGUN_SHOT,
  backSpecial: HANDGUN_SHOT,
}
