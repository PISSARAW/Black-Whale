import { strikeTimeline as strike } from './keyPoseContact'
import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'

/** A quick book-hand blow, a covered free-hand rush and a measured book counter. */
export const CHROLLO_COMMAND_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  forwardLight: strike(
    { chest: [0, 0.18, 0], leadElbow: [-0.3, 0, 0], rearElbow: [-0.5, 0, 0] },
    {
      root: [0, 0, 0.075],
      chest: [0.05, -0.4, 0],
      leadShoulder: [-0.95, 0, 0.12],
      leadElbow: [1.15, 0, 0],
      leadWrist: [0.15, 0, 0],
      rearShoulder: [-0.2, 0, -0.1],
      rearElbow: [-0.65, 0, 0],
      rearHip: [0.1, 0, 0],
    },
    { chest: [0, -0.15, 0], leadShoulder: [-0.25, 0, 0.05], leadElbow: [0.4, 0, 0] },
  ),
  forwardHeavy: strike(
    {
      root: [0, -0.02, -0.035],
      body: [-0.08, 0, 0],
      chest: [0, -0.25, 0],
      rearShoulder: [0.25, 0, -0.2],
      rearElbow: [-1.1, 0, 0],
      leadKnee: [0.16, 0, 0],
    },
    {
      root: [0, 0, 0.115],
      body: [0.18, 0, 0],
      chest: [0.08, 0.5, 0],
      rearShoulder: [-1.35, 0, -0.12],
      rearElbow: [0.08, 0, 0],
      leadShoulder: [-0.25, 0, 0.05],
      leadElbow: [-0.15, 0, 0],
      rearHip: [0.25, 0, 0],
      leadKnee: [0.14, 0, 0],
    },
    {
      root: [0, 0, 0.035],
      body: [0.05, 0, 0],
      chest: [0, 0.2, 0],
      rearShoulder: [-0.5, 0, 0],
      rearElbow: [-0.35, 0, 0],
    },
  ),
  backHeavy: strike(
    {
      body: [0.06, 0, 0],
      leadShoulder: [-0.1, 0, -0.25],
      leadElbow: [-0.3, 0, 0],
      rearElbow: [-0.6, 0, 0],
    },
    {
      root: [0, 0, -0.075],
      body: [-0.15, 0, 0],
      chest: [-0.03, -0.45, 0],
      leadShoulder: [-0.9, 0, 0.35],
      leadElbow: [0.95, 0, 0],
      leadWrist: [0.2, 0, 0],
      rearElbow: [-0.6, 0, 0],
      leadHip: [0.1, 0, 0],
    },
    {
      root: [0, 0, -0.025],
      body: [-0.03, 0, 0],
      leadShoulder: [-0.25, 0, 0.1],
      leadElbow: [0.3, 0, 0],
    },
  ),
}

/** Short guard breaker, weight-led shoulder charge and compact returning backfist. */
export const BENJAMIN_COMMAND_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  forwardLight: strike(
    {
      root: [0, -0.025, -0.02],
      chest: [0, -0.2, 0],
      rearElbow: [-0.9, 0, 0],
      leadKnee: [0.18, 0, 0],
    },
    {
      root: [0, -0.01, 0.08],
      body: [0.18, 0, 0],
      chest: [0.08, 0.3, 0],
      rearShoulder: [-1.3, 0, -0.1],
      rearElbow: [0.32, 0, 0],
      leadShoulder: [-0.3, 0, 0.05],
      leadElbow: [-0.7, 0, 0],
      rearHip: [0.15, 0, 0],
    },
    {
      body: [0.05, 0, 0],
      chest: [0, 0.12, 0],
      rearShoulder: [-0.4, 0, 0],
      rearElbow: [-0.2, 0, 0],
    },
  ),
  forwardHeavy: strike(
    {
      root: [0, -0.07, -0.06],
      body: [-0.15, 0, 0],
      chest: [-0.05, 0.2, 0],
      leadShoulder: [-0.35, 0, 0.05],
      leadElbow: [-1.1, 0, 0],
      rearElbow: [-0.8, 0, 0],
      leadKnee: [0.35, 0, 0],
      rearKnee: [0.35, 0, 0],
    },
    {
      root: [0, -0.025, 0.13],
      body: [0.36, 0, 0],
      chest: [0.12, -0.4, 0],
      head: [-0.12, 0, 0],
      leadShoulder: [-0.75, 0, -0.05],
      leadElbow: [-0.85, 0, 0],
      rearElbow: [-0.75, 0, 0],
      rearHip: [0.3, 0, 0],
      leadKnee: [0.25, 0, 0],
    },
    {
      root: [0, -0.025, 0.04],
      body: [0.13, 0, 0],
      chest: [0.04, -0.16, 0],
      leadElbow: [-0.35, 0, 0],
      leadKnee: [0.15, 0, 0],
    },
  ),
  backHeavy: strike(
    {
      chest: [0, 0.4, 0],
      leadShoulder: [-0.45, 0, -0.35],
      leadElbow: [-0.8, 0, 0],
      rearElbow: [-0.65, 0, 0],
    },
    {
      root: [0, -0.015, -0.06],
      body: [-0.1, 0, 0],
      chest: [0.05, -0.5, 0],
      leadShoulder: [-1.2, 0, 0.4],
      leadElbow: [0.32, 0, 0],
      leadWrist: [0.2, 0, 0],
      rearElbow: [-0.75, 0, 0],
      leadKnee: [0.15, 0, 0],
    },
    {
      body: [-0.02, 0, 0],
      chest: [0, -0.2, 0],
      leadShoulder: [-0.35, 0, 0.12],
      leadElbow: [-0.15, 0, 0],
    },
  ),
}
