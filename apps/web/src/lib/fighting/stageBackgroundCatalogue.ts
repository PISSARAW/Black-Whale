import { describeStageBackground } from './stageBackgroundDescriptions'
import { SHIP_BACKGROUNDS } from './stageBackgroundShip'
import { ROYAL_BACKGROUNDS } from './stageBackgroundRoyal'
import type { FightStageId } from './stages'
import type { StageBackgroundDefinition } from './stageBackgroundTypes'
import { fighterDefinition } from './roster'
import type { FightState } from './types'

export const STAGE_BACKGROUNDS = {
  ...SHIP_BACKGROUNDS,
  ...ROYAL_BACKGROUNDS,
} satisfies Record<FightStageId, StageBackgroundDefinition>

export function backgroundParticipants(state?: FightState): string[] {
  if (!state) return []
  return [state.player.id, state.opponent.id].map((id) => fighterDefinition(id).modelId)
}

export function stageBackgroundDescription(
  stage: FightStageId,
  participants: readonly string[],
  language: 'fr' | 'en' = 'fr',
): string {
  return describeStageBackground({
    stage,
    definition: STAGE_BACKGROUNDS[stage],
    participants,
    language,
  })
}
