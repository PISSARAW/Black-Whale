import type { FightPose } from './fightPose'
import type { Foot, StandingStrike } from './standingStrikeDirections'

function groundedStrike(
  [support, chamberAt]: [Foot, number],
  [load, contact, release]: [FightPose, FightPose, FightPose],
): StandingStrike {
  return { support, chamberAt, load, contact, release }
}

export const WAVE_SEVEN_STANDING_STRIKES = {
  kurapika: {
    standingLight: groundedStrike(
      ['rear', 0.41],
      [
        {
          chest: [0.035, 0.33, 0],
          leadElbow: [-0.66, 0, 0],
          leadWrist: [0.31, 0.33, 0.27],
          rearElbow: [-0.84, 0, 0],
          rearKnee: [0.48, 0, 0],
        },
        {
          root: [0.035, -0.075, 0.04],
          pelvis: [0, -0.32, 0],
          chest: [0.16, -0.38, 0.03],
          leadShoulder: [-1.23, -0.32, 0.25],
          leadElbow: [0.86, 0, 0],
          leadWrist: [0.36, -0.38, -0.27],
          rearShoulder: [-0.45, 0.14, -0.28],
          rearElbow: [-0.78, 0, 0],
          leadKnee: [0.48, 0, 0],
        },
        {
          root: [0, -0.045, -0.045],
          chest: [0.08, 0.27, 0],
          leadShoulder: [-0.51, 0.26, 0.31],
          leadElbow: [-0.88, 0, 0],
          leadWrist: [-0.35, 0.29, 0.24],
        },
      ],
    ),
  },
  hisoka: {
    standingLight: groundedStrike(
      ['rear', 0.29],
      [
        {
          root: [-0.04, -0.025, -0.08],
          chest: [-0.11, 0.56, 0.17],
          leadShoulder: [-0.41, 0.53, 0.53],
          leadElbow: [-0.9, 0, 0],
          leadWrist: [-0.55, 0.32, 0.45],
          rearShoulder: [0.14, 0.21, -0.6],
        },
        {
          root: [0.045, -0.075, 0.05],
          pelvis: [0, -0.41, 0],
          chest: [0.03, -0.66, -0.1],
          leadShoulder: [-1.32, -0.45, 0.47],
          leadElbow: [1.01, 0, 0],
          leadWrist: [0.66, -0.28, -0.32],
          rearShoulder: [0.45, 0.44, -0.63],
          rearKnee: [0.6, 0, 0],
        },
        {
          root: [0, -0.045, -0.08],
          chest: [-0.02, 0.38, 0.15],
          leadShoulder: [-0.35, 0.52, 0.56],
          leadElbow: [-0.94, 0, 0],
          leadWrist: [-0.51, 0.31, 0.3],
        },
      ],
    ),
    standingHeavy: groundedStrike(
      ['rear', 0.67],
      [
        {
          root: [-0.02, -0.12, -0.11],
          pelvis: [0, -0.62, 0],
          chest: [0.22, -0.53, -0.12],
          leadHip: [-0.88, 0.31, 0.54],
          leadKnee: [1.41, 0, 0],
          rearKnee: [0.71, 0, 0],
          rearShoulder: [-0.72, -0.38, -0.57],
          leadElbow: [-0.82, 0, 0],
        },
        {
          root: [0.035, -0.1, 0.045],
          pelvis: [0, 0.64, 0],
          chest: [-0.19, 0.55, 0.07],
          leadHip: [-1.46, 0.26, 0.52],
          leadKnee: [-0.76, 0, 0],
          leadFoot: [-0.38, 0, 0],
          rearHip: [-0.18, -0.14, -0.21],
          rearKnee: [0.72, 0, 0],
          rearShoulder: [-0.24, 0.38, -0.71],
          leadShoulder: [0.38, 0.29, 0.56],
        },
        {
          root: [-0.01, -0.11, -0.06],
          chest: [0.19, 0.24, -0.08],
          leadHip: [-0.72, 0.29, 0.42],
          leadKnee: [0.96, 0, 0],
          rearKnee: [0.68, 0, 0],
        },
      ],
    ),
  },
  benjamin: {
    standingLight: groundedStrike(
      ['lead', 0.47],
      [
        {
          root: [0, -0.05, -0.055],
          chest: [0.1, -0.27, 0],
          rearShoulder: [-0.37, -0.22, -0.28],
          rearElbow: [-0.78, 0, 0],
          leadKnee: [0.42, 0, 0],
        },
        {
          root: [0.03, -0.08, 0.065],
          pelvis: [0, 0.25, 0],
          chest: [0.18, 0.47, 0.04],
          rearShoulder: [-1.49, 0.37, -0.21],
          rearElbow: [0.85, 0, 0],
          rearWrist: [0.52, 0.14, -0.19],
          rearPalm: [0.52, 0, 0],
          leadElbow: [-1.08, 0, 0],
          leadKnee: [0.55, 0, 0],
        },
        {
          root: [0, -0.055, 0.02],
          chest: [0.09, 0.22, 0],
          rearShoulder: [-0.72, 0.19, -0.21],
          rearElbow: [-0.67, 0, 0],
        },
      ],
    ),
    standingHeavy: groundedStrike(
      ['lead', 0.75],
      [
        {
          root: [-0.04, -0.12, -0.065],
          pelvis: [0, -0.44, 0],
          chest: [0.19, -0.53, -0.07],
          leadShoulder: [-0.34, -0.19, 0.24],
          leadElbow: [-1.34, 0, 0],
          leadKnee: [0.85, 0, 0],
          rearKnee: [0.74, 0, 0],
        },
        {
          root: [0.045, -0.12, 0.055],
          pelvis: [0, 0.39, 0],
          chest: [0.22, 0.62, 0.05],
          leadShoulder: [-0.88, -0.38, 0.43],
          leadClavicle: [0, -0.22, 0.11],
          leadElbow: [-1.56, 0, 0],
          rearShoulder: [0.41, -0.12, -0.45],
          leadHip: [-0.37, 0, 0.17],
          leadKnee: [0.71, 0, 0],
          rearKnee: [0.47, 0, 0],
        },
        {
          root: [0, -0.09, 0.03],
          chest: [0.13, 0.31, 0.04],
          leadShoulder: [-0.49, -0.19, 0.27],
          leadElbow: [-1.19, 0, 0],
          leadKnee: [0.58, 0, 0],
        },
      ],
    ),
  },
  biscuit: {
    standingLight: groundedStrike(
      ['lead', 0.32],
      [
        {
          root: [0, -0.065, -0.06],
          chest: [0.11, 0.26, -0.08],
          leadShoulder: [-0.39, 0.31, 0.43],
          leadElbow: [-0.67, 0, 0],
          rearElbow: [-0.86, 0, 0],
          leadKnee: [0.59, 0, 0],
        },
        {
          root: [0.02, -0.09, 0.055],
          chest: [0.18, -0.45, 0.03],
          leadShoulder: [-1.28, -0.21, 0.57],
          leadElbow: [0.61, 0, 0],
          leadWrist: [0.63, 0.04, -0.23],
          leadPalm: [0.57, 0.19, 0],
          rearShoulder: [-0.31, -0.21, -0.44],
          rearElbow: [-1.03, 0, 0],
          leadKnee: [0.65, 0, 0],
        },
        {
          root: [0, -0.04, 0.015],
          chest: [0.11, 0.16, 0],
          leadShoulder: [-0.59, 0.23, 0.33],
          leadElbow: [-0.72, 0, 0],
          leadKnee: [0.43, 0, 0],
        },
      ],
    ),
    standingHeavy: groundedStrike(
      ['rear', 0.58],
      [
        {
          root: [-0.025, -0.13, -0.08],
          pelvis: [0, -0.5, 0],
          chest: [0.24, -0.52, 0.05],
          rearShoulder: [0.31, -0.13, -0.48],
          rearElbow: [-0.65, 0, 0],
          leadElbow: [-1.25, 0, 0],
          rearKnee: [1.11, 0, 0],
        },
        {
          root: [0.035, -0.08, 0.03],
          pelvis: [0, 0.51, 0],
          chest: [-0.12, 0.49, 0.06],
          rearShoulder: [-1.9, 0.48, -0.38],
          rearElbow: [0.25, 0, 0],
          rearWrist: [0.44, 0.27, 0.41],
          rearPalm: [0.48, 0.04, 0.09],
          leadElbow: [-0.94, 0, 0],
          rearKnee: [0.59, 0, 0],
        },
        {
          root: [0, -0.07, 0.015],
          chest: [0.11, 0.34, 0.05],
          rearShoulder: [-0.81, 0.17, -0.31],
          rearElbow: [-0.71, 0, 0],
          rearKnee: [0.57, 0, 0],
        },
      ],
    ),
  },
  franklin: {
    standingLight: groundedStrike(
      ['rear', 0.53],
      [
        {
          root: [0, -0.065, -0.07],
          chest: [0.06, 0.37, 0.03],
          leadShoulder: [-0.25, 0.45, 0.45],
          leadElbow: [-0.8, 0, 0],
          rearShoulder: [-0.29, 0.28, -0.43],
          rearKnee: [0.54, 0, 0],
        },
        {
          root: [0.025, -0.085, 0.045],
          pelvis: [0, -0.24, 0],
          chest: [0.16, -0.47, -0.04],
          leadShoulder: [-1.22, -0.46, 0.69],
          leadElbow: [0.94, 0, 0],
          leadWrist: [0.57, -0.14, -0.38],
          rearShoulder: [0.16, 0.37, -0.54],
          rearKnee: [0.63, 0, 0],
        },
        {
          root: [0, -0.06, 0],
          chest: [0.11, 0.21, 0.04],
          leadShoulder: [-0.62, 0.13, 0.49],
          leadElbow: [-0.65, 0, 0],
          rearKnee: [0.52, 0, 0],
        },
      ],
    ),
    standingHeavy: groundedStrike(
      ['lead', 0.81],
      [
        {
          root: [0, -0.13, -0.075],
          chest: [-0.07, 0.07, 0],
          leadShoulder: [-2.02, 0.44, 0.52],
          rearShoulder: [-1.94, -0.36, -0.53],
          leadElbow: [-0.81, 0, 0],
          rearElbow: [-0.8, 0, 0],
          leadKnee: [0.81, 0, 0],
          rearKnee: [0.78, 0, 0],
        },
        {
          root: [0.03, -0.16, 0.055],
          chest: [0.27, -0.1, 0.02],
          leadShoulder: [-0.74, -0.26, 0.55],
          rearShoulder: [-0.68, 0.25, -0.55],
          leadElbow: [0.73, 0, 0],
          rearElbow: [0.68, 0, 0],
          leadHip: [-0.35, 0, 0.19],
          leadKnee: [0.79, 0, 0],
          rearKnee: [0.8, 0, 0],
        },
        {
          root: [0, -0.115, 0.02],
          chest: [0.2, -0.05, 0.01],
          leadShoulder: [-0.38, 0.13, 0.47],
          rearShoulder: [-0.39, -0.13, -0.51],
          leadElbow: [-0.43, 0, 0],
          rearElbow: [-0.49, 0, 0],
        },
      ],
    ),
  },
}

