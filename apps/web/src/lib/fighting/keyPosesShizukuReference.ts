import { strikeTimeline as strike } from './keyPoseContact'
import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'

/** Pike reference: a calm trunk and a two-handed implement. Short checks, low sweeps,
 * advancing tank blows and guarded returns adapt that weapon to the duel's normal slots.
 */
export const SHIZUKU_REFERENCE_NORMALS: Partial<Record<MoveSlot, MoveTimeline>> = {
  standingLight: strike(
    { chest: [0, 0.15, 0], leadElbow: [-0.65, 0, 0], rearElbow: [-0.55, 0, 0] },
    {
      chest: [0.04, -0.25, 0],
      leadShoulder: [-0.95, 0, 0.08],
      leadElbow: [-0.2, 0, 0],
      rearShoulder: [-0.85, 0.1, -0.12],
      rearElbow: [-0.6, 0, 0],
      leadWrist: [-0.12, 0, 0],
    },
    { chest: [0, -0.1, 0], leadShoulder: [-0.4, 0, 0.05], leadElbow: [-0.3, 0, 0] },
  ),
  lowLight: strike(
    { chest: [0, 0.18, 0], leadElbow: [-0.6, 0, 0], rearShoulder: [-0.8, 0, -0.12] },
    {
      chest: [0.13, -0.28, 0],
      leadShoulder: [-0.45, 0, 0.06],
      leadElbow: [-0.2, 0, 0],
      rearShoulder: [-0.6, 0.1, -0.18],
      rearElbow: [-0.5, 0, 0],
    },
    { chest: [0.04, -0.1, 0], leadElbow: [-0.35, 0, 0] },
  ),
  lowHeavy: strike(
    { chest: [0.02, 0.45, 0], leadShoulder: [-0.4, 0.15, 0.5], leadElbow: [-0.65, 0, 0] },
    {
      root: [0, -0.025, 0.04],
      chest: [0.18, -0.6, 0],
      leadShoulder: [-0.35, -0.2, -0.4],
      leadElbow: [-0.2, 0, 0],
      rearShoulder: [-0.55, 0.15, -0.25],
      rearElbow: [-0.55, 0, 0],
    },
    { chest: [0.07, -0.25, 0], leadShoulder: [-0.15, 0, -0.2], leadElbow: [-0.4, 0, 0] },
  ),
  airLight: strike(
    { chest: [-0.04, 0.2, 0], leadElbow: [-0.7, 0, 0], rearElbow: [-0.6, 0, 0] },
    {
      chest: [0.08, -0.3, 0],
      leadShoulder: [-0.95, 0, 0.1],
      leadElbow: [-0.2, 0, 0],
      rearShoulder: [-0.9, 0.15, -0.15],
      rearElbow: [-0.5, 0, 0],
    },
    { chest: [0, -0.1, 0], leadElbow: [-0.4, 0, 0], rearElbow: [-0.6, 0, 0] },
  ),
  airHeavy: strike(
    {
      chest: [-0.08, 0.2, 0],
      leadShoulder: [-1.8, 0, 0.15],
      leadElbow: [-0.6, 0, 0],
      rearShoulder: [-1.6, 0, -0.15],
    },
    {
      body: [0.2, 0, 0],
      chest: [0.17, -0.3, 0],
      leadShoulder: [-0.85, 0, 0.06],
      leadElbow: [-0.2, 0, 0],
      rearShoulder: [-0.9, 0.1, -0.18],
      rearElbow: [-0.45, 0, 0],
    },
    { body: [0.08, 0, 0], chest: [0.06, -0.1, 0], leadShoulder: [-0.35, 0, 0.05] },
  ),
  forwardLight: strike(
    { root: [0, -0.02, -0.025], chest: [0, 0.18, 0], leadElbow: [-0.65, 0, 0] },
    {
      root: [0, 0, 0.08],
      chest: [0.06, -0.3, 0],
      leadShoulder: [-1.05, 0, 0.05],
      leadElbow: [-0.15, 0, 0],
      rearShoulder: [-0.9, 0.1, -0.15],
      rearElbow: [-0.55, 0, 0],
    },
    { chest: [0, -0.12, 0], leadElbow: [-0.4, 0, 0], rearKnee: [0.15, 0, 0] },
  ),
  forwardHeavy: strike(
    {
      body: [-0.05, 0, 0],
      chest: [0, 0.5, 0],
      leadShoulder: [-1, 0.2, 0.6],
      leadElbow: [-0.65, 0, 0],
    },
    {
      root: [0, -0.015, 0.12],
      body: [0.12, 0, 0],
      chest: [0.1, -0.6, 0],
      leadShoulder: [-1, -0.25, -0.35],
      leadElbow: [-0.15, 0, 0],
      rearShoulder: [-1.05, 0.1, -0.25],
      rearElbow: [-0.5, 0, 0],
      rearHip: [0.2, 0, 0],
    },
    { root: [0, -0.025, 0.04], chest: [0.04, -0.25, 0], leadElbow: [-0.4, 0, 0] },
  ),
  backHeavy: strike(
    { chest: [0, -0.3, 0], leadShoulder: [-0.6, 0, -0.25], leadElbow: [-0.6, 0, 0] },
    {
      root: [0, 0, -0.1],
      body: [-0.1, 0, 0],
      chest: [0, 0.45, 0],
      leadShoulder: [-0.9, 0.2, 0.45],
      leadElbow: [-0.2, 0, 0],
      rearShoulder: [-0.85, 0.1, -0.15],
      rearElbow: [-0.65, 0, 0],
    },
    { root: [0, 0, -0.025], chest: [0, 0.18, 0], leadElbow: [-0.4, 0, 0] },
  ),
}
