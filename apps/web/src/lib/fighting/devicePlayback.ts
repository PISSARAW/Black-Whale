import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

/** A screen displays only recorded visible bodies and audible words, never latent Nen cues. */
export function watchDevice(state: FightState, side: FightSide, entry: PreparedEntity): FightState {
  const device = entry.device!
  if (device.kind !== 'camera' || device.batteryFrames <= 0) return state
  return {
    ...state,
    [side]: {
      ...state[side],
      devicePlayback: {
        deviceId: entry.id,
        viewedAt: state.frame,
        pictures: structuredClone(device.pictures ?? []),
        words: (device.words ?? []).map(({ deliberateLie: _cue, ...word }) => word),
      },
    },
  }
}
