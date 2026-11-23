import { isBiscuitTrueForm } from './biscuitForm'
import type { CombatLocomotion } from './firstFiveCombatMotion'
import type { FightPose } from './fightPose'
import type { ArcadeFighter, FighterId } from './types'

export const FEITAN_JUMP: FightPose = {
  body: [0.23, 0, -0.08],
  head: [-0.17, 0, 0],
  leadHip: [-0.14, 0, 0],
  rearHip: [-0.12, 0, 0],
  leadKnee: [0.24, 0, 0],
  rearKnee: [0.22, 0, 0],
}

const LOCOMOTION: Partial<Record<FighterId, CombatLocomotion>> = {
  feitan: {
    stride: 0.78,
    stepScale: 0.79,
    advance: { root: [0, -0.065, 0], body: [0.21, 0, 0], head: [-0.17, 0, 0] },
    retreat: { root: [0, -0.05, 0], chest: [0.11, -0.15, 0], leadElbow: [-0.28, 0, 0] },
    weight: { rearKnee: [0.21, 0, 0], rearHip: [-0.15, 0, 0] },
    swing: { chest: [0, 0.11, -0.08], leadWrist: [0.19, 0, 0] },
    guard: {
      root: [0, -0.065, 0],
      body: [0.16, 0, 0],
      head: [-0.14, 0, 0],
      leadElbow: [-0.43, 0, 0],
      rearShoulder: [-0.2, 0, -0.18],
    },
    takeoff: { body: [0.16, 0, 0], rearKnee: [0.26, 0, 0], head: [-0.1, 0, 0] },
    jump: FEITAN_JUMP,
    landing: { body: [0.13, 0, 0], leadKnee: [0.17, 0, 0], rearHip: [-0.15, 0, 0] },
  },
  saiyu: {
    stride: 1.12,
    stepScale: 1.02,
    advance: { body: [-0.1, 0, 0], leadShoulder: [-0.19, 0, 0.19], leadElbow: [-0.16, 0, 0] },
    retreat: { chest: [0.02, -0.18, 0], leadShoulder: [-0.15, 0, 0.27], leadElbow: [-0.25, 0, 0] },
    weight: { pelvis: [0, -0.11, 0], leadKnee: [0.13, 0, 0] },
    swing: { pelvis: [0, 0.18, 0], head: [0, -0.08, 0], rearShoulder: [0.17, 0, -0.12] },
    guard: {
      leadShoulder: [-0.42, 0, 0.25],
      rearShoulder: [-0.31, 0, -0.19],
      rearElbow: [-0.38, 0, 0],
    },
    takeoff: { body: [-0.15, 0, 0], leadShoulder: [-0.32, 0, 0.16], rearKnee: [0.25, 0, 0] },
    jump: {
      body: [-0.12, 0, 0.13],
      leadHip: [-0.38, 0, 0.19],
      leadKnee: [0.39, 0, 0],
      rearHip: [0.22, 0, -0.13],
      rearKnee: [-0.22, 0, 0],
      leadShoulder: [-0.42, 0, 0.22],
    },
    landing: { body: [-0.1, 0, 0], pelvis: [0, 0.17, 0], leadShoulder: [-0.27, 0, 0.21] },
  },
  theta: {
    stride: 0.91,
    stepScale: 0.87,
    advance: { root: [0, -0.026, 0], chest: [0.06, -0.14, 0], leadElbow: [-0.54, 0, 0] },
    retreat: { chest: [0.07, -0.11, 0], rearShoulder: [-0.14, 0, -0.13], leadElbow: [-0.6, 0, 0] },
    weight: { root: [0, -0.018, 0], leadKnee: [0.1, 0, 0], rearKnee: [0.1, 0, 0] },
    swing: { pelvis: [0, 0.1, 0], chest: [0, -0.06, 0] },
    guard: {
      chest: [0.08, -0.16, 0],
      leadShoulder: [-0.27, 0, 0.09],
      rearShoulder: [-0.13, 0, -0.1],
      leadElbow: [-0.53, 0, 0],
    },
    takeoff: { body: [0.06, 0, 0], leadElbow: [-0.51, 0, 0], rearKnee: [0.18, 0, 0] },
    jump: {
      chest: [0.09, -0.18, 0],
      leadHip: [-0.14, 0, 0.09],
      rearHip: [-0.23, 0, -0.1],
      rearKnee: [0.18, 0, 0],
      rearShoulder: [-0.18, 0, -0.14],
      leadElbow: [-0.63, 0, 0],
    },
    landing: { chest: [0.07, -0.12, 0], leadElbow: [-0.49, 0, 0], leadKnee: [0.13, 0, 0] },
  },
  biscuit: {
    stride: 0.89,
    stepScale: 0.83,
    advance: { chest: [-0.04, -0.09, 0], leadPalm: [-0.13, 0.18, 0.07], rearElbow: [-0.19, 0, 0] },
    retreat: { body: [-0.09, 0, 0], leadShoulder: [-0.11, 0, 0.14], rearElbow: [-0.21, 0, 0] },
    weight: { leadHip: [-0.09, 0, 0], leadKnee: [0.14, 0, 0] },
    swing: { leadPalm: [0.12, 0.16, 0], pelvis: [0, -0.09, 0] },
    guard: {
      leadShoulder: [-0.25, 0, 0.18],
      leadPalm: [-0.16, 0.25, 0.09],
      rearElbow: [-0.19, 0, 0],
    },
    takeoff: { body: [-0.07, 0, 0], leadHip: [-0.19, 0, 0], leadKnee: [0.15, 0, 0] },
    jump: {
      body: [-0.13, 0, 0],
      leadKnee: [0.3, 0, 0],
      rearKnee: [0.25, 0, 0],
      leadPalm: [-0.21, 0.17, 0],
    },
    landing: { body: [-0.12, 0, 0], leadKnee: [0.12, 0, 0], leadPalm: [-0.14, 0.17, 0] },
  },
  phinks: {
    stride: 1.18,
    stepScale: 1.08,
    advance: { chest: [0.09, 0.16, 0], rearShoulder: [0.2, 0, -0.13], rearElbow: [-0.42, 0, 0] },
    retreat: { root: [0, -0.04, 0], chest: [0.07, 0.17, 0], rearElbow: [-0.5, 0, 0] },
    weight: { root: [0, -0.045, 0], rearKnee: [0.19, 0, 0], pelvis: [0, 0.15, 0] },
    swing: { chest: [0, -0.18, 0.09], rearShoulder: [0.19, 0.13, 0] },
    guard: { chest: [0.14, 0.25, 0], leadShoulder: [-0.38, 0, 0.13], rearElbow: [-0.55, 0, 0] },
    takeoff: { chest: [0.07, 0.21, 0], rearHip: [-0.15, 0, 0], rearElbow: [-0.53, 0, 0] },
    jump: {
      chest: [0.04, 0.29, 0.12],
      rearHip: [-0.3, 0, -0.13],
      rearKnee: [0.39, 0, 0],
      rearElbow: [-0.59, 0, 0],
    },
    landing: { chest: [0.13, 0.17, 0], rearKnee: [0.24, 0, 0], leadKnee: [0.11, 0, 0] },
  },
}

