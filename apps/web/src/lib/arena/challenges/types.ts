import type { ArenaReplay } from '../replay/types'

export type ChallengeObjective =
  | { kind: 'use'; action: ArenaReplay['commands'][number]['action']['type']; count: number }
  | { kind: 'win' }
  | { kind: 'accuracy'; minimum: number }
  | { kind: 'aura'; minimum: number }
  | { kind: 'blocks'; count: number }

export interface ArenaChallenge {
  id: string
  titleFr: string
  titleEn: string
  objectives: ChallengeObjective[]
}

export interface ChallengeResult {
  complete: boolean
  satisfied: boolean[]
  grade: 'S' | 'A' | 'B' | 'C'
}
