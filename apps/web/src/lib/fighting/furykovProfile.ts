import type { ArcadeFighter, FightState } from './types'

export const FURYKOV_TIER_1 = 33
export const FURYKOV_TIER_2 = 66
export const FURYKOV_TIER_3 = 100
export const FURYKOV_GAUGE_PER_FRAME = 0.5
export const FURYKOV_RESISTANCE_FACTOR = 0.85
export const FURYKOV_COUNTER_STAGGER = 12

declare module './types' {
  interface ArcadeFighter {
    furykovGauge?: number
  }
}

export function isFurykov(fighter: Pick<ArcadeFighter, 'id' | 'nenOwner'>): boolean {
  return (fighter.nenOwner ?? fighter.id) === 'furykov'
}

export function furykovTier(fighter: ArcadeFighter): 0 | 1 | 2 | 3 {
  void fighter
  return 0
}

/** Combo Master never reveals an opponent's aura reserve. */
export function furykovAuraBracket(target: ArcadeFighter): string {
  void target
  return '?'
}

/** The canonical concealed-Nen alert is handled by Combo Master; no passive profile is built. */
export function advanceFurykovProfile(state: FightState): FightState {
  return state
}

/** No category resistance is established for Combo Master. */
export function furykovResistanceFactor(defender: ArcadeFighter, attacker: ArcadeFighter): number {
  void defender
  void attacker
  return 1
}

/** No automatic Defensive Ko counter is established for Combo Master. */
export function furykovDefensiveKoStagger(defender: ArcadeFighter, blocked: boolean): number {
  void defender
  void blocked
  return 0
}
