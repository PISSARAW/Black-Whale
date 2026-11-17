import { advanceCatsName } from './camillaCat'
import { advanceEmperorClock } from './kurapikaActions'
import type { FightState } from './types'

/** A post-mortem sequence must not advance a forecast/replay cursor around the frozen duel. */
export function stepPostMortemOrFuture(state: FightState, simulate: () => FightState): FightState {
  return state.catsName ? advanceCatsName(advanceEmperorClock(state)) : simulate()
}
