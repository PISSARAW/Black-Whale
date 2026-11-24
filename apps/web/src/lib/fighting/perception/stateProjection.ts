import { createFightingNen } from '../nen'
import { privateGumNetwork, privateGumProjectiles } from '../bungeePrivacy'
import { futurePerceptionView } from '../futurePerception'
import { localPerspective, privatePvpState } from '../pvp/view'
import type { FightSide, FightState } from '../types'

export type FightAudience =
  | { kind: 'fighter'; side: FightSide }
  | { kind: 'spectator' }
  | { kind: 'perception'; side: FightSide }
  | { kind: 'simulation'; side: FightSide }

/**
 * Single privacy boundary for every non-authoritative representation of a fight.
 * Callers choose an audience, never a collection of ad-hoc fields to redact.
 */
export function projectFightState(state: FightState, audience: FightAudience): FightState {
  if (audience.kind === 'spectator') return spectatorFightState(state)
  const perceived =
    audience.kind === 'perception' ? (futurePerceptionView(state, audience.side) ?? state) : state
  const projected = privatePvpState(perceived, audience.side)
  return audience.kind === 'simulation' ? { ...projected, forecastSimulation: true } : projected
}

function spectatorFightState(state: FightState): FightState {
  const actual = { ...state, parallelFuture: undefined }
  const publicState = privatePvpState(privatePvpState(actual, 'player'), 'opponent')
  // The second projection swaps seats. Restore canonical order without restoring private facts.
  const view = localPerspective(publicState, true) as FightState
  view.enReadings = undefined
  view.parallelFuture = undefined
  view.commandFeedback = undefined
  view.bungeeGum = state.bungeeGum?.hidden ? null : state.bungeeGum
  view.gumNetwork = privateGumNetwork(state)
  view.projectiles = privateGumProjectiles(state).filter(
    (shot) => shot.matter === 'object' || !shot.concealed,
  )
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
  return view
}
