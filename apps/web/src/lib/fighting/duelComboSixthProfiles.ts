import type { DuelComboProfile } from './duelComboTypes'

export const SIXTH_DUEL_PROFILES = {
  theta: {
    window: 6,
    block: 'standingHeavy',
    // Leçon de tir (signatureCombosSenses.ts): forward from the covering shot, back from the sweep.
    dash: { backSpecial: 'forward', lowHeavy: 'back' },
    // After the back accélération: low shot, shooting step, disarm, aimed shot.
    accelInto: {
      downSpecial: ['forwardLight'],
      forwardLight: ['throw'],
      throw: ['forwardSpecial'],
    },
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
        tuning: { startup: 8, active: 4, recovery: 16, hitstun: 32, knockback: 1.3, reach: 13 },
        into: ['lowHeavy', 'forwardHeavy', 'neutralSpecial', 'forwardSpecial', 'downSpecial'],
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
      // Only shot timing changes: damage and collision come from the travelling metal bullet.
      neutralSpecial: { tuning: { startup: 12 }, into: [] },
      forwardSpecial: { tuning: { startup: 10 }, into: [] },
      downSpecial: { tuning: { startup: 9 }, into: [] },
    },
  },
  musse: {
    window: 6,
    block: 'standingHeavy',
    // Fenêtre discrète (signatureCombosLot3A.ts): step back after sweep to fire the pistol.
    dash: { lowHeavy: 'back' },
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
        into: ['standingHeavy', 'forwardHeavy'],
      },
      standingHeavy: {
        tuning: { startup: 8, active: 4, recovery: 16, hitstun: 32, knockback: 1.3, reach: 13 },
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
  furykov: {
    window: 7,
    block: 'standingHeavy',
    // Lecture du garde (signatureCombosLot3A.ts): measured step back then forward capture.
    dash: { standingHeavy: 'back', lowHeavy: 'forward' },
    moves: {
      standingLight: {
        tuning: { startup: 5, hitstun: 19, knockback: 0.8 },
        into: ['standingHeavy', 'forwardLight'],
      },
      lowLight: {
        tuning: { startup: 6, hitstun: 19, knockback: 0.7 },
        into: ['standingLight', 'forwardLight', 'standingHeavy'],
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
        tuning: { startup: 14, recovery: 24, damage: 16, knockback: 7.5, reach: 16 },
        into: [],
      },
      airLight: { tuning: { hitstun: 18, knockback: 1.3 }, into: ['airHeavy'] },
      airHeavy: { into: [] },
    },
  },
  beyond: {
    window: 8,
    block: 'standingHeavy',
    // Pression du Ren (signatureCombosLot3A.ts): press in after low Ren blow into heavy capture.
    dash: { downSpecial: 'forward' },
    accelInto: { forwardSpecial: ['forwardHeavy'], forwardHeavy: ['throw'] },
    moves: {
      standingLight: {
        tuning: { startup: 5, hitstun: 19, knockback: 0.8 },
        into: ['standingHeavy', 'forwardLight'],
      },
      lowLight: {
        tuning: { startup: 6, hitstun: 19, knockback: 0.7 },
        into: ['standingLight', 'forwardLight', 'standingHeavy'],
      },
      forwardLight: {
        tuning: { startup: 6, hitstun: 25, knockback: 1, reach: 12, lunge: 1.3 },
        into: ['standingHeavy', 'forwardHeavy'],
      },
      standingHeavy: {
        tuning: { startup: 11, active: 4, recovery: 16, hitstun: 32, knockback: 1.3, reach: 13 },
        into: ['lowHeavy', 'forwardHeavy', 'forwardSpecial', 'downSpecial'],
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
        tuning: { startup: 15, recovery: 24, damage: 16, knockback: 7.5, reach: 16 },
        into: [],
      },
      airLight: { tuning: { hitstun: 18, knockback: 1.3 }, into: ['airHeavy'] },
      airHeavy: { into: [] },
      // Ren-powered martial adaptations remain distinct from the unavailable sacrificial curse.
      forwardSpecial: { tuning: { startup: 14, damage: 22, knockback: 4.5, reach: 20 }, into: [] },
      downSpecial: { tuning: { startup: 10, damage: 17, knockback: 3.1, reach: 18 }, into: [] },
    },
  },
} satisfies Record<string, DuelComboProfile>
