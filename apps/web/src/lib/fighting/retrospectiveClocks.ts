import { advanceCookie } from './cookie'
import { advanceMoonlightPenalty } from './moonlightPenalty'
import type { FightState } from './types'

/** Hitstop pauses impacts, not the actual sleep duration or the week-long sanction. */
export function advanceRetrospectiveHitstop(state: FightState): FightState {
  return advanceCookie(advanceMoonlightPenalty(state))
}
