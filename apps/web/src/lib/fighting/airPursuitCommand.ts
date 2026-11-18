import type { AuraAttackOptions } from './auraAttackAction'
import { selectedGumLink } from './bungeeNetwork'
import { hasAirPursuit, isAirPursuit, pursuitWindow } from './directionalChain'
import { attackData, INPUT_BUFFER_FRAMES } from './frameData'
import { moveForSlot } from './movesets'
import type { FightInput, FightSide, FightState, MoveAction } from './types'

interface PursuitCommand {
  state: FightState
  side: FightSide
  action: MoveAction
  input: FightInput
}

export function performAirPursuit(
  command: PursuitCommand,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | undefined {
  if (!pursuitInput(command)) return
  const { state, side, action } = command
  const fighter = state[side]
  const attack = fighter.attack!
  if (!pursuitWindow(attack.frame, attackData(attack.kind, fighter), INPUT_BUFFER_FRAMES))
    return state
  const technique = action === 'special'
  const move = moveForSlot(fighter.id, technique ? signatureSlot(fighter.id) : 'airLight')
  if (!move) return state
  return perform({
    state,
    side,
    kind: move.kind,
    variant: move.variant,
    moveId: move.id,
    auraCharged: false,
    directionalChain: technique ? 'pursuit-technique' : 'pursuit',
  })
}

function signatureSlot(fighter: FightState['player']['id']) {
  return fighter === 'kurapika' ? 'forwardSpecial' : 'finisher'
}

function pursuitInput({ state, side, action, input }: PursuitCommand): boolean {
  const fighter = state[side]
  if (!hasAirPursuit(fighter.id) || !pursuitButtons(action, input)) return false
  const forward = fighter.facing === 1 ? input.right : input.left
  const attack = fighter.attack
  return Boolean(forward && attack?.directionalChain === 'air' && attack.confirmedHit)
}

function pursuitButtons(action: MoveAction, input: FightInput): boolean {
  return !input.aura && !input.down && (action === 'light' || action === 'special')
}

export function pursuitAttackAllowed({
  state,
  side,
  directionalChain,
}: AuraAttackOptions): boolean {
  if (!isAirPursuit(directionalChain)) return true
  const fighter = state[side]
  const target = state[side === 'player' ? 'opponent' : 'player']
  if (fighter.y > 0 || target.y <= 0) return false
  if (directionalChain === 'pursuit-technique' && fighter.id === 'hisoka')
    return tetheredToOpponent(state, side)
  return true
}

function tetheredToOpponent(state: FightState, side: FightSide): boolean {
  const link = selectedGumLink(state, side)
  return link?.target.kind === 'fighter' && link.target.side !== side
}
