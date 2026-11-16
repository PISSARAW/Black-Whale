import type { FightPose } from './fightPose'

/**
 * The vocabulary idle stances are written in: a few ways to stand and a few
 * ways to hold the arms, each a partial pose that `addPoses` sums. A fighter's
 * stance (`fightStancesRoster.ts`) picks one of each and adds what is its own.
 *
 * Signs follow `fightPose.ts`: shoulders and hips x < 0 swing forward, elbows
 * x < 0 bend, knees x > 0 bend; z > 0 opens the lead limb, z < 0 the rear one.
 */

/** Straight and still: a prince, a soldier at attention. */
export const LEGS_UPRIGHT: FightPose = {
  leadHip: [-0.08, 0, 0.04],
  leadKnee: [0.1, 0, 0],
  rearHip: [0.06, 0, -0.04],
  rearKnee: [0.04, 0, 0],
}

/** Weight balanced on soft knees, lead foot forward: the default fighter. */
export const LEGS_SOFT: FightPose = {
  leadHip: [-0.3, 0, 0.06],
  leadKnee: [0.45, 0, 0],
  rearHip: [0.22, 0, -0.06],
  rearKnee: [0.12, 0, 0],
}

/** Low and coiled, ready to spring: assassins, ninjas, beasts. */
export const LEGS_DEEP: FightPose = {
  body: [0.12, 0, 0],
  leadHip: [-0.65, 0, 0.12],
  leadKnee: [1, 0, 0],
  rearHip: [0.05, 0, -0.12],
  rearKnee: [0.7, 0, 0],
}

/** Feet planted wide: big bodies that do not need to move. */
export const LEGS_WIDE: FightPose = {
  leadHip: [-0.12, 0, 0.3],
  leadKnee: [0.35, 0, 0],
  rearHip: [0.08, 0, -0.3],
  rearKnee: [0.3, 0, 0],
}

/** A boxer's high guard: lead fist forward, rear fist at the chin. */
export const ARMS_GUARD: FightPose = {
  leadShoulder: [-0.85, 0, 0.15],
  leadElbow: [-1.7, 0, 0],
  rearShoulder: [-0.6, 0, -0.15],
  rearElbow: [-2, 0, 0],
}

/** Arms folded across the chest. */
export const ARMS_CROSSED: FightPose = {
  leadShoulder: [-0.75, 0, -0.45],
  leadElbow: [-1.85, 0, 0],
  rearShoulder: [-0.8, 0, 0.45],
  rearElbow: [-1.8, 0, 0],
}

/** Fists on the hips, elbows out. */
export const ARMS_ON_HIPS: FightPose = {
  leadShoulder: [0.1, 0, 0.55],
  leadElbow: [-1.5, 0, 0],
  leadWrist: [0.3, 0, 0],
  rearShoulder: [0.1, 0, -0.55],
  rearElbow: [-1.5, 0, 0],
  rearWrist: [0.3, 0, 0],
}

/** Hands clasped behind the back. */
export const ARMS_BEHIND: FightPose = {
  leadShoulder: [0.45, 0, -0.12],
  leadElbow: [-0.7, 0, 0],
  rearShoulder: [0.45, 0, 0.12],
  rearElbow: [-0.7, 0, 0],
}

/** Arms loose at the sides, a little forward. */
export const ARMS_LOOSE: FightPose = {
  leadShoulder: [-0.15, 0, 0.1],
  leadElbow: [-0.3, 0, 0],
  rearShoulder: [-0.05, 0, -0.1],
  rearElbow: [-0.2, 0, 0],
}
