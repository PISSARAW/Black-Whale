import { moveById } from './movesets'
import { rosterMoveShape } from './rosterStrikeMotion'
import type { ArcadeFighter } from './types'

/** Recoil alone is not a fall: ordinary ground blows keep the target standing unless they sweep or decisively displace it. */
export function groundedImpactFinishes(attacker: ArcadeFighter, knockback: number): boolean {
  const attack = attacker.attack
  const move = moveById(attack?.moveId)
  if (!move || attack?.variant === 'air') return knockback >= 3
  if (move.kind === 'special' || move.category === 'finisher') return knockback >= 3
  if (rosterMoveShape(move.id) === 'sweep') return true
  return knockback >= 7
}
