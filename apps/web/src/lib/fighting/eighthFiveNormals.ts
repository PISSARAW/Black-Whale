import type { NormalStyle } from './secondFiveNormals'
import type { FighterId } from './types'

export const EIGHTH_FIVE_NORMAL_STYLES: Partial<Record<FighterId, NormalStyle>> = {
  padaille: {
    prepareAt: 0.24,
    recoverAt: 0.53,
    load: { chest: [0.09, 0.26, 0.1], leadElbow: [-0.31, 0, 0], rearShoulder: [-0.13, 0, -0.13] },
    recover: { body: [0.11, 0, 0], chest: [0.08, 0.17, 0], leadElbow: [-0.39, 0, 0] },
    impact: {
      standingLight: {
        chest: [0.06, -0.16, 0],
        rearWrist: [0.17, 0.09, 0],
        leadElbow: [-0.39, 0, 0],
      },
      standingHeavy: { body: [0.11, 0, 0], chest: [0.17, -0.38, 0.12], rearElbow: [-0.28, 0, 0] },
      lowLight: {
        chest: [0.16, 0.12, 0.08],
        leadElbow: [-0.38, 0, 0],
        rearWrist: [0.16, 0.1, 0.09],
      },
      lowHeavy: { pelvis: [0, -0.32, 0.12], chest: [0.18, 0.12, 0], leadElbow: [-0.41, 0, 0] },
      airLight: { chest: [0.14, 0.17, 0.08], leadElbow: [-0.45, 0, 0], rearHip: [-0.15, 0, -0.16] },
      airHeavy: { body: [0.18, 0, 0], chest: [0.21, -0.29, 0.13], rearElbow: [-0.4, 0, 0] },
      forwardLight: {
        chest: [0.08, -0.2, 0.11],
        rearElbow: [-0.46, 0, 0],
        leadWrist: [0.16, -0.11, 0],
      },
      forwardHeavy: {
        pelvis: [0, -0.24, 0.08],
        chest: [0.16, -0.31, 0],
        rearShoulder: [0.21, 0, -0.12],
      },
      backHeavy: {
        body: [-0.17, 0, 0.13],
        chest: [0.12, 0.29, 0],
        rearShoulder: [-0.38, 0.1, -0.14],
      },
    },
    contact: {
      standingLight: { rearShoulder: [-0.75, -0.15, -0.16], rearElbow: [-0.21, 0, 0] },
      standingHeavy: { leadShoulder: [-0.68, -0.18, 0.24], leadElbow: [-0.74, 0, 0] },
      lowLight: { rearShoulder: [-0.51, -0.19, -0.19], rearElbow: [-0.3, 0, 0] },
      airLight: {
        leadShoulder: [0.07, 0.14, 0.24],
        rearShoulder: [-0.89, 0.14, -0.17],
        rearElbow: [-0.26, 0, 0],
      },
      airHeavy: {
        leadShoulder: [-0.91, 0.18, 0.3],
        leadElbow: [-0.37, 0, 0],
        leadHip: [-0.21, 0, 0.2],
        rearHip: [0.22, 0, -0.16],
        rearKnee: [0.27, 0, 0],
      },
      forwardLight: { leadShoulder: [-0.79, 0.08, 0.22], leadElbow: [-0.22, 0, 0] },
    },
  },
  sayird: {
    prepareAt: 0.14,
    recoverAt: 0.27,
    load: { head: [0.075, -0.22, 0.15], chest: [0.07, 0.13, 0], rearElbow: [-0.38, 0, 0] },
    recover: { head: [-0.055, 0.19, 0.09], leadWrist: [-0.23, 0.17, 0], rearElbow: [-0.33, 0, 0] },
    impact: {
      standingLight: {
        head: [0.05, 0.16, -0.09],
        chest: [0.085, -0.13, 0],
        rearElbow: [-0.33, 0, 0],
      },
      standingHeavy: {
        head: [-0.06, -0.19, 0.09],
        pelvis: [0, -0.23, 0],
        rearWrist: [0.14, -0.18, 0],
      },
      lowLight: { head: [0.11, -0.17, 0.07], leadPalm: [-0.22, 0.2, 0], rearHip: [0.14, 0, 0] },
      lowHeavy: { pelvis: [0, -0.19, 0.11], head: [0.08, 0.19, 0.11], rearKnee: [0.22, 0, 0] },
      airLight: { chest: [0.07, -0.16, 0.08], head: [0.1, -0.2, 0.12], rearHip: [0.22, 0, -0.12] },
      airHeavy: { body: [0.13, 0, 0.16], head: [0.12, 0.23, -0.08], rearElbow: [-0.31, 0, 0] },
      forwardLight: {
        chest: [0.09, -0.2, 0.1],
        head: [0.065, 0.2, -0.06],
        rearElbow: [-0.37, 0, 0],
      },
      forwardHeavy: {
        pelvis: [0, -0.21, 0.08],
        head: [-0.07, 0.24, 0.09],
        rearShoulder: [0.16, 0, -0.14],
      },
      backHeavy: {
        body: [-0.13, 0, 0.12],
        chest: [0.06, 0.26, 0],
        head: [0.09, -0.24, 0.12],
        rearElbow: [-0.39, 0, 0],
      },
    },
    contact: {
      backHeavy: {
        leadShoulder: [-0.73, -0.17, 0.22],
        leadElbow: [-0.4, 0, 0],
        leadWrist: [-0.12, 0.16, -0.19],
      },
      airHeavy: {
        leadShoulder: [-0.35, 0.14, 0.25],
        rearShoulder: [0.16, -0.15, -0.26],
        leadHip: [-0.43, 0.12, 0.19],
        leadKnee: [-0.56, 0, 0],
        rearHip: [0.27, 0, -0.17],
        rearKnee: [0.32, 0, 0],
      },
    },
  },
  terebellum: {
    prepareAt: 0.28,
    recoverAt: 0.57,
    load: { root: [0, -0.025, 0], chest: [0.14, 0.27, 0], rearElbow: [-0.46, 0, 0] },
    recover: { chest: [0.17, -0.16, 0], leadPalm: [-0.36, 0.23, 0.13], rearElbow: [-0.51, 0, 0] },
    impact: {
      standingLight: {
        chest: [0.09, -0.15, 0],
        leadPalm: [-0.36, 0.19, 0.12],
        rearElbow: [-0.44, 0, 0],
      },
      standingHeavy: { body: [0.14, 0, 0], chest: [0.16, -0.33, 0.1], leadElbow: [-0.45, 0, 0] },
      lowLight: { body: [0.15, 0, 0], leadPalm: [-0.35, 0.26, 0.12], rearElbow: [-0.51, 0, 0] },
      lowHeavy: { pelvis: [0, -0.32, 0.1], chest: [0.21, -0.18, 0], rearKnee: [0.22, 0, 0] },
      airLight: {
        chest: [0.17, -0.17, 0],
        leadPalm: [-0.31, 0.19, 0.11],
        rearElbow: [-0.45, 0, 0],
      },
      airHeavy: { body: [0.21, 0, 0.11], chest: [0.16, -0.29, 0], rearPalm: [-0.26, -0.12, -0.09] },
      forwardLight: { body: [0.16, 0, 0], chest: [0.13, -0.23, 0], rearElbow: [-0.56, 0, 0] },
      forwardHeavy: { root: [0, -0.034, 0.045], chest: [0.21, -0.32, 0], leadKnee: [0.23, 0, 0] },
      backHeavy: {
        body: [-0.14, 0, 0],
        chest: [0.09, 0.26, 0.075],
        rearPalm: [-0.33, -0.26, -0.15],
      },
    },
    contact: {
      airHeavy: {
        leadShoulder: [-0.94, 0.16, 0.22],
        leadElbow: [-0.22, 0, 0],
        rearShoulder: [-0.39, -0.22, -0.17],
        rearElbow: [-0.69, 0, 0],
        leadHip: [-0.17, 0, 0.19],
        rearKnee: [0.39, 0, 0],
      },
      forwardLight: {
        leadShoulder: [-0.85, -0.14, 0.19],
        leadElbow: [-0.14, 0, 0],
        leadPalm: [-0.49, 0.16, 0.1],
      },
    },
  },
  voconte: {
    prepareAt: 0.19,
    recoverAt: 0.39,
    load: { body: [-0.1, 0.16, 0.1], chest: [-0.07, 0.21, 0], leadWrist: [0.2, 0.16, 0.08] },
    recover: { body: [-0.08, 0.16, 0.15], chest: [-0.064, -0.16, 0.09], leadElbow: [-0.36, 0, 0] },
    impact: {
      standingLight: {
        chest: [-0.04, -0.24, 0.13],
        leadWrist: [-0.21, 0.18, 0.11],
        rearElbow: [-0.29, 0, 0],
      },
      standingHeavy: {
        body: [0, 0.17, 0.21],
        chest: [0.07, -0.34, 0.12],
        rearShoulder: [0.12, 0, -0.21],
      },
      lowLight: {
        chest: [0.09, -0.2, 0.16],
        leadWrist: [-0.17, 0.25, 0.13],
        rearKnee: [0.14, 0, 0],
      },
      lowHeavy: { pelvis: [0, 0.27, 0.12], chest: [0.14, -0.2, 0.12], rearKnee: [0.21, 0, 0] },
      airLight: {
        body: [-0.08, 0.19, 0.14],
        chest: [-0.09, -0.19, 0.09],
        rearHip: [0.23, 0, -0.18],
      },
      airHeavy: {
        body: [-0.14, 0.23, 0.21],
        chest: [0.08, -0.29, 0.15],
        leadWrist: [-0.24, 0.2, 0],
      },
      forwardLight: {
        chest: [0.075, -0.25, 0.15],
        rearWrist: [-0.22, -0.18, -0.1],
        leadElbow: [-0.36, 0, 0],
      },
      forwardHeavy: {
        pelvis: [0, -0.29, 0.16],
        chest: [0.06, 0.32, 0.13],
        rearShoulder: [0.17, 0, -0.25],
      },
      backHeavy: {
        body: [-0.21, 0.18, 0.15],
        chest: [-0.08, 0.3, 0],
        leadWrist: [0.18, 0.23, -0.09],
      },
    },
    contact: {
      airHeavy: {
        leadShoulder: [-0.39, 0.23, 0.45],
        rearShoulder: [0.09, -0.19, -0.32],
        leadHip: [-0.56, 0.29, 0.25],
        leadKnee: [-0.43, 0, 0],
        rearHip: [0.24, 0, -0.17],
        rearKnee: [0.35, 0, 0],
      },
    },
  },
  yokotani: {
    prepareAt: 0.32,
    recoverAt: 0.46,
    load: { chest: [-0.15, 0.19, 0.08], leadPalm: [-0.29, 0.21, 0.16], rearElbow: [-0.34, 0, 0] },
    recover: {
      chest: [-0.12, -0.16, 0.09],
      leadPalm: [-0.38, 0.21, 0.12],
      rearElbow: [-0.43, 0, 0],
    },
    impact: {
      standingLight: {
        head: [-0.07, 0.14, 0.08],
        leadPalm: [-0.43, 0.19, 0.12],
        rearElbow: [-0.36, 0, 0],
      },
      standingHeavy: {
        chest: [-0.11, -0.27, 0.1],
        leadWrist: [0.17, 0.22, 0.12],
        rearPalm: [-0.32, -0.15, -0.1],
      },
      lowLight: { body: [0.08, 0, 0.09], leadPalm: [-0.31, -0.17, 0.14], rearElbow: [-0.31, 0, 0] },
      lowHeavy: {
        pelvis: [0, -0.22, 0.14],
        chest: [-0.15, -0.21, 0],
        leadPalm: [-0.33, 0.2, 0.11],
      },
      airLight: {
        chest: [-0.13, 0.16, 0.1],
        leadPalm: [-0.39, 0.2, 0.14],
        rearHip: [0.21, 0, -0.15],
      },
      airHeavy: { body: [-0.17, 0, 0.12], chest: [-0.12, 0.18, 0], rearElbow: [-0.42, 0, 0] },
      forwardLight: {
        chest: [-0.08, -0.22, 0.09],
        rearElbow: [-0.42, 0, 0],
        leadPalm: [-0.38, 0.19, 0.12],
      },
      forwardHeavy: {
        pelvis: [0, -0.26, 0.1],
        chest: [-0.12, -0.2, 0.11],
        rearElbow: [-0.41, 0, 0],
      },
      backHeavy: {
        body: [-0.2, 0, 0.12],
        chest: [-0.16, 0.28, 0.11],
        leadPalm: [-0.36, 0.24, 0.13],
      },
    },
    contact: {
      standingLight: { leadShoulder: [-0.67, 0.01, 0.2], leadElbow: [-0.28, 0, 0] },
      airHeavy: {
        leadShoulder: [-0.45, 0.15, 0.26],
        leadPalm: [-0.4, 0.27, 0.14],
        leadHip: [-0.44, 0, 0.14],
        leadKnee: [-0.52, 0, 0],
        rearHip: [0.22, 0, -0.16],
      },
      forwardHeavy: {
        leadShoulder: [-0.87, 0.14, 0.18],
        leadElbow: [-0.15, 0, 0],
        leadPalm: [-0.47, 0.2, 0.13],
      },
    },
  },
}
