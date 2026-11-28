import type { FighterMove } from './movesetTypes'
import { rosterBaseStrikeShape } from './rosterChoreography'
import type { FighterId } from './types'

/** Displacement required for airborne hits and special attacks to cause a knockdown. */
export const KNOCKDOWN_KNOCKBACK = 3

export function moveFinishesGroundedImpact(move: FighterMove, knockback: number): boolean {
  if (move.kind === 'special' || move.category === 'finisher' || move.variant === 'air')
    return knockback >= KNOCKDOWN_KNOCKBACK
  // The trip is part of the base move, independent of its drawn point of contact.
  const fighter = move.id.split(':')[0] as FighterId
  return rosterBaseStrikeShape(fighter, move.slot) === 'sweep' || knockback >= 7
}
