import { createCinematicTrack } from './cinematicCamera'
import { createCloseupTrack } from './closeupTrack'
import { createRangedCloseups } from './rangedCloseupTrack'
import type { FightState } from '../../src/lib/fighting/types'

export function createShowcaseTracks(
  states: FightState[],
  flags: {
    cinematic: boolean
    longForm: boolean
    rangedDynamic: boolean
  },
) {
  const detail = flags.rangedDynamic
    ? createRangedCloseups(states)
    : flags.longForm
      ? createCloseupTrack(states)
      : null
  return {
    closeupTrack: detail,
    cameraTrack: flags.cinematic ? createCinematicTrack(states, detail?.frames.map(Boolean)) : null,
  }
}
