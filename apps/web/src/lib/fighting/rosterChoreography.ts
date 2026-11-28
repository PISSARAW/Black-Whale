import type { Gesture } from './fightGestures'
import type { FightPose } from './fightPose'
import type { FighterId, MoveSlot } from './types'
import { FIRST_ROSTER_CHOREOGRAPHY } from './rosterChoreographyFirst'
import { SECOND_ROSTER_CHOREOGRAPHY } from './rosterChoreographySecond'

export type StrikeShape =
  | 'jab'
  | 'cross'
  | 'hook'
  | 'uppercut'
  | 'palm'
  | 'hammer'
  | 'slash'
  | 'thrust'
  | 'kick'
  | 'spin'
  | 'lowJab'
  | 'lowKick'
  | 'sweep'
  | 'airPunch'
  | 'airSlash'
  | 'dive'
  | 'backhand'
  | 'charge'

/** The nine physical attacks, in moveset order. Equipment stays with its actual hand. */
export interface RosterChoreography {
  strikes: readonly [
    StrikeShape,
    StrikeShape,
    StrikeShape,
    StrikeShape,
    StrikeShape,
    StrikeShape,
    StrikeShape,
    StrikeShape,
    StrikeShape,
  ]
  load: FightPose
  drive: FightPose
  release: FightPose
  amplitude: number
  anticipation: number
  recovery: number
}

// These are individual movement directions, not combat-stat multipliers. In particular,
// the support cast receives physical strikes rather than fabricated offensive Hatsu.
export const ROSTER_CHOREOGRAPHY = {
  ...FIRST_ROSTER_CHOREOGRAPHY,
  ...SECOND_ROSTER_CHOREOGRAPHY,
}

export type RosterFighterId = keyof typeof ROSTER_CHOREOGRAPHY

export type StrikeLibrary = Record<StrikeShape, Gesture>

export const ROSTER_NORMAL_SLOTS: readonly MoveSlot[] = [
  'standingLight',
  'standingHeavy',
  'lowLight',
  'lowHeavy',
  'airLight',
  'airHeavy',
  'forwardLight',
  'forwardHeavy',
  'backHeavy',
]

export function rosterBaseStrikeShape(id: FighterId, slot: MoveSlot): StrikeShape | undefined {
  return ROSTER_CHOREOGRAPHY[id as RosterFighterId]?.strikes[ROSTER_NORMAL_SLOTS.indexOf(slot)]
}
