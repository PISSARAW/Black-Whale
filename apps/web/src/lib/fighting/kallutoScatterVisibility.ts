import { gyoSight } from './nenPerception'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'
type PaperView = Pick<FightState, 'player' | 'opponent' | 'battlefield'>

/** Ordinary paper remains visible; In can conceal a conjured copy's matter. */
export function paperScatterVisible(
  state: PaperView,
  entry: PreparedEntity,
  observer: FightSide,
): boolean {
  const paper = entry.paperScatter
  if (!paper || entry.material === 'real' || !paper.hidden) return true
  return paper.owner.owner === observer || gyoSight(state[observer])
}
export function concealPaperScatters(state: PaperView, observer: FightSide): void {
  if (!state.battlefield) return
  state.battlefield.entities = state.battlefield.entities.filter((entry) =>
    paperScatterVisible(state, entry, observer),
  )
}
