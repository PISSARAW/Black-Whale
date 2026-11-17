import { arsenalMindAvailable } from './arsenalMind'
import { mapPhysicalBodies } from './physicalBodyMap'
import { sleepingBody } from './hanzoProjection'
import { secretWindowTarget, secretWindowNenActive } from './secretWindow'
import type { FightSide, FightState } from './types'

/** Receives actual nearby utterances, including through a wall, never private intent. */
export function captureSecretWindowSpeech(
  state: FightState,
  speech: { side: FightSide; text: string },
): FightState {
  if (state.pvpSeat) return state
  return mapPhysicalBodies(state, (owner) => {
    const feed = owner.secretWindow
    if (!feed || !secretWindowNenActive(owner) || !arsenalMindAvailable(owner)) return owner
    const target = secretWindowTarget(state, feed)
    if (!target) return owner
    const anchor = sleepingBody(target)
    const speaker = state[speech.side]
    // The radius of a physical voice is scenario tuning, not a range cap on the Nen link.
    if (Math.hypot(speaker.x - anchor.x, speaker.y - anchor.y) > 18) return owner
    return {
      ...owner,
      secretWindow: {
        ...feed,
        heard: { frame: state.frame, text: speech.text },
      },
    }
  })
}
