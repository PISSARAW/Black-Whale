import { localPerspective, privatePvpState } from './view'
import { createFightingNen } from '../nen'
import { encodeFightSnapshot } from '../fightReplaySnapshot'
import { fightReplayHash } from '../fightReplayHash'
import { privateGumNetwork, privateGumProjectiles } from '../bungeePrivacy'
import type { FightState } from '../types'
declare module '../types' {
  interface FightState {
    spectatorView?: boolean
  }
}

/** Intersection of public manifestations: neither player's private observer can be selected. */
export function spectatorSnapshot(state: FightState) {
  const actual = { ...state, parallelFuture: undefined }
  const publicState = privatePvpState(privatePvpState(actual, 'player'), 'opponent')
  // The second projection swaps seats. Restore the canonical order without restoring private data.
  const view = localPerspective(publicState, true) as FightState
  view.enReadings = undefined
  view.parallelFuture = undefined
  view.commandFeedback = undefined
  view.bungeeGum = state.bungeeGum?.hidden ? null : state.bungeeGum
  view.gumNetwork = privateGumNetwork(state)
  view.projectiles = privateGumProjectiles(state).filter((shot) => shot.matter === 'object' || !shot.concealed)
  if (view.impact?.concealed) view.impact = null
  for (const side of ['player', 'opponent'] as const) {
    const actor = view[side]
    actor.nen = createFightingNen()
    actor.aura = 0
    if (actor.attack?.concealed) actor.attack = null
    actor.bufferedAttack = null
  }
  view.pvpSeat = undefined
  view.mode = 'versus-local'
  view.spectatorView = true
  return { snapshot: encodeFightSnapshot(view), snapshotHash: fightReplayHash(view) }
}
