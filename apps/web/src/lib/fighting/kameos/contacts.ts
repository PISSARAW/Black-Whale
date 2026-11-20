import { resolveMeleePair } from '../combatImpact'
import { activeHitbox, boxesOverlap, hurtboxes, otherSide } from '../frameData'
import type { FightSide, FightState } from '../types'
import { guardAllyWound } from '../sweetHomeAlly'
import { mergeDuel, projectDuel } from './projection'
import { kameoOnStage, kameoSlot } from './state'

/**
 * Melee between one camp's on-stage kameo and the opposing leader, in a duel
 * projection. The opposing leader is a passive target here: none of its clocks,
 * AI or Hatsu frames advance, it only receives or lands strikes. A strike already
 * spent (`impacted`) on another body cannot land again in the same frame.
 */
export function resolveKameoContacts(state: FightState, side: FightSide): FightState {
  const slot = kameoSlot(state, side)
  if (!kameoOnStage(slot) || slot.fighter.health <= 0) return state
  if (state.catsName || state.phase !== 'fighting') return state
  const projection = projectDuel(state, side, slot)
  const view = resolveMeleePair(projection.view)
  if (view === projection.view) return state
  // Terebellum's right hand may take the ally's wound out through her left hand.
  return guardAllyWound({ before: state, after: mergeDuel(state, projection, view), side })
}

/** Both camps, player first, as the main pair resolves its own attacks. */
export function resolveAllKameoContacts(state: FightState): FightState {
  if (!state.kameos) return state
  return resolveKameoContacts(resolveKameoContacts(state, 'player'), 'opponent')
}

/**
 * Before the main pair: a kameo standing nearer to the attacker than its leader, and
 * inside the active hitbox, takes the strike first (the rosterGuests convention).
 */
export function resolveNearerKameoContacts(state: FightState): FightState {
  if (!state.kameos) return state
  let next = state
  for (const side of ['player', 'opponent'] as const)
    if (kameoShieldsLeader(next, side)) next = resolveKameoContacts(next, side)
  return next
}

function kameoShieldsLeader(state: FightState, side: FightSide): boolean {
  const slot = kameoSlot(state, side)
  if (!kameoOnStage(slot)) return false
  const attacker = state[otherSide(side)]
  if (!attacker.attack || attacker.attack.impacted) return false
  const kameoGap = Math.abs(attacker.x - slot.fighter.x)
  if (kameoGap >= Math.abs(attacker.x - state[side].x)) return false
  const hitbox = activeHitbox(attacker)
  return Boolean(hitbox && hurtboxes(slot.fighter).some((box) => boxesOverlap(hitbox, box)))
}
