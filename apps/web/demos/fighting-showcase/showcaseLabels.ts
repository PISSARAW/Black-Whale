import { FIGHT_STAGES } from '../../src/lib/fighting/stages'
import type { FightStageId } from '../../src/lib/fighting/stages'

export function showcaseStageName(stageId: FightStageId, ballroom = false) {
  return ballroom
    ? 'SALLE DE BAL'
    : FIGHT_STAGES.find((stage) => stage.id === stageId)!.nameFr.toUpperCase()
}
