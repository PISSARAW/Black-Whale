import { advanceBashoWardClocks } from './bashoWard'
import { advanceGallerySenses } from './gallerySense'
import { advanceBiohazardDeviceClocks } from './biohazardDevices'
import { advanceDeviceRecordings } from './deviceRecording'
import { advanceCookie } from './cookie'
import { advanceMoonlightPenalty } from './moonlightPenalty'
import type { FightState } from './types'

/** Hitstop pauses impacts, not the actual sleep duration or the week-long sanction. */
export function advanceRetrospectiveHitstop(state: FightState): FightState {
  return advanceGallerySenses(
    advanceDeviceRecordings(
      advanceBiohazardDeviceClocks(
        advanceBashoWardClocks(advanceCookie(advanceMoonlightPenalty(state))),
      ),
    ),
  )
}
