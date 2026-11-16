import type { MoveTimeline } from './keyPoseTimeline'

/** Crossed arms gather the protective outfit, then one hand raises the sun overhead. */
export const FEITAN_PAIN_PACKER: MoveTimeline = [
  {
    phase: 'startup',
    at: 0.7,
    pose: {
      chest: [0.2, 0, 0],
      leadShoulder: [-1.1, 0, -0.5],
      rearShoulder: [-1.1, 0, 0.5],
      leadElbow: [-1, 0, 0],
      rearElbow: [-1, 0, 0],
    },
  },
  {
    phase: 'active',
    at: 0,
    ease: 'snap',
    pose: {
      chest: [0.06, 0, 0],
      leadShoulder: [-0.45, 0, -0.25],
      rearShoulder: [-0.45, 0, 0.25],
      leadElbow: [-0.4, 0, 0],
      rearElbow: [-0.4, 0, 0],
    },
  },
  { phase: 'recovery', at: 0.8, pose: { chest: [0.1, 0, 0] } },
]

export const FEITAN_RISING_SUN: MoveTimeline = [
  {
    phase: 'startup',
    at: 0.8,
    pose: {
      chest: [-0.12, 0, 0],
      rearShoulder: [-2.8, 0, -0.25],
      rearElbow: [-0.15, 0, 0],
      head: [-0.2, 0, 0],
      leadShoulder: [-0.4, 0, 0.3],
    },
  },
  {
    phase: 'active',
    at: 0,
    ease: 'snap',
    pose: {
      chest: [-0.2, 0, 0],
      rearShoulder: [-3.1, 0, -0.1],
      rearElbow: [-0.05, 0, 0],
      head: [-0.25, 0, 0],
    },
  },
  { phase: 'recovery', at: 0.7, pose: { chest: [0.08, 0, 0], rearShoulder: [-0.5, 0, 0] } },
]
