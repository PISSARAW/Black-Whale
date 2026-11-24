import type { MoveTimeline } from './keyPoseTimeline'
import { rosterWaveOneGroundedTimeline } from './keyPosesRosterWaveOne'
import {
  ROSTER_LOW_HEAVY_ACCENT,
  ROSTER_WAVE_ONE_FINISH_SLOTS,
  rosterAuthoredAirTimeline,
} from './keyPosesRosterWaveOneFinish'
import { ROSTER_WAVE_TWO_FIGHTERS, ROSTER_WAVE_TWO_SIGNATURES } from './keyPosesRosterWaveTwo'
import type { MoveSlot } from './types'

export const ROSTER_WAVE_TWO_FINISH_SLOTS = ROSTER_WAVE_ONE_FINISH_SLOTS

export const ROSTER_WAVE_TWO_FINISH_POSES = Object.fromEntries(
  ROSTER_WAVE_TWO_FIGHTERS.map((id) => [
    id,
    {
      lowHeavy: rosterWaveOneGroundedTimeline(
        id,
        'lowHeavy',
        ROSTER_WAVE_TWO_SIGNATURES[id],
        ROSTER_LOW_HEAVY_ACCENT,
      ),
      airLight: rosterAuthoredAirTimeline(id, 'airLight', ROSTER_WAVE_TWO_SIGNATURES[id]),
      airHeavy: rosterAuthoredAirTimeline(id, 'airHeavy', ROSTER_WAVE_TWO_SIGNATURES[id]),
    },
  ]),
) as Record<(typeof ROSTER_WAVE_TWO_FIGHTERS)[number], Partial<Record<MoveSlot, MoveTimeline>>>
