import { addPoses, type FightPose } from './fightPose'
import type { FighterId } from './types'

/**
 * How a fighter stands between moves: the guard a 2D fighter keeps, chest
 * turned to the camera, lead hand forward, knees soft, breathing in a bounce.
 *
 * Only fighters with a stance here are drawn by the fighting rig; the others
 * keep the visit's idle until their moves are keyed (`keyPoseMoves.ts`).
 */
export interface FightStance {
  pose: FightPose
  /** Knee flex at the bottom of the bounce. */
  bounce: number
  /** Bounces per second. */
  tempo: number
}

const STANCES: Partial<Record<FighterId, FightStance>> = {
  // Upright and exact: chain hand forward, rear fist at the chin.
  kurapika: {
    pose: {
      body: [0.04, 0, 0],
      chest: [0.05, -0.32, 0],
      head: [0.05, 0, 0],
      leadShoulder: [-0.75, 0, 0.12],
      leadElbow: [-1.5, 0, 0],
      leadWrist: [0.2, 0, 0],
      rearShoulder: [-0.45, 0, -0.18],
      rearElbow: [-1.9, 0, 0],
      leadHip: [-0.3, 0, 0.06],
      leadKnee: [0.45, 0, 0],
      rearHip: [0.22, 0, -0.06],
      rearKnee: [0.12, 0, 0],
    },
    bounce: 0.08,
    tempo: 1.6,
  },
  // Loose and theatrical: leaning back, hands low, a card between the fingers.
  hisoka: {
    pose: {
      body: [-0.04, 0, 0.03],
      chest: [-0.06, -0.45, 0.05],
      head: [0.1, 0, 0.12],
      leadShoulder: [-0.35, 0, 0.25],
      leadElbow: [-0.9, 0, 0],
      leadWrist: [0.5, 0, 0],
      rearShoulder: [-0.1, 0, -0.15],
      rearElbow: [-0.5, 0, 0],
      leadHip: [-0.2, 0, 0.08],
      leadKnee: [0.3, 0, 0],
      rearHip: [0.15, 0, -0.06],
      rearKnee: [0.08, 0, 0],
    },
    bounce: 0.05,
    tempo: 1,
  },
}

/**
 * A deep crouch; the feet stay planted, so the body sinks by what the knees
 * fold. Both feet sit at the same depth under the hips, so neither floats.
 * It replaces the stance's legs and keeps its arms (`fightBodyMotion.ts`).
 */
export const CROUCH_POSE: FightPose = {
  body: [0.22, 0, 0],
  chest: [0.12, 0, 0],
  head: [-0.2, 0, 0],
  leadHip: [-1.25, 0, 0.12],
  leadKnee: [2, 0, 0],
  rearHip: [-1.1, 0, -0.12],
  rearKnee: [2, 0, 0],
}

/** Knees drawn up under the body while airborne. */
export const AIR_POSE: FightPose = {
  leadHip: [-0.7, 0, 0.05],
  leadKnee: [1.3, 0, 0],
  rearHip: [-0.4, 0, -0.05],
  rearKnee: [1.1, 0, 0],
}

export function fightStance(id: FighterId): FightStance | null {
  return STANCES[id] ?? null
}

export function stanceAt(stance: FightStance, seconds: number): FightPose {
  const dip = stance.bounce * (0.5 - 0.5 * Math.cos(seconds * Math.PI * 2 * stance.tempo))
  return addPoses(stance.pose, {
    leadHip: [-dip * 0.5, 0, 0],
    leadKnee: [dip, 0, 0],
    rearHip: [-dip * 0.4, 0, 0],
    rearKnee: [dip * 0.8, 0, 0],
    rearShoulder: [dip * 0.3, 0, 0],
  })
}
