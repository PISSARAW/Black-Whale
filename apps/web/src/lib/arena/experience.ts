import { adaptOpponent, V3_OPPONENTS, type OpponentProfile } from './adaptation'
import type { ArenaDifficulty, OpponentDoctrine } from './ai'
import { ARENA_FORMATS, type ArenaFormat, type ArenaFormatId } from './formats'
import type { ArenaReplay } from './replay/types'

export type ArenaOpponentId = OpponentProfile['id'] | 'adaptive'

export interface ArenaExperience {
  format: ArenaFormat
  opponentId: ArenaOpponentId
  doctrine: OpponentDoctrine
  difficulty: ArenaDifficulty
  observedBouts: number
}

export function resolveArenaExperience(input: {
  formatId: ArenaFormatId
  opponentId: ArenaOpponentId
  history?: ArenaReplay[]
}): ArenaExperience {
  const format = ARENA_FORMATS.find(({ id }) => id === input.formatId) ?? ARENA_FORMATS[0]
  if (input.opponentId === 'adaptive') {
    const adaptation = adaptOpponent(input.history ?? [])
    return {
      format,
      opponentId: 'adaptive',
      doctrine: adaptation.doctrine,
      difficulty: adaptation.observedBouts >= 3 ? 'master' : 'fighter',
      observedBouts: adaptation.observedBouts,
    }
  }
  const opponent = V3_OPPONENTS.find(({ id }) => id === input.opponentId) ?? V3_OPPONENTS[0]
  return {
    format,
    opponentId: opponent.id,
    doctrine: opponent.doctrine,
    difficulty: opponent.difficulty,
    observedBouts: 0,
  }
}
