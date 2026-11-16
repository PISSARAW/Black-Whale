import type { ArcadeFighter } from './types'

export const HEALTH_PER_BAR = 100
export const DUEL_HEALTH = 3 * HEALTH_PER_BAR

/** Percentage of the whole reserve, for tactical thresholds shared by all formats. */
export function healthPercent(fighter: ArcadeFighter): number {
  return (100 * fighter.health) / fighter.maxHealth
}

/** Lowest bar first; damage spills into the next bar without a pause or reset. */
export function healthBars(health: number, maximum: number): number[] {
  return Array.from({ length: Math.ceil(maximum / HEALTH_PER_BAR) }, (_, index) =>
    Math.max(0, Math.min(HEALTH_PER_BAR, health - index * HEALTH_PER_BAR)),
  )
}
