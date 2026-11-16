import type { MoveTimeline } from './keyPoseTimeline'

/** An activation gesture, never a portal-powered strike. */
export const DOOR_LINK_POSE: MoveTimeline = [
  {
    phase: 'startup',
    at: 0.7,
    pose: {
      leadShoulder: [-0.55, 0, -0.25],
      leadElbow: [-0.8, 0, 0],
      rearShoulder: [-0.3, 0, 0.2],
      rearElbow: [-0.7, 0, 0],
    },
  },
  {
    phase: 'active',
    at: 0,
    pose: {
      leadShoulder: [-0.6, 0, -0.35],
      leadElbow: [-0.6, 0, 0],
      rearShoulder: [-0.4, 0, 0.35],
      rearElbow: [-0.6, 0, 0],
    },
  },
]
