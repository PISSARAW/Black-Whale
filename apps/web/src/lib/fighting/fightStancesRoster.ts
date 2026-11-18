import {
  composeStance as stance,
  ARMS_CROSSED,
  ARMS_LOOSE,
  LEGS_SOFT,
  LEGS_UPRIGHT,
  LEGS_WIDE,
} from './fightStanceParts'
import type { FightStance } from './fightStance'
import type { FighterId } from './types'
import { ADDITIONAL_ROSTER_STANCES } from './fightStancesAdditionalRoster'

/**
 * Resting attitudes, not held attack/ability keyframes. STANCE_REFERENCES.md
 * records a chapter, identifiable scene and the limits of each interpretation.
 * Numbers are rig adaptations, never measurements claimed from manga panels.
 * Kurapika and Hisoka remain in fightStance.ts.
 */
export const ROSTER_STANCES: Partial<Record<FighterId, FightStance>> = {
  ...ADDITIONAL_ROSTER_STANCES,
  // Ch. 351: book supported close to the torso, free arm low.
  chrollo: stance(
    [
      LEGS_UPRIGHT,
      {
        chest: [0, -0.24, 0],
        head: [0.05, 0, 0],
        leadShoulder: [-0.42, 0, -0.06],
        leadElbow: [-1.4, 0, 0],
        leadWrist: [-0.18, 0, 0],
        rearShoulder: [0.02, 0, -0.04],
        rearElbow: [-0.12, 0, 0],
      },
    ],
    0.006,
    0.3,
  ),
  // Ch. 373: receives Camilla without a boxer’s raised fists.
  benjamin: stance(
    [
      LEGS_WIDE,
      ARMS_LOOSE,
      {
        chest: [-0.03, -0.1, 0],
        head: [-0.03, 0, 0],
        leadShoulder: [0.12, 0, 0.05],
        rearShoulder: [0.08, 0, -0.05],
      },
    ],
    0.008,
    0.3,
  ),
  // Ch. 385–387: upright training posture; eye closure follows Nen state.
  tserriednich: stance(
    [
      LEGS_UPRIGHT,
      {
        chest: [0, -0.12, 0],
        head: [-0.04, 0, 0],
        leadShoulder: [0.04, 0, 0.025],
        leadElbow: [-0.06, 0, 0],
        rearShoulder: [0.04, 0, -0.025],
        rearElbow: [-0.06, 0, 0],
      },
    ],
    0,
    0.25,
  ),
  // Ch. 224, opening group: collar high, hands low, no permanent crouch.
  feitan: stance(
    [
      LEGS_UPRIGHT,
      {
        body: [0.03, 0, 0],
        chest: [0.1, -0.16, 0],
        head: [-0.08, 0, 0],
        leadShoulder: [-0.08, 0, 0.025],
        leadElbow: [-0.18, 0, 0],
        rearShoulder: [-0.04, 0, -0.025],
        rearElbow: [-0.22, 0, 0],
      },
    ],
    0.008,
    0.4,
  ),
  // Ch. 349: composed Zodiac explaining his ability, not a monkey crouch.
  saiyu: stance(
    [
      LEGS_UPRIGHT,
      {
        chest: [0.04, -0.2, 0],
        head: [0.03, 0, 0.025],
        leadShoulder: [-0.35, 0, 0.12],
        leadElbow: [-0.75, 0, 0],
        leadWrist: [-0.12, 0, 0],
        rearShoulder: [0.02, 0, -0.05],
        rearElbow: [-0.25, 0, 0],
      },
    ],
    0.014,
    0.4,
  ),
  // Ch. 385: controlled pistol carriage; aiming belongs to the shot.
  theta: stance(
    [
      LEGS_SOFT,
      {
        leadHip: [0.12, 0, 0],
        leadKnee: [-0.16, 0, 0],
        chest: [0.02, -0.24, 0],
        leadShoulder: [-0.35, 0, 0.06],
        leadElbow: [-0.65, 0, 0],
        leadWrist: [-0.12, 0, 0],
        rearShoulder: [-0.03, 0, -0.04],
        rearElbow: [-0.22, 0, 0],
      },
    ],
    0.012,
    0.4,
  ),
  // Ch. 177: compact preparation against Bara, rear hand near the waist.
  biscuit: stance(
    [
      LEGS_SOFT,
      {
        leadHip: [0.08, 0, 0],
        leadKnee: [-0.1, 0, 0],
        chest: [0.02, -0.26, 0],
        leadShoulder: [-0.45, 0, 0.06],
        leadElbow: [-0.8, 0, 0],
        rearShoulder: [0.18, 0, -0.08],
        rearElbow: [-1.15, 0, 0],
      },
    ],
    0.016,
    0.45,
  ),
  // Ch. 224, before the nest: casual stance, Cyclotron arm lowered.
  phinks: stance(
    [
      LEGS_WIDE,
      {
        body: [0.015, 0, 0],
        chest: [0.04, -0.16, 0],
        head: [0.04, 0, 0],
        leadShoulder: [-0.12, 0, 0.08],
        leadElbow: [-0.35, 0, 0],
        rearShoulder: [0.08, 0, -0.05],
        rearElbow: [-0.14, 0, 0],
      },
    ],
    0.012,
    0.35,
  ),
  // Ch. 379: waiting, not shooting; seated bearing adapted to standing.
  franklin: stance(
    [
      LEGS_WIDE,
      {
        chest: [0.04, -0.08, 0],
        head: [0.02, 0, 0],
        leadShoulder: [-0.06, 0, 0.08],
        leadElbow: [-0.12, 0, 0],
        rearShoulder: [-0.04, 0, -0.08],
        rearElbow: [-0.1, 0, 0],
      },
    ],
    0.004,
    0.25,
  ),
  // Ch. 357, suture scene: precise hands close together, lowered outside the technique.
  machi: stance(
    [
      LEGS_UPRIGHT,
      {
        chest: [0.01, -0.22, 0],
        leadShoulder: [-0.24, -0.12, 0.06],
        leadElbow: [-0.65, 0, 0],
        leadWrist: [-0.12, 0, 0],
        rearShoulder: [-0.2, 0.12, -0.06],
        rearElbow: [-0.6, 0, 0],
        rearWrist: [-0.12, 0, 0],
      },
    ],
    0.006,
    0.3,
  ),
  // Ch. 380: almost motionless, arms straight, only a slight head tilt.
  illumi: stance(
    [
      LEGS_UPRIGHT,
      {
        chest: [0, -0.1, 0],
        head: [0, 0, 0.025],
        leadShoulder: [0, 0, 0.03],
        leadElbow: [-0.08, 0, 0],
        leadWrist: [-0.08, 0, 0],
        rearShoulder: [0, 0, -0.03],
        rearElbow: [-0.04, 0, 0],
      },
    ],
    0,
    0.25,
  ),
  // Ch. 224, opening group: hands beside the kimono, fan lowered.
  kalluto: stance(
    [
      LEGS_UPRIGHT,
      {
        chest: [0, -0.14, 0],
        head: [0.025, 0, 0],
        leadShoulder: [-0.04, 0, 0.02],
        leadElbow: [-0.12, 0, 0],
        rearShoulder: [-0.12, 0, -0.025],
        rearElbow: [-0.28, 0, 0],
        rearWrist: [-0.08, 0, 0],
      },
    ],
    0.004,
    0.3,
  ),
  // Ch. 224, opening group: one glove near the chest, the other low; not dancing.
  bonolenov: stance(
    [
      LEGS_UPRIGHT,
      {
        chest: [0.02, -0.18, 0],
        leadShoulder: [-0.45, 0, 0.06],
        leadElbow: [-1.55, 0, 0],
        rearShoulder: [-0.08, 0, -0.05],
        rearElbow: [-0.24, 0, 0],
      },
    ],
    0.01,
    0.35,
  ),
  // Ch. 224, neutral group; carried Blinky follows its existing prop controller.
  shizuku: stance(
    [
      LEGS_UPRIGHT,
      {
        chest: [0.01, -0.12, 0],
        head: [0.03, 0, -0.025],
        leadShoulder: [-0.16, 0, -0.06],
        leadElbow: [-0.32, 0, 0],
        rearShoulder: [-0.12, 0, 0.06],
        rearElbow: [-0.35, 0, 0],
      },
    ],
    0.006,
    0.3,
  ),
  // Ch. 391: economical interception, not a boxer’s high guard.
  hinrigh: stance(
    [
      LEGS_WIDE,
      ARMS_LOOSE,
      {
        chest: [0.04, -0.2, 0],
        head: [-0.02, 0, 0],
        leadShoulder: [-0.12, 0, -0.02],
        leadElbow: [-0.12, 0, 0],
        rearShoulder: [0.08, 0, 0.02],
      },
    ],
    0.008,
    0.35,
  ),
  // Ch. 343: composed investigator; folded arms are an idle adaptation.
  mizaistom: stance(
    [
      LEGS_UPRIGHT,
      ARMS_CROSSED,
      {
        chest: [0, -0.16, 0],
        head: [0.025, 0, 0],
      },
    ],
    0.004,
    0.3,
  ),
  // Ch. 325, addressing Ging: upright civilian, without a boxing bounce.
  leorio: stance(
    [
      LEGS_UPRIGHT,
      ARMS_LOOSE,
      {
        body: [0.02, 0, 0],
        chest: [0.025, -0.18, 0],
        head: [-0.025, 0, 0],
        leadElbow: [-0.12, 0, 0],
        rearShoulder: [0.1, 0, -0.03],
      },
    ],
    0.018,
    0.45,
  ),
  // Ch. 33, face-off with Gon: poised, upright; crouching is an action.
  hanzo: stance(
    [
      LEGS_SOFT,
      {
        leadHip: [0.08, 0, 0],
        leadKnee: [-0.1, 0, 0],
        chest: [0.045, -0.26, 0],
        leadShoulder: [-0.26, 0, 0.08],
        leadElbow: [-0.45, 0, 0],
        leadWrist: [0.08, 0, 0],
        rearShoulder: [0.18, 0, -0.06],
        rearElbow: [-0.3, 0, 0],
      },
    ],
    0.012,
    0.45,
  ),
  // Ch. 374/381: analytical soldier; Predator’s name does not describe his anatomy.
  rihan: stance(
    [
      LEGS_UPRIGHT,
      {
        body: [0.015, 0, 0],
        chest: [0.045, -0.12, 0],
        head: [0.015, 0, 0],
        leadShoulder: [-0.08, 0, 0.04],
        leadElbow: [-0.25, 0, 0],
        rearShoulder: [0.025, 0, -0.04],
        rearElbow: [-0.12, 0, 0],
      },
    ],
    0.006,
    0.3,
  ),
  // Ch. 391: relaxed blood manipulator; no invented hand-to-nose tracking gesture.
  zakuro: stance(
    [
      LEGS_UPRIGHT,
      {
        body: [0.02, 0, 0.02],
        chest: [0.04, -0.2, 0],
        head: [0.035, 0, 0.025],
        leadShoulder: [-0.22, 0, 0.08],
        leadElbow: [-0.48, 0, 0],
        rearShoulder: [0.08, 0, -0.04],
        rearElbow: [-0.3, 0, 0],
      },
    ],
    0.012,
    0.4,
  ),
  // Ch. 68: listening; ch. 383 playing uses the separate flute-performance state.
  melody: stance(
    [
      LEGS_UPRIGHT,
      {
        chest: [0.02, -0.16, 0],
        head: [0.035, 0, 0.035],
        leadShoulder: [-0.18, 0, 0.08],
        leadElbow: [-0.55, 0, 0],
        rearShoulder: [-0.15, 0, -0.05],
        rearElbow: [-0.5, 0, 0],
      },
    ],
    0.008,
    0.3,
  ),
}
