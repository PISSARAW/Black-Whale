import { personDolphinOptions } from './dolphinPeopleOptions'
import { paperScatterOptions, performPaperScatterCommand } from './kallutoScatterCommands'
import { paperKitOptions, performPaperKitCommand } from './kallutoMaterialActions'
import { paperReceiverOptions, performPaperReceiverCommand } from './kallutoCommands'
import { judgmentTargetLimit } from './judgmentInquiryTypes'
import { judgmentInquiryOptions, performJudgmentInquiry } from './judgmentInquiryAction'
import { musseArchiveOptions, performMusseArchiveCommand } from './benjaminMusseReplay'
import { recordedWindowOptions, performRecordedWindowCommand } from './benjaminMusseRecorded'
import { secretWindowOptions, performSecretWindowCommand } from './secretWindowCommands'
import { performPersonDolphinCommand } from './dolphinPeopleAction'
import { littleEyeOptions, performLittleEyeCommand } from './littleEyeActions'
import { arsenalMindAvailable } from './arsenalMind'
import { dolphinCommandAllowed, performLoanCommand, loanCommandOptions } from './dolphinCommands'
import { withDolphinSupply } from './dolphinSupply'
import { performDolphinLoan, dolphinLoanOptions } from './dolphinLoanAction'
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
  if (!Object.keys(command).every((key) => key === 'action' || key === 'target' || key === 'loan'))
    return false
  if (!ARSENAL_ACTION_IDS.includes(command.action as ArsenalCommand['action'])) return false
  if (command.loan !== undefined && typeof command.loan !== 'boolean') return false
  return (
    command.target === undefined ||
    (typeof command.target === 'string' &&
      command.target.length <= judgmentTargetLimit(command.action as string))
  )
}

export function performArsenalCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (!fightAcceptsCommands(state) || !validArsenalCommand(command)) return state
  if (command.action.startsWith('person-')) return performPersonDolphinCommand(state, side, command)
  if (!arsenalMindAvailable(state[side])) return state
  if (!futureAcceptsMove(state, side) || state[side].parallelEyesClosed) return state
  if (command.loan) return performLoanCommand({ state, side, command }, performArsenalCommand)
  if (selfDolphinCommand(state, side, command))
    return withDolphinSupply(state, side, (supplied) =>
      performArsenalCommand(supplied, side, command),
    )
  return nativeArsenalCommand(state, side, command)
}
function nativeArsenalCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (command.action === 'support-consent') return toggleConsent(state, side)
  const handler = COMMAND_HANDLERS.find(([prefix]) => command.action.startsWith(prefix))
  return handler ? handler[1](state, side, command) : state
}

function selfDolphinCommand(state: FightState, side: FightSide, command: ArsenalCommand): boolean {
  const body = state[side]
  return (
    body.id === 'kurapika' &&
    Boolean(body.kurapika?.held?.auraSupply) &&
    !body.dolphinExecution &&
    dolphinCommandAllowed(body, command)
  )
}

const COMMAND_HANDLERS: readonly [
  string,
  (state: FightState, side: FightSide, command: ArsenalCommand) => FightState,
][] = [
  ['paper-release-confetti', performPaperScatterCommand],
  ['paper-kit-', performPaperKitCommand],
  ['paper-stop-listening', performPaperReceiverCommand],
  ['judgment-ask', performJudgmentInquiry],
  ['judgment-answer', performJudgmentInquiry],
  ['window-archive', performMusseArchiveCommand],
  ['window-recorded', performRecordedWindowCommand],
  ['window-', performSecretWindowCommand],
  ['dolphin-lend', performDolphinLoan],
  ['voice-', performBlackVoiceCommand],
  ['little-eye-', performLittleEyeCommand],
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
  const options = [
    ...paperScatterOptions(state, side),
    ...paperKitOptions(state, side),
    ...paperReceiverOptions(state, side),
    ...judgmentInquiryOptions(state, side),
    ...musseArchiveOptions(state, side),
    ...recordedWindowOptions(state, side),
    ...secretWindowOptions(state, side),
    ...nativeArsenalOptions(state, side),
    ...loanCommandOptions(state, side, nativeArsenalOptions),
  ]
  const personal = arsenalMindAvailable(state[side])
    ? options
    : options.map((option) => ({ ...option, ready: false }))
  return [...personal, ...personDolphinOptions(state, side)]
}
function nativeArsenalOptions(state: FightState, side: FightSide): ArsenalOption[] {
  return [
    consentOption(state, side),
    ...blackVoiceOptions(state, side),
    ...littleEyeOptions(state, side),
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
    ...dolphinLoanOptions(state, side),
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
