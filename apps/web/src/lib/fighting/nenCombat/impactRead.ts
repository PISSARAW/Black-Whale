import { combatSight, gyoSight } from './sight'
import { enContains } from '../en/access'
import type { CombatRead } from '../combatRead'
import type { ArcadeFighter } from '../types'
/** A manual parry needs a sensed attack. In-hidden aura is not automatically decoded by En. */
export function readableImpact(fighter: ArcadeFighter, read: CombatRead): boolean {
  if (read.physicalScreened) return !read.concealed && enContains(fighter, read.position)
  if (read.concealed) return gyoSight(fighter)
  return combatSight(fighter) || enContains(fighter, read.position)
}
