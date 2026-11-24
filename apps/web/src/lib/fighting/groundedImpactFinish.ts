import { moveById } from './movesets'
import { rosterBaseStrikeShape } from './rosterKeyPoses'
import type { ArcadeFighter, FighterId } from './types'

/** Recoil alone is not a fall: ordinary ground blows keep the target standing unless they sweep or decisively displace it. */
export function groundedImpactFinishes(attacker: ArcadeFighter, knockback: number): boolean {
  const attack = attacker.attack
  const move = moveById(attack?.moveId)
  if (!move || attack?.variant === 'air') return knockback >= 3
  if (move.kind === 'special' || move.category === 'finisher') return knockback >= 3
  // The trip belongs to the move's combat data, independent of its drawn contact.
  if (rosterBaseStrikeShape(move.id.split(':')[0] as FighterId, move.slot) === 'sweep') return true
  return knockback >= 7
}
