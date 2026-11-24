import type { NormalStyle } from './secondFiveNormals'
import type { FighterId } from './types'

export const SEVENTH_FIVE_NORMAL_STYLES: Partial<Record<FighterId, NormalStyle>> = {
  furykov: {
    prepareAt: 0.29,
    recoverAt: 0.24,
    load: { chest: [0.04, 0.14, 0], head: [-0.04, 0.12, 0], rearElbow: [-0.27, 0, 0] },
    recover: { chest: [0.06, -0.1, 0], head: [-0.05, 0.08, 0], leadElbow: [-0.26, 0, 0] },
    impact: {
      standingLight: {
        chest: [0.08, -0.11, 0],
        leadWrist: [-0.18, 0.1, 0],
        rearElbow: [-0.24, 0, 0],
      },
      standingHeavy: { pelvis: [0, -0.22, 0], chest: [0.07, -0.18, 0], rearHip: [0.12, 0, 0] },
      lowLight: { body: [0.11, 0, 0], head: [-0.06, 0.11, 0], rearKnee: [0.17, 0, 0] },
      lowHeavy: { pelvis: [0, -0.2, 0], leadElbow: [-0.22, 0, 0], rearKnee: [0.19, 0, 0] },
      airLight: { chest: [0.05, -0.16, 0.08], rearElbow: [-0.27, 0, 0], rearHip: [0.22, 0, -0.11] },
      airHeavy: { body: [0.15, 0, 0], chest: [0.08, -0.21, 0], leadWrist: [-0.19, 0.12, 0] },
      forwardLight: { body: [0.08, 0, 0], leadPalm: [-0.23, 0.2, 0.075], rearElbow: [-0.31, 0, 0] },
      forwardHeavy: { pelvis: [0, -0.27, 0], head: [-0.07, 0.09, 0], rearWrist: [-0.21, 0, 0] },
      backHeavy: {
        body: [-0.16, 0, 0.08],
        chest: [0.06, 0.18, 0],
        leadWrist: [0.21, 0.16, -0.13],
        rearKnee: [0.23, 0, 0],
      },
    },
    contact: {
      airHeavy: {
        leadShoulder: [-0.85, 0.16, 0.19],
        leadElbow: [-0.23, 0, 0],
        rearElbow: [-0.36, 0, 0],
        leadHip: [-0.17, 0, 0.12],
        rearHip: [0.22, 0, -0.12],
        rearKnee: [0.34, 0, 0],
      },
      backHeavy: { leadShoulder: [-0.67, -0.2, 0.21], leadElbow: [-0.41, 0, 0] },
    },
  },
  cluck: {
    prepareAt: 0.15,
    recoverAt: 0.36,
    load: { chest: [-0.05, 0.18, 0.08], rearShoulder: [0.2, 0.09, -0.29], leadKnee: [0.16, 0, 0] },
    recover: {
      chest: [-0.04, -0.11, 0.1],
      rearShoulder: [0.12, 0.08, -0.25],
      rearKnee: [0.15, 0, 0],
    },
    impact: {
      standingLight: {
        chest: [0.05, -0.14, 0.12],
        leadWrist: [-0.15, 0.16, 0.12],
        rearShoulder: [0.18, 0, -0.19],
      },
      standingHeavy: {
        pelvis: [0, -0.28, 0.12],
        rearShoulder: [0.2, 0, -0.24],
        leadFoot: [-0.17, 0.15, 0],
      },
      lowLight: { body: [0.09, 0, 0.13], leadWrist: [-0.21, 0.19, 0.08], rearHip: [-0.15, 0, 0] },
      lowHeavy: { pelvis: [0, -0.27, 0.11], rearShoulder: [0.24, 0, -0.29], rearKnee: [0.2, 0, 0] },
      airLight: {
        chest: [-0.08, -0.17, 0.15],
        rearHip: [0.23, 0, -0.16],
        leadFoot: [-0.17, 0.13, 0],
      },
      airHeavy: {
        body: [-0.08, 0, 0.24],
        chest: [0, -0.29, 0.07],
        leadShoulder: [0.16, 0.08, 0.28],
      },
      forwardLight: {
        chest: [0.09, -0.16, 0.13],
        rearShoulder: [0.23, 0, -0.22],
        rearHip: [0.15, 0, 0],
      },
      forwardHeavy: {
        pelvis: [0, -0.3, 0.14],
        leadShoulder: [0.2, 0, 0.26],
        rearKnee: [0.21, 0, 0],
      },
      backHeavy: { body: [-0.17, 0, 0.14], chest: [-0.08, 0.16, 0], rearKnee: [0.24, 0, 0] },
    },
    contact: {
      airHeavy: {
        leadShoulder: [0.21, 0.1, 0.45],
        rearShoulder: [0.17, -0.1, -0.45],
        leadHip: [-0.38, 0.23, 0.25],
        leadKnee: [-0.68, 0, 0],
        rearHip: [0.25, 0, -0.17],
        rearKnee: [0.33, 0, 0],
      },
    },
  },
  beyond: {
    prepareAt: 0.27,
    recoverAt: 0.57,
    load: { root: [0, -0.036, 0], chest: [0.07, 0.17, 0], rearKnee: [0.25, 0, 0] },
    recover: { body: [0.12, 0, 0], chest: [0.07, -0.08, 0], rearKnee: [0.21, 0, 0] },
    impact: {
      standingLight: { chest: [0.11, -0.16, 0], rearElbow: [-0.26, 0, 0], rearHip: [0.16, 0, 0] },
      standingHeavy: {
        pelvis: [0, -0.25, 0],
        rearShoulder: [-0.21, 0, -0.17],
        leadKnee: [0.2, 0, 0],
      },
      lowLight: { body: [0.15, 0, 0], chest: [0.13, -0.1, 0], rearKnee: [0.18, 0, 0] },
      lowHeavy: { pelvis: [0, -0.28, 0], rearKnee: [0.26, 0, 0], leadElbow: [-0.19, 0, 0] },
      airLight: { chest: [0.12, -0.15, 0], leadElbow: [-0.17, 0, 0], rearHip: [0.25, 0, -0.13] },
      airHeavy: { body: [0.2, 0, 0.07], chest: [0.12, -0.14, 0], rearWrist: [-0.19, 0.05, 0] },
      forwardLight: { body: [0.16, 0, 0], rearHip: [0.2, 0, 0], rearElbow: [-0.25, 0, 0] },
      forwardHeavy: { root: [0, -0.022, 0.045], chest: [0.16, -0.2, 0], leadKnee: [0.21, 0, 0] },
      backHeavy: { body: [-0.11, 0, 0], chest: [0.1, 0.13, 0], rearKnee: [0.25, 0, 0] },
    },
    contact: {
      airHeavy: {
        leadShoulder: [-0.51, 0.14, 0.24],
        leadElbow: [-0.29, 0, 0],
        rearShoulder: [-1.05, -0.17, -0.2],
        rearElbow: [-0.29, 0, 0],
        leadHip: [0.18, 0, 0.12],
        rearHip: [-0.22, 0, -0.11],
        rearKnee: [0.32, 0, 0],
      },
    },
  },
  longhi: {
    prepareAt: 0.18,
    recoverAt: 0.44,
    load: { chest: [-0.05, 0.14, 0.08], leadWrist: [0.15, 0.21, 0.11], rearElbow: [-0.27, 0, 0] },
    recover: {
      chest: [-0.075, 0.1, 0.09],
      leadPalm: [-0.21, 0.22, 0.12],
      rearElbow: [-0.29, 0, 0],
    },
    impact: {
      standingLight: {
        chest: [-0.03, -0.14, 0.08],
        leadPalm: [-0.24, 0.22, 0.11],
        rearElbow: [-0.21, 0, 0],
      },
      standingHeavy: {
        pelvis: [0, -0.21, 0.08],
        leadWrist: [0.22, -0.21, -0.16],
        rearShoulder: [0.17, 0, -0.19],
      },
      lowLight: { body: [0.1, 0, 0.11], leadWrist: [-0.18, 0.16, 0.11], rearHip: [-0.11, 0, 0] },
      lowHeavy: { pelvis: [0, -0.23, 0.12], leadPalm: [-0.19, 0.18, 0.09], rearKnee: [0.2, 0, 0] },
      airLight: {
        chest: [-0.08, -0.19, 0.15],
        leadWrist: [-0.2, 0.21, 0.09],
        rearHip: [0.2, 0, -0.16],
      },
      airHeavy: {
        body: [-0.11, 0, 0.18],
        leadPalm: [-0.23, 0.22, 0.105],
        rearPalm: [-0.14, -0.19, -0.13],
      },
      forwardLight: {
        chest: [0.09, -0.14, 0.085],
        leadPalm: [-0.26, 0.21, 0.09],
        rearElbow: [-0.25, 0, 0],
      },
      forwardHeavy: {
        pelvis: [0, -0.25, 0.11],
        leadWrist: [0.19, -0.2, -0.24],
        rearHip: [0.14, 0, 0],
      },
      backHeavy: {
        body: [-0.17, 0, 0.09],
        chest: [-0.06, 0.17, 0],
        leadWrist: [0.22, 0.17, -0.24],
        rearKnee: [0.23, 0, 0],
      },
    },
    contact: {
      airHeavy: {
        leadShoulder: [-0.6, 0.15, 0.24],
        leadElbow: [-0.26, 0, 0],
        rearShoulder: [-0.33, -0.15, -0.26],
        rearElbow: [-0.43, 0, 0],
        leadHip: [0.12, 0, 0.16],
        rearHip: [-0.21, 0, -0.12],
        rearKnee: [0.33, 0, 0],
      },
      backHeavy: { leadShoulder: [-0.63, -0.21, 0.16], leadElbow: [-0.42, 0, 0] },
    },
  },
  musse: {
    prepareAt: 0.3,
    recoverAt: 0.28,
    load: { chest: [0.05, 0.16, 0], head: [0.05, -0.14, 0.065], rearElbow: [-0.33, 0, 0] },
    recover: { chest: [0.05, -0.11, 0], head: [0.037, -0.11, 0.07], rearElbow: [-0.32, 0, 0] },
    impact: {
      standingLight: {
        chest: [0.055, -0.11, 0],
        leadPalm: [-0.23, 0.19, 0.09],
        rearElbow: [-0.28, 0, 0],
      },
      standingHeavy: {
        pelvis: [0, -0.2, 0],
        leadWrist: [0.22, -0.18, -0.27],
        rearKnee: [0.19, 0, 0],
      },
      lowLight: { body: [0.12, 0, 0.08], head: [0.05, -0.13, 0.055], rearElbow: [-0.24, 0, 0] },
      lowHeavy: { pelvis: [0, -0.22, 0], head: [0.05, 0.09, 0.07], rearKnee: [0.24, 0, 0] },
      airLight: { chest: [0.08, -0.13, 0.09], head: [0.07, -0.12, 0.06], rearHip: [0.19, 0, -0.1] },
      airHeavy: { body: [0.12, 0, 0.13], chest: [0.13, -0.14, 0], leadPalm: [-0.2, 0.15, 0.09] },
      forwardLight: {
        leadPalm: [-0.25, 0.21, 0.11],
        chest: [0.08, -0.17, 0.08],
        rearElbow: [-0.25, 0, 0],
      },
      forwardHeavy: {
        pelvis: [0, -0.25, 0.095],
        rearShoulder: [-0.21, 0.09, -0.18],
        rearHip: [0.16, 0, 0],
      },
      backHeavy: { body: [-0.16, 0, 0.08], head: [0.05, -0.16, 0.07], rearKnee: [0.21, 0, 0] },
    },
    contact: {
      standingHeavy: { leadShoulder: [-0.68, -0.21, 0.16], leadElbow: [-0.39, 0, 0] },
      airHeavy: {
        leadShoulder: [-0.9, 0.13, 0.19],
        leadElbow: [-0.18, 0, 0],
        rearElbow: [-0.39, 0, 0],
        leadHip: [-0.09, 0, 0.11],
        rearHip: [0.18, 0, -0.1],
        rearKnee: [0.31, 0, 0],
      },
    },
  },
}
