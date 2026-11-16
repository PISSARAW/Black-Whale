import { canStartFighterAttack } from './fighterAttacks'
import { FIGHT_HATSU_AURA_COST, hatsuSourceFor, triggerHatsu } from './hatsu'
import { canRejoinHanzoBody, isHanzoProjectionMove, wakeHanzoBody } from './hanzoProjection'
import { moveById } from './movesets'
import type { ArcadeFighter, AttackKind, FightSide, FightState } from './types'

/** Projection has a startup cost, but no activation strike, lunge or ranged ammunition. */
export function performProjectionAction(options: {
  state: FightState
  side: FightSide
  kind: AttackKind
  moveId?: string
}): FightState | null {
  const { state, side, kind, moveId } = options
  const fighter = state[side]
  if (fighter.hanzoProjection && kind === 'ranged') return state
  if (kind !== 'special' || !isHanzoProjectionMove(fighter, moveId)) return null
  if (fighter.hanzoProjection) {
    return canRejoinHanzoBody(fighter) ? { ...state, [side]: wakeHanzoBody(fighter) } : state
  }
  if (hatsuSourceFor(fighter, moveId) !== 'hanzo') return fighter.id === 'hanzo' ? state : null
  if (!canBeginProjection(fighter, moveId)) return state
  const projected = triggerHatsu(state, side, 'hanzo')
  return {
    ...projected,
    [side]: { ...projected[side], aura: fighter.aura - projectionCost(moveId) },
  }
}

function projectionCost(moveId?: string): number {
  return moveById(moveId)?.auraCost ?? FIGHT_HATSU_AURA_COST
}

function canBeginProjection(fighter: ArcadeFighter, moveId?: string): boolean {
  return (
    fighter.y === 0 && fighter.attack === null && canStartFighterAttack(fighter, 'special', moveId)
  )
}
