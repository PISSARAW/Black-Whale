import { WAVE_SIX_WEAPON_STRIKES } from './physicalStrikeWaveSixWeapons'
import { WAVE_SIX_MARTIAL_STRIKES } from './physicalStrikeWaveSixMartial'
import { HANZO_PHYSICAL_STRIKES } from './physicalStrikeWaveSixHanzo'
import { WAVE_FIVE_REACH_STRIKES } from './physicalStrikeWaveFiveReach'
import { WAVE_FIVE_HAND_STRIKES } from './physicalStrikeWaveFiveHands'
import { WAVE_FOUR_RHYTHM_STRIKES } from './physicalStrikeWaveFourRhythm'
import { WAVE_FOUR_GUARD_STRIKES } from './physicalStrikeWaveFourGuard'
import { YOKOTANI_STRIKES } from './physicalStrikeWaveFourBoundary'
import { WAVE_THREE_POWER_STRIKES } from './physicalStrikeWaveThree'
import { WAVE_THREE_COUNTER_STRIKES } from './physicalStrikeWaveThreeCounters'
import { WAVE_TWO_STRIKE_DIRECTIONS } from './physicalStrikeWaveTwo'
import { WAVE_TWO_COUNTER_STRIKES } from './physicalStrikeWaveTwoCounters'
import type { Gesture } from './fightGestures'
import type { StrikeShape } from './rosterChoreography'
import type { FighterId, MoveSlot } from './types'

type NormalSlot =
  | 'standingLight'
  | 'standingHeavy'
  | 'lowLight'
  | 'lowHeavy'
  | 'airLight'
  | 'airHeavy'
  | 'forwardLight'
  | 'forwardHeavy'
  | 'backHeavy'

export type StrikeContactJoint =
  'leadElbow' | 'rearElbow' | 'leadKnee' | 'rearKnee' | 'leadShoulder'

interface StrikeDirection {
  shape: StrikeShape
  gesture?: Gesture
  contactJoint?: StrikeContactJoint
}

type Direction = StrikeShape | StrikeDirection
type PhysicalExtra =
  'throw' | 'neutralSpecial' | 'forwardSpecial' | 'downSpecial' | 'backSpecial' | 'finisher'
export type PhysicalStrikeDirections = Record<NormalSlot, Direction> &
  Partial<Record<PhysicalExtra, Direction>>

