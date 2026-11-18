import { resolveCrossGamePhysicalUtility } from './crossGameAction'
import { canAct } from './fightActorState'
import { freeDeviceHand } from './deviceHands'
import { updateEntity } from './preparationWorld'
import type { FightSide, FightState } from './types'
import type { ArsenalCommand } from './retrospectiveTypes'

/** Ordinary physical handling of an existing crate, never a new Nen effect. */
export function performArenaObjectTurn(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  const actor = state[side]
  if (!turnBodyReady(state, side)) return state
  const entry = state.battlefield?.entities.find((e) => e.id === command.target)
  if (!entry?.arena || !turnableCrate(entry)) return state
  if (Math.hypot(entry.x - actor.x, entry.y - actor.y) > 8) return state
  const after = updateEntity(state, entry.id, {
    arena: { ...entry.arena, facing: entry.arena.facing === -1 ? 1 : -1 },
  })
  return resolveCrossGamePhysicalUtility(state, after, side)
}

function turnBodyReady(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  return Boolean(
    canAct(actor) && !actor.attack && !actor.hanzoProjection && freeDeviceHand(state, side),
  )
}
function turnableCrate(entry: import('./preparationTypes').PreparedEntity): boolean {
  return entry.kind === 'crate' && entry.present && entry.health > 0
}
