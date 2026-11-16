import type { MoveTimeline } from './keyPoseTimeline'

/** Both hands brought together around the console, without a striking extension. */
export const FURYKOV_CONSOLE_POSE: MoveTimeline = [
  {
    phase: 'startup',
    at: 0.5,
    pose: {
      chest: [0.1, 0, 0],
      head: [0.2, 0, 0],
      leadShoulder: [-0.4, 0, -0.2],
      leadElbow: [-0.3, 0, 0],
      rearShoulder: [-0.4, 0, 0.2],
      rearElbow: [-0.3, 0, 0],
    },
  },
  {
    phase: 'active',
    at: 0,
    ease: 'snap',
    pose: {
      head: [0.35, 0, 0],
      leadShoulder: [-0.5, 0, -0.25],
      leadElbow: [-0.25, 0, 0],
      rearShoulder: [-0.5, 0, 0.25],
      rearElbow: [-0.25, 0, 0],
      leadWrist: [0.2, 0, 0],
      rearWrist: [0.2, 0, 0],
    },
  },
]
