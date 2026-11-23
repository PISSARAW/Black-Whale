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

/** A compact fencing burst: gather, glide with the chain hand ready, then plant. */
export function kurapikaDashPoses(forward: boolean): FightPose[] {
  const direction = forward ? 1 : -1
  return [
    {
      root: [0, -0.055, -0.018 * direction],
      body: [0.09 * direction, 0, 0],
      chest: [0.035 * direction, -0.06 * direction, 0],
      leadKnee: [0.46, 0, 0],
      rearKnee: [0.38, 0, 0],
      leadPalm: [-0.1, 0.14, -0.05],
      rearFoot: [0.15, 0, 0],
    },
    {
      root: [0, 0.018, 0.072 * direction],
      body: [0.16 * direction, 0, 0],
      chest: [0.05 * direction, -0.16 * direction, 0],
      neck: [-0.06 * direction, 0.025 * direction, 0],
      leadHip: [-0.42 * direction, 0, 0],
      rearHip: [0.32 * direction, 0, 0],
      leadClavicle: [-0.012, 0.018, 0.025],
      leadPalm: [-0.14, 0.18, -0.06],
      leadFoot: [-0.1, 0, 0],
    },
    {
      root: [0, -0.035, 0.018 * direction],
      body: [0.035 * direction, 0, 0],
      chest: [0, -0.04 * direction, 0],
      leadKnee: [0.34, 0, 0],
      rearKnee: [0.3, 0, 0],
      leadPalm: [-0.07, 0.1, -0.03],
      leadFoot: [0.12, 0, 0],
    },
  ]
}
