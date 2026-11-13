import { adaptOpponent, V3_OPPONENTS, type OpponentProfile } from './adaptation'
import type { ArenaDifficulty, OpponentDoctrine } from './ai'
import { ARENA_FORMATS, type ArenaFormat, type ArenaFormatId } from './formats'
import type { ArenaReplay } from './replay/types'

export type ArenaOpponentId = OpponentProfile['id'] | 'adaptive' | 'custom'

export interface ArenaExperience {
  format: ArenaFormat
  opponentId: ArenaOpponentId
  doctrine: OpponentDoctrine
  difficulty: ArenaDifficulty
  observedBouts: number
}

export interface ArenaMatchPreset {
  doctrine: OpponentDoctrine
  difficulty: ArenaDifficulty
}

export function resolveArenaExperience(input: {
  formatId: ArenaFormatId
  opponentId: ArenaOpponentId
  doctrine?: OpponentDoctrine
  difficulty?: ArenaDifficulty
  history?: ArenaReplay[]
  /** Campaign missions are authored match presets, not opponent defaults. */
  matchPreset?: ArenaMatchPreset
}): ArenaExperience {
  const format = ARENA_FORMATS.find(({ id }) => id === input.formatId) ?? ARENA_FORMATS[0]
  if (input.opponentId === 'custom') {
    return applyMatchPreset(
      {
        format,
        opponentId: 'custom',
        doctrine: input.doctrine ?? 'counter',
        difficulty: input.difficulty ?? 'fighter',
        observedBouts: 0,
      },
      input.matchPreset,
    )
  }
  if (input.opponentId === 'adaptive') {
    const adaptation = adaptOpponent(input.history ?? [])
    return applyMatchPreset(
      {
        format,
        opponentId: 'adaptive',
        doctrine: adaptation.doctrine,
        difficulty: adaptation.observedBouts >= 3 ? 'master' : 'fighter',
        observedBouts: adaptation.observedBouts,
      },
      input.matchPreset,
    )
  }
  const opponent = V3_OPPONENTS.find(({ id }) => id === input.opponentId) ?? V3_OPPONENTS[0]
  return applyMatchPreset(
    {
      format,
      opponentId: opponent.id,
      doctrine: opponent.doctrine,
      difficulty: opponent.difficulty,
      observedBouts: 0,
    },
    input.matchPreset,
  )
}

function applyMatchPreset(
  experience: ArenaExperience,
  preset: ArenaMatchPreset | undefined,
): ArenaExperience {
  return preset
    ? { ...experience, doctrine: preset.doctrine, difficulty: preset.difficulty }
    : experience
}
