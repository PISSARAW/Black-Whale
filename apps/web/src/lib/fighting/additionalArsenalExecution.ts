import { performDolphinLoan } from './dolphinLoan'
import { performLuiniCommand } from './luiniArsenal'
import { performBashoArsenal } from './bashoInterrogation'
import { performMelodyQuestion } from './melodyInterrogation'
import { performSweetHomeCommand } from './sweetHomeArsenal'
import { performPadailleEscape } from './padailleEscape'
import { performHinrighCounter } from './hinrighCounter'
import { performIllumiDisguiseApplication } from './illumiDisguiseApplication'
import { performIllumiNeedleApplication } from './illumiNeedleApplication'
import type { ArsenalInvocation } from './retrospectiveTypes'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState } from './types'

export function performAdditionalArsenal(
  options: ArsenalInvocation,
  perform: (o: AuraAttackOptions) => FightState,
): FightState | null {
  const { state, side, command } = options
  if (command.action === 'illumi-needle-apply')
    return performIllumiNeedleApplication(options, perform)
  if (command.action === 'illumi-face-apply')
    return performIllumiDisguiseApplication(options, perform)
  if (command.action === 'dolphin-loan') return performDolphinLoan(options)
  if (command.action.startsWith('luini-')) return performLuiniCommand(options, perform)
  if (command.action.startsWith('melody-')) return performMelodyQuestion(options)
  if (command.action === 'sweet-home-object') return performSweetHomeCommand(state, side, command)
  if (command.action === 'padaille-escape') return performPadailleEscape(options, perform)
  if (command.action === 'bio-axe-counter') return performHinrighCounter(options, perform)
  return legacyBasho(options) ? performBashoArsenal(options, perform) : null
}
function legacyBasho({ state, side, command }: ArsenalInvocation) {
  if (command.action === 'basho-compose') return true
  if (command.action === 'basho-ask') return state[side].bashoPoem?.effect === 'trial-by-fire'
  return command.action === 'basho-answer' && state[side].bashoPrompt?.owner !== undefined
}
