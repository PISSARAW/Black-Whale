import type { BodyZone, FighterState } from './types'

export interface AuraReading {
  guard: BodyZone | null
  koZone: BodyZone | null
  ken: boolean
  concealed: boolean
}

/** In conceals the distribution; Gyo reveals it rather than being defeated by it. */
export function readAura(observer: FighterState, target: FighterState): AuraReading {
  if (!observer.gyo) {
    return { guard: null, koZone: null, ken: target.ken, concealed: target.in }
  }
  return {
    guard: target.guard,
    koZone: target.ko?.zone ?? null,
    ken: target.ken,
    concealed: false,
  }
}
