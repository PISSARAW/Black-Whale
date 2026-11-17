import { resolveMeleePair } from '../combatImpact'
import type { FightSide, FightState } from '../types'
import { mergeDuel, projectDuel } from './projection'
import { kameoOnStage, kameoSlot } from './state'

/**
 * Melee between one camp's on-stage kameo and the opposing leader, in a duel
 * projection. The opposing leader is a passive target here: none of its clocks,
 * AI or Hatsu frames advance, it only receives or lands strikes.
 *
 * Run after the main pair's contacts: an attack that already struck the leader is
 * spent (`impacted`) and cannot strike the kameo in the same frame.
 * Hatsu clocks of the kameo itself do not advance yet (KAMEOS.md, lot 7).
 */
export function resolveKameoContacts(state: FightState, side: FightSide): FightState {
  const slot = kameoSlot(state, side)
  if (!kameoOnStage(slot) || slot.fighter.health <= 0) return state
  if (state.catsName || state.phase !== 'fighting') return state
  const projection = projectDuel(state, side, slot)
  const view = resolveMeleePair(projection.view)
  return view === projection.view ? state : mergeDuel(state, projection, view)
}

/** Both camps, player first, as the main pair resolves its own attacks. */
export function resolveAllKameoContacts(state: FightState): FightState {
  if (!state.kameos) return state
  return resolveKameoContacts(resolveKameoContacts(state, 'player'), 'opponent')
}
