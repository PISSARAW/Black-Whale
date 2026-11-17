import { performBlackVoiceCommand } from './blackVoiceAction'
import { blackVoiceOptions } from './blackVoiceOptions'
import { performBashoQuestion, bashoQuestionOptions } from './bashoQuestions'
import { performBashoWard, bashoWardOptions } from './bashoWard'
import { performWritingKitCommand, writingKitOptions } from './bashoMaterials'
import { performRecordedStatement, recordedStatementOptions } from './recordedStatements'
import { futureAcceptsMove } from './parallelFutureAbility'
import { deviceOptions } from './deviceOptions'
import { performDeviceCommand } from './deviceActions'
import { performDowsingCommand } from './dowsingAction'
import { dowsingOptions } from './dowsingOptions'
import { performJudgmentCommand, judgmentOptions } from './judgmentAction'
import { dolphinArsenalOptions } from './dolphinArsenal'
import { copiedArsenalOptions } from './chrolloCopiedOptions'
import { performGumCommand, gumArsenalOptions } from './hisokaArsenal'
import { fightAcceptsCommands } from './fightOutcome'
import { canAct } from './fightActorState'
import { cookieOptions, performCookie } from './cookie'
import { hunterOptions, performHunterInterview } from './skillHunterAcquisition'
import { performHistoricalCommand } from './chrolloHistoricalAction'
import { historicalOptions } from './chrolloHistoricalOptions'
import { ARSENAL_ACTION_IDS, type ArsenalCommand, type ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function validArsenalCommand(value: unknown): value is ArsenalCommand {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const command = value as Record<string, unknown>
  if (!Object.keys(command).every((key) => key === 'action' || key === 'target')) return false
  if (!ARSENAL_ACTION_IDS.includes(command.action as ArsenalCommand['action'])) return false
  return (
    command.target === undefined ||
    (typeof command.target === 'string' && command.target.length <= 100)
  )
}

export function performArsenalCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (!fightAcceptsCommands(state) || !validArsenalCommand(command)) return state
  if (state[side].blackVoiceControl?.active) return state
  if (!futureAcceptsMove(state, side) || state[side].parallelEyesClosed) return state
  if (command.action === 'support-consent') return toggleConsent(state, side)
  const handler = COMMAND_HANDLERS.find(([prefix]) => command.action.startsWith(prefix))
  return handler ? handler[1](state, side, command) : state
}

const COMMAND_HANDLERS: readonly [
  string,
  (state: FightState, side: FightSide, command: ArsenalCommand) => FightState,
][] = [
  ['voice-', performBlackVoiceCommand],
  ['basho-ask', performBashoQuestion],
  ['basho-answer', performBashoQuestion],
  ['basho-', performBashoWard],
  ['writing-', performWritingKitCommand],
  ['statement-', performRecordedStatement],
  ['device-', performDeviceCommand],
  ['biohazard-', performDeviceCommand],
  ['dowsing-', performDowsingCommand],
  ['judgment-', performJudgmentCommand],
  ['gum-', performGumCommand],
  ['cookie-', performCookie],
  ['hunter-', performHunterInterview],
  ['history-', performHistoricalCommand],
]

function toggleConsent(state: FightState, side: FightSide): FightState {
  if (!canAct(state[side])) return state
  return { ...state, [side]: { ...state[side], supportConsent: !state[side].supportConsent } }
}

export function arsenalOptions(state: FightState, side: FightSide): ArsenalOption[] {
  return [
    consentOption(state, side),
    ...blackVoiceOptions(state, side),
    ...judgmentOptions(state, side),
    ...deviceOptions(state, side),
    ...recordedStatementOptions(state, side),
    ...writingKitOptions(state, side),
    ...bashoQuestionOptions(state, side),
    ...bashoWardOptions(state, side),
    ...dowsingOptions(state, side),
    ...gumArsenalOptions(state, side),
    ...cookieOptions(state, side),
    ...hunterOptions(state, side),
    ...dolphinArsenalOptions(state, side),
    ...copiedArsenalOptions(state, side),
    ...historicalOptions(state, side),
  ]
}

function consentOption(state: FightState, side: FightSide): ArsenalOption {
  return {
    command: { action: 'support-consent' },
    ready: canAct(state[side]),
    labelFr: state[side].supportConsent
      ? 'Retirer mon consentement au soutien'
      : 'Consentir à recevoir un soutien',
    labelEn: state[side].supportConsent
      ? 'Withdraw my support consent'
      : 'Consent to receive support',
    conditionFr:
      'Décision volontaire du destinataire, jamais une attaque ou une signature implicite.',
    conditionEn: 'The recipient’s voluntary decision, never an attack or an implicit signature.',
  }
}
