import { strikeTimeline as strike } from './keyPoseContact'
import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'

/** Squared military strikes: a short straight, a committed hammer and heavy boots. */
export const BENJAMIN_NORMAL_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  standingLight: strike(
    { chest: [0, 0.12, 0], leadShoulder: [0.1, 0, 0], leadElbow: [-0.35, 0, 0] },
    {
      root: [0, 0, 0.05],
      body: [0.1, 0, 0],
      chest: [0.05, -0.28, 0],
      leadShoulder: [-1.15, 0, -0.15],
      leadElbow: [0.35, 0, 0],
      rearElbow: [-0.65, 0, 0],
    },
    { chest: [0, -0.12, 0], leadShoulder: [-0.4, 0, 0], leadElbow: [-0.3, 0, 0] },
  ),
  standingHeavy: strike(
    {
      body: [-0.12, 0, 0],
      chest: [-0.06, -0.4, 0],
      rearShoulder: [-2.05, 0, -0.25],
      rearElbow: [-0.8, 0, 0],
      leadKnee: [0.18, 0, 0],
    },
    {
      root: [0, -0.04, 0.08],
      body: [0.3, 0, 0],
      chest: [0.18, 0.42, 0],
      rearShoulder: [-1.05, 0, -0.15],
      rearElbow: [0.3, 0, 0],
      leadElbow: [-0.6, 0, 0],
      leadKnee: [0.2, 0, 0],
    },
    {
      body: [0.12, 0, 0],
      chest: [0.05, 0.2, 0],
      rearShoulder: [-0.5, 0, 0],
      rearElbow: [-0.2, 0, 0],
    },
  ),
  lowLight: strike(
    { body: [-0.08, 0, 0], leadHip: [0.1, 0, 0], leadKnee: [0.1, 0, 0] },
    {
      body: [-0.1, 0, 0],
      chest: [0.05, -0.2, 0],
      leadHip: [-0.65, 0, 0.05],
      leadKnee: [0.25, 0, 0],
      leadShoulder: [-0.25, 0, 0],
      rearElbow: [-0.4, 0, 0],
    },
    { leadHip: [-0.25, 0, 0], leadKnee: [0.15, 0, 0] },
  ),
  lowHeavy: strike(
    { chest: [0, 0.35, 0], leadHip: [0.2, 0, 0], leadKnee: [0.2, 0, 0] },
    {
      body: [0.18, 0, 0],
      chest: [0.1, -0.55, 0],
      leadHip: [-0.3, 0, 0.28],
      leadKnee: [-1.65, 0, 0],
      rearKnee: [0.15, 0, 0],
      leadShoulder: [0.3, 0, 0.2],
    },
    { chest: [0, -0.25, 0], leadHip: [-0.12, 0, 0.1], leadKnee: [-0.65, 0, 0] },
  ),
  airLight: strike(
    { chest: [0, -0.25, 0], rearShoulder: [-1.9, 0, -0.35], rearElbow: [-1, 0, 0] },
    {
      body: [0.32, 0, 0],
      chest: [0.15, 0.3, 0],
      rearShoulder: [-0.85, 0, -0.2],
      rearElbow: [-1.05, 0, 0],
      leadElbow: [-0.6, 0, 0],
    },
    { body: [0.1, 0, 0], rearShoulder: [-0.4, 0, 0], rearElbow: [-0.5, 0, 0] },
  ),
  airHeavy: strike(
    { body: [-0.15, 0, 0], leadHip: [-0.7, 0, 0], leadKnee: [0.4, 0, 0] },
    {
      body: [-0.2, 0, 0],
      chest: [0.1, -0.25, 0],
      leadHip: [-0.8, 0, 0.08],
      leadKnee: [-1.15, 0, 0],
      rearShoulder: [0.4, 0, -0.3],
      rearHip: [0.15, 0, 0],
    },
    { leadHip: [-0.25, 0, 0], leadKnee: [-0.4, 0, 0] },
  ),
}
