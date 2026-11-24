import { WAVE_SIX_WEAPON_MOVEMENT } from './physicalLocomotionWaveSixWeapons'
import { WAVE_SIX_MARTIAL_MOVEMENT } from './physicalLocomotionWaveSixMartial'
import { WAVE_FIVE_HANDS_MOVEMENT } from './physicalLocomotionWaveFiveHands'
import { WAVE_FIVE_REACH_MOVEMENT } from './physicalLocomotionWaveFiveReach'
import { WAVE_FOUR_RHYTHM_MOVEMENT } from './physicalLocomotionWaveFourRhythm'
import { WAVE_FOUR_GUARD_MOVEMENT } from './physicalLocomotionWaveFourGuard'
import { WAVE_THREE_PRESSURE_MOVEMENT } from './physicalLocomotionWaveThree'
import { WAVE_THREE_RETREAT_MOVEMENT } from './physicalLocomotionWaveThreeCounters'
import type { WalkStyle } from './fightLocomotion'
import { COVERING_MOVEMENT } from './physicalLocomotionCounters'
import { WAVE_TWO_OBSERVATION_MOVEMENT } from './physicalLocomotionWaveTwo'
import { WAVE_TWO_COUNTER_MOVEMENT } from './physicalLocomotionWaveTwoCounters'
import type { FightPose } from './fightPose'
import type { FighterId } from './types'

type MotionBeats = [push: FightPose, travel: FightPose, brake: FightPose]

export interface PhysicalLocomotion {
  walk: WalkStyle
  stride: number
  forward: MotionBeats
  backward: MotionBeats
  guard: FightPose
  crouch: FightPose
  takeoff: FightPose
  air: FightPose
  landing: FightPose
}

