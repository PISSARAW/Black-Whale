import type { MoveTimeline } from './keyPoseTimeline'
import { rosterWaveOneGroundedTimeline } from './keyPosesRosterWaveOne'
import {
  ROSTER_DIRECTIONAL_ACCENTS,
  ROSTER_WAVE_ONE_DIRECTIONAL_SLOTS,
} from './keyPosesRosterWaveOneDirectional'
import { ROSTER_WAVE_THREE_FIGHTERS, ROSTER_WAVE_THREE_SIGNATURES } from './keyPosesRosterWaveThree'
import type { MoveSlot } from './types'

export const ROSTER_WAVE_THREE_DIRECTIONAL_SLOTS = ROSTER_WAVE_ONE_DIRECTIONAL_SLOTS

export const ROSTER_WAVE_THREE_DIRECTIONAL_POSES = Object.fromEntries(
  ROSTER_WAVE_THREE_FIGHTERS.map((id) => [
    id,
    Object.fromEntries(
      ROSTER_WAVE_THREE_DIRECTIONAL_SLOTS.map((slot) => [
        slot,
        rosterWaveOneGroundedTimeline(id, slot, {
          signature: ROSTER_WAVE_THREE_SIGNATURES[id],
          accent: ROSTER_DIRECTIONAL_ACCENTS[slot],
        }),
      ]),
    ),
  ]),
) as Record<(typeof ROSTER_WAVE_THREE_FIGHTERS)[number], Partial<Record<MoveSlot, MoveTimeline>>>
