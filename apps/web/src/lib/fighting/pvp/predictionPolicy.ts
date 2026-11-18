import { FIGHTING_ROSTER } from '../roster'
import type { FightState } from '../types'

const FIGHTERS = new Set(FIGHTING_ROSTER.map(({ id }) => id))

/** All roster bodies are eligible. Alternate timelines and post-mortem sequences stay confirmed. */
export function predictionEligible(state: FightState): boolean {
  if (state.phase !== 'fighting' || state.parallelFuture || state.catsName) return false
  if (state.rosterGuests?.some((guest) => guest.phase !== 'eliminated')) return false
  if (
    state.battlefield?.entities.some((entry) => entry.kind === 'camera' && entry.statements?.length)
  )
    return false
  return FIGHTERS.has(state.player.id) && FIGHTERS.has(state.opponent.id)
}

/** A projection may move immediately once confirmed, but cannot invent a new controlled vessel. */
export function sameControlledBody(authority: FightState, predicted: FightState): boolean {
  return (
    authority.player.id === predicted.player.id &&
    Boolean(authority.player.hanzoProjection) === Boolean(predicted.player.hanzoProjection)
  )
}
