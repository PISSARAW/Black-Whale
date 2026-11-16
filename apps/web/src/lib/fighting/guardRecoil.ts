import { fighterAnchored } from './fighterAnchors'
import type { ArcadeFighter } from './types'

/** Preserve the normal push distance when the wall prevents the guarding body moving. */
export function recoilGuardedAttack(options: {
  attacker: ArcadeFighter
  defender: ArcadeFighter
  struck: ArcadeFighter
  knockback: number
  blocked: boolean
  avoided: boolean
}): ArcadeFighter {
  const { attacker, defender, struck, knockback } = options
  if (!options.blocked || options.avoided || attacker.hanzoProjection || fighterAnchored(attacker))
    return attacker
  const missing = Math.max(0, knockback - Math.abs(struck.x - defender.x))
  const direction = attacker.x <= defender.x ? -1 : 1
  return missing === 0
    ? attacker
    : { ...attacker, x: Math.max(7, Math.min(93, attacker.x + direction * missing)) }
}
