import type { MoveTimeline } from './keyPoseTimeline'
import { rosterWaveOneGroundedTimeline } from './keyPosesRosterWaveOne'
import {
  ROSTER_LOW_HEAVY_ACCENT,
  ROSTER_WAVE_ONE_FINISH_SLOTS,
  rosterAuthoredAirTimeline,
} from './keyPosesRosterWaveOneFinish'
import { ROSTER_WAVE_THREE_FIGHTERS, ROSTER_WAVE_THREE_SIGNATURES } from './keyPosesRosterWaveThree'
import type { MoveSlot } from './types'

export const ROSTER_WAVE_THREE_FINISH_SLOTS = ROSTER_WAVE_ONE_FINISH_SLOTS

export const ROSTER_WAVE_THREE_FINISH_POSES = Object.fromEntries(
  ROSTER_WAVE_THREE_FIGHTERS.map((id) => [
    id,
    {
      lowHeavy: rosterWaveOneGroundedTimeline(
        id,
        'lowHeavy',
        ROSTER_WAVE_THREE_SIGNATURES[id],
        ROSTER_LOW_HEAVY_ACCENT,
      ),
      airLight: rosterAuthoredAirTimeline(id, 'airLight', ROSTER_WAVE_THREE_SIGNATURES[id]),
      airHeavy: rosterAuthoredAirTimeline(id, 'airHeavy', ROSTER_WAVE_THREE_SIGNATURES[id]),
    },
  ]),
) as Record<(typeof ROSTER_WAVE_THREE_FIGHTERS)[number], Partial<Record<MoveSlot, MoveTimeline>>>
