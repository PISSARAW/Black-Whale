import type { AuraAttackOptions } from './auraAttackAction'
import { commandGumLink } from './bungeeScoped'
import { hasDirectionalChain, isAirPursuit, pursuitWindow } from './directionalChain'
import { currentPursuitTechnique, requiresNativeStrikeStart } from './airPursuitTechniques'
import { canAct } from './fightActorState'
import { attackData, INPUT_BUFFER_FRAMES } from './frameData'
import { canUseMovesetMove, moveForSlot } from './movesets'
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
  const move = technique ? currentPursuitTechnique(fighter) : moveForSlot(fighter.id, 'airLight')
  if (!move) return state
  return executeAirPursuit(
    {
      state,
      side,
      kind: move.kind,
      variant: move.variant,
      moveId: move.id,
      auraCharged: false,
      directionalChain: technique ? 'pursuit-technique' : 'pursuit',
    },
    perform,
  )
}

function pursuitInput({ state, side, action, input }: PursuitCommand): boolean {
  const fighter = state[side]
  if (!hasDirectionalChain(fighter.id) || !pursuitButtons(action, input)) return false
  const forward = fighter.facing === 1 ? input.right : input.left
  const attack = fighter.attack
  return Boolean(forward && attack?.directionalChain === 'air' && attack.confirmedHit)
}

function pursuitButtons(action: MoveAction, input: FightInput): boolean {
  return !input.aura && !input.down && (action === 'light' || action === 'special')
}

export function pursuitAttackAllowed(options: AuraAttackOptions): boolean {
  const { state, side, directionalChain } = options
  if (!isAirPursuit(directionalChain)) return true
  const fighter = state[side]
  const target = state[side === 'player' ? 'opponent' : 'player']
  if (fighter.y > 0 || target.y <= 0) return false
  if (directionalChain === 'pursuit') return true
  if (fighter.id === 'hisoka' && !tetheredToOpponent(state, side)) return false
  return usesNativePursuitStart(options) || selectedPursuitAvailable(options)
}

function selectedPursuitAvailable({ state, side, moveId }: AuraAttackOptions): boolean {
  const move = currentPursuitTechnique(state[side])
  return move !== null && move.id === moveId && canUseMovesetMove(state, side, move)
}

function tetheredToOpponent(state: FightState, side: FightSide): boolean {
  const link = commandGumLink(state, side)
  return link?.target.kind === 'fighter' && link.target.side !== side
}

export function usesNativePursuitStart({ state, side, directionalChain }: AuraAttackOptions) {
  return directionalChain === 'pursuit-technique' && requiresNativeStrikeStart(state[side].id)
}

export function executeAirPursuit(
  options: AuraAttackOptions,
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  if (!usesNativePursuitStart(options)) return perform(options)
  if (!pursuitAttackAllowed(options)) return options.state
  return pursueWithNativeStart(options, perform)
}

/** These native commands require an idle attack slot. Clear it only after a confirmed cancel. */
function pursueWithNativeStart(
  options: AuraAttackOptions,
  perform: (options: AuraAttackOptions) => FightState,
) {
  const { state, side, moveId, kind, variant } = options
  const fighter = state[side]
  const source = fighter.attack
  if (source?.directionalChain !== 'air' || !source.confirmedHit || !canAct(fighter)) return state
  const frames = attackData(source.kind, fighter)
  const staged = { ...state, [side]: { ...fighter, attack: null, bufferedAttack: null } }
  if (!selectedPursuitAvailable({ ...options, state: staged })) return state
  if (!pursuitWindow(source.frame, frames, INPUT_BUFFER_FRAMES)) return state
  if (!pursuitWindow(source.frame, frames))
    return {
      ...state,
      [side]: {
        ...fighter,
        bufferedAttack: {
          kind,
          variant,
          moveId,
          auraCharged: false,
          concealed: false,
          hatsuSource: null,
          directionalChain: 'pursuit-technique',
          cancelFrom: source.moveId,
          bufferFrames: INPUT_BUFFER_FRAMES + 1,
        },
      },
    }
  const launched = perform({ ...options, state: staged, directionalChain: undefined })
  const attack = launched[side].attack
  if (!attack) return state
  return {
    ...launched,
    [side]: { ...launched[side], attack: { ...attack, directionalChain: 'pursuit-technique' } },
  }
}
