import { canStartFighterAttack } from './fighterAttacks'
import { FIGHT_HATSU_AURA_COST, hatsuSourceFor, triggerHatsu } from './hatsu'
import { canActivateLsdf, isLsdfMove } from './lsdf'
import { moveById } from './movesets'
import type { AttackKind, FightSide, FightState } from './types'

/** Introduction and summons have no melee carrier, lunge, hitbox or damaging finisher. */
export function performLsdfAction(options: {
  state: FightState
  side: FightSide
  kind: AttackKind
  moveId?: string
}): FightState | null {
  const { state, side, kind, moveId } = options
  const fighter = state[side]
  if (kind !== 'special' || !isLsdfMove(fighter, moveId)) return null
  if (fighter.id === 'yokotani' && moveId && moveId !== 'yokotani:neutralSpecial') return state
  if (!canActivateLsdf(state, side) || hatsuSourceFor(fighter, moveId) !== 'yokotani') return state
  if (fighter.attack || !canStartFighterAttack(fighter, kind, moveId)) return state
  const next = triggerHatsu(state, side, 'yokotani')
  const cost = lsdfAuraCost(moveId)
  return {
    ...next,
    [side]: { ...next[side], aura: fighter.aura - cost },
  }
}

function lsdfAuraCost(moveId?: string): number {
  return moveById(moveId)?.auraCost ?? FIGHT_HATSU_AURA_COST
}
