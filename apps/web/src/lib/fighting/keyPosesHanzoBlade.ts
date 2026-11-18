import { strikeTimeline as strike } from './keyPoseContact'
import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'

/** Lead means anatomical right for these two armed gestures, including when sides switch. */
export const HANZO_BLADE_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  forwardSpecial: strike(
    {
      chest: [0, 0.18, 0],
      leadShoulder: [-0.5, 0.1, 0.1],
      leadElbow: [-0.8, 0, 0],
      leadWrist: [-0.08, 0, 0],
    },
    {
      body: [0.1, 0, 0],
      chest: [0.04, -0.24, 0],
      leadShoulder: [-1.4, -0.12, 0.05],
      leadElbow: [0.33, 0, 0],
      leadWrist: [-0.08, 0, 0],
      rearShoulder: [-0.45, 0, -0.2],
      rearElbow: [-0.6, 0, 0],
      leadHip: [-0.35, 0, 0],
      leadKnee: [0.3, 0, 0],
      rearHip: [0.2, 0, 0],
    },
    {
      body: [0.03, 0, 0],
      leadShoulder: [-0.3, 0, 0.08],
      leadElbow: [-0.6, 0, 0],
      leadWrist: [-0.08, 0, 0],
    },
  ),
  backSpecial: strike(
    {
      body: [-0.05, 0, 0],
      chest: [0, -0.2, 0],
      leadShoulder: [-0.5, 0, -0.2],
      leadElbow: [-0.65, 0, 0],
      leadWrist: [-0.08, 0, 0],
    },
    {
      body: [-0.1, 0, 0],
      chest: [0.02, 0.28, 0],
      leadShoulder: [-1.2, 0.15, 0.35],
      leadElbow: [0.18, 0, 0],
      leadWrist: [-0.08, 0, 0],
      rearShoulder: [-0.4, 0, -0.2],
      rearElbow: [-0.6, 0, 0],
      rearKnee: [0.2, 0, 0],
    },
    {
      body: [-0.02, 0, 0],
      leadShoulder: [-0.25, 0, 0.1],
      leadElbow: [-0.55, 0, 0],
      leadWrist: [-0.08, 0, 0],
    },
  ),
}
