import { arsenalMindAvailable } from './arsenalMind'
import { mapPhysicalBodies } from './physicalBodyMap'
import { observeSecretWindow, secretWindowTarget } from './secretWindow'
import { secretWindowNenActive } from './secretWindowAccess'
import type { FightState } from './types'

/** A relay moves bodies, not the bird's attachment or the owner's private feed. */
export function advanceSecretWindowFeeds(state: FightState): FightState {
  if (state.pvpSeat) return state
  return mapPhysicalBodies(state, (owner) => {
    const feed = owner.secretWindow
    if (!feed) return owner
    if (!secretWindowNenActive(owner)) return { ...owner, secretWindow: undefined }
    if (!arsenalMindAvailable(owner)) return owner
    const target = secretWindowTarget(state, feed)
    if (!target) return owner
    return {
      ...owner,
      secretWindow: {
        ...feed,
        observation: observeSecretWindow(state, feed.target, feed.targetMember),
      },
    }
  })
}
