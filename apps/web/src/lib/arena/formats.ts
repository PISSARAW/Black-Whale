import type { CombatState } from '../combat/types'

export type ArenaFormatId = 'first-to-three' | 'survival' | 'forced-mastery' | 'sudden-death'

export interface ArenaFormat {
  id: ArenaFormatId
  titleFr: string
  titleEn: string
  scoreToWin: number
  timeLimit: number | null
  requiredAction?: 'GYO' | 'RYU' | 'HATSU'
}

export const ARENA_FORMATS: ArenaFormat[] = [
  {
    id: 'first-to-three',
    titleFr: 'Premier à trois',
    titleEn: 'First to Three',
    scoreToWin: 3,
    timeLimit: null,
  },
  {
    id: 'survival',
    titleFr: 'Survie 90 s',
    titleEn: '90s Survival',
    scoreToWin: 99,
    timeLimit: 90,
  },
  {
    id: 'forced-mastery',
    titleFr: 'Maîtrise imposée',
    titleEn: 'Forced Mastery',
    scoreToWin: 3,
    timeLimit: 120,
    requiredAction: 'RYU',
  },
  {
    id: 'sudden-death',
    titleFr: 'Mort subite',
    titleEn: 'Sudden Death',
    scoreToWin: 1,
    timeLimit: 45,
  },
]

export function formatOutcome(
  format: ArenaFormat,
  state: CombatState,
  usedRequiredAction = false,
): CombatState['outcome'] {
  if (format.requiredAction && !usedRequiredAction && state.player.score >= format.scoreToWin)
    return 'playing'
  if (state.player.score >= format.scoreToWin) return 'won'
  if (state.opponent.score >= format.scoreToWin) return 'lost'
  if (format.timeLimit !== null && state.clock >= format.timeLimit) {
    return state.player.score >= state.opponent.score ? 'won' : 'lost'
  }
  return 'playing'
}
