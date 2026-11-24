import type { NormalStyle } from './secondFiveNormals'
import type { FighterId } from './types'

export const THIRD_FIVE_NORMAL_STYLES: Partial<Record<FighterId, NormalStyle>> = {
  franklin: {
    prepareAt: 0.29,
    recoverAt: 0.56,
    load: {
      root: [0, -0.033, 0],
      chest: [-0.06, 0.15, 0],
      rearKnee: [0.19, 0, 0],
      rearElbow: [-0.31, 0, 0],
    },
    recover: {
      body: [0.13, 0, 0],
      leadKnee: [0.12, 0, 0],
      rearKnee: [0.14, 0, 0],
      leadElbow: [-0.24, 0, 0],
    },
    impact: {
      standingLight: {
        chest: [0.06, -0.16, 0],
        rearElbow: [-0.29, 0, 0],
        leadWrist: [-0.17, 0, 0],
      },
      standingHeavy: {
        body: [0.12, 0, 0],
        rearShoulder: [-0.29, 0, -0.21],
        rearKnee: [0.17, 0, 0],
      },
      lowLight: { chest: [0.18, -0.16, 0.08], leadElbow: [-0.22, 0, 0], rearKnee: [0.13, 0, 0] },
      lowHeavy: { pelvis: [0, -0.25, 0], leadHip: [-0.16, 0, 0.17], rearShoulder: [0.2, 0, -0.25] },
      airLight: { chest: [0.11, -0.12, 0], leadPalm: [-0.4, 0.18, 0], rearElbow: [-0.19, 0, 0] },
      airHeavy: {
        chest: [0.06, -0.11, 0],
        leadPalm: [-0.24, 0.16, 0],
        rearPalm: [-0.24, -0.16, 0],
      },
      forwardLight: { body: [0.15, 0, 0], rearShoulder: [-0.18, 0, -0.25], leadKnee: [0.19, 0, 0] },
      forwardHeavy: { root: [0, -0.022, 0.035], chest: [0.18, -0.22, 0], rearElbow: [-0.21, 0, 0] },
      backHeavy: {
        body: [-0.16, 0, 0],
        chest: [0.04, 0.23, 0],
        leadElbow: [-0.38, 0, 0],
        rearKnee: [0.22, 0, 0],
      },
    },
    contact: {
      airHeavy: {
        leadShoulder: [-0.94, 0.16, 0.23],
        rearShoulder: [-0.78, -0.16, -0.23],
        leadElbow: [-0.26, 0, 0],
        rearElbow: [-0.43, 0, 0],
        leadHip: [0.18, 0, 0.14],
        rearHip: [0.27, 0, -0.12],
        leadKnee: [0.12, 0, 0],
        rearKnee: [0.26, 0, 0],
      },
    },
  },
  machi: {
    prepareAt: 0.13,
    recoverAt: 0.26,
    load: { leadWrist: [0.21, 0.16, 0.09], rearWrist: [-0.16, -0.11, 0], rearElbow: [-0.24, 0, 0] },
    recover: {
      body: [-0.08, 0, 0],
      rearShoulder: [0.29, 0.12, -0.15],
      leadPalm: [-0.19, 0.08, 0.15],
    },
    impact: {
      standingLight: { leadWrist: [-0.27, 0.23, 0], rearElbow: [-0.25, 0, 0], head: [0, 0.09, 0] },
      standingHeavy: {
        chest: [0.08, -0.21, 0],
        leadElbow: [-0.42, 0, 0],
        rearWrist: [0.14, -0.23, 0],
      },
      lowLight: {
        leadPalm: [-0.22, 0.22, 0.08],
        rearShoulder: [0.21, 0, -0.16],
        rearKnee: [0.12, 0, 0],
      },
      lowHeavy: {
        pelvis: [0, -0.16, 0],
        leadWrist: [0.2, 0.11, 0.18],
        rearShoulder: [0.31, 0, -0.28],
      },
      airLight: {
        leadWrist: [-0.24, 0.21, 0.08],
        rearElbow: [-0.22, 0, 0],
        leadKnee: [0.22, 0, 0],
      },
      airHeavy: {
        chest: [-0.13, 0.18, 0.1],
        rearWrist: [-0.17, -0.25, 0],
        leadPalm: [-0.17, 0.27, 0],
      },
      forwardLight: {
        leadWrist: [-0.31, 0.11, 0],
        rearShoulder: [0.22, 0, -0.17],
        rearHip: [0.14, 0, 0],
      },
      forwardHeavy: {
        pelvis: [0, -0.22, 0],
        leadPalm: [-0.2, 0.22, 0.09],
        rearPalm: [-0.15, -0.24, -0.16],
      },
      backHeavy: {
        body: [-0.17, 0, 0],
        rearShoulder: [0.32, 0.13, -0.18],
        rearElbow: [-0.31, 0, 0],
        leadElbow: [-0.34, 0, 0],
      },
    },
    contact: {
      airHeavy: {
        leadShoulder: [-0.92, 0.13, 0.22],
        rearShoulder: [0.38, 0.1, -0.31],
        rearElbow: [-0.72, 0, 0],
        leadHip: [-0.17, 0, 0.14],
        rearHip: [0.25, 0, -0.13],
        leadKnee: [0.21, 0, 0],
        rearKnee: [0.33, 0, 0],
      },
    },
  },
  illumi: {
    prepareAt: 0.36,
    recoverAt: 0.21,
    load: { chest: [-0.07, 0.07, 0], head: [0, -0.06, 0], leadWrist: [0.21, 0.13, 0] },
    recover: { chest: [-0.06, 0.09, 0], leadShoulder: [-0.17, 0, 0.07], leadElbow: [-0.17, 0, 0] },
    impact: {
      standingLight: {
        neck: [0.03, 0, 0],
        leadPalm: [-0.25, 0.24, 0],
        rearShoulder: [0.17, 0, -0.09],
      },
      standingHeavy: { body: [-0.08, 0, 0], leadWrist: [-0.34, 0.19, 0], rearElbow: [-0.24, 0, 0] },
      lowLight: { chest: [0.11, -0.06, 0], leadWrist: [-0.17, 0.2, 0], rearHip: [-0.14, 0, 0] },
      lowHeavy: { chest: [-0.08, 0.07, 0], rearKnee: [0.28, 0, 0], leadWrist: [-0.17, 0.13, 0] },
      airLight: { body: [-0.17, 0, 0], leadWrist: [-0.22, 0.2, 0], rearHip: [0.1, 0, -0.12] },
      airHeavy: { chest: [-0.13, 0.12, 0.11], head: [0.06, -0.12, 0], leadWrist: [0.24, 0.26, 0] },
      forwardLight: {
        neck: [0, -0.08, 0],
        leadPalm: [-0.27, 0.22, 0],
        rearShoulder: [0.18, 0, -0.12],
      },
      forwardHeavy: {
        chest: [0.11, -0.15, 0],
        leadElbow: [-0.27, 0, 0],
        rearWrist: [-0.16, -0.11, 0],
      },
      backHeavy: { body: [-0.19, 0, 0], leadWrist: [-0.25, 0.19, 0], rearKnee: [0.16, 0, 0] },
    },
    contact: {
      airHeavy: {
        leadShoulder: [-1.14, 0.24, 0.16],
        leadElbow: [-0.28, 0, 0],
        rearShoulder: [0.24, 0.16, -0.16],
        rearElbow: [-0.62, 0, 0],
        leadHip: [0.16, 0.11, 0],
        rearHip: [-0.22, 0, -0.12],
        rearKnee: [0.32, 0, 0],
      },
    },
  },
  kalluto: {
    prepareAt: 0.24,
    recoverAt: 0.37,
    load: { chest: [0, 0.14, 0.07], leadWrist: [0.13, 0.11, 0.31], rearElbow: [-0.28, 0, 0] },
    recover: { body: [-0.1, 0, 0.1], leadWrist: [0.15, 0.14, 0.25], rearElbow: [-0.3, 0, 0] },
    impact: {
      standingLight: {
        leadWrist: [-0.11, 0.05, -0.24],
        rearKnee: [0.13, 0, 0],
        head: [0, 0.08, 0],
      },
      standingHeavy: {
        pelvis: [0, -0.17, 0],
        leadWrist: [0.13, -0.13, -0.25],
        rearShoulder: [0.17, 0, -0.13],
      },
      lowLight: {
        chest: [0.08, 0.11, 0.07],
        leadWrist: [-0.09, 0.14, -0.17],
        rearHip: [-0.13, 0, 0],
      },
      lowHeavy: { pelvis: [0, -0.24, 0], leadWrist: [0.22, -0.14, -0.22], leadKnee: [0.23, 0, 0] },
      airLight: {
        chest: [-0.11, -0.14, 0.14],
        leadWrist: [-0.11, 0.14, -0.21],
        rearKnee: [0.23, 0, 0],
      },
      airHeavy: {
        body: [-0.11, 0, 0.18],
        leadWrist: [0.25, -0.19, -0.23],
        leadHip: [-0.29, 0, 0.12],
        rearHip: [0.21, 0, -0.13],
      },
      forwardLight: {
        chest: [-0.04, -0.08, 0.1],
        leadWrist: [-0.13, 0.16, -0.21],
        rearHip: [0.16, 0, 0],
      },
      forwardHeavy: {
        pelvis: [0, -0.23, 0.07],
        leadWrist: [0.22, -0.14, -0.27],
        rearShoulder: [0.17, 0, -0.2],
      },
      backHeavy: { body: [-0.18, 0, 0.12], leadWrist: [0.12, 0.18, 0.23], rearKnee: [0.24, 0, 0] },
    },
  },
  bonolenov: {
    prepareAt: 0.19,
    recoverAt: 0.52,
    load: { pelvis: [0, 0.24, 0.07], chest: [0, -0.13, 0.09], rearKnee: [0.19, 0, 0] },
    recover: { pelvis: [0, 0.16, -0.08], chest: [0, -0.14, 0.08], rearShoulder: [0.13, 0, -0.2] },
    impact: {
      standingLight: {
        pelvis: [0, -0.16, 0],
        rearShoulder: [0.14, 0, -0.18],
        leadFoot: [0, 0.16, 0],
      },
      standingHeavy: {
        pelvis: [0, -0.27, 0.07],
        rearHip: [0.17, 0, -0.14],
        leadElbow: [-0.22, 0, 0],
      },
      lowLight: {
        chest: [0.1, -0.11, 0.1],
        rearKnee: [0.19, 0, 0],
        rearShoulder: [-0.14, 0, -0.17],
      },
      lowHeavy: { pelvis: [0, -0.31, 0], rearFoot: [0, 0.24, 0], leadHip: [-0.16, 0.16, 0.16] },
      airLight: { chest: [-0.1, -0.15, 0.14], leadKnee: [0.31, 0, 0], rearHip: [0.22, 0, -0.18] },
      airHeavy: {
        chest: [0.08, -0.3, 0.17],
        leadHip: [-0.2, 0, 0.19],
        rearHip: [0.27, 0, -0.16],
        rearShoulder: [0.13, 0, -0.29],
      },
      forwardLight: {
        pelvis: [0, -0.2, 0],
        rearShoulder: [0.18, 0, -0.17],
        leadFoot: [0, 0.13, 0],
      },
      forwardHeavy: {
        pelvis: [0, -0.34, 0.13],
        chest: [0.11, 0.16, -0.11],
        rearFoot: [0, -0.19, 0],
      },
      backHeavy: {
        body: [-0.14, 0, 0.12],
        pelvis: [0, 0.18, 0],
        rearKnee: [0.26, 0, 0],
        leadShoulder: [0.14, 0, 0.21],
      },
    },
  },
}
