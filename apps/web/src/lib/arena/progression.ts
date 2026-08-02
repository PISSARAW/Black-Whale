import type { CombatEvent } from '../combat/types'
import type { ArenaDifficulty } from './ai'

export interface ArenaStats {
  attacks: number
  hits: number
  blocks: number
  hatsu: number
}

export const EMPTY_STATS: ArenaStats = { attacks: 0, hits: 0, blocks: 0, hatsu: 0 }

export function difficultyLabel(level: ArenaDifficulty, locale: 'fr' | 'en'): string {
  const labels = {
    fr: { initiate: 'Initié', fighter: 'Combattant', master: 'Maître' },
    en: { initiate: 'Initiate', fighter: 'Fighter', master: 'Master' },
  } as const
  return labels[locale][level]
}

export function recordEvent(stats: ArenaStats, event: CombatEvent): ArenaStats {
  if (event.attacker === 'player') {
    return {
      ...stats,
      attacks: stats.attacks + 1,
      hits: stats.hits + (event.impact === 'miss' || event.impact === 'blocked' ? 0 : 1),
      hatsu: stats.hatsu + (event.technique === 'hatsu' ? 1 : 0),
    }
  }
  return { ...stats, blocks: stats.blocks + (event.impact === 'blocked' ? 1 : 0) }
}

export function gradeArena(stats: ArenaStats, won: boolean, aura: number): 'S' | 'A' | 'B' | 'C' {
  const accuracy = stats.attacks === 0 ? 0 : stats.hits / stats.attacks
  const score = (won ? 45 : 0) + accuracy * 30 + Math.min(15, stats.blocks * 5) + aura * 0.1
  if (score >= 85) return 'S'
  if (score >= 70) return 'A'
  if (score >= 50) return 'B'
  return 'C'
}