export const PHYSICAL_LOCOMOTION: Partial<Record<FighterId, PhysicalLocomotion>> = {
  mizaistom: {
    stride: 0.84,
    walk: {
      advance: {
        body: [0.07, 0, 0],
        leadShoulder: [-0.38, 0, 0.13],
        leadWrist: [-0.4, 0, 0],
        rearElbow: [0.58, 0, 0],
      },
      retreat: {
        body: [-0.07, 0, 0],
        leadShoulder: [-0.28, -0.12, 0.22],
        leadElbow: [0.55, 0, 0],
        rearShoulder: [0.28, 0, -0.1],
      },
      rhythm: { chest: [0, 0.06, 0], leadClavicle: [0, 0.025, 0.02] },
    },
    forward: [
      {
        root: [0, -0.07, -0.045],
        body: [0.11, 0, 0],
        leadKnee: [0.29, 0, 0],
        rearKnee: [0.68, 0, 0],
      },
      {
        body: [0.19, 0, 0],
        leadHip: [-0.64, 0, 0],
        leadKnee: [0.52, 0, 0],
        leadShoulder: [-0.53, -0.24, 0.34],
        leadElbow: [0.66, 0, 0],
        rearShoulder: [0.28, 0, -0.18],
      },
      {
        root: [0, -0.055, 0],
        body: [-0.04, 0, 0],
        leadKnee: [0.56, 0, 0],
        leadShoulder: [-0.37, -0.15, 0.26],
        leadElbow: [0.28, 0, 0],
      },
    ],
    backward: [
      {
        body: [-0.11, 0, 0],
        leadShoulder: [-0.32, -0.24, 0.22],
        leadElbow: [0.6, 0, 0],
        rearKnee: [0.52, 0, 0],
      },
      {
        body: [-0.13, 0, 0],
        leadHip: [0.32, 0, 0],
        rearHip: [-0.62, 0, 0],
        rearKnee: [0.34, 0, 0],
        leadShoulder: [-0.49, -0.28, 0.39],
        leadElbow: [0.47, 0, 0],
      },
      { body: [0.02, 0, 0], rearKnee: [0.42, 0, 0], leadShoulder: [-0.22, -0.16, 0.23] },
    ],
    guard: {
      body: [-0.08, 0, 0],
      chest: [0, -0.24, 0],
      leadShoulder: [-0.3, 0, 0.38],
      rearShoulder: [-0.06, 0, -0.23],
      leadElbow: [0.3, 0, 0],
    },
    crouch: {
      body: [0.19, 0, 0],
      leadHip: [-0.75, 0, 0.13],
      leadKnee: [1.26, 0, 0],
      rearHip: [-0.98, 0, -0.14],
      rearKnee: [1.67, 0, 0],
    },
    takeoff: {
      body: [0.18, 0, 0],
      leadKnee: [0.31, 0, 0],
      rearKnee: [0.64, 0, 0],
      leadHip: [-0.23, 0, 0],
      rearHip: [-0.4, 0, 0],
    },
    air: {
      body: [0.07, 0, 0],
      leadHip: [-0.56, 0, 0.1],
      leadKnee: [0.85, 0, 0],
      rearHip: [-0.29, 0, -0.08],
      rearKnee: [0.9, 0, 0],
      leadShoulder: [-0.42, 0, 0.13],
    },
    landing: {
      body: [0.12, 0, 0],
      leadHip: [-0.44, 0, 0],
      leadKnee: [0.74, 0, 0],
      rearHip: [-0.19, 0, 0],
      rearKnee: [0.41, 0, 0],
      leadShoulder: [-0.28, 0, 0.16],
    },
  },
  terebellum: {
    stride: 1.15,
    walk: {
      advance: {
        body: [0.21, 0, 0],
        chest: [0.12, 0.15, 0],
        rearShoulder: [-0.61, 0.08, -0.23],
        rearElbow: [-0.47, 0, 0],
        leadShoulder: [0.18, 0, 0.17],
        leadKnee: [0.22, 0, 0],
        rearKnee: [0.25, 0, 0],
      },
      retreat: {
        body: [0.11, 0, 0],
        chest: [0.04, 0.18, 0],
        rearShoulder: [-0.31, 0, -0.47],
        leadShoulder: [0.2, 0, 0.3],
        rearKnee: [0.29, 0, 0],
      },
      rhythm: { body: [0, 0, 0.085], chest: [0, 0.14, -0.05], rearShoulder: [-0.13, 0, 0] },
    },
    forward: [
      {
        root: [0, -0.095, -0.07],
        body: [0.22, 0.14, 0],
        leadHip: [-0.38, 0, 0.17],
        leadKnee: [0.69, 0, 0],
        rearKnee: [0.76, 0, 0],
      },
      {
        root: [0, -0.055, 0.14],
        body: [0.42, 0.13, 0],
        chest: [0.05, 0.2, 0],
        leadHip: [-0.65, 0, 0.15],
        leadKnee: [0.78, 0, 0],
        rearHip: [0.23, 0, -0.16],
        rearShoulder: [-0.73, 0.12, -0.2],
        rearElbow: [-0.42, 0, 0],
      },
      {
        root: [0, -0.09, 0.08],
        body: [0.23, 0, 0],
        leadHip: [-0.3, 0, 0.2],
        leadKnee: [0.8, 0, 0],
        rearKnee: [0.43, 0, 0],
        rearShoulder: [-0.32, 0, -0.13],
      },
    ],
    backward: [
      { body: [0.14, 0.13, 0], rearKnee: [0.7, 0, 0], rearShoulder: [-0.33, 0, -0.46] },
      {
        root: [0, -0.08, -0.12],
        body: [0.07, 0.16, 0],
        rearHip: [-0.68, 0, -0.26],
        rearKnee: [0.67, 0, 0],
        leadHip: [0.24, 0, 0.2],
        rearShoulder: [-0.73, 0, -0.42],
        leadShoulder: [0.3, 0, 0.27],
      },
      {
        root: [0, -0.06, -0.05],
        body: [0.17, 0, 0],
        rearKnee: [0.59, 0, 0],
        leadKnee: [0.23, 0, 0],
      },
    ],
    guard: {
      body: [0.19, 0, 0],
      chest: [0.08, 0.1, 0],
      rearShoulder: [-0.57, 0.1, -0.34],
      rearElbow: [-0.52, 0, 0],
      leadShoulder: [-0.35, 0, 0.29],
      leadElbow: [-0.24, 0, 0],
    },
    crouch: {
      body: [0.32, 0, 0],
      chest: [0.13, 0.14, 0],
      head: [-0.23, 0, 0],
      leadHip: [-1.02, 0, 0.25],
      leadKnee: [1.72, 0, 0],
      rearHip: [-1.1, 0, -0.31],
      rearKnee: [1.9, 0, 0],
    },
    takeoff: {
      body: [0.29, 0, 0],
      leadHip: [-0.42, 0, 0.2],
      leadKnee: [0.76, 0, 0],
      rearHip: [-0.42, 0, -0.22],
      rearKnee: [0.7, 0, 0],
    },
    air: {
      body: [0.24, 0, 0],
      chest: [0.05, 0.15, 0],
      leadHip: [-0.47, 0, 0.19],
      leadKnee: [0.82, 0, 0],
      rearHip: [-0.56, 0, -0.19],
      rearKnee: [1.01, 0, 0],
      rearShoulder: [-0.61, 0, -0.28],
    },
    landing: {
      body: [0.34, 0, 0],
      chest: [0.1, 0.12, 0],
      leadHip: [-0.58, 0, 0.2],
      leadKnee: [0.95, 0, 0],
      rearHip: [-0.54, 0, -0.2],
      rearKnee: [0.88, 0, 0],
    },
  },
  cluck: {
    stride: 0.8,
    walk: {
      advance: {
        body: [0.17, 0, -0.13],
        leadHip: [-0.24, 0, 0.12],
        leadKnee: [0.2, 0, 0],
        rearShoulder: [0.14, 0, -0.45],
        leadShoulder: [0.22, 0, 0.35],
      },
      retreat: {
        body: [-0.13, 0, 0.12],
        chest: [0, 0.18, 0],
        rearShoulder: [-0.12, 0, -0.55],
        leadShoulder: [0.2, 0, 0.42],
      },
      rhythm: {
        root: [0, 0.055, 0],
        body: [0.08, 0, 0.12],
        leadShoulder: [-0.18, 0, 0.24],
        rearShoulder: [0.21, 0, -0.26],
      },
    },
    forward: [
      {
        root: [0, -0.04, -0.04],
        body: [0.22, 0, -0.18],
        leadHip: [-0.43, 0, 0.2],
        leadKnee: [0.65, 0, 0],
        rearShoulder: [0.19, 0, -0.6],
      },
      {
        root: [0, 0.055, 0.12],
        body: [0.26, -0.19, -0.24],
        leadHip: [-0.89, 0, 0.3],
        leadKnee: [0.67, 0, 0],
        rearHip: [0.48, 0, -0.23],
        rearShoulder: [0.23, 0, -0.73],
        leadShoulder: [0.27, 0, 0.47],
      },
      {
        body: [-0.04, 0, -0.13],
        leadKnee: [0.43, 0, 0],
        rearShoulder: [0.13, 0, -0.36],
        leadWrist: [0.32, 0, 0],
      },
    ],
    backward: [
      { body: [-0.13, 0.12, 0.18], leadKnee: [0.38, 0, 0], rearShoulder: [0, 0, -0.46] },
      {
        root: [0, 0.05, -0.11],
        body: [-0.26, 0.14, 0.2],
        rearHip: [-0.72, 0, -0.24],
        rearKnee: [0.83, 0, 0],
        leadShoulder: [0.34, 0, 0.62],
        rearShoulder: [-0.28, 0, -0.81],
      },
      { body: [-0.07, 0, 0.12], rearKnee: [0.42, 0, 0], rearShoulder: [-0.15, 0, -0.41] },
    ],
    guard: {
      body: [-0.11, 0, -0.16],
      chest: [0, 0.18, 0],
      leadShoulder: [-0.2, 0.1, 0.32],
      rearShoulder: [-0.32, 0, -0.32],
      rearElbow: [-0.6, 0, 0],
    },
    crouch: {
      body: [0.25, 0, -0.17],
      leadHip: [-1.13, 0, 0.18],
      leadKnee: [1.72, 0, 0],
      rearHip: [-0.71, 0, -0.15],
      rearKnee: [1.52, 0, 0],
    },
    takeoff: {
      body: [0.18, 0, -0.13],
      leadHip: [-0.57, 0, 0.16],
      leadKnee: [0.64, 0, 0],
      rearKnee: [0.33, 0, 0],
      rearShoulder: [0.16, 0, -0.57],
    },
    air: {
      body: [0.04, -0.15, -0.25],
      leadHip: [-1.03, 0, 0.29],
      leadKnee: [1.29, 0, 0],
      rearHip: [0.43, 0, -0.2],
      rearKnee: [1.06, 0, 0],
      leadShoulder: [0.24, 0, 0.53],
      rearShoulder: [0.18, 0, -0.68],
    },
    landing: {
      body: [0.03, 0, -0.19],
      leadHip: [-0.45, 0, 0.17],
      leadKnee: [0.61, 0, 0],
      rearKnee: [0.24, 0, 0],
      rearShoulder: [0.04, 0, -0.43],
    },
  },
  ...COVERING_MOVEMENT,
  ...WAVE_TWO_OBSERVATION_MOVEMENT,
  ...WAVE_TWO_COUNTER_MOVEMENT,
  ...WAVE_THREE_PRESSURE_MOVEMENT,
  ...WAVE_THREE_RETREAT_MOVEMENT,
  ...WAVE_FOUR_RHYTHM_MOVEMENT,
  ...WAVE_FOUR_GUARD_MOVEMENT,
  ...WAVE_FIVE_REACH_MOVEMENT,
  ...WAVE_FIVE_HANDS_MOVEMENT,
  ...WAVE_SIX_WEAPON_MOVEMENT,
  ...WAVE_SIX_MARTIAL_MOVEMENT,
}
