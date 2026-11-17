import { withDolphinSupply } from './dolphinSupply'
import { withLoanCarrier } from './dolphinBorrowing'
import { performDolphinApplication } from './dolphinArsenal'
import { performArsenalCommand } from './retrospectiveArsenal'
import { performChrolloSelectedMove } from './chrolloCopiedAction'
import { futureAcceptsMove } from './parallelFutureAbility'
import { fightAcceptsCommands } from './fightOutcome'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightSide, FightState } from './types'

/** Native move callbacks are trusted local code, never supplied by a network packet. */
export function performArsenalAction(
  options: {
    state: FightState
    side: FightSide
    command: ArsenalCommand
  },
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const { state, side, command } = options
  if (!fightAcceptsCommands(state)) return state
  if (!futureAcceptsMove(state, side) || state[side].parallelEyesClosed) return state
  if (command.action.startsWith('dolphin-') && command.action !== 'dolphin-lend')
    return executeDolphin(options, perform)
  if (command.action === 'copied-move')
    return command.target
      ? performChrolloSelectedMove({ state, side, moveId: command.target }, perform)
      : state
  return performArsenalCommand(state, side, command)
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
