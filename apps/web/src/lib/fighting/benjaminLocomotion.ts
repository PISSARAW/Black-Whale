import type { FightPose } from './fightPose'
import type { WalkStyle } from './fightLocomotion'

/**
 * Benjamin does not bounce into range: he occupies it. His guard stays broad,
 * his centre low and the small arm rhythm comes from loaded clavicles.
 */
export const BENJAMIN_WALK_STYLE = {
  advance: {
    root: [0, -0.025, 0],
    body: [0.19, 0, 0],
    chest: [0.1, -0.025, 0],
    neck: [-0.06, 0, 0],
    leadClavicle: [-0.018, 0.016, 0.028],
    rearClavicle: [0.018, 0.012, 0.022],
    leadFoot: [0.08, 0, 0],
  },
  retreat: {
    root: [0, -0.018, 0],
    body: [-0.015, 0, 0],
    chest: [0.045, 0.055, 0],
    neck: [-0.035, 0.02, 0],
    leadShoulder: [-0.08, 0, 0.08],
    rearShoulder: [-0.06, 0, -0.08],
  },
  rhythm: {
    chest: [0.018, 0, 0.035],
    leadClavicle: [0, 0.009, 0.012],
    rearClavicle: [0, 0.007, 0.01],
    leadPalm: [-0.025, 0.03, 0],
    rearPalm: [-0.025, -0.03, 0],
  },
} satisfies WalkStyle

/** A heavyweight drive with almost no airtime and a visibly braced catch. */
export function benjaminDashPoses(forward: boolean): FightPose[] {
  const direction = forward ? 1 : -1
  return [
    {
      root: [0, -0.09, -0.025 * direction],
      body: [0.22 * direction, 0, 0],
      chest: [0.13 * direction, 0, 0],
      neck: [-0.08 * direction, 0, 0],
      leadKnee: [0.62, 0, 0],
      rearKnee: [0.58, 0, 0],
      leadClavicle: [-0.02, 0.018, 0.03],
      rearClavicle: [0.02, 0.016, 0.026],
      rearFoot: [0.2, 0, 0],
    },
    {
      root: [0, -0.018, 0.082 * direction],
      body: [0.31 * direction, 0, 0],
      chest: [0.16 * direction, -0.055 * direction, 0],
      neck: [-0.11 * direction, 0, 0],
      leadHip: [-0.52 * direction, 0, 0],
      rearHip: [0.4 * direction, 0, 0],
      leadKnee: [0.28, 0, 0],
      rearKnee: [0.34, 0, 0],
      leadClavicle: [-0.025, 0.022, 0.04],
      rearClavicle: [0.025, 0.02, 0.035],
      leadPalm: [-0.08, 0.04, 0],
      rearPalm: [-0.08, -0.04, 0],
    },
    {
      root: [0, -0.075, 0.02 * direction],
      body: [0.13 * direction, 0, 0],
      chest: [0.075 * direction, 0, 0],
      leadKnee: [0.55, 0, 0],
      rearKnee: [0.5, 0, 0],
      leadClavicle: [-0.014, 0.012, 0.02],
      rearClavicle: [0.014, 0.01, 0.018],
      leadFoot: [0.16, 0, 0],
    },
  ]
}
