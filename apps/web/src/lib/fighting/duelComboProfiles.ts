import type { FighterMove, FighterMoveset } from './movesetTypes'
import type { FighterId, MoveSlot } from './types'
import type { ComboMove, DuelComboProfile } from './duelComboTypes'
import { ROSTER_DUEL_PROFILES } from './duelComboRosterProfiles'
import { SECOND_DUEL_PROFILES } from './duelComboSecondProfiles'
import { THIRD_DUEL_PROFILES } from './duelComboThirdProfiles'
import { FOURTH_DUEL_PROFILES } from './duelComboFourthProfiles'

// Combat rules are authored independently of the Academy's example sequences.
// Utility chains and inherited preparations deliberately have no combo destinations.
const KURAPIKA: Partial<Record<MoveSlot, ComboMove>> = {
  standingLight: {
    tuning: { startup: 4, hitstun: 17, knockback: 1.1 },
    into: ['standingHeavy', 'forwardLight', 'forwardSpecial'],
  },
  lowLight: {
    tuning: { startup: 5, hitstun: 18, knockback: 0.9 },
    into: ['forwardLight', 'standingHeavy'],
  },
  standingHeavy: {
    tuning: { startup: 8, hitstun: 22, knockback: 1.7, reach: 11 },
    into: ['lowHeavy', 'forwardHeavy', 'forwardSpecial'],
  },
  forwardLight: {
    // Enough advantage to LINK the backfist after recovery; it is not a cancel.
    tuning: {
      startup: 6,
      active: 3,
      recovery: 5,
      hitstun: 23,
      knockback: 1,
      reach: 11.5,
      lunge: 1.3,
    },
    into: ['lowHeavy', 'forwardSpecial'],
    links: ['standingHeavy'],
    window: 5,
  },
  backHeavy: {
    tuning: { startup: 10, hitstun: 22, knockback: 1.8, reach: 10 },
    into: ['standingHeavy', 'forwardSpecial'],
  },
  lowHeavy: {
    tuning: { startup: 10, recovery: 19, damage: 9, knockback: 3.1, reach: 12.5 },
    into: [],
  },
  forwardHeavy: {
    tuning: { startup: 13, recovery: 22, damage: 13, knockback: 7.2, reach: 15 },
    into: [],
  },
  forwardSpecial: {
    tuning: { startup: 10, recovery: 21, damage: 17, knockback: 4.3, reach: 22 },
    into: [],
  },
  airLight: { tuning: { hitstun: 17, knockback: 1.4 }, into: ['airHeavy'] },
  airHeavy: { into: [] },
}

const BENJAMIN: Partial<Record<MoveSlot, ComboMove>> = {
  standingLight: {
    tuning: { startup: 5, hitstun: 18, knockback: 1.1 },
    into: ['standingHeavy', 'forwardLight'],
  },
  lowLight: {
    tuning: { startup: 6, hitstun: 19, knockback: 0.8 },
    into: ['forwardLight', 'standingHeavy'],
  },
  forwardLight: {
    tuning: { startup: 8, hitstun: 23, knockback: 1.2, reach: 10.5, lunge: 1.4 },
    into: ['standingHeavy', 'forwardHeavy', 'neutralSpecial'],
  },
  standingHeavy: {
    tuning: {
      startup: 10,
      recovery: 17,
      damage: 13,
      hitstun: 24,
      knockback: 1.8,
      reach: 11.6,
      lunge: 1.2,
    },
    into: ['lowHeavy', 'forwardHeavy', 'neutralSpecial'],
  },
  backHeavy: {
    tuning: { startup: 12, hitstun: 23, knockback: 1.5, reach: 9.6 },
    into: ['standingHeavy', 'neutralSpecial'],
  },
  lowHeavy: {
    tuning: { startup: 11, recovery: 21, damage: 10, knockback: 3.1, reach: 11 },
    into: [],
  },
  forwardHeavy: {
    tuning: { startup: 15, recovery: 25, damage: 18, knockback: 8, reach: 15.5, lunge: 2.3 },
    into: [],
  },
  neutralSpecial: {
    tuning: { startup: 14, recovery: 24, damage: 23, knockback: 4.2, reach: 18 },
    into: [],
  },
  airLight: { tuning: { hitstun: 18, knockback: 1.4 }, into: ['airHeavy'] },
  airHeavy: { into: [] },
}

const PROFILES: Partial<Record<FighterId, DuelComboProfile>> = {
  kurapika: { moves: KURAPIKA, window: 6, block: 'standingHeavy' },
  benjamin: { moves: BENJAMIN, window: 8, block: 'standingHeavy' },
  ...ROSTER_DUEL_PROFILES,
  ...SECOND_DUEL_PROFILES,
  ...THIRD_DUEL_PROFILES,
  ...FOURTH_DUEL_PROFILES,
}
export const DUEL_COMBO_FIGHTERS = Object.keys(PROFILES) as FighterId[]
export const hasDuelComboProfile = (fighter: string): boolean => Object.hasOwn(PROFILES, fighter)

export function tuneDuelComboProfile(moveset: FighterMoveset): FighterMoveset {
  const profile = PROFILES[moveset.fighterId]
  if (!profile) return moveset
  return { ...moveset, moves: moveset.moves.map((move) => tune(move, profile)) }
}

function tune(move: FighterMove, profile: DuelComboProfile): FighterMove {
  const spec = profile.moves[move.slot]
  const fighter = move.id.split(':')[0]
  const tuning = { ...move.tuning, ...spec?.tuning }
  return {
    ...move,
    tuning,
    cancelInto: (spec?.into ?? []).map((slot) => `${fighter}:${slot}`),
    linkInto: (spec?.links ?? []).map((slot) => `${fighter}:${slot}`),
    cancelOnBlockInto: move.slot === 'standingLight' ? [`${fighter}:${profile.block}`] : [],
    cancelWindow: {
      start: 0,
      end: tuning.active + (spec?.window ?? profile.window),
    },
  }
}
