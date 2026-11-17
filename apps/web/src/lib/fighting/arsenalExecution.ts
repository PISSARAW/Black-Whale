import { performDolphinApplication } from './dolphinArsenal'
import { performArsenalCommand } from './retrospectiveArsenal'
import { performChrolloSelectedMove } from './chrolloCopiedAction'
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
  if (command.action === 'dolphin-move')
    return command.target
      ? performDolphinApplication({ state, side, moveId: command.target }, perform)
      : state
  if (command.action === 'copied-move')
    return command.target
      ? performChrolloSelectedMove({ state, side, moveId: command.target }, perform)
      : state
  return performArsenalCommand(state, side, command)
}
