import type { DuelComboProfile } from './duelComboTypes'

export const ROSTER_DUEL_PROFILES = {
  hisoka: {
    window: 7,
    block: 'standingHeavy',
    grammar: {
      specials: ['lowHeavy', 'backHeavy'],
      supers: ['neutralSpecial', 'finisher'],
      // Élastique meurtrier (signatureCombos.ts): back from the attachment to stretch the link.
      dash: { neutralSpecial: 'back' },
    },
    moves: {
      standingLight: {
        tuning: { startup: 3, hitstun: 12, knockback: 1 },
        into: ['standingHeavy', 'forwardLight'],
      },
      lowLight: {
        tuning: { startup: 4, hitstun: 14, knockback: 0.8 },
        // Élastique meurtrier: the low card confirms into the recall of a stretched link.
        into: ['forwardLight', 'standingHeavy', 'forwardSpecial'],
      },
      standingHeavy: {
        tuning: { startup: 8, hitstun: 19, knockback: 1.5, reach: 11.5 },
        into: [],
      },
      forwardLight: {
        tuning: { startup: 6, hitstun: 16, knockback: 1, reach: 11.5, lunge: 1.3 },
        into: ['forwardHeavy', 'standingHeavy'],
      },
      forwardHeavy: {
        tuning: { startup: 11, hitstun: 24, knockback: 1.8, reach: 14 },
        into: [],
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
      // Élastique meurtrier: the Aerial Axe closes on the Elastic Execution.
      airHeavy: { into: ['finisher'] },
    },
  },
  chrollo: {
    window: 6,
    block: 'backHeavy',
    grammar: {
      specials: ['lowHeavy', 'forwardLight'],
      supers: ['neutralSpecial'],
      // Double page (signatureCombosBookArmy.ts): the Silent Reap opens the accélération.
      dash: { lowHeavy: 'forward' },
    },
    moves: {
      standingLight: {
        tuning: { startup: 4, hitstun: 14, knockback: 0.7 },
        into: ['backHeavy', 'standingHeavy'],
      },
      lowLight: {
        tuning: { startup: 5, hitstun: 16, knockback: 0.7 },
        into: ['standingHeavy', 'backHeavy'],
      },
      standingHeavy: {
        // Lot 3: the former recovery link into the back heavy is a chain (see COMBO_GRAMMAR.md).
        tuning: { startup: 8, active: 4, recovery: 9, hitstun: 16, knockback: 1.2, reach: 10.5 },
        into: ['backHeavy'],
      },
      backHeavy: {
        tuning: { startup: 9, hitstun: 23, knockback: 1, reach: 11.5, lunge: 1.1 },
        into: [],
      },
      forwardHeavy: {
        tuning: { startup: 13, hitstun: 23, knockback: 1.5, reach: 13, lunge: 1.5 },
        into: [],
      },
      lowHeavy: {
        tuning: { startup: 10, recovery: 19, damage: 10, knockback: 3.1, reach: 11.5 },
        into: [],
      },
      forwardLight: {
        tuning: { startup: 9, recovery: 22, damage: 12, knockback: 6.8, reach: 14 },
        // Double page: the Quick Palm alone opens the bookmarked page; no normal does.
        into: ['finisher'],
      },
      neutralSpecial: { into: [] },
      airLight: { tuning: { hitstun: 18, knockback: 1.3 }, into: ['airHeavy'] },
      airHeavy: { into: [] },
    },
  },
  feitan: {
    window: 5,
    block: 'standingHeavy',
    grammar: { specials: ['lowHeavy', 'forwardHeavy'], supers: ['forwardSpecial'] },
    moves: {
      standingLight: {
        tuning: { startup: 3, hitstun: 11, knockback: 0.8 },
        into: ['standingHeavy', 'forwardLight'],
      },
      lowLight: {
        tuning: { startup: 4, hitstun: 14, knockback: 0.7 },
        into: ['forwardLight', 'standingHeavy'],
      },
      standingHeavy: {
        tuning: { startup: 7, hitstun: 19, knockback: 1.2, reach: 11.5 },
        into: ['forwardLight'],
      },
      forwardLight: {
        // +3 at most: Feitan's jab starts in 3 frames, so +4 would link back into it.
        tuning: { startup: 5, hitstun: 15, knockback: 0.8, reach: 11.5, lunge: 1.3 },
        into: ['backHeavy'],
      },
      backHeavy: {
        tuning: { startup: 7, hitstun: 19, knockback: 1, reach: 12, lunge: 1.2 },
        into: [],
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
