import { stepGumResuscitation } from './gumResuscitation'
import { advanceVoiceRecovery } from './blackVoiceAutopilot'
import { reconcileBlackVoice } from './blackVoice'
import { advanceCatsName } from './camillaCat'
import { advanceEmperorClock } from './kurapikaActions'
import { expireHistoricalMatter } from './historicalMatterClock'
import type { FightState } from './types'

/** A post-mortem sequence must not advance a forecast/replay cursor around the frozen duel. */
export function stepPostMortemOrFuture(state: FightState, simulate: () => FightState): FightState {
  if (state.gumResuscitation) return stepGumResuscitation(state)
  return state.catsName
    ? reconcileBlackVoice(
        advanceVoiceRecovery(expireHistoricalMatter(advanceCatsName(advanceEmperorClock(state)))),
      )
    : simulate()
}
