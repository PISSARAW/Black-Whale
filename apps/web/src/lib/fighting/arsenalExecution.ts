import { futureAcceptsMove } from './parallelFutureAbility'
import { traceArsenal } from './arsenalTrace'
import { performDolphinLoan } from './dolphinLoan'
import { performDolphinApplication } from './dolphinArsenal'
import { performSecretWindowCommand } from './secretWindowArsenal'
import { performBashoArsenal } from './bashoInterrogation'
import { performMelodyQuestion } from './melodyInterrogation'
import { performLuiniCommand } from './luiniArsenal'
import { performSweetHomeCommand } from './sweetHomeArsenal'
import { performPadailleEscape } from './padailleEscape'
import { performHinrighCounter } from './hinrighCounter'
import { performArsenalCommand } from './retrospectiveArsenal'
import { performChrolloSelectedMove } from './chrolloCopiedAction'
import { fightAcceptsCommands } from './fightOutcome'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightSide, FightState } from './types'

const CALLBACK_FAMILIES: Record<string, typeof performLuiniCommand | undefined> = {
  luini: performLuiniCommand,
  window: performSecretWindowCommand,
  basho: performBashoArsenal,
}

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
  if (!fightAcceptsCommands(state) || !futureAcceptsMove(state, side)) return state
  const family = CALLBACK_FAMILIES[command.action.split('-')[0]]
  if (family) return family(options, perform)
  if (command.action.startsWith('melody-')) return performMelodyQuestion({ state, side, command })
  if (command.action === 'sweet-home-object') return performSweetHomeCommand(state, side, command)
  if (command.action === 'padaille-escape')
    return performPadailleEscape({ state, side, command }, perform)
  if (command.action === 'bio-axe-counter') return performHinrighCounter(options, perform)
  if (command.action.startsWith('dolphin-')) return dolphinCommand(options, perform)
  if (command.action === 'copied-move') return copiedMove(options, perform)
  return performArsenalCommand(state, side, command)
}

function dolphinCommand(
  options: import('./retrospectiveTypes').ArsenalInvocation,
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  const { state, side, command } = options
  if (command.action === 'dolphin-loan') return performDolphinLoan({ state, side, command })
  if (command.action === 'dolphin-move')
    return command.target
      ? performDolphinApplication({ state, side, moveId: command.target }, perform)
      : state
  return state
}

function copiedMove(
  { state, side, command }: import('./retrospectiveTypes').ArsenalInvocation,
  perform: (options: AuraAttackOptions) => FightState,
): FightState {
  return command.target
    ? performChrolloSelectedMove({ state, side, moveId: command.target }, perform)
    : state
}
