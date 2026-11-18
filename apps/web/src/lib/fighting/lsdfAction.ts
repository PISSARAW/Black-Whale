import { canStartFighterAttack } from './fighterAttacks'
import { FIGHT_HATSU_AURA_COST, hatsuSourceFor, triggerHatsu } from './hatsu'
import { canActivateLsdf, isLsdfMove } from './lsdf'
import { moveById } from './movesets'
import { voiceAvailable, speakPaperWords } from './kallutoListening'
import { fighterDefinition } from './roster'
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
  if (!lsdfActionReady(options)) return state
  const declared = speakPaperWords(
    state,
    side,
    `Je suis ${fighterDefinition(fighter.nenOwner ?? fighter.id).name}. Vous êtes en infraction dans la planque Heil-Ly. LSDF : expulsion.`,
  )
  if (declared.phase !== 'fighting') return declared
  const next = triggerHatsu(declared, side, 'yokotani')
  const cost = lsdfAuraCost(moveId)
  return {
    ...next,
    [side]: { ...next[side], aura: fighter.aura - cost },
  }
}

function lsdfAuraCost(moveId?: string): number {
  return moveById(moveId)?.auraCost ?? FIGHT_HATSU_AURA_COST
}

function lsdfActionReady({
  state,
  side,
  kind,
  moveId,
}: Parameters<typeof performLsdfAction>[0]): boolean {
  const fighter = state[side]
  return (
    canActivateLsdf(state, side) &&
    hatsuSourceFor(fighter, moveId) === 'yokotani' &&
    !fighter.attack &&
    canStartFighterAttack(fighter, kind, moveId) &&
    voiceAvailable(state, side)
  )
}