const DIRECTIONS: Partial<Record<FighterId, PhysicalStrikeDirections>> = {
  mizaistom: {
    standingLight: {
      shape: 'thrust',
      gesture: {
        windup: { leadShoulder: [0.12, 0, 0.16], leadElbow: [-0.32, 0, 0] },
        contact: {
          chest: [0, -0.22, 0],
          leadShoulder: [-0.68, -0.28, 0.26],
          leadElbow: [0.62, 0, 0],
          leadWrist: [-0.48, 0, 0],
        },
        follow: { leadShoulder: [-0.28, -0.16, 0.18], leadElbow: [0.23, 0, 0] },
      },
    },
    standingHeavy: 'uppercut',
    lowLight: 'lowKick',
    lowHeavy: {
      shape: 'lowKick',
      gesture: {
        windup: {
          body: [-0.13, 0, 0],
          leadHip: [-0.95, 0, 0.13],
          leadKnee: [1.3, 0, 0],
          rearKnee: [0.28, 0, 0],
        },
        contact: {
          root: [0, -0.035, 0.11],
          chest: [0.18, -0.13, 0],
          leadHip: [-0.48, 0, 0.08],
          leadKnee: [-0.3, 0, 0],
          leadFoot: [-0.4, 0, 0],
        },
        follow: { leadHip: [-0.4, 0, 0], leadKnee: [0.63, 0, 0], leadFoot: [-0.12, 0, 0] },
      },
    },
    airLight: 'palm',
    airHeavy: {
      shape: 'hammer',
      gesture: {
        windup: {
          chest: [-0.12, 0.35, 0],
          rearShoulder: [-1.42, 0, -0.2],
          rearElbow: [-0.54, 0, 0],
          leadHip: [-0.54, 0, 0],
        },
        contact: {
          body: [0.32, 0, 0],
          chest: [0.12, 0.35, -0.19],
          rearShoulder: [-0.76, 0, -0.36],
          rearElbow: [0.53, 0, 0],
          leadHip: [-0.42, 0, 0],
          rearKnee: [0.27, 0, 0],
        },
        follow: { body: [0.22, 0, 0], rearShoulder: [-0.38, 0, -0.25], leadKnee: [0.33, 0, 0] },
      },
    },
    forwardLight: 'jab',
    forwardHeavy: 'palm',
    backHeavy: 'hook',
  },
  terebellum: {
    standingLight: 'palm',
    standingHeavy: 'hammer',
    lowLight: 'palm',
    lowHeavy: {
      shape: 'lowJab',
      gesture: {
        windup: {
          chest: [0.3, -0.22, 0],
          body: [0.27, 0, 0],
          rearShoulder: [0.36, 0, -0.34],
          rearKnee: [0.3, 0, 0],
        },
        contact: {
          root: [0, -0.095, 0.14],
          chest: [0.38, 0.44, 0.12],
          leadShoulder: [-0.22, 0, 0.28],
          rearShoulder: [-0.88, 0, -0.22],
          rearElbow: [1.45, 0, 0],
          rearWrist: [0.45, 0, 0],
          leadKnee: [0.4, 0, 0],
        },
        follow: {
          chest: [-0.08, 0.55, 0],
          rearShoulder: [-0.94, 0, -0.26],
          rearElbow: [0.58, 0, 0],
        },
      },
    },
    airLight: 'hook',
    airHeavy: {
      shape: 'cross',
      gesture: {
        windup: {
          chest: [0, -0.44, 0],
          rearShoulder: [0.46, 0, -0.2],
          rearElbow: [-0.2, 0, 0],
          leadHip: [-0.62, 0, 0],
          leadKnee: [0.52, 0, 0],
        },
        contact: {
          body: [0.27, 0.22, 0],
          chest: [0.19, 0.66, 0],
          rearShoulder: [-1.46, 0, 0.18],
          rearElbow: [1.75, 0, 0],
          leadShoulder: [0.39, 0, 0.25],
          leadHip: [-0.46, 0, 0.12],
          rearKnee: [0.42, 0, 0],
        },
        follow: { chest: [0.17, 0.37, 0], rearShoulder: [-0.55, 0, 0.13], rearElbow: [0.82, 0, 0] },
      },
    },
    forwardLight: 'cross',
    forwardHeavy: 'uppercut',
    backHeavy: 'palm',
  },
  cluck: {
    standingLight: 'backhand',
    standingHeavy: 'spin',
    lowLight: 'lowJab',
    lowHeavy: {
      shape: 'sweep',
      gesture: {
        windup: {
          body: [-0.08, 0.1, 0.22],
          chest: [0, 0.46, -0.09],
          leadHip: [-0.38, 0, 0.66],
          leadKnee: [0.62, 0, 0],
          leadShoulder: [0, 0, 0.52],
        },
        contact: {
          body: [-0.16, 0, -0.32],
          chest: [-0.08, -0.53, 0.16],
          leadHip: [-0.58, -0.48, 0.44],
          leadKnee: [-0.35, 0, 0],
          leadFoot: [0.3, 0, 0],
          rearShoulder: [0.12, 0, -0.7],
        },
        follow: {
          body: [-0.12, 0, -0.17],
          chest: [0, -0.3, 0],
          leadHip: [-0.42, 0.2, 0.27],
          leadKnee: [0.51, 0, 0],
        },
      },
    },
    airLight: 'airPunch',
    airHeavy: 'spin',
    forwardLight: 'thrust',
    forwardHeavy: {
      shape: 'slash',
      gesture: {
        windup: {
          chest: [0, 0.58, 0],
          leadShoulder: [-0.69, 0, -0.8],
          leadElbow: [-0.35, 0, 0],
          rearShoulder: [0.32, 0, -0.4],
        },
        contact: {
          root: [0, 0.015, 0.13],
          body: [0.06, -0.25, -0.18],
          chest: [0, -0.65, 0.11],
          leadShoulder: [-1.42, 0.18, 0.56],
          leadElbow: [1.36, 0, 0],
          leadWrist: [0.62, 0, 0],
          rearShoulder: [0.25, 0, -0.49],
        },
        follow: {
          chest: [0, -0.35, 0.07],
          leadShoulder: [-0.66, 0.12, 0.44],
          leadWrist: [0.28, 0, 0],
        },
      },
    },
    backHeavy: 'kick',
    forwardSpecial: 'airSlash',
    downSpecial: 'sweep',
    backSpecial: 'spin',
    finisher: 'kick',
  },
  sayird: {
    standingLight: 'jab',
    standingHeavy: 'cross',
    lowLight: 'thrust',
    lowHeavy: {
      shape: 'kick',
      gesture: {
        windup: {
          body: [-0.19, 0, 0],
          leadHip: [-1.12, 0, 0],
          leadKnee: [1.52, 0, 0],
          rearElbow: [-0.4, 0, 0],
        },
        contact: {
          root: [0, -0.02, 0.08],
          body: [-0.32, 0, 0],
          chest: [0.04, 0.2, 0],
          leadHip: [-0.78, 0, 0],
          leadKnee: [-0.38, 0, 0],
          leadFoot: [0.42, 0, 0],
          leadShoulder: [0.28, 0, 0.1],
        },
        follow: { body: [-0.2, 0, 0], leadHip: [-0.71, 0, 0], leadKnee: [0.98, 0, 0] },
      },
    },
    airLight: 'airSlash',
    airHeavy: {
      shape: 'airPunch',
      gesture: {
        windup: {
          chest: [-0.16, 0.26, 0],
          leadShoulder: [-1.31, 0, 0.16],
          leadElbow: [-0.41, 0, 0],
          leadHip: [-0.38, 0, 0],
          rearKnee: [0.42, 0, 0],
        },
        contact: {
          body: [0.33, 0, 0],
          chest: [0.19, -0.37, 0],
          leadShoulder: [-0.42, 0, 0.08],
          leadElbow: [1.55, 0, 0],
          leadWrist: [0.22, 0, 0],
          rearShoulder: [0.36, 0, -0.17],
          rearKnee: [0.37, 0, 0],
        },
        follow: {
          body: [0.18, 0, 0],
          leadShoulder: [-0.2, 0, 0.11],
          leadElbow: [0.65, 0, 0],
          rearKnee: [0.28, 0, 0],
        },
      },
    },
    forwardLight: 'hook',
    forwardHeavy: 'hammer',
    backHeavy: 'cross',
    forwardSpecial: 'charge',
    downSpecial: 'lowJab',
    backSpecial: 'thrust',
    finisher: 'uppercut',
  },
  camilla: {
    standingLight: 'slash',
    standingHeavy: 'palm',
    lowLight: 'backhand',
    lowHeavy: {
      shape: 'palm',
      gesture: {
        windup: {
          body: [-0.17, 0, 0.06],
          chest: [0, 0.34, 0],
          leadShoulder: [0.31, 0, 0.29],
          leadWrist: [-0.24, 0, 0],
        },
        contact: {
          root: [0, -0.064, 0.06],
          body: [0.18, -0.18, 0],
          chest: [0.17, -0.36, 0],
          leadShoulder: [-0.49, 0, 0.36],
          leadElbow: [1.38, 0, 0],
          leadWrist: [0.59, 0, 0],
          rearShoulder: [0.19, 0, -0.35],
          leadKnee: [0.38, 0, 0],
        },
        follow: { chest: [0.06, -0.26, 0], leadShoulder: [-0.26, 0, 0.24], leadWrist: [0.4, 0, 0] },
      },
    },
    airLight: 'thrust',
    airHeavy: {
      shape: 'dive',
      gesture: {
        windup: {
          body: [-0.23, 0.14, -0.08],
          leadHip: [-0.94, 0, 0.31],
          leadKnee: [0.9, 0, 0],
          rearHip: [0.27, 0, -0.17],
          rearKnee: [0.34, 0, 0],
        },
        contact: {
          body: [-0.23, -0.14, -0.09],
          chest: [-0.09, -0.2, 0],
          leadHip: [-0.64, 0, 0.26],
          leadKnee: [-0.48, 0, 0],
          leadFoot: [0.62, 0, 0],
          rearHip: [0.46, 0, -0.33],
          rearKnee: [0.3, 0, 0],
          leadShoulder: [-0.21, 0, 0.41],
          rearShoulder: [0.16, 0, -0.44],
        },
        follow: {
          body: [-0.12, -0.1, 0],
          leadHip: [-0.47, 0, 0.13],
          leadKnee: [0.29, 0, 0],
          leadFoot: [0.27, 0, 0],
        },
      },
    },
    forwardLight: 'airSlash',
    forwardHeavy: 'thrust',
    backHeavy: 'slash',
  },
}

