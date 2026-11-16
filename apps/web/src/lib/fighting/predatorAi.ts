import { predatorReady } from './predator'
import { PREDATOR_PREY, preyIsLive } from './predatorPrey'
import type { FightState, MoveSlot } from './types'

export function predatorAiSlots(state: FightState): readonly MoveSlot[] {
  if (predatorReady(state, 'opponent')) return ['finisher']
  const predator = state.opponent.predator
  if (!predator?.watching && !predator?.hunt) return ['neutralSpecial', 'standingLight']
  const analysis = predator.analysis
  if (
    analysis &&
    !preyIsLive(state, analysis.owner, analysis.preyId) &&
    PREDATOR_PREY.some((prey) => preyIsLive(state, 'player', prey.id))
  )
    return ['forwardSpecial', 'standingLight']
  return ['standingLight', 'backHeavy']
}
