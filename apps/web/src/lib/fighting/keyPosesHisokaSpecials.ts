import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'

/** Contact, finger curl, elastic launch, and smoothing a cloth panel are different gestures. */
export const HISOKA_SPECIAL_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  neutralSpecial: [
    { phase: 'startup', at: 0.6, pose: { leadElbow: [-1.2, 0, 0], leadWrist: [0.4, 0, 0] } },
    {
      phase: 'active',
      at: 0,
      ease: 'snap',
      pose: {
        chest: [0.08, -0.35, 0],
        leadShoulder: [-1.2, 0, 0.3],
        leadElbow: [0.7, 0, 0],
      },
    },
  ],
  forwardSpecial: [
    { phase: 'startup', at: 0.5, pose: { leadShoulder: [-1.05, 0, 0.2], leadElbow: [0.5, 0, 0] } },
    {
      phase: 'active',
      at: 0,
      ease: 'smooth',
      pose: {
        body: [-0.15, 0, 0],
        leadShoulder: [-0.2, 0, 0.1],
        leadElbow: [-1.6, 0, 0],
        leadWrist: [-0.6, 0, 0],
      },
    },
  ],
  backSpecial: [
    {
      phase: 'startup',
      at: 0.8,
      pose: {
        body: [-0.2, 0, 0],
        leadHip: [-0.5, 0, 0],
        leadKnee: [0.7, 0, 0],
        leadShoulder: [-1, 0, 0.2],
        leadElbow: [0.5, 0, 0],
      },
    },
    {
      phase: 'active',
      at: 0,
      ease: 'snap',
      pose: {
        body: [0.35, 0, 0],
        chest: [0.1, -0.1, 0],
        rearShoulder: [0.6, 0, -0.25],
        leadHip: [-0.25, 0, 0],
        leadKnee: [-0.1, 0, 0],
      },
    },
  ],
  downSpecial: [
    {
      phase: 'startup',
      at: 0.65,
      pose: {
        head: [0.2, 0, 0],
        leadShoulder: [-0.6, 0, -0.6],
        leadElbow: [-1.2, 0, 0],
      },
    },
    {
      phase: 'active',
      at: 0,
      pose: {
        head: [0.15, 0, 0],
        leadShoulder: [-0.45, 0, -0.4],
        leadElbow: [-0.6, 0, 0],
        leadWrist: [0.6, 0, 0],
      },
    },
  ],
}
