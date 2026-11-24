import { KURAPIKA_GOLDEN_HEAVY } from './kurapikaGoldenHeavy'
import type { FighterId } from './types'

export const GOLDEN_HEAVY_FACINGS = [1, -1] as const
export const GOLDEN_HEAVY_OUTCOMES = ['hit', 'block', 'whiff'] as const
export const GOLDEN_HEAVY_OPPONENTS = [
  'kalluto',
  'hisoka',
  'franklin',
] as const satisfies readonly FighterId[]
export const GOLDEN_HEAVY_PLAYBACK_RATES = [0.25, 0.5, 1, 2] as const
export const GOLDEN_HEAVY_ENTRIES = ['idle', 'advance', 'retreat', 'dash'] as const

export interface GoldenHeavyCertificationCase {
  facing: (typeof GOLDEN_HEAVY_FACINGS)[number]
  outcome: (typeof GOLDEN_HEAVY_OUTCOMES)[number]
  opponent: (typeof GOLDEN_HEAVY_OPPONENTS)[number]
  playbackRate: (typeof GOLDEN_HEAVY_PLAYBACK_RATES)[number]
  entry: (typeof GOLDEN_HEAVY_ENTRIES)[number]
}

/** Exhaustive review matrix; gameplay frames remain the source of truth at every playback rate. */
export function goldenHeavyCertificationCases(): GoldenHeavyCertificationCase[] {
  return GOLDEN_HEAVY_FACINGS.flatMap((facing) =>
    GOLDEN_HEAVY_OUTCOMES.flatMap((outcome) =>
      GOLDEN_HEAVY_OPPONENTS.flatMap((opponent) =>
        GOLDEN_HEAVY_PLAYBACK_RATES.flatMap((playbackRate) =>
          GOLDEN_HEAVY_ENTRIES.map((entry) => ({ facing, outcome, opponent, playbackRate, entry })),
        ),
      ),
    ),
  )
}

export function goldenHeavyReviewSeconds(frame: number, playbackRate: number): number {
  return frame / (60 * playbackRate)
}

export function goldenHeavyCertificationDrawCount(): number {
  return goldenHeavyCertificationCases().length * KURAPIKA_GOLDEN_HEAVY.reviewFrames.length
}
