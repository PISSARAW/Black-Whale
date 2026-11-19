import { strikeTimeline as strike } from './keyPoseContact'
import { KALLUTO_PAPER_POSES } from './keyPosesKallutoPaper'
import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'

/** Fan in the anatomical right hand. Quiet torso, wrist-led cuts, free hand in the sleeve.
 * Normals adapt the fan's cutting edge to the duel; reference: episode 96, 0:37–1:04.
 */
export const KALLUTO_KEY_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  standingLight: strike(
    { leadElbow: [-0.8, 0, 0], leadWrist: [0.15, 0, 0.35] },
    {
      chest: [0.015, -0.12, 0],
      leadShoulder: [-0.95, 0, 0.12],
      leadElbow: [0.1, 0, 0],
      leadWrist: [-0.3, 0, -0.55],
      rearElbow: [-0.55, 0, 0],
    },
    { leadShoulder: [-0.25, 0, 0.12], leadElbow: [-0.3, 0, 0] },
  ),
  standingHeavy: strike(
    { chest: [0, 0.25, 0], leadShoulder: [-1.3, 0, 0.5], leadElbow: [-0.65, 0, 0] },
    {
      chest: [0.025, -0.4, 0],
      leadShoulder: [-0.85, -0.2, -0.35],
      leadElbow: [0.1, 0, 0],
      leadWrist: [-0.25, 0, -0.75],
      rearElbow: [-0.65, 0, 0],
    },
    { chest: [0, -0.15, 0], leadShoulder: [-0.3, 0, -0.2], leadWrist: [0, 0, -0.3] },
  ),
  lowLight: strike(
    { leadElbow: [-0.55, 0, 0], leadWrist: [0, 0, 0.3] },
    {
      chest: [0.08, -0.1, 0],
      leadShoulder: [-0.55, 0, 0.15],
      leadElbow: [0.08, 0, 0],
      leadWrist: [-0.2, 0, -0.5],
      rearElbow: [-0.7, 0, 0],
    },
    { chest: [0.03, 0, 0], leadElbow: [-0.2, 0, 0] },
  ),
  lowHeavy: strike(
    { chest: [0, 0.3, 0], leadShoulder: [-0.2, 0, 0.6], leadElbow: [-0.5, 0, 0] },
    {
      chest: [0.12, -0.45, 0],
      leadShoulder: [-0.35, -0.2, -0.45],
      leadElbow: [0.08, 0, 0],
      leadWrist: [-0.3, 0, -0.65],
      rearElbow: [-0.75, 0, 0],
    },
    { chest: [0.04, -0.15, 0], leadShoulder: [-0.1, 0, -0.2] },
  ),
  airLight: strike(
    { leadShoulder: [-0.5, 0, 0.35], leadElbow: [-0.75, 0, 0] },
    {
      chest: [0.025, -0.18, 0],
      leadShoulder: [-1.05, 0, 0.1],
      leadElbow: [0.1, 0, 0],
      leadWrist: [-0.3, 0, -0.6],
      rearShoulder: [-0.15, 0, -0.35],
      rearElbow: [-0.65, 0, 0],
    },
    { leadShoulder: [-0.4, 0, 0.15], leadElbow: [-0.25, 0, 0] },
  ),
  airHeavy: strike(
    { chest: [-0.03, 0.2, 0], leadShoulder: [-2, 0, 0.25], leadElbow: [-0.5, 0, 0] },
    {
      chest: [0.12, -0.28, 0],
      leadShoulder: [-0.65, 0, -0.2],
      leadElbow: [0.12, 0, 0],
      leadWrist: [-0.25, 0, -0.7],
      rearElbow: [-0.8, 0, 0],
    },
    { chest: [0.04, -0.1, 0], leadShoulder: [-0.25, 0, -0.1] },
  ),
  forwardLight: strike(
    { leadElbow: [-0.75, 0, 0], leadWrist: [0, 0, 0.45] },
    {
      root: [0, 0, 0.045],
      chest: [0.02, -0.16, 0],
      leadShoulder: [-1.1, 0, 0.12],
      leadElbow: [0.1, 0, 0],
      leadWrist: [-0.35, 0, -0.65],
      rearElbow: [-0.7, 0, 0],
    },
    { chest: [0, -0.05, 0], leadShoulder: [-0.35, 0, 0.1] },
  ),
  forwardHeavy: strike(
    { chest: [0, 0.35, 0], leadShoulder: [-1.2, 0, 0.65], leadElbow: [-0.65, 0, 0] },
    {
      root: [0, 0, 0.06],
      chest: [0.04, -0.55, 0],
      leadShoulder: [-0.95, -0.25, -0.4],
      leadElbow: [0.12, 0, 0],
      leadWrist: [-0.25, 0, -0.8],
      rearElbow: [-0.85, 0, 0],
    },
    { chest: [0, -0.2, 0], leadShoulder: [-0.3, 0, -0.25] },
  ),
  backHeavy: strike(
    { chest: [0, -0.2, 0], leadElbow: [-0.7, 0, 0], leadWrist: [0, 0, -0.5] },
    {
      root: [0, 0, -0.045],
      chest: [0, 0.35, 0],
      leadShoulder: [-0.9, 0.2, 0.5],
      leadElbow: [0.08, 0, 0],
      leadWrist: [-0.2, 0, 0.7],
      rearElbow: [-0.75, 0, 0],
    },
    { chest: [0, 0.1, 0], leadShoulder: [-0.25, 0, 0.2] },
  ),
  ...KALLUTO_PAPER_POSES,
}
