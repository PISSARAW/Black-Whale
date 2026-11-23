import type { DuelComboProfile } from './duelComboTypes'

export const SEVENTH_DUEL_PROFILES = {
  tserriednich: {
    window: 6,
    block: 'standingHeavy',
    // Dix secondes d'avance (signatureCombosSecond.ts): Calculated Sweep relaunches into Blind Spot.
    relance: true,
    moves: {
      standingLight: {
        tuning: { startup: 4, hitstun: 19, knockback: 0.8 },
        into: ['standingHeavy', 'forwardLight'],
      },
      lowLight: {
        tuning: { startup: 5, hitstun: 19, knockback: 0.7 },
        into: ['forwardLight', 'standingHeavy'],
      },
      forwardLight: {
        tuning: {
          startup: 6,
          active: 3,
          recovery: 7,
          hitstun: 28,
          knockback: 1,
          reach: 12,
          lunge: 1.3,
        },
        into: ['forwardHeavy', 'lowHeavy'],
        links: ['standingHeavy'],
      },
      standingHeavy: {
        tuning: { startup: 10, active: 4, recovery: 16, hitstun: 32, knockback: 1.3, reach: 13 },
        into: ['lowHeavy', 'forwardHeavy'],
        links: ['backHeavy'],
      },
      backHeavy: {
        tuning: { startup: 8, hitstun: 25, knockback: 1.1, reach: 13 },
        into: ['lowHeavy', 'forwardHeavy'],
      },
      lowHeavy: {
        tuning: { startup: 9, recovery: 18, damage: 9, knockback: 3.1, reach: 13 },
        into: [],
      },
      forwardHeavy: {
        tuning: { startup: 14, recovery: 24, damage: 16, knockback: 7.5, reach: 16 },
        into: [],
      },
      airLight: { tuning: { hitstun: 18, knockback: 1.3 }, into: ['airHeavy'] },
      airHeavy: { into: [] },
    },
  },
  basho: {
    window: 7,
    block: 'standingHeavy',
    // Le poing qui brûle (signatureCombosLot2A.ts): press in after sweep into shoulder & throw.
    dash: { lowHeavy: 'forward' },
    accelInto: { forwardHeavy: ['throw'] },
    moves: {
      standingLight: {
        tuning: { startup: 5, hitstun: 19, knockback: 0.8 },
        into: ['standingHeavy', 'forwardLight'],
      },
      lowLight: {
        tuning: { startup: 6, hitstun: 19, knockback: 0.7 },
        into: ['forwardLight', 'standingHeavy'],
      },
      forwardLight: {
        tuning: { startup: 6, hitstun: 25, knockback: 1, reach: 12, lunge: 1.3 },
        into: ['standingHeavy', 'forwardHeavy'],
        links: [],
      },
      standingHeavy: {
        tuning: { startup: 10, active: 4, recovery: 16, hitstun: 32, knockback: 1.3, reach: 13 },
        into: ['lowHeavy', 'forwardHeavy'],
        links: ['backHeavy'],
      },
      backHeavy: {
        tuning: { startup: 8, hitstun: 25, knockback: 1.1, reach: 13 },
        into: ['lowHeavy', 'forwardHeavy'],
      },
      lowHeavy: {
        tuning: { startup: 9, recovery: 18, damage: 9, knockback: 3.1, reach: 13 },
        into: [],
      },
      forwardHeavy: {
        tuning: { startup: 14, recovery: 24, damage: 16, knockback: 7.5, reach: 16 },
        into: [],
      },
      airLight: { tuning: { hitstun: 18, knockback: 1.3 }, into: ['airHeavy'] },
      airHeavy: { into: [] },
    },
  },
  camilla: {
    window: 6,
    block: 'standingHeavy',
    // Deuxième vie (signatureCombosLot2A.ts): step back after sweep to fire the handgun.
    dash: { lowHeavy: 'back' },
    moves: {
      standingLight: {
        tuning: { startup: 4, hitstun: 19, knockback: 0.8 },
        into: ['standingHeavy', 'forwardLight'],
      },
      lowLight: {
        tuning: { startup: 5, hitstun: 19, knockback: 0.7 },
        into: ['forwardLight', 'standingHeavy'],
      },
      forwardLight: {
        tuning: { startup: 6, hitstun: 25, knockback: 1, reach: 12, lunge: 1.3 },
        into: ['forwardHeavy', 'lowHeavy'],
        links: [],
      },
      standingHeavy: {
        tuning: { startup: 9, active: 4, recovery: 16, hitstun: 32, knockback: 1.3, reach: 13 },
        into: ['forwardLight', 'lowHeavy', 'forwardHeavy'],
        links: ['backHeavy'],
      },
      backHeavy: {
        tuning: { startup: 8, hitstun: 25, knockback: 1.1, reach: 13 },
        into: ['forwardLight', 'lowHeavy', 'forwardHeavy'],
      },
      lowHeavy: {
        tuning: { startup: 9, recovery: 18, damage: 9, knockback: 3.1, reach: 13 },
        into: [],
      },
      forwardHeavy: {
        tuning: { startup: 13, recovery: 24, damage: 16, knockback: 7.5, reach: 16 },
        into: [],
      },
      airLight: { tuning: { hitstun: 18, knockback: 1.3 }, into: ['airHeavy'] },
      airHeavy: { into: [] },
    },
  },
  longhi: {
    window: 6,
    block: 'standingHeavy',
    // Clair de lune (signatureCombosLot3A.ts): step back then forward capture without forced contract.
    dash: { forwardLight: 'back', lowHeavy: 'forward' },
    moves: {
      standingLight: {
        tuning: { startup: 4, hitstun: 19, knockback: 0.8 },
        into: ['standingHeavy', 'forwardLight'],
      },
      lowLight: {
        tuning: { startup: 5, hitstun: 19, knockback: 0.7 },
        into: ['standingLight', 'forwardLight', 'standingHeavy'],
      },
      forwardLight: {
        tuning: { startup: 6, hitstun: 25, knockback: 1, reach: 12, lunge: 1.3 },
        into: ['forwardHeavy', 'lowHeavy'],
        links: [],
      },
      standingHeavy: {
        tuning: { startup: 8, active: 4, recovery: 16, hitstun: 32, knockback: 1.3, reach: 13 },
        into: ['forwardLight', 'lowHeavy', 'forwardHeavy'],
        links: ['backHeavy'],
      },
      backHeavy: {
        tuning: { startup: 8, hitstun: 25, knockback: 1.1, reach: 13 },
        into: ['lowHeavy', 'forwardHeavy'],
      },
      lowHeavy: {
        tuning: { startup: 9, recovery: 18, damage: 9, knockback: 3.1, reach: 13 },
        into: [],
      },
      forwardHeavy: {
        tuning: { startup: 12, recovery: 24, damage: 16, knockback: 7.5, reach: 16 },
        into: [],
      },
      airLight: { tuning: { hitstun: 18, knockback: 1.3 }, into: ['airHeavy'] },
      airHeavy: { into: [] },
    },
  },
} satisfies Record<string, DuelComboProfile>
