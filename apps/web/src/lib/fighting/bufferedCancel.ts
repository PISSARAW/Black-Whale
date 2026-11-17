import { canAct } from './fightActorState'
import { INPUT_BUFFER_FRAMES, attackData } from './frameData'
import { canStartFighterAttack } from './fighterAttacks'
import { moveById } from './movesets'
import type { AuraAttackOptions } from './auraAttackAction'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Only an authored cancel can be anticipated; a whiff never turns it into a later neutral attack. */
export function cancelBufferSource(fighter: ArcadeFighter, moveId?: string): string | undefined {
  const attack = fighter.attack
  const move = moveById(attack?.moveId)
  if (!attack || !move?.cancelWindow || !moveId || !canAct(fighter)) return undefined
  if (!move.cancelInto.includes(moveId)) return undefined
  const remaining = attackData(attack.kind, fighter).startup - attack.frame
  return remaining > 0 && remaining <= INPUT_BUFFER_FRAMES ? move.id : undefined
}

export function flushBufferedCancel(
  state: FightState,
  side: FightSide,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const fighter = state[side]
  const intent = fighter.bufferedAttack
  if (!intent?.cancelFrom) return null
  const cleared = { ...state, [side]: { ...fighter, bufferedAttack: null } }
  if (fighter.attack?.moveId !== intent.cancelFrom) return cleared
  if (!canAct(fighter) || !canStartFighterAttack(fighter, intent.kind, intent.moveId)) return state
  return perform({ state: cleared, side, ...intent })
}
