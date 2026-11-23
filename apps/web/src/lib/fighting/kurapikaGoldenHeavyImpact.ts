import type { ImpactPresentation } from './fightImpactPresentation'

export const KURAPIKA_GOLDEN_HEAVY_MOVE_ID = 'kurapika:standingHeavy'

export interface GoldenHeavyAudioAccent {
  thumpPeak: number
  thumpFrom: number
  thumpTo: number
  duration: number
  chainForce: number
}

export function isKurapikaGoldenHeavy(moveId?: string): boolean {
  return moveId === KURAPIKA_GOLDEN_HEAVY_MOVE_ID
}

/** Presentation-only accent: a compact, horizontal body blow instead of a larger generic explosion. */
export function kurapikaGoldenHeavyImpact(
  profile: ImpactPresentation,
  blocked: boolean,
): ImpactPresentation {
  return {
    ...profile,
    sparks: Math.max(1, Math.round(profile.sparks * (blocked ? 0.78 : 0.86))),
    sparkSpeed: profile.sparkSpeed * 0.9,
    sparkSize: profile.sparkSize * (blocked ? 0.82 : 0.9),
    shakeMs: profile.shakeMs * (blocked ? 0.72 : 0.88),
    shakeX: profile.shakeX * (blocked ? 1.02 : 1.16),
    shakeY: profile.shakeY * (blocked ? 0.56 : 0.64),
  }
}

export function kurapikaGoldenHeavyAudioAccent(blocked: boolean): GoldenHeavyAudioAccent {
  return blocked
    ? { thumpPeak: 0.035, thumpFrom: 125, thumpTo: 58, duration: 0.075, chainForce: 0.09 }
    : { thumpPeak: 0.06, thumpFrom: 165, thumpTo: 48, duration: 0.12, chainForce: 0.16 }
}
