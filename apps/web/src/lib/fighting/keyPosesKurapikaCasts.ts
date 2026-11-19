import { strikeTimeline as strike } from './keyPoseContact'
import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'

/** The anatomical right hand casts; the other hand protects the chest or receives Holy Chain. */
export const KURAPIKA_CAST_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  neutralSpecial: strike(
    {
      chest: [0.02, 0.4, 0],
      leadShoulder: [-0.3, 0, 0.5],
      leadElbow: [-0.5, 0, 0],
      rearElbow: [-0.7, 0, 0],
    },
    {
      chest: [0.04, -0.45, 0],
      leadShoulder: [-1.15, 0, 0.18],
      leadElbow: [1.05, 0, 0],
      leadWrist: [-0.15, 0, -0.35],
      rearElbow: [-0.85, 0, 0],
    },
    { chest: [0.02, -0.22, 0], leadShoulder: [-0.55, 0, 0.12], leadElbow: [0.5, 0, 0] },
  ),
  forwardSpecial: strike(
    {
      root: [0, -0.02, -0.03],
      chest: [0, 0.42, 0],
      leadShoulder: [-0.35, 0, 0.6],
      leadElbow: [-0.45, 0, 0],
      leadWrist: [0, 0, 0.5],
      rearElbow: [-0.65, 0, 0],
    },
    {
      root: [0, 0, 0.08],
      chest: [0.04, -0.5, 0],
      leadShoulder: [-1.15, -0.1, 0.05],
      leadElbow: [1.1, 0, 0],
      leadWrist: [-0.2, 0, -0.55],
      rearElbow: [-0.85, 0, 0],
    },
    { chest: [0, -0.2, 0], leadShoulder: [-0.3, 0, -0.25], leadElbow: [0.5, 0, 0] },
  ),
  downSpecial: strike(
    { head: [0.08, 0, 0], leadElbow: [-0.45, 0, 0], rearElbow: [-0.6, 0, 0] },
    {
      head: [0.16, 0, 0],
      chest: [0.03, 0.1, 0],
      leadShoulder: [-0.35, -0.3, 0.15],
      leadElbow: [-0.45, 0, 0],
      rearShoulder: [-0.65, 0.2, -0.15],
      rearElbow: [-0.9, 0, 0],
      rearWrist: [0.25, 0, 0],
    },
    { head: [0.05, 0, 0], leadElbow: [-0.2, 0, 0], rearElbow: [-0.4, 0, 0] },
  ),
  backSpecial: strike(
    { chest: [0, 0.25, 0], leadElbow: [-0.5, 0, 0], rearElbow: [-0.7, 0, 0] },
    {
      chest: [0.03, -0.3, 0],
      leadShoulder: [-1.05, 0, 0.06],
      leadElbow: [1.1, 0, 0],
      leadWrist: [-0.15, 0, 0],
      rearElbow: [-0.9, 0, 0],
    },
    { chest: [0, -0.15, 0], leadShoulder: [-0.5, 0, 0.06], leadElbow: [0.6, 0, 0] },
  ),
  finisher: strike(
    { head: [0, -0.08, 0], leadElbow: [-0.45, 0, 0], rearElbow: [-0.6, 0, 0] },
    {
      chest: [0.02, -0.3, 0],
      leadShoulder: [-1.1, 0, 0.05],
      leadElbow: [1.1, 0, 0],
      leadWrist: [-0.1, 0, 0],
      rearElbow: [-0.85, 0, 0],
    },
    { chest: [0, -0.1, 0], leadShoulder: [-0.5, 0, 0.05], leadElbow: [0.5, 0, 0] },
  ),
}
