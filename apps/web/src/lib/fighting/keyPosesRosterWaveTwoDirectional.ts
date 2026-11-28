import type { MoveTimeline } from './keyPoseTimeline'
import { rosterWaveOneGroundedTimeline } from './keyPosesRosterWaveOne'
import {
  ROSTER_DIRECTIONAL_ACCENTS,
  ROSTER_WAVE_ONE_DIRECTIONAL_SLOTS,
} from './keyPosesRosterWaveOneDirectional'
import { ROSTER_WAVE_TWO_FIGHTERS, ROSTER_WAVE_TWO_SIGNATURES } from './keyPosesRosterWaveTwo'
import type { MoveSlot } from './types'

export const ROSTER_WAVE_TWO_DIRECTIONAL_SLOTS = ROSTER_WAVE_ONE_DIRECTIONAL_SLOTS

export const ROSTER_WAVE_TWO_DIRECTIONAL_POSES = Object.fromEntries(
  ROSTER_WAVE_TWO_FIGHTERS.map((id) => [
    id,
    Object.fromEntries(
      ROSTER_WAVE_TWO_DIRECTIONAL_SLOTS.map((slot) => [
        slot,
        rosterWaveOneGroundedTimeline(id, slot, {
          signature: ROSTER_WAVE_TWO_SIGNATURES[id],
          accent: ROSTER_DIRECTIONAL_ACCENTS[slot],
        }),
      ]),
    ),
  ]),
) as Record<(typeof ROSTER_WAVE_TWO_FIGHTERS)[number], Partial<Record<MoveSlot, MoveTimeline>>>
