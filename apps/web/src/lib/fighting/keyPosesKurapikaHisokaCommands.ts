import { strikeTimeline as strike } from './keyPoseContact'
import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'

/** Precise chain-hand thrust, shoulder-led lariat and guarded retreat. */
export const KURAPIKA_COMMAND_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  forwardLight: strike(
    {
      root: [0, -0.015, -0.03],
      chest: [0, 0.2, 0],
      leadElbow: [-0.25, 0, 0],
      rearKnee: [0.12, 0, 0],
    },
    {
      root: [0, 0, 0.09],
      body: [0.12, 0, 0],
      chest: [0.04, -0.38, 0],
      leadShoulder: [-0.9, 0, -0.08],
      leadElbow: [1.4, 0, 0],
      leadWrist: [-0.2, 0, 0],
      rearElbow: [-0.1, 0, 0],
      rearHip: [0.12, 0, 0],
    },
    {
      root: [0, 0, 0.02],
      chest: [0, -0.12, 0],
      leadShoulder: [-0.3, 0, 0],
      leadElbow: [0.45, 0, 0],
    },
  ),
  forwardHeavy: strike(
    {
      root: [0, -0.035, -0.05],
      body: [-0.1, 0, 0],
      chest: [0, 0.5, 0],
      leadShoulder: [0.15, 0, -0.6],
      leadKnee: [0.22, 0, 0],
      rearKnee: [0.3, 0, 0],
    },
    {
      root: [0, -0.01, 0.12],
      body: [0.24, 0, 0],
      chest: [0.1, -0.6, 0],
      leadShoulder: [-1, 0, 0.45],
      leadElbow: [1.25, 0, 0],
      leadWrist: [0.1, 0, 0],
      rearShoulder: [0.25, 0, -0.2],
      leadHip: [0.1, 0, 0],
      rearHip: [0.28, 0, 0],
      rearKnee: [0.05, 0, 0],
    },
    {
      root: [0, -0.015, 0.04],
      body: [0.08, 0, 0],
      chest: [0, -0.28, 0],
      leadShoulder: [-0.4, 0, 0.15],
      leadElbow: [0.5, 0, 0],
      leadKnee: [0.12, 0, 0],
    },
  ),
  backHeavy: strike(
    { body: [0.08, 0, 0], chest: [0, 0.25, 0], leadElbow: [-0.25, 0, 0], rearKnee: [0.15, 0, 0] },
    {
      root: [0, 0.01, -0.08],
      body: [-0.18, 0, 0],
      chest: [-0.05, -0.35, 0],
      leadShoulder: [-0.75, 0, 0.3],
      leadElbow: [1.15, 0, 0],
      leadWrist: [-0.3, 0, 0],
      rearElbow: [-0.15, 0, 0],
      leadHip: [0.15, 0, 0],
      leadKnee: [0.1, 0, 0],
    },
    {
      root: [0, 0, -0.025],
      body: [-0.04, 0, 0],
      leadShoulder: [-0.25, 0, 0.08],
      leadElbow: [0.35, 0, 0],
    },
  ),
}

/** Deceptive reach, an uncoiling kick and an elastic backfist. */
export const HISOKA_COMMAND_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  forwardLight: strike(
    {
      body: [-0.12, 0, 0.04],
      chest: [-0.04, 0.2, 0],
      leadElbow: [-0.35, 0, 0],
      leadWrist: [-0.25, 0, 0],
    },
    {
      root: [0, 0.01, 0.1],
      body: [0.15, 0, -0.03],
      chest: [0.04, -0.38, 0],
      leadShoulder: [-1.05, 0, -0.15],
      leadElbow: [0.8, 0, 0],
      leadWrist: [-0.45, 0, 0],
      rearShoulder: [0.25, 0, -0.2],
      rearHip: [0.12, 0, 0],
    },
    {
      body: [-0.06, 0, 0],
      leadShoulder: [-0.35, 0, 0],
      leadElbow: [0.3, 0, 0],
      leadWrist: [-0.15, 0, 0],
    },
  ),
  forwardHeavy: strike(
    {
      root: [0, -0.03, -0.035],
      body: [-0.15, 0, 0.08],
      chest: [0, 0.5, 0.08],
      leadHip: [-0.5, 0, 0.1],
      leadKnee: [0.5, 0, 0],
      rearKnee: [0.2, 0, 0],
    },
    {
      root: [0, 0.03, 0.1],
      body: [-0.22, 0, -0.08],
      chest: [-0.08, -0.75, -0.12],
      leadHip: [-1.35, 0, 0.18],
      leadKnee: [-0.15, 0, 0],
      rearHip: [0.15, 0, 0],
      leadShoulder: [0.35, 0, 0.2],
      rearShoulder: [0.4, 0, -0.35],
    },
    {
      root: [0, -0.025, 0.015],
      chest: [0, -0.28, -0.04],
      leadHip: [-0.35, 0, 0.08],
      leadKnee: [0.12, 0, 0],
      rearKnee: [0.2, 0, 0],
    },
  ),
  backHeavy: strike(
    {
      body: [0.1, 0, 0],
      chest: [0, 0.3, 0],
      leadShoulder: [-0.3, 0, -0.4],
      leadElbow: [-0.3, 0, 0],
    },
    {
      root: [0, 0.02, -0.09],
      body: [-0.24, 0, 0.05],
      chest: [-0.06, -0.6, 0.05],
      leadShoulder: [-1.05, 0, 0.35],
      leadElbow: [0.75, 0, 0],
      leadWrist: [0.35, 0, 0],
      rearShoulder: [0.35, 0, -0.25],
      leadKnee: [0.12, 0, 0],
    },
    { root: [0, 0, -0.03], body: [-0.08, 0, 0], chest: [0, -0.18, 0], leadElbow: [0.25, 0, 0] },
  ),
}
