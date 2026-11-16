import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'

/** Offset from Franklin's planted stance: both palms stay aimed throughout the volley. */
const BARRAGE: MoveTimeline = [
  {
    phase: 'startup',
    at: 0.65,
    pose: {
      chest: [-0.05, 0.08, 0],
      leadShoulder: [0.12, 0, 0.05],
      rearShoulder: [0.12, 0, -0.05],
      leadElbow: [-0.12, 0, 0],
      rearElbow: [-0.12, 0, 0],
    },
  },
  {
    phase: 'active',
    at: 0,
    ease: 'snap',
    pose: {
      chest: [0.03, 0, 0],
      leadShoulder: [0.22, 0, -0.04],
      rearShoulder: [0.16, 0, 0.04],
      leadElbow: [0.13, 0, 0],
      rearElbow: [0.18, 0, 0],
      leadWrist: [-0.3, 0, 0],
      rearWrist: [-0.3, 0, 0],
    },
  },
  {
    phase: 'active',
    at: 1,
    pose: {
      chest: [0.03, 0, 0],
      leadShoulder: [0.22, 0, -0.04],
      rearShoulder: [0.16, 0, 0.04],
      leadElbow: [0.13, 0, 0],
      rearElbow: [0.18, 0, 0],
      leadWrist: [-0.3, 0, 0],
      rearWrist: [-0.3, 0, 0],
    },
  },
  { phase: 'recovery', at: 0.5, pose: { leadElbow: [-0.1, 0, 0], rearElbow: [-0.1, 0, 0] } },
]

const LOW_BARRAGE: MoveTimeline = BARRAGE.map((key) => ({
  ...key,
  pose: { ...key.pose, leadShoulder: [0.4, 0, 0.03], rearShoulder: [0.35, 0, -0.03] },
}))

export const FRANKLIN_KEY_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  neutralSpecial: BARRAGE,
  forwardSpecial: BARRAGE,
  downSpecial: LOW_BARRAGE,
  backSpecial: BARRAGE,
  finisher: BARRAGE,
}
