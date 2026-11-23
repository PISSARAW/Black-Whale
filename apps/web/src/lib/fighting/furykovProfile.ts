import { FIGHT_NEN_PROFILES } from './nenCatalogue.gen'
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
  const g = fighter.furykovGauge ?? 0
  if (g >= FURYKOV_TIER_3) return 3
  if (g >= FURYKOV_TIER_2) return 2
  if (g >= FURYKOV_TIER_1) return 1
  return 0
}

/** Passive analytical vision: Furykov reads In-concealed aura in 25% brackets without Gyo. */
export function furykovAuraBracket(target: ArcadeFighter): string {
  const aura = Math.max(0, Math.min(100, target.aura))
  if (aura < 25) return '0–25 / 100'
  if (aura < 50) return '25–50 / 100'
  if (aura < 75) return '50–75 / 100'
  return '75–100 / 100'
}

function opponentUsingActiveNen(fighter: ArcadeFighter): boolean {
  if (fighter.nen.mode === 'zetsu') return false
  return Boolean(
    fighter.nen.mode === 'ren' ||
      fighter.nen.ken ||
      fighter.nen.ko ||
      fighter.nen.en ||
      fighter.nen.gyo ||
      Object.values(fighter.nen.ryu).some((share) => Number(share) > 0) ||
      fighter.attack?.hatsuSource,
  )
}

/** Fills Furykov's profiling gauge whenever the opponent uses active Nen in sight. */
export function advanceFurykovProfile(state: FightState): FightState {
  if (state.phase !== 'fighting') return state
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const f = next[side]
    if (!isFurykov(f)) continue
    const foe = next[side === 'player' ? 'opponent' : 'player']
    if (!opponentUsingActiveNen(foe)) continue
    const gauge = Math.min(FURYKOV_TIER_3, (f.furykovGauge ?? 0) + FURYKOV_GAUGE_PER_FRAME)
    if (gauge !== f.furykovGauge) {
      next = { ...next, [side]: { ...f, furykovGauge: gauge } }
    }
  }
  return next
}

/** Tier 2 (66%+): +15% resistance against the opponent's primary Nen category. */
export function furykovResistanceFactor(defender: ArcadeFighter, attacker: ArcadeFighter): number {
  if (!isFurykov(defender) || furykovTier(defender) < 2) return 1
  const affinity = FIGHT_NEN_PROFILES[attacker.nenOwner ?? attacker.id]?.affinity
  if (!affinity || affinity === 'unknown') return 1
  return FURYKOV_RESISTANCE_FACTOR
}

/** Tier 3 (100%): blocking in Defensive Ko triggers a 12-frame counter-stagger on the attacker. */
export function furykovDefensiveKoStagger(defender: ArcadeFighter, blocked: boolean): number {
  if (!blocked || !isFurykov(defender) || furykovTier(defender) < 3) return 0
  return defender.nen.ko ? FURYKOV_COUNTER_STAGGER : 0
}
