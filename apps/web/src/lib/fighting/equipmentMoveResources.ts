import { feitanBladeResources } from './feitanCombat'
import { voconteMoveResources } from './voconteDoorAction'
import { illumiResources } from './illumiAccess'
import { biohazardMoveResources } from './biohazardMoveset'
import type { FighterMove } from './movesetTypes'
import type { ArcadeFighter } from './types'

/** Material resources are checked before the ordinary Nen-powered move fallback. */
export function equipmentMoveResources(fighter: ArcadeFighter, move: FighterMove): boolean | null {
  const blade = feitanBladeResources(fighter, move)
  if (blade !== null) return blade
  const door = move.kind === 'special' ? voconteMoveResources(fighter, move.id) : null
  if (door !== null) return door
  const needles = move.kind === 'special' ? illumiResources(fighter, move.id) : null
  if (needles !== null) return needles && fighter.aura >= move.auraCost
  return biohazardMoveResources(fighter, move.id)
}
