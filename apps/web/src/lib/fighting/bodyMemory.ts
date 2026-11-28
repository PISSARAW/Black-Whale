import { ERIGERON_BODY_MEMORY_DRAIN } from './zodiacAndHeirUpgrades'
import type { ArcadeFighter, FightNenZone } from './types'

export type BodyMemoryZone = Extract<FightNenZone, 'hands' | 'feet'>

export interface BodyMemoryState {
  /** Landed blows remembered by each striking limb group for the duration of the match. */
  hits: Partial<Record<BodyMemoryZone, number>>
}

export const BODY_MEMORY_HIT_THRESHOLD = 3
export const BODY_MEMORY_RYU_DRAIN = 3
export const BODY_MEMORY_ATTACK_FACTOR = 0.82

export function rememberBodyHit(
  fighter: ArcadeFighter,
  { zone, damage, blocked }: { zone: FightNenZone | undefined; damage: number; blocked: boolean },
): ArcadeFighter {
  if ((zone !== 'hands' && zone !== 'feet') || blocked || damage <= 0) return fighter
  const hits = Math.min(BODY_MEMORY_HIT_THRESHOLD, (fighter.bodyMemory?.hits[zone] ?? 0) + 1)
  return {
    ...fighter,
    bodyMemory: { hits: { ...fighter.bodyMemory?.hits, [zone]: hits } },
  }
}

export function bodyMemoryWeak(fighter: ArcadeFighter, zone: FightNenZone): boolean {
  if (zone !== 'hands' && zone !== 'feet') return false
  return (fighter.bodyMemory?.hits[zone] ?? 0) >= BODY_MEMORY_HIT_THRESHOLD
}

/** A weakened region asks for more aura whenever Ryu concentrates most of its flow there. */
export function bodyMemoryRyuDrain(fighter: ArcadeFighter): number {
  const focus = (['hands', 'feet'] as const).find(
    (zone) => bodyMemoryWeak(fighter, zone) && Number(fighter.nen.ryu[zone] ?? 0) >= 0.5,
  )
  if (!focus) return 0
  return (fighter.erigeronCatalystFrames ?? 0) > 0
    ? ERIGERON_BODY_MEMORY_DRAIN
    : BODY_MEMORY_RYU_DRAIN
}

/** Continuing to strike with an overused limb remains possible, but is deliberately inefficient. */
export function bodyMemoryAttackFactor(fighter: ArcadeFighter, zone: FightNenZone): number {
  return bodyMemoryWeak(fighter, zone) ? BODY_MEMORY_ATTACK_FACTOR : 1
}

export function bodyMemoryLabel(fighter: ArcadeFighter, language: 'fr' | 'en'): string | null {
  const weak = (['hands', 'feet'] as const).filter((zone) => bodyMemoryWeak(fighter, zone))
  if (!weak.length) return null
  const labels = weak.map((zone) =>
    language === 'fr' ? (zone === 'hands' ? 'bras' : 'jambes') : zone === 'hands' ? 'arms' : 'legs',
  )
  return `${language === 'fr' ? 'Mémoire du corps' : 'Body memory'} · ${labels.join(' + ')}`
}

export function carryBodyMemory(fighter: ArcadeFighter, previous: ArcadeFighter): ArcadeFighter {
  return previous.bodyMemory ? { ...fighter, bodyMemory: previous.bodyMemory } : fighter
}
