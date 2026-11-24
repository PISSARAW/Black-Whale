import { performDolphinLoan } from './dolphinLoan'
import { performLuiniCommand } from './luiniArsenal'
import { performBashoArsenal } from './bashoInterrogation'
import { performMelodyQuestion } from './melodyInterrogation'
import { performSweetHomeCommand } from './sweetHomeArsenal'
import { performPadailleEscape } from './padailleEscape'
import { performHinrighCounter } from './hinrighCounter'
import { performIllumiDisguiseApplication } from './illumiDisguiseApplication'
import { performIllumiNeedleApplication } from './illumiNeedleApplication'
import { performHistoricalWeapon } from './historicalWeapons'
import { performFutureArsenal } from './futureIllusion'
import type { ArsenalInvocation } from './retrospectiveTypes'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState } from './types'

export function performAdditionalArsenal(
  options: ArsenalInvocation,
  perform: (o: AuraAttackOptions) => FightState,
): FightState | null {
  const { state, side, command } = options
  const action = command.action
  if (action.startsWith('weapon-')) return performHistoricalWeapon(options, perform)
  if (action.startsWith('future-')) return performFutureArsenal(options, perform)
  if (action.startsWith('luini-')) return performLuiniCommand(options, perform)
  if (action.startsWith('melody-')) return performMelodyQuestion(options)
  if (action.startsWith('illumi-')) return performIllumiApplication(action, options, perform)
  if (action === 'dolphin-loan') return performDolphinLoan(options)
  if (action === 'sweet-home-object') return performSweetHomeCommand(state, side, command)
  if (action === 'padaille-escape') return performPadailleEscape(options, perform)
  if (action === 'bio-axe-counter') return performHinrighCounter(options, perform)
  return performBashoAdditionalArsenal(options, perform)
}

function performIllumiApplication(
  action: string,
  options: ArsenalInvocation,
  perform: (o: AuraAttackOptions) => FightState,
): FightState | null {
  if (action === 'illumi-needle-apply') return performIllumiNeedleApplication(options, perform)
  return performIllumiDisguiseApplication(options, perform)
}

function performBashoAdditionalArsenal(
  options: ArsenalInvocation,
  perform: (o: AuraAttackOptions) => FightState,
): FightState | null {
  if (!legacyBasho(options)) return null
  return performBashoArsenal(options, perform)
}
function legacyBasho({ state, side, command }: ArsenalInvocation) {
  if (command.action === 'basho-compose') return true
  if (command.action === 'basho-ask') return state[side].bashoPoem?.effect === 'trial-by-fire'
  return command.action === 'basho-answer' && state[side].bashoPrompt?.owner !== undefined
}
