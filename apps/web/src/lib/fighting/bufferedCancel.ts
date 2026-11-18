import { canAct } from './fightActorState'
import { INPUT_BUFFER_FRAMES, attackData } from './frameData'
import { canStartFighterAttack } from './fighterAttacks'
import { moveById } from './movesets'
import {
  directionalSourceMatches,
  isAirPursuit,
  pursuitWindow,
  type DirectionalIntent,
} from './directionalChain'
import type { FighterMove } from './movesetTypes'
import type { AuraAttackOptions } from './auraAttackAction'
import { executeAirPursuit, usesNativePursuitStart } from './airPursuitCommand'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Only an authored cancel can be anticipated; a whiff never turns it into a later neutral attack. */
export function cancelBufferSource(
  fighter: ArcadeFighter,
  intent: DirectionalIntent,
): string | undefined {
  const attack = fighter.attack
  const move = moveById(attack?.moveId)
  if (!attack || !move || !canAct(fighter)) return undefined
  if (!admitsEarlyCancel(fighter, move, intent)) return undefined
  const data = attackData(attack.kind, fighter)
  if (isAirPursuit(intent.directionalChain)) return pursuitBuffer(fighter, data)
  const remaining = data.startup - attack.frame
  return remaining > 0 && remaining <= INPUT_BUFFER_FRAMES ? move.id : undefined
}

function pursuitBuffer(fighter: ArcadeFighter, data: ReturnType<typeof attackData>) {
  const attack = fighter.attack!
  return attack.confirmedHit &&
    !pursuitWindow(attack.frame, data) &&
    pursuitWindow(attack.frame, data, INPUT_BUFFER_FRAMES)
    ? attack.moveId
    : undefined
}

function admitsEarlyCancel(
  fighter: ArcadeFighter,
  move: FighterMove,
  intent: DirectionalIntent,
): boolean {
  const { directionalChain, moveId } = intent
  if (directionalChain) return directionalSourceMatches(fighter, directionalChain)
  return Boolean(move.cancelWindow && moveId && move.cancelInto.includes(moveId))
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
  const options = { state: cleared, side, ...intent }
  if (usesNativePursuitStart(options)) {
    const attack = fighter.attack!
    if (!pursuitWindow(attack.frame, attackData(attack.kind, fighter))) return state
    return executeAirPursuit(options, perform)
  }
  if (!canAct(fighter) || !canStartFighterAttack(fighter, intent.kind, intent)) return state
  return perform(options)
}
