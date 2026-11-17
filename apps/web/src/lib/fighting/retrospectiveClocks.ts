import { advanceBiohazardDeviceClocks } from './biohazardDevices'
import { advanceDeviceRecordings } from './deviceRecording'
import { advanceCookie } from './cookie'
import { advanceMoonlightPenalty } from './moonlightPenalty'
import type { FightState } from './types'

/** Hitstop pauses impacts, not the actual sleep duration or the week-long sanction. */
export function advanceRetrospectiveHitstop(state: FightState): FightState {
  return advanceDeviceRecordings(
    advanceBiohazardDeviceClocks(advanceCookie(advanceMoonlightPenalty(state))),
  )
}
