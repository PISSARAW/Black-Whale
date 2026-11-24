import type { FightPose } from './fightPose'
import type { WalkStyle } from './fightLocomotion'

/**
 * Kurapika advances like a duellist measuring chain range: quiet feet, sternum
 * aimed at the opponent and the lead hand already articulated for a cast.
 */
export const KURAPIKA_WALK_STYLE = {
  advance: {
    body: [0.055, 0, 0],
    chest: [0.035, -0.07, 0],
    neck: [-0.025, 0.025, 0],
    leadClavicle: [-0.01, 0.012, 0.018],
    leadPalm: [-0.08, 0.12, -0.04],
  },
  retreat: {
    body: [-0.045, 0, 0],
    chest: [-0.015, 0.09, 0],
    neck: [0.02, -0.02, 0],
    rearPalm: [-0.06, -0.08, 0.03],
  },
  rhythm: {
    chest: [0, 0.025, 0.012],
    leadClavicle: [0, 0.006, 0.008],
    leadPalm: [0, 0.05, -0.025],
    rearPalm: [0, -0.035, 0.02],
  },
} satisfies WalkStyle

/** 1999 guard: upright, lead forearm high, rear hand kept close to the waist. */
export const KURAPIKA_1999_GUARD: FightPose = {
  body: [-0.045, 0, 0],
  chest: [-0.055, 0.08, 0],
  head: [0.025, -0.025, 0],
  leadShoulder: [-0.34, 0, 0.3],
  leadElbow: [-0.34, 0, 0],
  leadWrist: [0.24, 0, -0.08],
  rearShoulder: [0.08, 0, -0.08],
  rearElbow: [0.18, 0, 0],
  rearWrist: [-0.12, 0, 0.04],
}

/** Raised-forearm reception of Uvogin's heavy blow; only layered during actual blockstun. */
export const KURAPIKA_BIG_BANG_GUARD: FightPose = {
  root: [0, -0.035, -0.045],
  body: [-0.13, 0, 0],
  chest: [-0.11, 0.12, 0.04],
  head: [-0.08, -0.05, 0.08],
  leadShoulder: [-1.45, 0, 0.42],
  leadElbow: [-1.25, 0, 0],
  leadWrist: [0.42, 0, -0.1],
  rearShoulder: [-0.55, 0, -0.18],
  rearElbow: [-0.9, 0, 0],
  leadKnee: [0.28, 0, 0],
  rearKnee: [0.34, 0, 0],
}

/**
 * 1999 and 2011 combined: a near-upright speed step on approach; on retreat,
 * the old anime's horizontal corkscrew resolves into its one-knee ground skim.
 * These are ordinary vulnerable dash poses, never teleportation or i-frames.
 */
export function kurapikaDashPoses(forward: boolean): FightPose[] {
  if (forward)
    return [
      {
        root: [0, -0.055, -0.018],
        body: [0.06, 0, 0],
        chest: [-0.02, -0.04, 0],
        leadKnee: [0.46, 0, 0],
        rearKnee: [0.38, 0, 0],
        leadPalm: [-0.1, 0.14, -0.05],
        rearFoot: [0.15, 0, 0],
      },
      {
        root: [0, 0.028, 0.082],
        body: [-0.02, 0, 0],
        chest: [-0.03, -0.12, 0],
        neck: [-0.035, 0.025, 0],
        leadHip: [-0.38, 0, 0],
        rearHip: [0.3, 0, 0],
        leadClavicle: [-0.012, 0.018, 0.025],
        leadPalm: [-0.14, 0.18, -0.06],
        leadFoot: [-0.1, 0, 0],
      },
      {
        root: [0, -0.045, 0.024],
        body: [0.025, 0, 0],
        chest: [0, -0.05, 0],
        leadKnee: [0.4, 0, 0],
        rearKnee: [0.34, 0, 0],
        leadPalm: [-0.07, 0.1, -0.03],
        leadFoot: [0.12, 0, 0],
      },
    ]
  return [
    {
      root: [0, -0.06, 0.025],
      body: [-0.08, 0, 0],
      chest: [-0.04, 0.1, 0],
      leadKnee: [0.5, 0, 0],
      rearKnee: [0.42, 0, 0],
      leadShoulder: [-0.18, 0, 0.2],
    },
    {
      root: [0, 0.045, -0.1],
      body: [-1.02, 0.18, 0.22],
      chest: [-0.22, 0.7, -0.12],
      head: [0.18, -0.18, 0.1],
      leadHip: [-0.88, 0.18, 0.12],
      leadKnee: [1.28, 0, 0],
      rearHip: [-0.7, -0.18, -0.1],
      rearKnee: [1.12, 0, 0],
      leadShoulder: [0.42, 0, 0.38],
      rearShoulder: [0.36, 0, -0.34],
    },
    {
      root: [0, -0.105, -0.035],
      body: [0.36, 0, 0],
      chest: [0.18, -0.16, 0],
      head: [-0.2, 0.08, 0],
      leadHip: [-0.82, 0, 0.18],
      leadKnee: [1.45, 0, 0],
      rearHip: [-0.34, 0, -0.12],
      rearKnee: [0.78, 0, 0],
      leadShoulder: [-0.18, 0, 0.3],
      rearShoulder: [0.22, 0, -0.18],
      leadPalm: [-0.1, 0.12, -0.04],
      rearFoot: [0.18, 0, 0],
    },
  ]
}
