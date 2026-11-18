import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'

/** Offset from Franklin's planted stance: both palms stay aimed throughout the volley. */
const BARRAGE: MoveTimeline = [
  {
    phase: 'startup',
    at: 0.65,
    pose: {
      body: [-0.06, 0, 0],
      chest: [-0.08, 0.04, 0],
      leadShoulder: [0.38, 0, 0.05],
      rearShoulder: [0.34, 0, -0.05],
      leadElbow: [-0.38, 0, 0],
      rearElbow: [-0.38, 0, 0],
      leadHip: [-0.08, 0, 0],
      rearHip: [-0.1, 0, 0],
      leadKnee: [0.2, 0, 0],
      rearKnee: [0.24, 0, 0],
    },
  },
  {
    phase: 'active',
    at: 0,
    ease: 'snap',
    pose: {
      body: [0.12, 0, 0],
      chest: [0.03, 0, 0],
      leadShoulder: [0.22, 0, -0.04],
      rearShoulder: [0.16, 0, 0.04],
      leadElbow: [0.13, 0, 0],
      rearElbow: [0.18, 0, 0],
      leadWrist: [-0.3, 0, 0],
      rearWrist: [-0.3, 0, 0],
      leadHip: [-0.08, 0, 0],
      rearHip: [0.1, 0, 0],
      leadKnee: [0.16, 0, 0],
      rearKnee: [0.12, 0, 0],
    },
  },
  {
    phase: 'active',
    at: 1,
    pose: {
      body: [0.12, 0, 0],
      chest: [0.03, 0, 0],
      leadShoulder: [0.22, 0, -0.04],
      rearShoulder: [0.16, 0, 0.04],
      leadElbow: [0.13, 0, 0],
      rearElbow: [0.18, 0, 0],
      leadWrist: [-0.3, 0, 0],
      rearWrist: [-0.3, 0, 0],
      leadHip: [-0.08, 0, 0],
      rearHip: [0.1, 0, 0],
      leadKnee: [0.16, 0, 0],
      rearKnee: [0.12, 0, 0],
    },
  },
  {
    phase: 'recovery',
    at: 0.22,
    ease: 'out',
    pose: {
      body: [0.08, 0, 0],
      chest: [-0.02, 0, 0],
      leadShoulder: [0.28, 0, 0],
      rearShoulder: [0.22, 0, 0],
      leadElbow: [-0.18, 0, 0],
      rearElbow: [-0.18, 0, 0],
      leadKnee: [0.2, 0, 0],
      rearKnee: [0.18, 0, 0],
    },
  },
  {
    phase: 'recovery',
    at: 0.65,
    ease: 'smooth',
    pose: {
      body: [0.02, 0, 0],
      leadShoulder: [0.12, 0, 0],
      rearShoulder: [0.1, 0, 0],
      leadElbow: [-0.08, 0, 0],
      rearElbow: [-0.08, 0, 0],
      leadKnee: [0.06, 0, 0],
      rearKnee: [0.06, 0, 0],
    },
  },
]

const LOW_BARRAGE: MoveTimeline = BARRAGE.map((key) => ({
  ...key,
  pose: {
    ...key.pose,
    leadShoulder: [(key.pose.leadShoulder?.[0] ?? 0) + 0.18, 0, 0.03],
    rearShoulder: [(key.pose.rearShoulder?.[0] ?? 0) + 0.19, 0, -0.03],
  },
}))

export const FRANKLIN_KEY_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  neutralSpecial: BARRAGE,
  forwardSpecial: BARRAGE,
  downSpecial: LOW_BARRAGE,
  backSpecial: BARRAGE,
  finisher: BARRAGE,
}
