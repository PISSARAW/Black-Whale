import { advanceVoiceRecovery } from './blackVoiceAutopilot'
import { expireHistoricalMatter } from './historicalMatterClock'
import type { FightState } from './types'

/** Physical recovery follows elapsed frames, including hitstop and post-mortem sequences. */
export function finishPhysicalFrame(state: FightState): FightState {
  return expireHistoricalMatter(advanceVoiceRecovery(state))
}
