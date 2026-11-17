import type { DuelComboProfile } from './duelComboTypes'

export const FIFTH_DUEL_PROFILES = {
  gel: {
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
        into: ['forwardHeavy', 'lowHeavy', 'forwardSpecial', 'downSpecial'],
      },
      standingHeavy: {
        tuning: { startup: 8, active: 4, recovery: 16, hitstun: 32, knockback: 1.3, reach: 13 },
        into: ['forwardLight', 'lowHeavy', 'forwardHeavy', 'forwardSpecial', 'downSpecial'],
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
      forwardSpecial: { tuning: { startup: 10, damage: 18, knockback: 4.3, reach: 23 }, into: [] },
      downSpecial: { tuning: { startup: 8, damage: 13, knockback: 3.1, reach: 18 }, into: [] },
    },
  },
  lynch: {
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
        into: ['standingHeavy', 'forwardHeavy'],
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
  padaille: {
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
        into: ['forwardHeavy', 'forwardSpecial', 'lowHeavy'],
      },
      standingHeavy: {
        tuning: { startup: 10, active: 4, recovery: 16, hitstun: 32, knockback: 1.3, reach: 13 },
        into: [
          'forwardLight',
          'lowHeavy',
          'forwardHeavy',
          'neutralSpecial',
          'forwardSpecial',
          'downSpecial',
        ],
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
      // The drill keeps its real tool selection, physical hitbox and 20 aura cost.
      forwardSpecial: { into: ['lowHeavy'] },
      neutralSpecial: { into: [] },
      downSpecial: { into: [] },
    },
  },
  zakuro: {
    window: 7,
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
