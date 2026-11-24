import type { DuelComboProfile } from './duelComboTypes'

export const SECOND_DUEL_PROFILES = {
  machi: {
    window: 6,
    block: 'standingHeavy',
    // Fil court (signatureCombosArmory.ts): a short step back from the bind, thread kept short.
    dash: { downSpecial: 'back' },
    // From that step: stitched sweep, Troupe Bind, final tension.
    accelInto: { lowHeavy: ['throw'], throw: ['finisher'] },
    moves: {
      standingLight: {
        tuning: { startup: 4, hitstun: 18, knockback: 0.8 },
        into: ['standingHeavy', 'forwardLight'],
      },
      lowLight: {
        tuning: { startup: 4, hitstun: 18, knockback: 0.8 },
        into: ['forwardLight', 'standingHeavy'],
      },
      standingHeavy: {
        tuning: { startup: 8, active: 4, recovery: 12, hitstun: 29, knockback: 1.4, reach: 12 },
        // Fil court (signatureCombosArmory.ts): the elbow that opened the wound binds at contact.
        into: ['forwardLight', 'lowHeavy', 'forwardHeavy', 'downSpecial'],
        links: ['backHeavy'],
      },
      forwardLight: {
        tuning: { startup: 6, hitstun: 23, knockback: 1, reach: 12, lunge: 1.3 },
        into: ['forwardHeavy', 'lowHeavy'],
      },
      backHeavy: {
        tuning: { startup: 8, hitstun: 24, knockback: 1.2, reach: 12 },
        into: ['forwardHeavy', 'lowHeavy'],
      },
      lowHeavy: {
        tuning: { startup: 9, recovery: 18, damage: 9, knockback: 3.1, reach: 12.5 },
        into: [],
      },
      forwardHeavy: {
        tuning: { startup: 12, recovery: 23, damage: 14, knockback: 7, reach: 15 },
        into: [],
      },
      airLight: { tuning: { hitstun: 18, knockback: 1.3 }, into: ['airHeavy'] },
      airHeavy: { into: [] },
    },
  },
  biscuit: {
    window: 7,
    block: 'standingHeavy',
    // Retour à la vraie forme (signatureCombosBiscuitPhinks.ts): forward from the Stone Sweep.
    dash: { lowHeavy: 'forward' },
    moves: {
      standingLight: {
        tuning: { startup: 4, hitstun: 19, knockback: 1 },
        into: ['standingHeavy', 'forwardLight'],
      },
      lowLight: {
        tuning: { startup: 5, hitstun: 19, knockback: 0.8 },
        into: ['forwardLight', 'standingHeavy'],
      },
      forwardLight: {
        tuning: { startup: 6, hitstun: 24, knockback: 1, reach: 11.5, lunge: 1.4 },
        into: ['standingHeavy', 'forwardHeavy'],
      },
      standingHeavy: {
        tuning: { startup: 8, hitstun: 28, knockback: 1.5, reach: 12, damage: 13 },
        into: ['lowHeavy', 'forwardHeavy', 'forwardSpecial', 'finisher'],
      },
      backHeavy: {
        tuning: { startup: 10, hitstun: 23, knockback: 1.3, reach: 11 },
        into: ['forwardHeavy', 'standingHeavy'],
      },
      lowHeavy: {
        tuning: { startup: 9, recovery: 19, damage: 10, knockback: 3.1, reach: 12 },
        into: [],
      },
      forwardHeavy: {
        tuning: { startup: 12, recovery: 24, damage: 16, knockback: 7.5, reach: 15 },
        into: [],
      },
      forwardSpecial: { tuning: { startup: 10, damage: 19, knockback: 4.2, reach: 19 }, into: [] },
      finisher: { tuning: { startup: 18, knockback: 6, reach: 21 }, into: [] },
      // Retour à la vraie forme: capture, Perfect Ken, Ko Fist, Full Impact.
      throw: { into: ['backSpecial'] },
      backSpecial: { into: ['downSpecial'] },
      downSpecial: { into: ['finisher'] },
      airLight: { tuning: { hitstun: 18, knockback: 1.3 }, into: ['airHeavy'] },
      airHeavy: { into: [] },
    },
  },
  franklin: {
    window: 8,
    block: 'standingHeavy',
    // Feu de suppression (signatureCombosArmory.ts): after the grazing volley, after the rams.
    dash: { downSpecial: 'forward', forwardHeavy: 'back' },
    // After the short recoil: Double Machine Gun, crossed volley, bullet curtain, extended burst.
    accelInto: {
      neutralSpecial: ['forwardSpecial'],
      forwardSpecial: ['backSpecial'],
      backSpecial: ['finisher'],
    },
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
        tuning: { startup: 8, hitstun: 25, knockback: 1.2, reach: 12, lunge: 1.4 },
        into: ['standingHeavy', 'forwardHeavy'],
      },
      standingHeavy: {
        tuning: { startup: 11, recovery: 18, hitstun: 28, knockback: 1.5, reach: 12, damage: 14 },
        into: ['lowHeavy', 'forwardHeavy', 'forwardSpecial', 'neutralSpecial'],
      },
      backHeavy: {
        tuning: { startup: 12, hitstun: 24, knockback: 1.2, reach: 12 },
        into: ['forwardHeavy'],
      },
      lowHeavy: {
        tuning: { startup: 11, recovery: 21, damage: 11, knockback: 3.1, reach: 12 },
        into: [],
      },
      forwardHeavy: {
        tuning: { startup: 16, recovery: 27, damage: 20, knockback: 8, reach: 17 },
        into: [],
      },
      // Feu de suppression: each volley fires in full before it cancels (its last shot).
      downSpecial: { into: [], windowStart: 18 },
      neutralSpecial: { into: [], windowStart: 38 },
      forwardSpecial: { into: [], windowStart: 18 },
      backSpecial: { into: [], windowStart: 38 },
      airLight: { tuning: { hitstun: 18, knockback: 1.3 }, into: ['airHeavy'] },
      airHeavy: { into: [] },
    },
  },
  hanzo: {
    window: 5,
    block: 'standingHeavy',
    moves: {
      standingLight: {
        tuning: { startup: 3, hitstun: 18, knockback: 0.8 },
        into: ['standingHeavy', 'forwardLight'],
      },
      lowLight: {
        tuning: { startup: 4, hitstun: 18, knockback: 0.7 },
        into: ['forwardLight', 'standingHeavy'],
      },
      standingHeavy: {
        tuning: { startup: 7, hitstun: 24, knockback: 1.4, reach: 11.5 },
        into: ['forwardLight', 'lowHeavy', 'downSpecial'],
      },
      forwardLight: {
        tuning: {
          startup: 6,
          active: 3,
          recovery: 8,
          hitstun: 25,
          knockback: 0.6,
          reach: 12,
          lunge: 1.8,
        },
        // Corps vide (signatureCombosHunters.ts): step into choke range for the astral double.
        into: ['forwardHeavy', 'lowHeavy', 'finisher'],
        links: ['backHeavy'],
      },
      backHeavy: {
        tuning: { startup: 8, hitstun: 23, knockback: 1.2, reach: 12 },
        into: ['forwardHeavy', 'lowHeavy'],
      },
      lowHeavy: {
        tuning: { startup: 8, recovery: 17, damage: 9, knockback: 3.1, reach: 12 },
        into: [],
      },
      forwardHeavy: {
        tuning: { startup: 11, recovery: 22, damage: 14, knockback: 7, reach: 15 },
        into: [],
      },
      backSpecial: { tuning: { startup: 7, hitstun: 24, knockback: 1 }, into: ['downSpecial'] },
      downSpecial: { tuning: { startup: 8, hitstun: 24, knockback: 0.4, lunge: 2.2 }, into: [] },
      finisher: { tuning: { startup: 13 }, into: [] },
      airLight: { tuning: { hitstun: 30, knockback: 0.6 }, into: ['airHeavy'] },
      airHeavy: { into: [] },
    },
  },
} satisfies Record<string, DuelComboProfile>
