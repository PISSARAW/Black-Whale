import { strikeTimeline as strike } from './keyPoseContact'
import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'

/** Compact free-hand strikes; the book hand remains close until Book Strike. */
export const CHROLLO_NORMAL_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  standingLight: strike(
    { chest: [0, -0.12, 0], rearShoulder: [0.12, 0, 0], rearElbow: [-0.7, 0, 0] },
    {
      root: [0, 0, 0.04],
      chest: [0.05, 0.3, 0],
      rearShoulder: [-1.35, 0, -0.08],
      rearElbow: [0.08, 0, 0],
      rearWrist: [0.12, 0, 0],
    },
    { chest: [0, 0.12, 0], rearShoulder: [-0.6, 0, 0], rearElbow: [-0.35, 0, 0] },
  ),
  standingHeavy: strike(
    { chest: [0, 0.35, 0], leadShoulder: [-0.2, 0, -0.4], leadElbow: [-0.3, 0, 0] },
    {
      root: [0, 0, 0.06],
      body: [0.12, 0, 0],
      chest: [0.08, -0.5, 0],
      leadShoulder: [-1.05, 0, 0.25],
      leadElbow: [0.8, 0, 0],
      rearElbow: [-0.5, 0, 0],
    },
    { chest: [0, -0.2, 0], leadShoulder: [-0.45, 0, 0.1], leadElbow: [0.4, 0, 0] },
  ),
  lowLight: strike(
    { chest: [0, -0.12, 0], rearElbow: [-0.65, 0, 0] },
    {
      chest: [0.12, 0.25, 0],
      rearShoulder: [-0.8, 0, -0.1],
      rearElbow: [0.05, 0, 0],
      rearWrist: [0.15, 0, 0],
    },
    { chest: [0, 0.1, 0], rearShoulder: [-0.3, 0, 0], rearElbow: [-0.4, 0, 0] },
  ),
  lowHeavy: strike(
    { chest: [0, 0.25, 0], leadHip: [0.25, 0, 0], leadKnee: [0.15, 0, 0] },
    {
      body: [0.08, 0, 0],
      chest: [0, -0.65, 0],
      leadHip: [-0.35, 0, 0.35],
      leadKnee: [-1.7, 0, 0],
      rearShoulder: [0.3, 0, -0.25],
    },
    { chest: [0, -0.25, 0], leadHip: [-0.15, 0, 0.15], leadKnee: [-0.6, 0, 0] },
  ),
  airLight: strike(
    { chest: [0, -0.2, 0], rearShoulder: [-0.4, 0, -0.3], rearElbow: [-0.9, 0, 0] },
    {
      body: [0.18, 0, 0],
      chest: [0.1, 0.3, 0],
      rearShoulder: [-0.95, 0, -0.12],
      rearElbow: [0.08, 0, 0],
      rearWrist: [0.25, 0, 0],
    },
    { chest: [0, 0.1, 0], rearElbow: [-0.5, 0, 0] },
  ),
  airHeavy: strike(
    { body: [-0.18, 0, 0], leadHip: [-0.65, 0, 0], leadKnee: [0.5, 0, 0] },
    {
      body: [0.15, 0, 0],
      chest: [0, -0.25, 0],
      leadHip: [-0.35, 0, 0.12],
      leadKnee: [-1.15, 0, 0],
      rearShoulder: [0.35, 0, -0.25],
    },
    { leadHip: [-0.15, 0, 0], leadKnee: [-0.4, 0, 0] },
  ),
}
