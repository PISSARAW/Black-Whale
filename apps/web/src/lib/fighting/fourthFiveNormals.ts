import type { NormalStyle } from './secondFiveNormals'
import type { FighterId } from './types'

export const FOURTH_FIVE_NORMAL_STYLES: Partial<Record<FighterId, NormalStyle>> = {
  shizuku: {
    prepareAt: 0.2,
    recoverAt: 0.54,
    load: { pelvis: [0, 0.18, 0], rearKnee: [0.2, 0, 0], rearShoulder: [-0.16, 0, -0.12] },
    recover: { body: [0.1, 0, 0], leadKnee: [0.19, 0, 0], rearKnee: [0.13, 0, 0] },
    impact: {
      standingLight: { chest: [0.07, -0.09, 0], rearElbow: [-0.2, 0, 0], rearKnee: [0.1, 0, 0] },
      standingHeavy: { pelvis: [0, -0.18, 0], leadKnee: [0.16, 0, 0], rearHip: [0.12, 0, 0] },
      lowLight: { body: [0.09, 0, 0.09], rearHip: [-0.12, 0, 0], rearElbow: [-0.12, 0, 0] },
      lowHeavy: { pelvis: [0, -0.29, 0.09], leadKnee: [0.13, 0, 0], rearFoot: [0, 0.19, 0] },
      airLight: {
        chest: [-0.055, -0.1, 0.15],
        rearKnee: [0.25, 0, 0],
        rearShoulder: [-0.16, 0, -0.13],
      },
      airHeavy: { body: [0.16, 0, 0], rearHip: [0.23, 0, -0.17], leadKnee: [0.21, 0, 0] },
      forwardLight: { chest: [0.08, -0.08, 0], rearElbow: [-0.16, 0, 0], rearHip: [0.12, 0, 0] },
      forwardHeavy: { root: [0, -0.02, 0.03], pelvis: [0, -0.23, 0], rearKnee: [0.17, 0, 0] },
      backHeavy: { body: [-0.11, 0, 0.11], pelvis: [0, 0.16, 0], rearKnee: [0.25, 0, 0] },
    },
  },
  hinrigh: {
    prepareAt: 0.17,
    recoverAt: 0.33,
    load: { chest: [0, 0.16, 0.08], rearElbow: [-0.24, 0, 0], rearWrist: [-0.16, 0.16, 0] },
    recover: { chest: [0.05, 0.09, 0.11], rearElbow: [-0.23, 0, 0], leadPalm: [-0.13, 0.17, 0] },
    impact: {
      standingLight: {
        leadWrist: [-0.22, 0.2, 0.08],
        rearElbow: [-0.32, 0, 0],
        chest: [0.06, -0.1, 0],
      },
      standingHeavy: {
        chest: [0.12, -0.17, 0],
        rearShoulder: [-0.19, -0.12, -0.16],
        leadPalm: [-0.2, 0.16, 0],
      },
      lowLight: { body: [0.13, 0, 0.12], leadPalm: [-0.18, 0.22, 0], rearElbow: [-0.27, 0, 0] },
      lowHeavy: { pelvis: [0, -0.26, 0.11], leadShoulder: [0.2, 0, 0.18], rearKnee: [0.19, 0, 0] },
      airLight: {
        chest: [0.18, -0.17, 0.1],
        leadHip: [-0.26, 0, 0.14],
        rearShoulder: [0.23, 0, -0.23],
      },
      airHeavy: {
        chest: [0.15, -0.23, -0.12],
        leadPalm: [-0.17, 0.26, 0],
        rearWrist: [-0.17, 0.16, 0],
      },
      forwardLight: {
        leadPalm: [-0.29, 0.15, 0.07],
        rearShoulder: [0.18, 0.12, -0.13],
        rearHip: [0.15, 0, 0],
      },
      forwardHeavy: { pelvis: [0, -0.22, 0], leadElbow: [-0.21, 0, 0], rearElbow: [-0.27, 0, 0] },
      backHeavy: { body: [-0.18, 0, 0.13], leadPalm: [-0.27, 0.24, 0.08], rearKnee: [0.22, 0, 0] },
    },
    contact: {
      airHeavy: {
        leadHip: [0.06, 0, 0.16],
        leadKnee: [0.21, 0, 0],
        rearHip: [-0.27, 0, -0.14],
        rearKnee: [0.28, 0, 0],
        leadShoulder: [-0.58, 0.19, 0.31],
        leadElbow: [-0.41, 0, 0],
        rearShoulder: [-0.94, -0.1, -0.15],
        rearElbow: [-0.3, 0, 0],
      },
    },
  },
  mizaistom: {
    prepareAt: 0.24,
    recoverAt: 0.39,
    load: { chest: [-0.06, 0.12, 0], leadPalm: [-0.18, 0.22, 0.1], rearKnee: [0.2, 0, 0] },
    recover: { chest: [-0.04, 0.1, 0], leadElbow: [-0.23, 0, 0], leadPalm: [-0.15, 0.21, 0.11] },
    impact: {
      standingLight: { chest: [0.03, -0.12, 0], leadElbow: [-0.19, 0, 0], rearKnee: [0.13, 0, 0] },
      standingHeavy: {
        leadPalm: [-0.32, 0.27, 0.13],
        rearElbow: [-0.25, 0, 0],
        body: [0.09, 0, 0],
      },
      lowLight: { chest: [0.1, -0.07, 0], leadWrist: [-0.21, 0.19, 0], rearKnee: [0.12, 0, 0] },
      lowHeavy: { pelvis: [0, -0.13, 0], head: [0.06, 0, 0], rearKnee: [0.18, 0, 0] },
      airLight: { body: [-0.1, 0, 0], leadPalm: [-0.24, 0.17, 0.08], rearElbow: [-0.24, 0, 0] },
      airHeavy: { body: [-0.12, 0, 0], leadPalm: [-0.29, 0.22, 0.1], rearPalm: [-0.12, -0.16, 0] },
      forwardLight: {
        chest: [-0.06, -0.1, 0],
        leadPalm: [-0.25, 0.3, 0.13],
        rearHip: [0.11, 0, 0],
      },
      forwardHeavy: { body: [0.15, 0, 0], leadKnee: [0.17, 0, 0], rearShoulder: [-0.13, 0, -0.17] },
      backHeavy: { body: [-0.15, 0, 0], leadPalm: [-0.18, 0.24, 0.12], rearKnee: [0.22, 0, 0] },
    },
    contact: {
      airHeavy: {
        leadShoulder: [-0.58, 0.11, 0.19],
        leadElbow: [-0.52, 0, 0],
        rearShoulder: [-0.64, -0.06, -0.21],
        rearElbow: [-0.37, 0, 0],
        leadHip: [0.13, 0, 0.1],
        rearHip: [-0.17, 0, -0.08],
        rearKnee: [0.37, 0, 0],
      },
    },
  },
  leorio: {
    prepareAt: 0.25,
    recoverAt: 0.56,
    load: {
      pelvis: [0, 0.19, 0],
      chest: [-0.06, 0.13, 0],
      rearElbow: [-0.35, 0, 0],
      rearKnee: [0.23, 0, 0],
    },
    recover: { chest: [0.13, -0.14, 0], rearKnee: [0.21, 0, 0], rearElbow: [-0.24, 0, 0] },
    impact: {
      standingLight: {
        chest: [0.11, -0.15, 0],
        rearElbow: [-0.23, 0, 0],
        leadWrist: [-0.18, 0, 0],
      },
      standingHeavy: {
        pelvis: [0, -0.21, 0],
        rearHip: [0.16, 0, 0],
        rearShoulder: [-0.23, 0, -0.14],
      },
      lowLight: { body: [0.18, 0, 0], rearKnee: [0.18, 0, 0], leadWrist: [-0.14, 0, 0] },
      lowHeavy: { pelvis: [0, -0.19, 0], rearShoulder: [0.17, 0, -0.24], leadKnee: [0.14, 0, 0] },
      airLight: { chest: [0.13, -0.19, 0.09], rearElbow: [-0.29, 0, 0], rearHip: [0.12, 0, 0] },
      airHeavy: { body: [0.23, 0, 0.08], rearWrist: [-0.16, 0, 0], leadShoulder: [0.18, 0, 0.2] },
      forwardLight: { body: [0.15, 0, 0], rearHip: [0.23, 0, 0], rearElbow: [-0.3, 0, 0] },
      forwardHeavy: { chest: [0.16, -0.22, 0], leadKnee: [0.19, 0, 0], rearWrist: [-0.22, 0, 0] },
      backHeavy: { body: [-0.14, 0, 0], chest: [0.08, 0.15, 0], rearKnee: [0.27, 0, 0] },
    },
    contact: {
      airHeavy: {
        leadShoulder: [0.08, 0, 0.26],
        leadElbow: [-0.36, 0, 0],
        rearShoulder: [-0.68, -0.05, -0.12],
        rearElbow: [-0.25, 0, 0],
        leadHip: [-0.15, 0, 0.15],
        rearHip: [0.21, 0, -0.12],
        rearKnee: [0.34, 0, 0],
      },
    },
  },
  hanzo: {
    prepareAt: 0.16,
    recoverAt: 0.24,
    load: { pelvis: [0, 0.13, 0], rearKnee: [0.17, 0, 0], leadPalm: [-0.17, 0.21, 0] },
    recover: { body: [-0.08, 0, 0], leadPalm: [-0.14, 0.22, 0.07], rearElbow: [-0.29, 0, 0] },
    impact: {
      standingLight: {
        chest: [-0.02, -0.11, 0],
        leadPalm: [-0.21, 0.2, 0.08],
        rearElbow: [-0.19, 0, 0],
      },
      standingHeavy: {
        pelvis: [0, -0.16, 0],
        leadWrist: [0.16, 0.19, -0.15],
        rearShoulder: [0.13, 0, -0.11],
      },
      lowLight: { chest: [0.09, -0.13, 0], leadPalm: [-0.19, 0.19, 0.09], rearHip: [-0.1, 0, 0] },
      lowHeavy: { pelvis: [0, -0.25, 0], rearKnee: [0.22, 0, 0], rearShoulder: [0.15, 0, -0.18] },
      airLight: { body: [-0.13, 0, 0], leadPalm: [-0.26, 0.21, 0.1], rearHip: [0.18, 0, -0.1] },
      airHeavy: {
        chest: [0, -0.17, 0.08],
        leadWrist: [-0.17, 0.24, 0],
        rearWrist: [-0.15, -0.2, 0],
      },
      forwardLight: {
        chest: [0.08, -0.13, 0],
        leadPalm: [-0.24, 0.19, 0.1],
        rearHip: [0.14, 0, 0],
      },
      forwardHeavy: {
        pelvis: [0, -0.21, 0],
        leadWrist: [0.12, 0.2, -0.17],
        rearKnee: [0.13, 0, 0],
      },
      backHeavy: { body: [-0.18, 0, 0], leadPalm: [-0.23, 0.19, 0.08], rearKnee: [0.24, 0, 0] },
    },
  },
}
