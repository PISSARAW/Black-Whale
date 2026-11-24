import type { NormalStyle } from './secondFiveNormals'
import type { FighterId } from './types'

export const FIFTH_FIVE_NORMAL_STYLES: Partial<Record<FighterId, NormalStyle>> = {
  rihan: {
    prepareAt: 0.34,
    recoverAt: 0.25,
    load: { chest: [-0.06, 0.18, 0], head: [0.02, -0.14, 0], leadElbow: [-0.21, 0, 0] },
    recover: { body: [-0.09, 0, 0], head: [0.055, -0.17, 0], leadPalm: [-0.13, 0.17, 0] },
    impact: {
      standingLight: {
        head: [0.04, -0.08, 0],
        leadWrist: [-0.18, 0.14, 0],
        rearElbow: [-0.17, 0, 0],
      },
      standingHeavy: {
        pelvis: [0, -0.21, 0],
        leadElbow: [-0.3, 0, 0],
        rearShoulder: [0.19, 0, -0.15],
      },
      lowLight: { body: [0.095, 0, 0], head: [0.08, -0.09, 0], rearKnee: [0.18, 0, 0] },
      lowHeavy: { chest: [-0.12, 0.15, 0], rearKnee: [0.2, 0, 0], leadPalm: [-0.21, 0.19, 0.08] },
      airLight: {
        chest: [-0.09, -0.1, 0.1],
        leadPalm: [-0.19, 0.13, 0],
        rearHip: [0.21, 0, -0.12],
      },
      airHeavy: { body: [-0.12, 0, 0.12], head: [0.075, -0.15, 0], rearElbow: [-0.31, 0, 0] },
      forwardLight: {
        chest: [-0.06, -0.12, 0],
        leadPalm: [-0.24, 0.21, 0.09],
        rearHip: [0.1, 0, 0],
      },
      forwardHeavy: {
        pelvis: [0, -0.24, 0],
        head: [-0.045, -0.09, 0],
        rearShoulder: [-0.21, 0, -0.17],
      },
      backHeavy: {
        body: [-0.19, 0, 0],
        head: [0.07, -0.16, 0],
        leadWrist: [-0.23, 0.18, 0],
        rearKnee: [0.25, 0, 0],
      },
    },
    contact: {
      airHeavy: {
        leadShoulder: [-0.71, 0.21, 0.25],
        leadElbow: [-0.42, 0, 0],
        rearShoulder: [-0.94, -0.12, -0.15],
        rearElbow: [-0.33, 0, 0],
        leadHip: [0.16, 0, 0.11],
        rearHip: [-0.15, 0, -0.12],
        leadKnee: [0.05, 0, 0],
        rearKnee: [0.33, 0, 0],
      },
    },
  },
  zakuro: {
    prepareAt: 0.18,
    recoverAt: 0.53,
    load: { pelvis: [0, 0.22, 0.09], leadWrist: [0.18, 0.19, 0.12], rearWrist: [-0.12, -0.2, 0] },
    recover: {
      chest: [-0.075, 0.13, 0.09],
      leadWrist: [0.18, 0.16, 0.1],
      rearElbow: [-0.29, 0, 0],
    },
    impact: {
      standingLight: {
        chest: [0.06, -0.16, 0.08],
        leadWrist: [-0.22, 0.15, -0.12],
        rearElbow: [-0.2, 0, 0],
      },
      standingHeavy: {
        pelvis: [0, -0.29, 0.1],
        leadWrist: [0.22, -0.26, -0.13],
        rearShoulder: [0.17, 0, -0.16],
      },
      lowLight: { body: [0.11, 0, 0.095], leadPalm: [-0.23, 0.24, 0.08], rearHip: [-0.15, 0, 0] },
      lowHeavy: { pelvis: [0, -0.29, 0], rearKnee: [0.23, 0, 0], leadWrist: [0.13, -0.24, -0.19] },
      airLight: {
        chest: [-0.09, -0.17, 0.11],
        leadWrist: [-0.2, 0.11, -0.11],
        leadKnee: [0.22, 0, 0],
      },
      airHeavy: {
        body: [0.14, 0, -0.19],
        chest: [0.12, -0.23, 0.13],
        leadWrist: [-0.25, 0.19, 0.12],
      },
      forwardLight: {
        chest: [0.09, -0.11, 0],
        leadPalm: [-0.27, 0.23, 0.11],
        rearShoulder: [0.21, 0, -0.17],
      },
      forwardHeavy: {
        pelvis: [0, -0.29, 0.09],
        rearElbow: [-0.26, 0, 0],
        leadWrist: [-0.22, -0.18, -0.19],
      },
      backHeavy: {
        body: [-0.18, 0, 0.12],
        leadWrist: [0.25, 0.22, 0.19],
        rearWrist: [-0.17, -0.22, 0],
        rearKnee: [0.23, 0, 0],
      },
    },
    contact: {
      airHeavy: {
        leadShoulder: [-0.88, 0.11, 0.3],
        leadElbow: [-0.37, 0, 0],
        rearShoulder: [0.24, 0.17, -0.24],
        rearElbow: [-0.63, 0, 0],
        leadHip: [-0.28, 0, 0.19],
        rearHip: [-0.06, 0, -0.15],
        leadKnee: [0.25, 0, 0],
        rearKnee: [0.28, 0, 0],
      },
    },
  },
  melody: {
    prepareAt: 0.15,
    recoverAt: 0.41,
    load: { chest: [-0.05, 0.11, 0.07], head: [0.045, -0.12, 0], leadElbow: [-0.23, 0, 0] },
    recover: {
      chest: [-0.09, -0.07, 0.08],
      leadPalm: [-0.16, 0.22, 0.065],
      rearElbow: [-0.27, 0, 0],
    },
    impact: {
      standingLight: {
        chest: [-0.06, -0.09, 0.07],
        leadPalm: [-0.24, 0.22, 0.11],
        rearElbow: [-0.19, 0, 0],
      },
      standingHeavy: {
        body: [-0.09, 0, 0.1],
        rearShoulder: [-0.17, 0.11, -0.19],
        leadWrist: [-0.16, 0.19, 0],
      },
      lowLight: { chest: [0.12, -0.09, 0], head: [0.065, -0.09, 0], leadPalm: [-0.17, 0.2, 0] },
      lowHeavy: {
        pelvis: [0, -0.19, 0.08],
        rearKnee: [0.17, 0, 0],
        rearShoulder: [0.21, 0, -0.21],
      },
      airLight: {
        chest: [-0.15, 0.1, 0.15],
        leadWrist: [-0.19, 0.2, 0.09],
        rearKnee: [0.27, 0, 0],
      },
      airHeavy: {
        chest: [-0.12, -0.19, 0.1],
        leadPalm: [-0.21, 0.22, 0.09],
        rearPalm: [-0.13, -0.2, -0.1],
      },
      forwardLight: { body: [0.09, 0, 0], leadWrist: [-0.23, 0.18, 0], rearElbow: [-0.31, 0, 0] },
      forwardHeavy: { pelvis: [0, -0.2, 0], leadPalm: [-0.25, 0.21, 0.12], rearHip: [0.15, 0, 0] },
      backHeavy: {
        body: [-0.14, 0, 0.1],
        head: [0.07, -0.14, 0],
        rearKnee: [0.18, 0, 0],
        leadElbow: [-0.25, 0, 0],
      },
    },
    contact: {
      airHeavy: {
        leadShoulder: [-0.72, 0.22, 0.19],
        leadElbow: [-0.17, 0, 0],
        rearShoulder: [-0.52, -0.08, -0.3],
        rearElbow: [-0.37, 0, 0],
        leadHip: [0.13, 0, 0.13],
        rearHip: [-0.26, 0, -0.12],
        leadKnee: [0.17, 0, 0],
        rearKnee: [0.32, 0, 0],
      },
    },
  },
  basho: {
    prepareAt: 0.21,
    recoverAt: 0.52,
    load: { chest: [0.05, 0.15, 0], leadWrist: [0.2, 0.16, 0], rearElbow: [-0.25, 0, 0] },
    recover: { body: [0.07, 0, 0], leadWrist: [0.14, 0.11, 0], rearElbow: [-0.32, 0, 0] },
    impact: {
      standingLight: {
        leadWrist: [-0.21, 0.17, -0.09],
        chest: [0.055, -0.17, 0],
        rearElbow: [-0.2, 0, 0],
      },
      standingHeavy: { chest: [0.13, -0.21, 0], leadElbow: [-0.33, 0, 0], leadKnee: [0.18, 0, 0] },
      lowLight: { body: [0.17, 0, 0], leadWrist: [-0.21, 0.15, 0.1], rearHip: [-0.13, 0, 0] },
      lowHeavy: {
        pelvis: [0, -0.28, 0.07],
        leadWrist: [0.13, -0.17, -0.19],
        rearKnee: [0.24, 0, 0],
      },
      airLight: {
        chest: [-0.08, -0.17, 0.12],
        leadWrist: [-0.17, 0.12, 0.12],
        rearHip: [0.23, 0, -0.13],
      },
      airHeavy: { body: [0.2, 0, 0.085], chest: [0.1, -0.2, 0], leadWrist: [0.17, -0.1, 0] },
      forwardLight: {
        chest: [0.085, -0.17, 0],
        leadWrist: [-0.26, 0.17, -0.08],
        rearElbow: [-0.26, 0, 0],
      },
      forwardHeavy: { pelvis: [0, -0.3, 0.07], chest: [0.13, -0.17, 0], rearHip: [0.19, 0, 0] },
      backHeavy: {
        body: [-0.14, 0, 0],
        leadPalm: [-0.2, 0.22, 0.09],
        rearElbow: [-0.3, 0, 0],
        rearKnee: [0.22, 0, 0],
      },
    },
    contact: {
      airHeavy: {
        leadShoulder: [-0.58, 0.14, 0.15],
        leadElbow: [0.14, 0, 0],
        rearShoulder: [0.17, 0.09, -0.27],
        rearElbow: [-0.49, 0, 0],
        leadHip: [-0.17, 0, 0.14],
        rearHip: [0.26, 0, -0.11],
        leadKnee: [0.26, 0, 0],
        rearKnee: [0.31, 0, 0],
      },
    },
  },
  camilla: {
    prepareAt: 0.37,
    recoverAt: 0.26,
    load: { body: [-0.11, 0, 0.07], chest: [-0.08, 0.19, 0], leadWrist: [0.18, 0.16, 0.14] },
    recover: { body: [-0.145, 0, 0.105], chest: [-0.08, 0.16, 0], leadPalm: [-0.14, 0.23, 0.13] },
    impact: {
      standingLight: {
        chest: [-0.07, -0.18, 0.09],
        leadPalm: [-0.28, 0.26, 0.13],
        rearElbow: [-0.18, 0, 0],
      },
      standingHeavy: {
        pelvis: [0, -0.24, 0.06],
        leadWrist: [0.19, -0.18, -0.21],
        rearShoulder: [0.17, 0, -0.21],
      },
      lowLight: { body: [-0.075, 0, 0.11], head: [0.07, -0.15, 0], leadFoot: [-0.21, 0.11, 0] },
      lowHeavy: { pelvis: [0, -0.21, 0.12], chest: [-0.11, 0.12, 0], leadPalm: [-0.19, 0.2, 0.1] },
      airLight: {
        body: [-0.12, 0, 0.16],
        leadPalm: [-0.29, 0.21, 0.13],
        rearHip: [0.24, 0, -0.16],
      },
      airHeavy: {
        chest: [-0.14, 0.18, 0.14],
        head: [0.07, -0.17, 0],
        rearWrist: [-0.21, -0.17, -0.13],
      },
      forwardLight: { chest: [-0.07, 0.12, 0.08], leadElbow: [-0.28, 0, 0], rearHip: [0.18, 0, 0] },
      forwardHeavy: {
        pelvis: [0, -0.31, 0.1],
        leadPalm: [-0.3, 0.23, -0.15],
        rearShoulder: [0.22, 0, -0.19],
      },
      backHeavy: {
        body: [-0.23, 0, 0.17],
        chest: [-0.11, 0.2, 0],
        rearKnee: [0.26, 0, 0],
        leadPalm: [-0.25, 0.25, 0.14],
      },
    },
    contact: {
      airHeavy: {
        leadShoulder: [0.19, 0.24, 0.27],
        leadElbow: [-0.35, 0, 0],
        rearShoulder: [-0.85, -0.08, -0.19],
        rearElbow: [-0.18, 0, 0],
        leadHip: [-0.23, 0, 0.2],
        rearHip: [0.19, 0, -0.18],
        leadKnee: [0.2, 0, 0],
        rearKnee: [0.27, 0, 0],
      },
    },
  },
}
