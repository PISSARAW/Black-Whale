import type { MoveTimeline } from './keyPoseTimeline'

/** Fold at the hips, lower the centre, and drive the rear fist into the floor. */
export const LEORIO_REMOTE_PUNCH: MoveTimeline = [
  {
    phase: 'startup',
    at: 0.5,
    pose: {
      root: [0, 0, 0],
      chest: [0.35, 0.2, 0],
      rearShoulder: [-0.7, 0, 0],
      rearElbow: [-0.15, 0, 0],
      leadHip: [-0.4, 0, 0],
      rearHip: [-0.4, 0, 0],
      leadKnee: [0.7, 0, 0],
      rearKnee: [0.7, 0, 0],
    },
  },
  {
    phase: 'active',
    at: 0,
    ease: 'snap',
    pose: {
      root: [0, 0, 0.05],
      chest: [1.6, 0.25, 0],
      head: [-0.4, 0, 0],
      rearShoulder: [-1.3, 0, 0.12],
      rearElbow: [2, 0, 0],
      leadShoulder: [0.2, 0, 0],
      leadElbow: [-0.2, 0, 0],
      leadHip: [-1.19, 0, 0],
      rearHip: [-1.36, 0, 0],
      leadKnee: [1.7, 0, 0],
      rearKnee: [1.7, 0, 0],
    },
  },
  {
    phase: 'recovery',
    at: 0.35,
    pose: {
      root: [0, 0, 0],
      chest: [0.5, 0.1, 0],
      rearShoulder: [0.3, 0, 0],
      rearElbow: [1.1, 0, 0],
      leadKnee: [0.5, 0, 0],
      rearKnee: [0.5, 0, 0],
    },
  },
]
