import { advanceVoiceRecovery } from './blackVoiceAutopilot'
import { expireHistoricalMatter } from './historicalMatterClock'
import { reconcileGumObjectAnchors } from './gumObjectAnchorFrames'
import type { FightState } from './types'

/** Physical recovery follows elapsed frames, including hitstop and post-mortem sequences. */
export function finishPhysicalFrame(state: FightState): FightState {
  const next = expireHistoricalMatter(advanceVoiceRecovery(state))
  return reconcileGumObjectAnchors(reconcileGumObjectAnchors(next, 'player'), 'opponent')
}
