import type { DuelComboProfile } from './duelComboTypes'

export const NINTH_DUEL_PROFILES = {
  rihan: {
    window: 7,
    block: 'standingHeavy',
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
  melody: {
    window: 6,
    block: 'standingHeavy',
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
        tuning: { startup: 8, active: 4, recovery: 16, hitstun: 32, knockback: 1.3, reach: 13 },
        into: ['lowHeavy', 'forwardHeavy', 'forwardLight'],
        links: ['backHeavy'],
      },
      backHeavy: {
        tuning: { startup: 8, hitstun: 25, knockback: 1.1, reach: 13 },
        into: ['lowHeavy', 'forwardHeavy', 'forwardLight'],
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
  terebellum: {
    window: 7,
    block: 'standingHeavy',
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
        into: ['standingHeavy', 'forwardHeavy', 'lowHeavy'],
        links: [],
      },
      standingHeavy: {
        tuning: { startup: 10, active: 4, recovery: 16, hitstun: 32, knockback: 1.3, reach: 13 },
        into: ['lowHeavy', 'forwardHeavy', 'neutralSpecial'],
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
      // This is the existing physical carrier; injury transfer keeps its separate hand-contact rule.
      neutralSpecial: { tuning: { startup: 12, damage: 20, knockback: 4.2, reach: 16 }, into: [] },
    },
  },
  voconte: {
    window: 6,
    block: 'standingHeavy',
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
        into: ['standingHeavy', 'forwardHeavy', 'lowHeavy'],
        links: [],
      },
      standingHeavy: {
        tuning: { startup: 9, active: 4, recovery: 16, hitstun: 32, knockback: 1.3, reach: 13 },
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
        tuning: { startup: 13, recovery: 24, damage: 16, knockback: 7.5, reach: 16 },
        into: [],
      },
      airLight: { tuning: { hitstun: 18, knockback: 1.3 }, into: ['airHeavy'] },
      airHeavy: { into: [] },
    },
  },
} satisfies Record<string, DuelComboProfile>
