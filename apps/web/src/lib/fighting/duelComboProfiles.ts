import type { FighterMove, FighterMoveset } from './movesetTypes'
import type { FighterId, MoveSlot } from './types'
import type { CancelGrammar, ComboMove, DuelComboProfile } from './duelComboTypes'
import { grammarCancels } from './duelComboGrammar'
import { deriveGrammarProfile } from './duelComboDerivedGrammar'
import { ROSTER_DUEL_PROFILES } from './duelComboRosterProfiles'
import { SECOND_DUEL_PROFILES } from './duelComboSecondProfiles'
import { THIRD_DUEL_PROFILES } from './duelComboThirdProfiles'
import { FOURTH_DUEL_PROFILES } from './duelComboFourthProfiles'
import { FIFTH_DUEL_PROFILES } from './duelComboFifthProfiles'
import { SIXTH_DUEL_PROFILES } from './duelComboSixthProfiles'
import { SEVENTH_DUEL_PROFILES } from './duelComboSeventhProfiles'
import { EIGHTH_DUEL_PROFILES } from './duelComboEighthProfiles'
import { NINTH_DUEL_PROFILES } from './duelComboNinthProfiles'
import { TENTH_DUEL_PROFILES } from './duelComboTenthProfiles'

// Combat rules are authored independently of the Academy's example sequences.
// Utility chains and inherited preparations deliberately have no combo destinations.
// Kurapika and Benjamin use the tiered grammar (COMBO_GRAMMAR.md, lot 1): `into` lists
// only normal chains; enders and the paid Hatsu are added by the grammar. Normals sit
// between +2 and +4 on hit; the back heavy is an unchained starter that links.
const KURAPIKA: Partial<Record<MoveSlot, ComboMove>> = {
  standingLight: {
    tuning: { startup: 4, hitstun: 14, knockback: 1.1 },
    into: ['standingHeavy', 'forwardLight'],
  },
  lowLight: {
    tuning: { startup: 5, hitstun: 14, knockback: 0.9 },
    into: ['forwardLight', 'standingHeavy'],
  },
  standingHeavy: {
    tuning: { startup: 8, hitstun: 21, knockback: 1.7, reach: 11 },
    into: [],
  },
  forwardLight: {
    tuning: {
      startup: 6,
      active: 3,
      recovery: 5,
      hitstun: 12,
      blockstun: 6,
      knockback: 1,
      reach: 11.5,
      lunge: 1.3,
    },
    into: ['standingHeavy'],
    window: 5,
  },
  backHeavy: {
    // +9 on hit: a three-frame link into forward + light; nothing chains into it.
    tuning: { startup: 10, active: 4, recovery: 16, hitstun: 29, knockback: 1.8, reach: 12 },
    into: ['standingHeavy'],
    links: ['forwardLight', 'standingLight'],
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
  // Verdict écarlate: the capture holds the target for Judgment Chain (signatureCombos.ts).
  throw: { into: ['finisher'] },
  neutralSpecial: { into: ['finisher'] },
}

const BENJAMIN: Partial<Record<MoveSlot, ComboMove>> = {
  standingLight: {
    tuning: { startup: 5, hitstun: 15, knockback: 1.1 },
    into: ['standingHeavy', 'forwardLight'],
  },
  lowLight: {
    tuning: { startup: 6, hitstun: 16, knockback: 0.8 },
    into: ['forwardLight', 'standingHeavy'],
  },
  forwardLight: {
    tuning: { startup: 8, hitstun: 20, knockback: 1.2, reach: 10.5, lunge: 1.4 },
    into: ['standingHeavy'],
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
    into: [],
  },
  backHeavy: {
    // +11 on hit: a three-frame link into forward + light; nothing chains into it.
    tuning: { startup: 12, active: 4, recovery: 16, hitstun: 31, knockback: 1.5, reach: 12 },
    into: ['standingHeavy'],
    links: ['forwardLight', 'standingLight'],
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
  // Commandement absolu: the capture holds the target while the Aura Rectangle opens.
  throw: { into: ['downSpecial'] },
}

const ENDERS: readonly MoveSlot[] = ['lowHeavy', 'forwardHeavy']

const PROFILES: Partial<Record<FighterId, DuelComboProfile>> = {
  kurapika: {
    moves: KURAPIKA,
    window: 6,
    block: 'standingHeavy',
    grammar: {
      specials: ENDERS,
      supers: ['forwardSpecial'],
      accel: true,
      // Verdict écarlate (signatureCombos.ts): back from the hook, forward from the whip.
      dash: { standingHeavy: 'back', forwardSpecial: 'forward' },
    },
  },
  benjamin: {
    moves: BENJAMIN,
    window: 8,
    block: 'standingHeavy',
    // Commandement absolu (signatureCombosBookArmy.ts): forward from Air Blow into the capture.
    grammar: {
      specials: ENDERS,
      supers: ['neutralSpecial'],
      accel: true,
      dash: { neutralSpecial: 'forward' },
    },
  },
  ...ROSTER_DUEL_PROFILES,
  ...SECOND_DUEL_PROFILES,
  ...THIRD_DUEL_PROFILES,
  ...FOURTH_DUEL_PROFILES,
  ...FIFTH_DUEL_PROFILES,
  ...SIXTH_DUEL_PROFILES,
  ...SEVENTH_DUEL_PROFILES,
  ...EIGHTH_DUEL_PROFILES,
  ...NINTH_DUEL_PROFILES,
  ...TENTH_DUEL_PROFILES,
}
export const DUEL_COMBO_FIGHTERS = Object.keys(PROFILES) as FighterId[]
export const hasDuelComboProfile = (fighter: string): boolean => Object.hasOwn(PROFILES, fighter)
/** Grammars derived while the movesets are built (lot 4); authored grammars win. */
const DERIVED_GRAMMARS = new Map<string, CancelGrammar>()
export const cancelGrammarFor = (fighter: string): CancelGrammar | undefined =>
  PROFILES[fighter as FighterId]?.grammar ?? DERIVED_GRAMMARS.get(fighter)
export const hasCancelGrammar = (fighter: string): boolean => Boolean(cancelGrammarFor(fighter))

export function tuneDuelComboProfile(moveset: FighterMoveset): FighterMoveset {
  const authored = PROFILES[moveset.fighterId]
  if (!authored) return moveset
  const derive = !authored.grammar
  const profile = derive ? deriveGrammarProfile(moveset, authored) : authored
  if (derive && profile.grammar)
    DERIVED_GRAMMARS.set(moveset.fighterId, { ...profile.grammar, dash: authored.dash })
  return { ...moveset, moves: moveset.moves.map((move) => tune(move, profile)) }
}

function tune(move: FighterMove, profile: DuelComboProfile): FighterMove {
  const spec = profile.moves[move.slot]
  const fighter = move.id.split(':')[0]
  const tuning = { ...move.tuning, ...spec?.tuning }
  const authored = {
    cancelInto: (spec?.into ?? []).map((slot) => `${fighter}:${slot}`),
    cancelOnBlockInto: move.slot === 'standingLight' ? [`${fighter}:${profile.block}`] : [],
  }
  return {
    ...move,
    tuning,
    ...(profile.grammar ? grammarCancels(move, spec, profile.grammar) : authored),
    linkInto: (spec?.links ?? []).map((slot) => `${fighter}:${slot}`),
    cancelWindow: {
      start: 0,
      end: tuning.active + (spec?.window ?? profile.window),
    },
  }
}
