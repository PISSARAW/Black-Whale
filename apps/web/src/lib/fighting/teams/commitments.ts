import type { FightSide, FightState } from '../types'
import type { PreparedEntity } from '../preparationTypes'

/** Side-owned world effects cannot be handed to a different body by a relay. */
export function teamWorldEngaged(state: FightState, side: FightSide): boolean {
  if (gumWorldEngaged(state, side)) return true
  if (
    state.arena &&
    [state.arena.pending[side], state.arena.tether[side], state.arena.stored[side]].some(Boolean)
  )
    return true
  if (state.battlefield?.luiniAnchors?.[side]) return true
  return (state.battlefield?.entities ?? []).some((entry) => ownedEffect(entry, side))
}
function gumWorldEngaged(state: FightState, side: FightSide): boolean {
  return Boolean(
    state.gumNetwork?.links.some((link) => link.owner === side) || state.gumNetwork?.pending[side],
  )
}
function ownedEffect(entry: PreparedEntity, side: FightSide): boolean {
  if (entry.health <= 0) return false
  const owners = [entry.controller?.side, entry.copy?.owner, entry.arena?.sun, entry.arena?.moon]
  if (owners.includes(side)) return true
  if (!entry.present) return false
  // Existing fire has no caster field: keep both bodies until its clock resolves.
  return Boolean(entry.arena?.burning)
}
