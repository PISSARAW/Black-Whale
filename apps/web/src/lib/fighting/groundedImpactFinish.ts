import { moveById } from './movesets'
import { KNOCKDOWN_KNOCKBACK, moveFinishesGroundedImpact } from './knockdownRules'
import type { ArcadeFighter } from './types'

/** Recoil alone is not a fall: ordinary ground blows keep the target standing unless they sweep or decisively displace it. */
export function groundedImpactFinishes(attacker: ArcadeFighter, knockback: number): boolean {
  const attack = attacker.attack
  const move = moveById(attack?.moveId)
  if (!move || attack?.variant === 'air') return knockback >= KNOCKDOWN_KNOCKBACK
  return moveFinishesGroundedImpact(move, knockback)
}