const BISCUIT_NATURAL: CombatLocomotion = {
  stride: 1.15,
  stepScale: 0.94,
  advance: { root: [0, -0.05, 0], body: [0.12, 0, 0], chest: [0.09, 0.1, 0] },
  retreat: { root: [0, -0.047, 0], chest: [0.07, 0.11, 0], rearKnee: [0.18, 0, 0] },
  weight: { root: [0, -0.046, 0], leadKnee: [0.18, 0, 0], rearKnee: [0.22, 0, 0] },
  swing: { pelvis: [0, 0.11, 0.04], chest: [0, -0.09, 0] },
  guard: {
    body: [0.15, 0, 0],
    leadKnee: [0.18, 0, 0],
    rearKnee: [0.23, 0, 0],
    rearShoulder: [-0.27, 0, -0.17],
  },
  takeoff: { body: [0.13, 0, 0], leadKnee: [0.19, 0, 0], rearKnee: [0.27, 0, 0] },
  jump: {
    body: [0.16, 0, 0],
    leadHip: [-0.12, 0, 0.16],
    rearHip: [-0.09, 0, -0.15],
    rearKnee: [0.18, 0, 0],
    rearElbow: [-0.25, 0, 0],
  },
  landing: { body: [0.14, 0, 0], leadKnee: [0.23, 0, 0], rearKnee: [0.27, 0, 0] },
}

export function secondFiveLocomotion(fighter: ArcadeFighter): CombatLocomotion | undefined {
  return isBiscuitTrueForm(fighter) ? BISCUIT_NATURAL : LOCOMOTION[fighter.id]
}
