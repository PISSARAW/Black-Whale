import type { DuelComboProfile } from './duelComboTypes'

export const ROSTER_DUEL_PROFILES = {
  hisoka: {
    window: 7,
    block: 'standingHeavy',
    moves: {
      standingLight: {
        tuning: { startup: 3, hitstun: 18, knockback: 1 },
        into: ['standingHeavy', 'forwardLight'],
      },
      lowLight: {
        tuning: { startup: 4, hitstun: 18, knockback: 0.8 },
        into: ['forwardLight', 'standingHeavy'],
      },
      standingHeavy: {
        tuning: { startup: 8, hitstun: 26, knockback: 1.5, reach: 11.5 },
        into: ['lowHeavy', 'backHeavy', 'neutralSpecial', 'finisher'],
      },
      forwardLight: {
        tuning: { startup: 6, hitstun: 23, knockback: 1, reach: 11.5, lunge: 1.3 },
        into: ['forwardHeavy', 'neutralSpecial', 'standingHeavy'],
      },
      forwardHeavy: {
        tuning: { startup: 11, hitstun: 24, knockback: 1.8, reach: 14 },
        into: ['neutralSpecial'],
      },
      backHeavy: {
        tuning: { startup: 12, recovery: 22, damage: 14, knockback: 7, reach: 14 },
        into: [],
      },
      lowHeavy: {
        tuning: { startup: 9, recovery: 17, damage: 9, knockback: 3.1, reach: 12 },
        into: [],
      },
      neutralSpecial: { tuning: { startup: 11, damage: 17, knockback: 4, reach: 19 }, into: [] },
      finisher: { tuning: { startup: 18, knockback: 6, reach: 21 }, into: [] },
      airLight: { tuning: { hitstun: 18, knockback: 1.3 }, into: ['airHeavy'] },
      airHeavy: { into: [] },
    },
  },
  chrollo: {
    window: 6,
    block: 'backHeavy',
    moves: {
      standingLight: {
        tuning: { startup: 4, hitstun: 18, knockback: 0.7 },
        into: ['backHeavy', 'standingHeavy'],
      },
      lowLight: {
        tuning: { startup: 5, hitstun: 19, knockback: 0.7 },
        into: ['standingHeavy', 'backHeavy'],
      },
      standingHeavy: {
        tuning: { startup: 8, active: 4, recovery: 9, hitstun: 27, knockback: 1.2, reach: 10.5 },
        into: ['neutralSpecial', 'lowHeavy', 'forwardLight'],
        links: ['backHeavy'],
      },
      backHeavy: {
        tuning: { startup: 9, hitstun: 23, knockback: 1, reach: 11.5, lunge: 1.1 },
        into: ['neutralSpecial', 'lowHeavy', 'forwardLight'],
      },
      forwardHeavy: {
        tuning: { startup: 13, hitstun: 23, knockback: 1.5, reach: 13, lunge: 1.5 },
        into: ['neutralSpecial'],
      },
      lowHeavy: {
        tuning: { startup: 10, recovery: 19, damage: 10, knockback: 3.1, reach: 11.5 },
        into: [],
      },
      forwardLight: {
        tuning: { startup: 9, recovery: 22, damage: 12, knockback: 6.8, reach: 14 },
        into: [],
      },
      neutralSpecial: { into: [] },
      airLight: { tuning: { hitstun: 18, knockback: 1.3 }, into: ['airHeavy'] },
      airHeavy: { into: [] },
    },
  },
  feitan: {
    window: 5,
    block: 'standingHeavy',
    moves: {
      standingLight: {
        tuning: { startup: 3, hitstun: 17, knockback: 0.8 },
        into: ['standingHeavy', 'forwardLight'],
      },
      lowLight: {
        tuning: { startup: 4, hitstun: 18, knockback: 0.7 },
        into: ['forwardLight', 'standingHeavy'],
      },
      standingHeavy: {
        tuning: { startup: 7, hitstun: 24, knockback: 1.2, reach: 11.5 },
        into: ['forwardLight', 'lowHeavy', 'forwardHeavy', 'forwardSpecial'],
      },
      forwardLight: {
        tuning: { startup: 5, hitstun: 22, knockback: 0.8, reach: 11.5, lunge: 1.3 },
        into: ['backHeavy', 'forwardHeavy', 'lowHeavy', 'forwardSpecial'],
      },
      backHeavy: {
        tuning: { startup: 7, hitstun: 24, knockback: 1, reach: 12, lunge: 1.2 },
        into: ['forwardHeavy', 'forwardSpecial', 'lowHeavy'],
      },
      lowHeavy: {
        tuning: { startup: 8, recovery: 17, damage: 9, knockback: 3.1, reach: 12 },
        into: [],
      },
      forwardHeavy: {
        tuning: { startup: 11, recovery: 22, damage: 14, knockback: 7.2, reach: 15 },
        into: [],
      },
      forwardSpecial: { tuning: { startup: 8, damage: 18, knockback: 4.2, reach: 20 }, into: [] },
      airLight: { tuning: { hitstun: 17, knockback: 1.3 }, into: ['airHeavy'] },
      airHeavy: { into: [] },
    },
  },
  phinks: {
    window: 8,
    block: 'standingHeavy',
    moves: {
      standingLight: {
        tuning: { startup: 5, hitstun: 20, knockback: 1 },
        into: ['standingHeavy', 'forwardLight'],
      },
      lowLight: {
        tuning: { startup: 6, hitstun: 20, knockback: 0.8 },
        into: ['forwardLight', 'standingHeavy'],
      },
      forwardLight: {
        tuning: { startup: 8, hitstun: 24, knockback: 1, reach: 11, lunge: 1.5 },
        into: ['standingHeavy', 'forwardHeavy'],
      },
      standingHeavy: {
        tuning: {
          startup: 11,
          active: 4,
          recovery: 12,
          damage: 14,
          hitstun: 36,
          knockback: 1.5,
          reach: 12,
        },
        into: ['lowHeavy', 'forwardHeavy'],
        links: ['finisher'],
      },
      backHeavy: {
        tuning: { startup: 12, hitstun: 24, knockback: 1.2, reach: 11.8 },
        into: ['forwardHeavy', 'forwardLight'],
      },
      lowHeavy: {
        tuning: { startup: 11, recovery: 21, damage: 11, knockback: 3.1, reach: 12 },
        into: [],
      },
      forwardHeavy: {
        tuning: { startup: 16, recovery: 27, damage: 20, knockback: 8.5, reach: 17 },
        into: [],
      },
      airLight: { tuning: { hitstun: 18, knockback: 1.3 }, into: ['airHeavy'] },
      airHeavy: { into: [] },
      finisher: { into: [] },
    },
  },
} satisfies Record<string, DuelComboProfile>
