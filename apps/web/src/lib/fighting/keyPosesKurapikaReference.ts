import { strikeTimeline as strike } from './keyPoseContact'
import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'

/** Uvogin reference: compact body blows, a protected free hand and short recoil.
 * These are offsets from Kurapika's own bent-elbow guard, including in the air.
 */
export const KURAPIKA_REFERENCE_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  standingLight: strike(
    { chest: [0, 0.14, 0], leadElbow: [-0.3, 0, 0], rearElbow: [-0.5, 0, 0] },
    {
      root: [0, 0, 0.055],
      chest: [0.06, -0.28, 0],
      leadShoulder: [-0.85, 0, 0.05],
      leadElbow: [1.1, 0, 0],
      leadWrist: [-0.15, 0, 0],
      rearShoulder: [-0.3, 0, -0.1],
      rearElbow: [-0.9, 0, 0],
    },
    { chest: [0, -0.1, 0], leadShoulder: [-0.15, 0, 0], leadElbow: [0.2, 0, 0] },
  ),
  standingHeavy: strike(
    { chest: [0.04, -0.3, 0], rearShoulder: [0.05, 0, -0.25], rearElbow: [-0.65, 0, 0] },
    {
      body: [0.08, 0, 0],
      chest: [0.1, 0.48, -0.06],
      rearShoulder: [-1.05, 0.2, -0.35],
      rearElbow: [0.25, 0, 0],
      rearWrist: [-0.1, 0, 0],
      leadShoulder: [-0.2, 0, 0.1],
      leadElbow: [-0.6, 0, 0],
      rearHip: [0.14, 0, 0],
    },
    { chest: [0.03, 0.18, 0], rearShoulder: [-0.25, 0, -0.15], rearElbow: [-0.2, 0, 0] },
  ),
  lowLight: strike(
    { chest: [0, 0.15, 0], leadElbow: [-0.2, 0, 0], rearElbow: [-0.5, 0, 0] },
    {
      chest: [0.13, -0.28, 0],
      leadShoulder: [-0.55, 0, 0.05],
      leadElbow: [1.05, 0, 0],
      leadWrist: [-0.1, 0, 0],
      rearElbow: [-0.85, 0, 0],
    },
    { chest: [0.04, -0.08, 0], leadElbow: [0.25, 0, 0] },
  ),
  lowHeavy: strike(
    { chest: [0.05, 0.35, 0], leadHip: [0.2, 0, 0], rearElbow: [-0.6, 0, 0] },
    {
      chest: [0.1, -0.55, 0],
      leadHip: [-0.35, 0, 0.3],
      leadKnee: [-1.25, 0, 0],
      rearKnee: [0.12, 0, 0],
      leadElbow: [-0.3, 0, 0],
      rearShoulder: [-0.15, 0, -0.3],
    },
    { chest: [0.02, -0.2, 0], leadKnee: [-0.45, 0, 0], leadHip: [-0.1, 0, 0.1] },
  ),
  airLight: strike(
    { chest: [0, 0.3, 0], leadShoulder: [-0.2, 0, 0.2], leadElbow: [-0.3, 0, 0] },
    {
      body: [0.1, 0, 0],
      chest: [0.08, -0.4, 0],
      leadShoulder: [-0.95, 0, 0.08],
      leadElbow: [1.1, 0, 0],
      rearShoulder: [-0.15, 0, -0.25],
      rearElbow: [-0.7, 0, 0],
    },
    { chest: [0.02, -0.15, 0], leadElbow: [0.25, 0, 0] },
  ),
  airHeavy: strike(
    { body: [-0.12, 0, 0], leadHip: [-0.3, 0, 0], leadKnee: [0.3, 0, 0] },
    {
      body: [0.28, 0, 0],
      chest: [0.02, -0.3, 0],
      leadHip: [-0.85, 0, 0.12],
      leadKnee: [-1.15, 0, 0],
      leadElbow: [-0.2, 0, 0],
      rearElbow: [-0.55, 0, 0],
    },
    { body: [0.08, 0, 0], leadHip: [-0.25, 0, 0], leadKnee: [-0.4, 0, 0] },
  ),
  forwardLight: strike(
    { root: [0, -0.02, -0.025], chest: [0, 0.18, 0], leadElbow: [-0.25, 0, 0] },
    {
      root: [0, -0.015, 0.1],
      body: [0.1, 0, 0],
      chest: [0.08, -0.35, 0],
      leadShoulder: [-1, 0, 0.04],
      leadElbow: [1.1, 0, 0],
      rearElbow: [-0.9, 0, 0],
      rearHip: [0.15, 0, 0],
    },
    { root: [0, 0, 0.025], chest: [0, -0.12, 0], leadElbow: [0.3, 0, 0] },
  ),
  forwardHeavy: strike(
    { chest: [0.02, -0.35, 0], rearShoulder: [0.1, 0, -0.25], rearElbow: [-0.5, 0, 0] },
    {
      root: [0, 0, 0.13],
      body: [0.13, 0, 0],
      chest: [0.08, 0.55, -0.04],
      rearShoulder: [-1.25, 0.1, -0.05],
      rearElbow: [0.55, 0, 0],
      leadElbow: [-0.7, 0, 0],
      rearHip: [0.2, 0, 0],
    },
    { chest: [0.02, 0.2, 0], rearShoulder: [-0.25, 0, -0.08], rearElbow: [-0.15, 0, 0] },
  ),
  backHeavy: strike(
    { chest: [0, 0.2, 0], leadElbow: [-0.3, 0, 0], rearKnee: [0.12, 0, 0] },
    {
      root: [0, 0, -0.1],
      body: [-0.14, 0, 0],
      chest: [0, -0.35, 0],
      leadShoulder: [-0.95, 0, 0.1],
      leadElbow: [1.05, 0, 0],
      leadWrist: [-0.15, 0, 0],
      rearElbow: [-0.85, 0, 0],
    },
    { root: [0, 0, -0.03], chest: [0, -0.1, 0], leadElbow: [0.2, 0, 0] },
  ),
}
