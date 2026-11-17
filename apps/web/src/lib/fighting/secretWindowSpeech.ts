import { arsenalMindAvailable } from './arsenalMind'
import { captureShoulderWindowSpeech } from './secretWindowListening'
import { mapPhysicalBodies } from './physicalBodyMap'
import { secretWindowTarget, secretWindowNenActive, type SecretWindowState } from './secretWindow'
import type { FightSide, FightState } from './types'

/** Contact reports the marked body's words; ambient eavesdropping uses the shoulder bird. */
export function captureSecretWindowSpeech(
  state: FightState,
  speech: { side: FightSide; text: string },
): FightState {
  if (state.pvpSeat) return state
  return mapPhysicalBodies(captureShoulderWindowSpeech(state, speech), (owner) => {
    const feed = owner.secretWindow
    if (!feed || !secretWindowNenActive(owner) || !arsenalMindAvailable(owner)) return owner
    const target = secretWindowTarget(state, feed)
    if (!target) return owner
    if (!markedBodySpeaks(state, feed, speech.side)) return owner
    return {
      ...owner,
      secretWindow: {
        ...feed,
        heard: { frame: state.frame, text: speech.text },
      },
    }
  })
}

function markedBodySpeaks(state: FightState, feed: SecretWindowState, speaker: FightSide): boolean {
  const member = state.teamMatch?.seats[speaker].active ?? 0
  return (
    feed.target === speaker &&
    (feed.targetMember ?? 0) === member &&
    !state[speaker].hanzoProjection
  )
}
