import type { MoveSlot } from './types'

/** Immutable gameplay and animation intent for Kurapika's golden reference move. */
export const KURAPIKA_GOLDEN_HEAVY = {
  slot: 'standingHeavy' as MoveSlot,
  nameFr: 'Crochet au corps',
  nameEn: 'Body Hook',
  strikingSide: 'rear',
  guardSide: 'lead',
  supportFoot: 'lead',
  pivotFoot: 'rear',
  target: 'torso',
  frames: { startup: 8, active: 4, recovery: 14 },
  reviewFrames: [0, 2, 4, 6, 7, 8, 11, 14, 19, 25] as const,
} as const

export type KurapikaGoldenHeavyContract = typeof KURAPIKA_GOLDEN_HEAVY