const AUTHORED_STRIKES: Partial<Record<FighterId, PhysicalStrikeDirections>> = {
  ...WAVE_TWO_STRIKE_DIRECTIONS,
  ...WAVE_TWO_COUNTER_STRIKES,
  ...WAVE_THREE_POWER_STRIKES,
  ...WAVE_THREE_COUNTER_STRIKES,
  ...WAVE_FOUR_RHYTHM_STRIKES,
  ...WAVE_FOUR_GUARD_STRIKES,
  yokotani: YOKOTANI_STRIKES,
  ...WAVE_FIVE_REACH_STRIKES,
  ...WAVE_FIVE_HAND_STRIKES,
  ...WAVE_SIX_WEAPON_STRIKES,
  ...WAVE_SIX_MARTIAL_STRIKES,
  hanzo: HANZO_PHYSICAL_STRIKES,
}

const FULL_PHYSICAL_POSES = new Set<string>([
  ...Object.keys(WAVE_FIVE_REACH_STRIKES),
  ...Object.keys(WAVE_FIVE_HAND_STRIKES),
  ...Object.keys(WAVE_SIX_WEAPON_STRIKES),
  ...Object.keys(WAVE_SIX_MARTIAL_STRIKES),
  'hanzo',
])

export function usesFullPhysicalPoses(id: FighterId): boolean {
  return FULL_PHYSICAL_POSES.has(id)
}

export function authoredStrikeDirection(id: FighterId, slot: MoveSlot): Direction | undefined {
  return AUTHORED_STRIKES[id]?.[slot as keyof PhysicalStrikeDirections]
}

export function physicalStrikeDirection(id: FighterId, slot: MoveSlot): Direction | undefined {
  return DIRECTIONS[id]?.[slot as keyof PhysicalStrikeDirections]
}

export function physicalStrikeShape(direction: Direction | undefined): StrikeShape | undefined {
  return typeof direction === 'string' ? direction : direction?.shape
}
