import { arsenalMindAvailable } from './arsenalMind'
import { mapPhysicalBodies } from './physicalBodyMap'
import { observeSecretWindow, secretWindowTarget } from './secretWindow'
import { secretWindowNenActive } from './secretWindowAccess'
import type { ArcadeFighter, FightState } from './types'

/** A relay moves bodies, not the bird's attachment or the owner's private feed. */
export function advanceSecretWindowFeeds(state: FightState): FightState {
  if (state.pvpSeat) return state
  return mapPhysicalBodies(state, (owner) => {
    const feed = owner.secretWindow
    if (!feed && !owner.secretWindowListening) return owner
    if (!secretWindowNenActive(owner)) return clearWindowOwner(owner)
    if (!feed) return owner
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

function clearWindowOwner(owner: ArcadeFighter): ArcadeFighter {
  const baton = owner.hatsuEffects.baton
  return {
    ...owner,
    secretWindow: undefined,
    secretWindowListening: undefined,
    hatsuEffects: baton
      ? { ...owner.hatsuEffects, baton: { ...baton, markedTarget: null } }
      : owner.hatsuEffects,
  }
}
