import {
  composeStance as stance,
  ARMS_ON_HIPS,
  LEGS_SOFT,
  LEGS_UPRIGHT,
  LEGS_WIDE,
} from './fightStanceParts'
import type { FightStance } from './fightStance'
import type { FighterId } from './types'

/** Resting poses for the third, fourth and completion roster waves; see STANCE_REFERENCES.md. */
export const ADDITIONAL_ROSTER_STANCES: Partial<Record<FighterId, FightStance>> = {
  // Ch. 68: grounded posture; brush strokes belong to the writing state.
  basho: stance(
    [
      LEGS_WIDE,
      {
        chest: [-0.045, -0.24, -0.035],
        head: [0.015, 0, 0],
        leadShoulder: [-0.36, 0.21, 0.23],
        leadPalm: [-0.22, 0, 0.16],
        leadElbow: [-0.6, 0, 0],
        leadWrist: [0.1, 0, 0],
        rearShoulder: [-0.08, 0, -0.08],
        rearElbow: [-0.55, 0, 0],
      },
    ],
    0.01,
    0.35,
  ),
  // Ch. 372–373: proud, exposed posture rather than a combat crouch.
  camilla: stance(
    [
      LEGS_UPRIGHT,
      ARMS_ON_HIPS,
      {
        chest: [-0.04, -0.12, 0],
        head: [-0.07, 0, 0],
      },
    ],
    0.004,
    0.3,
  ),
  // Ch. 382, resolve before the shot: arms lowered; drawing the bow is an action.
  halkenburg: stance(
    [
      LEGS_UPRIGHT,
      {
        chest: [0.015, -0.22, 0],
        head: [0.01, 0, 0],
        leadShoulder: [-0.14, 0, 0.055],
        leadElbow: [-0.34, 0, 0],
        rearShoulder: [0.025, 0, -0.055],
        rearElbow: [-0.16, 0, 0],
      },
    ],
    0.01,
    0.35,
  ),
  // Ch. 319/326: composed Zodiac, ordinary arm outside the snake transformation.
  gel: stance(
    [
      LEGS_UPRIGHT,
      {
        body: [0, 0, 0.025],
        chest: [0.01, -0.18, -0.02],
        head: [0.02, 0, 0],
        leadShoulder: [-0.1, 0, 0.04],
        leadElbow: [-0.28, 0, 0],
        rearShoulder: [0.02, 0, -0.08],
        rearElbow: [-0.5, 0, 0],
      },
    ],
    0.008,
    0.3,
  ),
  // Ch. 390: punch-based interrogation, without an unsupported palm-power gesture.
  lynch: stance(
    [
      LEGS_SOFT,
      {
        leadHip: [0.08, 0, 0],
        leadKnee: [-0.1, 0, 0],
        chest: [0.115, -0.27, 0.035],
        leadShoulder: [-0.61, 0.1, 0.14],
        leadElbow: [-0.96, 0, 0],
        leadWrist: [0.04, 0, 0],
        rearShoulder: [-0.37, -0.15, -0.13],
        rearElbow: [-0.95, 0, 0],
      },
    ],
    0.018,
    0.45,
  ),
  // Ch. 392–393: casual knife carrier; hands do not shape an imaginary portal.
  luini: stance(
    [
      LEGS_UPRIGHT,
      {
        body: [0.035, 0, 0],
        chest: [0.05, -0.16, 0],
        head: [0.025, 0, 0.03],
        leadShoulder: [-0.2, 0, 0.08],
        leadElbow: [-0.45, 0, 0],
        leadWrist: [0.08, 0, 0],
        rearShoulder: [0.06, 0, -0.08],
        rearElbow: [-0.28, 0, 0],
      },
    ],
    0.012,
    0.4,
  ),
  // Ch. 364: ready in front of Vincent, without a cupped-aura gesture.
  bill: stance(
    [
      LEGS_SOFT,
      {
        leadHip: [0.1, 0, 0],
        leadKnee: [-0.12, 0, 0],
        chest: [0.05, -0.16, 0],
        head: [0.02, 0, 0],
        leadShoulder: [-0.4, 0, 0.08],
        leadElbow: [-0.8, 0, 0],
        rearShoulder: [-0.16, 0, -0.06],
        rearElbow: [-0.55, 0, 0],
      },
    ],
    0.012,
    0.35,
  ),
  // Ch. 370: observing the class; shoulders square, not locked at parade attention.
  furykov: stance(
    [
      LEGS_SOFT,
      {
        leadHip: [-0.065, 0.1, 0.03],
        rearHip: [-0.19, -0.1, -0.06],
        chest: [0.09, -0.17, -0.055],
        head: [0.02, 0, 0],
        leadShoulder: [-0.49, 0.12, 0.15],
        leadElbow: [-0.83, 0, 0],
        rearShoulder: [-0.34, -0.15, -0.12],
        rearElbow: [-1.08, 0, 0],
      },
    ],
    0.004,
    0.3,
  ),
  // Ch. 319, introductory close-up: hand near the mouth, not above the shoulder.
  cluck: stance(
    [
      LEGS_UPRIGHT,
      {
        chest: [0, -0.18, 0],
        head: [0.02, 0, 0.015],
        leadShoulder: [-0.85, -0.18, 0.1],
        leadElbow: [-1.95, 0, 0],
        leadWrist: [0.12, 0, 0],
        rearShoulder: [0.04, 0, -0.08],
        rearElbow: [-0.35, 0, 0],
      },
    ],
    0.006,
    0.35,
  ),
  // Ch. 342, patient confidence in custody: seated bearing adapted to standing.
  beyond: stance(
    [
      LEGS_WIDE,
      {
        leadHip: [-0.07, 0.08, 0.02],
        rearHip: [-0.17, -0.04, -0.02],
        rearKnee: [0.14, 0, 0],
        chest: [0.16, -0.09, 0],
        head: [-0.035, 0, 0],
        leadShoulder: [-0.31, -0.17, 0.29],
        leadElbow: [-0.3, 0, 0],
        rearShoulder: [-0.28, 0.15, -0.28],
        rearElbow: [-0.28, 0, 0],
      },
    ],
    0.004,
    0.25,
  ),
  // Ch. 401: hands before the torso when negotiating; no moonward salute.
  longhi: stance(
    [
      LEGS_UPRIGHT,
      {
        chest: [-0.055, -0.26, 0.07],
        head: [0.01, 0, 0],
        leadShoulder: [-0.41, 0.16, 0.25],
        leadElbow: [-0.8, 0, 0],
        leadWrist: [0.15, 0, 0.14],
        leadPalm: [-0.34, 0, 0.16],
        rearShoulder: [-0.17, 0.05, -0.16],
        rearElbow: [-0.75, 0, 0],
        rearWrist: [-0.08, 0, 0],
      },
    ],
    0.006,
    0.3,
  ),
  // Ch. 372–373: measured armed sentry, without a bouncing high guard.
  musse: stance(
    [
      LEGS_UPRIGHT,
      {
        chest: [0.065, 0.13, 0.035],
        head: [0.035, -0.11, 0],
        leadShoulder: [-0.45, -0.19, 0.14],
        leadElbow: [-0.72, 0, 0],
        rearShoulder: [-0.12, -0.23, -0.09],
        rearElbow: [-0.66, 0, 0],
      },
    ],
    0.008,
    0.35,
  ),
  // Ch. 391, before swinging: tool hand near the body, not permanently thrust.
  padaille: stance(
    [
      LEGS_SOFT,
      {
        leadHip: [0.08, 0, 0],
        leadKnee: [-0.1, 0, 0],
        chest: [0.075, 0.12, -0.08],
        leadShoulder: [-0.16, 0.14, 0.29],
        leadElbow: [-0.72, 0, 0],
        leadWrist: [0.08, 0, 0],
        rearShoulder: [-0.44, -0.13, -0.2],
        rearElbow: [-0.5, 0, 0],
        rearPalm: [-0.17, 0, -0.13],
      },
    ],
    0.018,
    0.45,
  ),
  // Ch. 361: lucid bodyguard, not the manipulated assault of ch. 360.
  sayird: stance(
    [
      LEGS_UPRIGHT,
      {
        chest: [0.03, -0.14, 0],
        head: [0.02, 0, 0],
        leadShoulder: [-0.14, 0, 0.07],
        leadElbow: [-0.4, 0, 0],
        rearShoulder: [-0.1, 0, -0.07],
        rearElbow: [-0.42, 0, 0],
      },
    ],
    0.008,
    0.35,
  ),
  // Ch. 399: independent right-in/left-out contacts, not a crossed-arm shield.
  terebellum: stance(
    [
      LEGS_WIDE,
      {
        chest: [0.05, -0.14, 0],
        head: [0.025, 0, 0],
        leadShoulder: [-0.24, 0, 0.1],
        leadElbow: [-0.5, 0, 0],
        rearShoulder: [0.08, 0, -0.1],
        rearElbow: [-0.24, 0, 0],
      },
    ],
    0.01,
    0.35,
  ),
  // Ch. 393: waiting with the Heil-Ly, without holding an absent doorknob.
  voconte: stance(
    [
      LEGS_SOFT,
      {
        pelvis: [0, 0.17, 0],
        chest: [0.07, -0.16, 0.04],
        head: [0.03, 0, -0.025],
        leadShoulder: [-0.34, -0.29, 0.23],
        leadElbow: [-0.67, 0, 0],
        rearShoulder: [-0.14, -0.21, -0.24],
        rearElbow: [-0.54, 0, 0],
      },
    ],
    0.008,
    0.3,
  ),
  // Ch. 399, self-introduction: one supporting forearm, the free palm explaining.
  yokotani: stance(
    [
      LEGS_UPRIGHT,
      {
        chest: [0.01, -0.16, 0],
        head: [0.01, 0, 0],
        leadShoulder: [-0.2, -0.3, 0.05],
        leadElbow: [-1.3, 0, 0],
        leadWrist: [-0.08, 0, 0],
        rearShoulder: [-0.45, 0, -0.12],
        rearElbow: [-1, 0, 0],
        rearWrist: [-0.08, 0, 0],
      },
    ],
    0.006,
    0.3,
  ),
}