export const BISCUIT_NATURAL_STANDING_STRIKES = {
  standingLight: groundedStrike(
    ['lead', 0.53],
    [
      {
        root: [0, -0.11, -0.08],
        pelvis: [0, -0.47, 0],
        chest: [0.19, -0.43, 0.02],
        rearShoulder: [0.41, -0.31, -0.42],
        rearElbow: [-0.83, 0, 0],
        rearKnee: [0.87, 0, 0],
      },
      {
        root: [0.035, -0.09, 0.065],
        pelvis: [0, 0.38, 0],
        chest: [0.18, 0.57, 0.03],
        rearShoulder: [-1.4, 0.48, -0.24],
        rearElbow: [1.02, 0, 0],
        rearWrist: [-0.42, 0.17, 0.24],
        leadElbow: [-1.06, 0, 0],
        leadKnee: [0.61, 0, 0],
      },
      {
        root: [0, -0.08, 0.025],
        chest: [0.14, 0.29, 0.01],
        rearShoulder: [-0.69, 0.26, -0.3],
        rearElbow: [-0.72, 0, 0],
      },
    ],
  ),
  standingHeavy: groundedStrike(
    ['lead', 0.79],
    [
      {
        root: [0, -0.155, -0.09],
        pelvis: [0, 0.63, 0],
        chest: [0.27, 0.48, 0.07],
        leadShoulder: [-0.32, 0.57, 0.61],
        leadElbow: [-1.35, 0, 0],
        rearElbow: [-1.02, 0, 0],
        leadKnee: [1.14, 0, 0],
      },
      {
        root: [0.035, -0.14, 0.07],
        pelvis: [0, -0.64, 0],
        chest: [0.22, -0.72, 0.02],
        leadShoulder: [-1.11, -0.73, 0.55],
        leadElbow: [0.28, 0, 0],
        leadWrist: [-0.42, -0.19, 0.26],
        rearElbow: [-1.1, 0, 0],
        leadKnee: [0.74, 0, 0],
        rearKnee: [0.62, 0, 0],
      },
      {
        root: [0, -0.1, 0.025],
        chest: [0.16, -0.37, 0.02],
        leadShoulder: [-0.74, -0.34, 0.43],
        leadElbow: [-0.71, 0, 0],
      },
    ],
  ),
}
