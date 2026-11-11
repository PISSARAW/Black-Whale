import type { BodyZone, FighterState } from './types'

export interface AuraReading {
  guard: BodyZone | null
  koZone: BodyZone | null
  ken: boolean
  concealed: boolean
  intentZone: BodyZone | null
  intentRemaining: number | null
  feintZone: BodyZone | null
  presenceDetected: boolean
}

/** In conceals the distribution; Gyo reveals it rather than being defeated by it. */
export function readAura(observer: FighterState, target: FighterState): AuraReading {
  const inEn =
    observer.en !== null &&
    Math.hypot(
      observer.position[0] - target.position[0],
      observer.position[1] - target.position[1],
    ) <= observer.en
  if (!observer.gyo) {
    return {
      guard: null,
      koZone: null,
      ken: target.ken,
      concealed: target.in,
      intentZone: target.in ? null : (target.intent?.zone ?? null),
      intentRemaining: target.in ? null : (target.intent?.remaining ?? null),
      feintZone: target.in ? null : target.feint,
      presenceDetected: !target.in || inEn,
    }
  }
  return {
    guard: target.guard,
    koZone: target.ko?.zone ?? null,
    ken: target.ken,
    concealed: false,
    intentZone: target.intent?.zone ?? null,
    intentRemaining: target.intent?.remaining ?? null,
    feintZone: target.feint,
    presenceDetected: true,
  }
}
