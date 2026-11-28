import type { DuelComboProfile } from './duelComboTypes'

export const THIRD_DUEL_PROFILES = {
  illumi: {
    window: 6,
    block: 'standingHeavy',
    // Consigne implantée (signatureCombosTroupeZoldyck.ts): capture, implant, step back.
    dash: { standingHeavy: 'forward', neutralSpecial: 'back' },
    accelInto: { throw: ['neutralSpecial'] },
    moves: {
      standingLight: {
        tuning: { startup: 4, hitstun: 18, knockback: 0.8 },
        into: ['standingHeavy', 'forwardLight'],
      },
      lowLight: {
        tuning: { startup: 4, hitstun: 18, knockback: 0.7 },
        into: ['forwardLight', 'standingHeavy'],
      },
      forwardLight: {
        tuning: { startup: 6, hitstun: 24, knockback: 1, reach: 12, lunge: 1.3 },
        into: ['standingHeavy', 'forwardHeavy'],
      },
      standingHeavy: {
        tuning: { startup: 8, active: 4, recovery: 12, hitstun: 29, knockback: 1.4, reach: 12 },
        into: ['lowHeavy', 'forwardHeavy'],
        links: ['backHeavy'],
      },
      backHeavy: {
        tuning: { startup: 8, hitstun: 24, knockback: 1.2, reach: 12 },
        into: ['lowHeavy', 'forwardHeavy', 'throw'],
      },
      lowHeavy: {
        tuning: { startup: 9, recovery: 18, damage: 9, knockback: 3.1, reach: 12 },
        into: [],
      },
      forwardHeavy: {
        tuning: { startup: 12, recovery: 23, damage: 15, knockback: 7, reach: 15 },
        into: [],
      },
      airLight: { tuning: { hitstun: 18, knockback: 1.3 }, into: ['airHeavy'] },
      airHeavy: { into: [] },
    },
  },
  kalluto: {
    window: 6,
    block: 'standingHeavy',
    // Serpent de papier (signatureCombosTroupeZoldyck.ts): step back after the sweep to scatter and converge paper.
    dash: { lowHeavy: 'back' },
    accelInto: {
      downSpecial: ['forwardSpecial'],
      forwardSpecial: ['finisher'],
    },
    moves: {
      standingLight: {
        tuning: { startup: 3, hitstun: 18, knockback: 0.8 },
        into: ['standingHeavy', 'forwardLight'],
      },
      lowLight: {
        tuning: { startup: 4, hitstun: 18, knockback: 0.7 },
        into: ['standingLight', 'forwardLight', 'standingHeavy'],
      },
      standingHeavy: {
        tuning: { startup: 8, hitstun: 28, knockback: 1.4, reach: 12 },
        into: ['forwardLight', 'lowHeavy', 'forwardHeavy', 'forwardSpecial'],
      },
      forwardLight: {
        tuning: {
          startup: 6,
          active: 3,
          recovery: 7,
          hitstun: 25,
          knockback: 1,
          reach: 12,
          lunge: 1.3,
        },
        into: ['forwardHeavy', 'lowHeavy'],
        links: ['backHeavy'],
      },
      backHeavy: {
        tuning: { startup: 8, hitstun: 24, knockback: 1.2, reach: 12 },
        into: ['forwardHeavy', 'lowHeavy', 'forwardSpecial'],
      },
      lowHeavy: {
        tuning: { startup: 8, recovery: 17, damage: 9, knockback: 3.1, reach: 12 },
        into: [],
      },
      forwardHeavy: {
        tuning: { startup: 11, recovery: 22, damage: 14, knockback: 7, reach: 15 },
        into: [],
      },
      forwardSpecial: { into: [] },
      airLight: { tuning: { hitstun: 18, knockback: 1.3 }, into: ['airHeavy'] },
      airHeavy: { into: [] },
    },
  },
  shizuku: {
    window: 7,
    block: 'standingHeavy',
    // Nettoyage clinique (signatureCombosTroupeZoldyck.ts): close in to wound, step back to draw blood.
    dash: { standingHeavy: 'forward', lowHeavy: 'back' },
    accelInto: { forwardSpecial: ['throw'], throw: ['lowHeavy'] },
    moves: {
      standingLight: {
        tuning: { startup: 4, hitstun: 19, knockback: 1 },
        into: ['lowLight', 'standingHeavy', 'forwardLight'],
      },
      lowLight: {
        tuning: { startup: 5, hitstun: 19, knockback: 0.8 },
        into: ['forwardLight', 'standingHeavy'],
      },
      forwardLight: {
        tuning: { startup: 7, hitstun: 24, knockback: 1.1, reach: 12, lunge: 1.3 },
        into: ['standingHeavy', 'lowHeavy'],
      },
      standingHeavy: {
        tuning: { startup: 10, hitstun: 25, knockback: 1.5, reach: 12, damage: 12 },
        into: ['forwardHeavy', 'lowHeavy', 'forwardSpecial'],
      },
      backHeavy: {
        tuning: { startup: 10, hitstun: 23, knockback: 1.2, reach: 12 },
        into: ['forwardLight', 'standingHeavy'],
      },
      lowHeavy: {
        tuning: { startup: 10, recovery: 20, damage: 10, knockback: 3.1, reach: 12 },
        into: [],
      },
      forwardHeavy: {
        tuning: { startup: 14, recovery: 25, damage: 16, knockback: 7.5, reach: 16 },
        into: [],
      },
      forwardSpecial: { tuning: { startup: 10, damage: 20, knockback: 4.3, reach: 20 }, into: [] },
      airLight: { tuning: { hitstun: 18, knockback: 1.3 }, into: ['airHeavy'] },
      airHeavy: { into: [] },
    },
  },
  leorio: {
    window: 8,
    block: 'standingHeavy',
    // Sous le plancher (signatureCombosHunters.ts): step back to strike the floor, dash in on hit.
    dash: { lowHeavy: 'back', neutralSpecial: 'forward' },
    accelInto: { forwardHeavy: ['throw'] },
    moves: {
      standingLight: {
        tuning: { startup: 4, hitstun: 20, knockback: 1 },
        into: ['standingHeavy', 'forwardLight'],
      },
      lowLight: {
        tuning: { startup: 5, hitstun: 20, knockback: 0.8 },
        into: ['forwardLight', 'standingHeavy'],
      },
      forwardLight: {
        tuning: { startup: 7, hitstun: 24, knockback: 1.1, reach: 12, lunge: 1.3 },
        into: ['standingHeavy', 'backHeavy', 'forwardHeavy'],
      },
      standingHeavy: {
        tuning: { startup: 10, hitstun: 25, knockback: 1.5, reach: 12, damage: 12 },
        into: ['backHeavy', 'lowHeavy', 'forwardHeavy'],
      },
      // This committed opening must outlast the real floor travel and rise of the remote fist.
      backHeavy: {
        tuning: { startup: 12, recovery: 33, hitstun: 39, knockback: 1.5, reach: 12 },
        into: ['forwardHeavy', 'lowHeavy', 'neutralSpecial'],
      },
      lowHeavy: {
        tuning: { startup: 10, recovery: 20, damage: 10, knockback: 3.1, reach: 12 },
        into: [],
      },
      forwardHeavy: {
        tuning: { startup: 14, recovery: 25, damage: 16, knockback: 7.5, reach: 16 },
        into: [],
      },
      neutralSpecial: { into: [], window: 28 },
      airLight: { tuning: { hitstun: 18, knockback: 1.3 }, into: ['airHeavy'] },
      airHeavy: { into: [] },
    },
  },
} satisfies Record<string, DuelComboProfile>
