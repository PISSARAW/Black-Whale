import { addPoses, type FightPose } from './fightPose'
import { ROSTER_STANCES } from './fightStancesRoster'
import type { FighterId } from './types'

/**
 * Authored resting attitudes with a small procedural weight shift. Chapter
 * and scene references (and adaptation limits) live in STANCE_REFERENCES.md.
 * Missing entries use fightBodyMotion's plain guard, including guest fighters.
 */
export interface FightStance {
  pose: FightPose
  /** Knee flex at the bottom of the bounce. */
  bounce: number
  /** Bounces per second. */
  tempo: number
}

const STANCES: Partial<Record<FighterId, FightStance>> = {
  // Ch. 83, confrontation with Uvogin: chain hand available, free hand lower.
  kurapika: {
    pose: {
      body: [0.02, 0, 0],
      chest: [0.02, -0.25, 0],
      head: [0.02, 0, 0],
      leadShoulder: [-0.55, 0, 0.08],
      leadElbow: [-1.2, 0, 0],
      leadWrist: [0.08, 0, 0],
      rearShoulder: [-0.15, 0, -0.08],
      rearElbow: [-0.65, 0, 0],
      leadHip: [-0.25, 0, 0.04],
      leadKnee: [0.3, 0, 0],
      rearHip: [0.18, 0, -0.04],
      rearKnee: [0.08, 0, 0],
    },
    bounce: 0.018,
    tempo: 0.45,
  },
  // Ch. 351, opening of the duel: relaxed card hand, no permanent backward lean.
  hisoka: {
    pose: {
      body: [-0.01, 0, 0.015],
      chest: [-0.02, -0.3, 0.02],
      head: [0.04, 0, 0.04],
      leadShoulder: [-0.25, 0, 0.14],
      leadElbow: [-0.75, 0, 0],
      leadWrist: [0.22, 0, 0],
      rearShoulder: [0.02, 0, -0.08],
      rearElbow: [-0.18, 0, 0],
      leadHip: [-0.12, 0, 0.05],
      leadKnee: [0.14, 0, 0],
      rearHip: [0.08, 0, -0.05],
      rearKnee: [0.04, 0, 0],
    },
    bounce: 0.012,
    tempo: 0.35,
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
  return STANCES[id] ?? ROSTER_STANCES[id] ?? null
}

export function stanceAt(stance: FightStance, seconds: number): FightPose {
  const dip = stance.bounce * (0.5 - 0.5 * Math.cos(seconds * Math.PI * 2 * stance.tempo))
  return addPoses(stance.pose, {
    // Hip and knee bend together, so the bounce sinks the body instead of the shins.
    leadHip: [-dip * 0.6, 0, 0],
    leadKnee: [dip * 0.6, 0, 0],
    rearHip: [-dip * 0.3, 0, 0],
    rearKnee: [dip * 0.4, 0, 0],
    rearShoulder: [dip * 0.3, 0, 0],
  })
}
