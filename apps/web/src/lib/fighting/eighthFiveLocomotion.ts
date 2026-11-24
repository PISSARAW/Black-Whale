import type { CombatLocomotion } from './firstFiveCombatMotion'
import type { ArcadeFighter, FighterId } from './types'

const LOCOMOTION: Partial<Record<FighterId, CombatLocomotion>> = {
  // Carry the right arm close like a tool, with the left hand free to cover.
  padaille: {
    stride: 1.09,
    stepScale: 1.12,
    advance: { body: [0.12, 0, 0], chest: [0.08, 0.16, 0.13], leadElbow: [-0.42, 0, 0] },
    retreat: { body: [-0.14, 0, -0.13], leadElbow: [-0.53, 0, 0], rearShoulder: [-0.22, 0, -0.2] },
    weight: { root: [0, -0.025, 0], chest: [0.07, 0, 0] },
    swing: { chest: [0, 0.15, 0.12], rearShoulder: [0.18, 0, -0.15] },
    guard: {
      chest: [0.13, 0.17, 0.12],
      leadShoulder: [0.12, 0, 0.19],
      leadElbow: [-0.45, 0, 0],
      rearShoulder: [-0.37, 0, -0.17],
    },
    takeoff: { body: [0.16, 0, 0], leadElbow: [-0.39, 0, 0], rearKnee: [0.26, 0, 0] },
    jump: {
      chest: [0.13, 0.25, 0.12],
      leadShoulder: [-0.81, 0.1, 0.29],
      leadElbow: [-0.54, 0, 0],
      rearShoulder: [0.24, 0, -0.25],
      leadHip: [-0.21, 0, 0.16],
    },
    landing: { body: [0.18, 0, 0], leadElbow: [-0.48, 0, 0], rearKnee: [0.23, 0, 0] },
  },
  // Little Eye informs how Sayird scans and follows movement.
  sayird: {
    stride: 0.85,
    stepScale: 0.78,
    advance: { body: [0.08, 0, 0], head: [0.09, -0.24, 0.13], leadElbow: [-0.36, 0, 0] },
    retreat: { body: [-0.09, 0, 0.05], head: [-0.055, 0.26, -0.12], rearElbow: [-0.27, 0, 0] },
    weight: { root: [0, -0.017, 0], chest: [0.06, 0, 0] },
    swing: { head: [0, 0.25, -0.14], chest: [0, -0.11, 0.04], leadWrist: [-0.1, 0.13, 0] },
    guard: {
      head: [0.08, -0.25, 0.16],
      leadShoulder: [-0.27, 0.08, 0.18],
      leadElbow: [-0.27, 0, 0],
      rearElbow: [-0.49, 0, 0],
    },
    takeoff: { head: [-0.14, 0.17, 0.08], rearKnee: [0.2, 0, 0], leadElbow: [-0.28, 0, 0] },
    jump: {
      chest: [0.06, 0.19, -0.1],
      head: [0.18, -0.25, 0.12],
      leadElbow: [-0.42, 0, 0],
      rearElbow: [-0.39, 0, 0],
      leadHip: [-0.24, 0, 0.11],
      rearKnee: [0.18, 0, 0],
    },
    landing: { body: [0.105, 0, 0], head: [0.13, 0.19, 0.08], leadElbow: [-0.25, 0, 0] },
  },
  // One hand reaches for contact while the other stays against the body.
  terebellum: {
    stride: 1.19,
    stepScale: 0.93,
    advance: {
      chest: [0.13, -0.21, 0],
      leadShoulder: [-0.37, 0, 0.21],
      leadPalm: [-0.27, 0.18, 0.09],
      rearElbow: [-0.45, 0, 0],
    },
    retreat: {
      body: [-0.06, 0, 0],
      chest: [0.17, 0.15, 0.09],
      leadElbow: [-0.55, 0, 0],
      rearPalm: [-0.19, -0.16, 0],
    },
    weight: { root: [0, -0.03, 0], chest: [0.1, 0, 0] },
    swing: { chest: [0.03, -0.12, 0.11], leadShoulder: [-0.14, 0, 0.09] },
    guard: {
      body: [0.12, 0, 0],
      chest: [0.17, -0.21, 0],
      leadShoulder: [-0.48, 0, 0.21],
      leadPalm: [-0.42, 0.17, 0.1],
      rearElbow: [-0.57, 0, 0],
    },
    takeoff: { body: [0.19, 0, 0], rearKnee: [0.23, 0, 0], leadPalm: [-0.28, 0.21, 0.09] },
    jump: {
      body: [0.2, 0, 0],
      chest: [0.15, -0.27, 0],
      leadShoulder: [-0.55, 0.1, 0.22],
      leadPalm: [-0.36, 0.19, 0.07],
      rearElbow: [-0.49, 0, 0],
      leadHip: [-0.22, 0, 0.16],
      rearHip: [0.21, 0, -0.11],
    },
    landing: { body: [0.23, 0, 0], leadElbow: [-0.32, 0, 0], rearElbow: [-0.48, 0, 0] },
  },
  // Door's threshold inspires the sideways body and angular forearms.
  voconte: {
    stride: 1.03,
    stepScale: 1.02,
    advance: {
      body: [0, 0.16, 0.11],
      chest: [-0.07, 0.22, 0],
      leadElbow: [-0.36, 0, 0],
      leadPalm: [-0.24, 0.27, 0.14],
    },
    retreat: {
      body: [-0.15, 0.09, 0.13],
      chest: [-0.09, -0.25, 0],
      rearShoulder: [-0.26, 0, -0.2],
    },
    weight: { root: [0, -0.013, 0], chest: [0.045, 0, 0] },
    swing: { body: [0, 0, 0.15], chest: [0, 0.15, -0.09], leadWrist: [0.16, -0.11, 0] },
    guard: {
      body: [-0.11, 0.19, 0],
      chest: [-0.05, 0.22, 0.07],
      leadShoulder: [-0.39, 0.03, 0.25],
      leadWrist: [-0.31, 0.18, 0.09],
      rearElbow: [-0.45, 0, 0],
    },
    takeoff: { body: [-0.09, 0.14, 0.12], leadElbow: [-0.29, 0, 0], rearKnee: [0.17, 0, 0] },
    jump: {
      body: [-0.12, 0.23, 0.19],
      chest: [-0.04, -0.29, 0],
      leadShoulder: [-0.49, 0, 0.3],
      rearShoulder: [0.1, 0, -0.34],
      leadHip: [-0.32, 0.18, 0.17],
      rearHip: [0.17, 0, -0.14],
    },
    landing: { body: [-0.08, 0.18, 0.13], leadWrist: [-0.25, 0.18, 0], rearKnee: [0.18, 0, 0] },
  },
  // A formal stop gesture and upright bearing echo the summons to LSDF.
  yokotani: {
    stride: 0.78,
    stepScale: 0.69,
    advance: { chest: [-0.13, 0.09, 0], head: [-0.08, -0.13, 0.08], rearElbow: [-0.34, 0, 0] },
    retreat: { body: [-0.15, 0, 0], chest: [-0.14, 0.12, 0.06], leadPalm: [-0.29, 0.26, 0.15] },
    weight: { root: [0, -0.011, 0], chest: [-0.045, 0, 0] },
    swing: { chest: [0, 0.08, 0.06], head: [0, -0.08, 0], leadWrist: [-0.14, 0.09, 0] },
    guard: {
      chest: [-0.13, 0.13, 0.07],
      leadShoulder: [-0.51, 0, 0.15],
      leadElbow: [-0.36, 0, 0],
      leadPalm: [-0.44, 0.19, 0.12],
      rearElbow: [-0.39, 0, 0],
    },
    takeoff: { body: [-0.15, 0, 0], chest: [-0.1, 0.09, 0], rearKnee: [0.15, 0, 0] },
    jump: {
      body: [-0.17, 0, 0],
      chest: [-0.15, 0.11, 0.09],
      leadElbow: [-0.53, 0, 0],
      leadPalm: [-0.38, 0.23, 0.13],
      rearElbow: [-0.33, 0, 0],
      leadKnee: [0.21, 0, 0],
    },
    landing: { body: [-0.15, 0, 0], leadPalm: [-0.29, 0.19, 0.09], rearKnee: [0.16, 0, 0] },
  },
}

export function eighthFiveLocomotion(fighter: ArcadeFighter): CombatLocomotion | undefined {
  return LOCOMOTION[fighter.id]
}
