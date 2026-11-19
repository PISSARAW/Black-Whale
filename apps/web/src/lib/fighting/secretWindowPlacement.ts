import { physicalBodyAt } from './fightBodyIdentity'
import { sleepingBody } from './hanzoProjection'
import { secretWindowNenActive } from './secretWindowAccess'
import type { DolphinBodyRef } from './dolphinLoanTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

export function privateWindowBirdVisible(
  state: FightState,
  owner: DolphinBodyRef,
  viewer: FightSide,
): boolean {
  if (owner.owner !== viewer) return false
  const actor = physicalBodyAt(state, owner.owner, owner.member)
  if (!actor?.secretWindow) return false
  const active = (state.teamMatch?.seats[owner.owner].active ?? 0) === owner.member
  // The active Benjamin scene already owns this one bird, rather than a second copy.
  if (active && actor.id === 'benjamin') return false
  return secretWindowNenActive(actor)
}

export function secretWindowBirdHeight(original: ArcadeFighter): number {
  const target = sleepingBody(original)
  if (original.hanzoProjection || target.knockdownFrames > 0) return 5
  return target.crouching ? 8 : 12.5
}
