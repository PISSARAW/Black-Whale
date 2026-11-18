import { performAdditionalArsenal } from './additionalArsenalExecution'
import { performTextureApplication } from './hisokaTextureAction'
import { traceArsenal } from './arsenalTrace'
import { performPersonDolphinCommand } from './dolphinPeopleAction'
import { arsenalMindAvailable } from './arsenalMind'
import { withDolphinSupply } from './dolphinSupply'
import { withLoanCarrier } from './dolphinBorrowing'
import { performDolphinApplication } from './dolphinArsenal'
import { performArsenalCommand } from './retrospectiveArsenal'
import { performChrolloSelectedMove } from './chrolloCopiedAction'
import { futureAcceptsMove } from './parallelFutureAbility'
import { fightAcceptsCommands } from './fightOutcome'
import { windowListeningMoveId } from './secretWindowListening'
import { moveById } from './movesets'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightSide, FightState } from './types'

/** Native move callbacks are trusted local code, never supplied by a network packet. */
export function performArsenalAction(
  options: import('./retrospectiveTypes').ArsenalInvocation,
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  return traceArsenal(options, executeArsenalAction(options, perform))
}

function executeArsenalAction(
  options: {
    state: FightState
    side: FightSide
    command: ArsenalCommand
  },
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const { state, side, command } = options
  if (!fightAcceptsCommands(state)) return state
  const otherBody = executeOtherBodyCommand(options)
  if (otherBody) return otherBody
  if (!voluntaryArsenalReady(state, side)) return state
  if (command.action === 'texture-apply') return performTextureApplication(options, perform)
  const additional = performAdditionalArsenal(options, perform)
  if (additional) return additional
  if (command.action === 'window-listen') return executeListening(options, perform)
  if (command.action.startsWith('dolphin-') && command.action !== 'dolphin-lend')
    return executeDolphin(options, perform)
  if (command.action === 'copied-move') return executeCopied(options, perform)
  return performArsenalCommand(state, side, command)
}

function executeOtherBodyCommand({
  state,
  side,
  command,
}: import('./retrospectiveTypes').ArsenalInvocation): FightState | null {
  if (command.action === 'halkenburg-host-motion')
    return performArsenalCommand(state, side, command)
  return command.action.startsWith('person-')
    ? performPersonDolphinCommand(state, side, command)
    : null
}

function executeCopied(
  { state, side, command }: import('./retrospectiveTypes').ArsenalInvocation,
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  return command.target
    ? performChrolloSelectedMove({ state, side, moveId: command.target }, perform)
    : state
}

function voluntaryArsenalReady(state: FightState, side: FightSide): boolean {
  return (
    arsenalMindAvailable(state[side]) &&
    futureAcceptsMove(state, side) &&
    !state[side].parallelEyesClosed
  )
}

function executeListening(
  options: { state: FightState; side: FightSide; command: ArsenalCommand },
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const { state, side } = options
  const move = moveById(windowListeningMoveId(state[side]) ?? '')
  return move
    ? perform({
        state,
        side,
        kind: move.kind,
        variant: move.variant,
        moveId: move.id,
        auraCharged: false,
      })
    : state
}

function executeDolphin(
  options: { state: FightState; side: FightSide; command: ArsenalCommand },
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const { state, side, command } = options
  if (command.action === 'dolphin-use')
    return withLoanCarrier(state, { side, kurapikaCommand: true }, (borrowed) =>
      withDolphinSupply(borrowed, side, (supplied) =>
        perform({
          state: supplied,
          side,
          kind: 'special',
          moveId: 'kurapika:backSpecial',
          auraCharged: false,
        }),
      ),
    )
  if (command.action === 'dolphin-move' && state[side].dolphinLoan)
    return withLoanCarrier(state, { side, kurapikaCommand: true }, (borrowed) =>
      performDolphinApplication({ state: borrowed, side, moveId: command.target ?? '' }, perform),
    )
  if (command.action === 'dolphin-move')
    return command.target
      ? performDolphinApplication({ state, side, moveId: command.target }, perform)
      : state
  return state
}
