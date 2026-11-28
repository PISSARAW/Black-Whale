import { performArenaObjectTurn } from './arenaObjectTurn'
import { performMachiCorpse, machiCorpseOptions } from './machiCorpses'
import { performBenjaminToxin, benjaminToxinOptions } from './benjaminToxin'
import { performUmbrellaFeint, umbrellaOptions } from './feitanUmbrella'
import { arenaObjectTurnOptions } from './arenaObjectTurnOptions'
import { performSunMoonCharge } from './sunMoonCharge'
import { sunMoonChargeOptions } from './sunMoonChargeOptions'
import { gumResuscitationOptions } from './gumResuscitationAction'
import { performGumObjectAnchorCommand } from './gumObjectAnchorCommands'
import { gumObjectAnchorOptions } from './gumObjectAnchorOptions'
import { traceArsenal } from './arsenalTrace'
import { performModelSelection, modelSelectionOptions } from './metamorphosenModels'
import { corpseRemovalOptions } from './illumiCorpsePins'
import { corpseOptions } from './illumiCorpses'
import { performMachiMaterial, machiMaterialOptions } from './machiMaterial'
import { performDolphinLoan as performLegacyDolphinLoan } from './dolphinLoan'
import { performHalkenburgTransfer, halkenburgTransferOptions } from './halkenburgTransfer'
import { performBlackVoice } from './blackVoiceControl'
import { performBiohazardDevice } from './legacyBiohazardDevices'
import { personDolphinOptions } from './dolphinPeopleOptions'
import { paperScatterOptions, performPaperScatterCommand } from './kallutoScatterCommands'
import { paperKitOptions, performPaperKitCommand } from './kallutoMaterialActions'
import { paperReceiverOptions, performPaperReceiverCommand } from './kallutoCommands'
import { arsenalCommandTargetLimit } from './arsenalCommandTargetLimit'
import { judgmentInquiryOptions, performJudgmentInquiry } from './judgmentInquiryAction'
import { musseArchiveOptions, performMusseArchiveCommand } from './benjaminMusseReplay'
import { recordedWindowOptions, performRecordedWindowCommand } from './benjaminMusseRecorded'
import { secretWindowOptions, performSecretWindowCommand } from './secretWindowCommands'
import { performPersonDolphinCommand } from './dolphinPeopleAction'
import { littleEyeOptions, performLittleEyeCommand } from './littleEyeActions'
import { arsenalMindAvailable } from './arsenalMind'
import { illumiMaskOptions } from './illumiMask'
import { performGuardianStatement, guardianStatementOptions } from './tserriednichGuardian'
import { performFutureField, futureFieldOptions } from './futureIllusion'
import { performFranklinAim, franklinAimOptions } from './franklinAim'
import { performBlinkyEvidence, blinkyEvidenceOptions } from './blinkyEvidence'
import { performIllumiSupplement, conditioningOptions } from './illumiConditioning'
import { historicalWeaponOptions } from './historicalWeapons'
import { gumHeartOptions, performGumHeart } from './hisokaHeart'
import { biohazardDeviceOptions } from './biohazardDeviceArsenal'
import {
  performHalkenburgSoulCommand,
  halkenburgHostOptions,
  isHalkenburgSoulCommand,
} from './halkenburgHostCommands'
import {
  performHalkenburgSoulCommand as performHalkenburgMaterialSoulCommand,
  isMaterialSoulCommand,
  halkenburgSoulOptions,
} from './halkenburgSoulActions'
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
import { bashoArsenalOptions } from './bashoInterrogation'
import { melodyQuestionOptions } from './melodyInterrogation'
import { luiniArsenalOptions } from './luiniArsenal'
import { sweetHomeOptions } from './sweetHomeArsenal'
import { padailleEscapeOptions } from './padailleEscape'
import { dowsingOptions } from './dowsingOptions'
import { performJudgmentCommand, judgmentOptions } from './judgmentAction'
import { dolphinArsenalOptions } from './dolphinArsenal'
import { copiedArsenalOptions } from './chrolloCopiedOptions'
import { performGumCommand, gumArsenalOptions } from './hisokaArsenal'
import { performTextureCommand, textureSurfaceOptions } from './hisokaTextureCommands'
import { performPaperDocumentCommand } from './paperDocumentActions'
import { paperDocumentOptions } from './paperDocumentOptions'
import { performPaperTextureCommand } from './paperTextureCommands'
import { fightAcceptsCommands } from './fightOutcome'
import { canAct } from './fightActorState'
import { cookieOptions, performCookie } from './cookie'
import { hunterOptions, performHunterInterview } from './skillHunterAcquisition'
import { performHistoricalCommand } from './chrolloHistoricalAction'
import { historicalOptions } from './chrolloHistoricalOptions'
import { ARSENAL_ACTION_IDS, type ArsenalCommand, type ArsenalOption } from './retrospectiveTypes'
import { performIllumiFaceCommand, illumiFaceOptions } from './illumiDisguise'
import { nativeIllumiFaceOption } from './illumiDisguiseApplication'
import { performNeedleModeCommand, needleModeOptions } from './illumiNeedleCommands'
import { nativeIllumiNeedleOption } from './illumiNeedleApplication'
import { performNeedleFaceRemoval, needleFaceRemovalOptions } from './illumiNeedleFaceRemoval'
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
      command.target.length <= arsenalCommandTargetLimit(command.action as string))
  )
}

const INVOCATION_FAMILIES: Record<
  string,
  ((options: import('./retrospectiveTypes').ArsenalInvocation) => FightState) | undefined
> = {
  umbrella: performUmbrellaFeint,
  bono: performModelSelection,
  illumi: performIllumiSupplement,
  machi: performMachiMaterial,
  dolphin: performLegacyDolphinLoan,
  halkenburg: performHalkenburgTransfer,
  black: performBlackVoice,
  bio: performBiohazardDevice,
  benjamin: performBenjaminToxin,
  guardian: performGuardianStatement,
  future: performFutureField,
  franklin: performFranklinAim,
  blinky: performBlinkyEvidence,
}

function canUseNativeArsenal(state: FightState, side: FightSide): boolean {
  return (
    arsenalMindAvailable(state[side]) &&
    futureAcceptsMove(state, side) &&
    !state[side].parallelEyesClosed
  )
}

export function performArsenalCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (!fightAcceptsCommands(state) || !validArsenalCommand(command)) return state
  if (isHalkenburgSoulCommand(command)) return performHalkenburgSoulCommand(state, side, command)
  if (isMaterialSoulCommand(command))
    return performHalkenburgMaterialSoulCommand({ state, side, command })
  if (command.action.startsWith('person-')) return performPersonDolphinCommand(state, side, command)
  if (!canUseNativeArsenal(state, side)) return state
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
  if (command.action.startsWith('machi-corpse'))
    return traceArsenal({ state, side, command }, performMachiCorpse({ state, side, command }))
  const handler = COMMAND_HANDLERS.find(([prefix]) => command.action.startsWith(prefix))
  if (handler) return handler[1]()(state, side, command)
  const legacy = INVOCATION_FAMILIES[command.action.split('-')[0]]
  return legacy ? traceArsenal({ state, side, command }, legacy({ state, side, command })) : state
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

// Resolve imported handlers at dispatch, after their shared chunks have initialized.
const COMMAND_HANDLERS: readonly [
  string,
  () => (state: FightState, side: FightSide, command: ArsenalCommand) => FightState,
][] = [
  // Shares the `gum` prefix: listed here so the gum network family never swallows it.
  ['gum-heart', () => (state, side, command) => performGumHeart({ state, side, command })],
  ['needle-face-remove', () => performNeedleFaceRemoval],
  ['illumi-needle-mode', () => performNeedleModeCommand],
  ['illumi-face-', () => performIllumiFaceCommand],
  ['gum-anchor-', () => performGumObjectAnchorCommand],
  ['paper-release-confetti', () => performPaperScatterCommand],
  ['paper-kit-', () => performPaperKitCommand],
  ['paper-stop-listening', () => performPaperReceiverCommand],
  ['judgment-ask', () => performJudgmentInquiry],
  ['judgment-answer', () => performJudgmentInquiry],
  ['window-archive', () => performMusseArchiveCommand],
  ['window-recorded', () => performRecordedWindowCommand],
  ['window-', () => performSecretWindowCommand],
  ['dolphin-lend', () => performDolphinLoan],
  ['voice-', () => performBlackVoiceCommand],
  ['little-eye-', () => performLittleEyeCommand],
  ['basho-ask', () => performBashoQuestion],
  ['basho-answer', () => performBashoQuestion],
  ['basho-', () => performBashoWard],
  ['writing-', () => performWritingKitCommand],
  ['statement-', () => performRecordedStatement],
  ['device-', () => performDeviceCommand],
  ['biohazard-', () => performDeviceCommand],
  ['dowsing-', () => performDowsingCommand],
  ['judgment-', () => performJudgmentCommand],
  ['gum-', () => performGumCommand],
  ['texture-paper', () => performPaperTextureCommand],
  ['texture-', () => performTextureCommand],
  ['document-', () => performPaperDocumentCommand],
  ['cookie-', () => performCookie],
  ['hunter-', () => performHunterInterview],
  ['arena-turn-object', () => performArenaObjectTurn],
  ['sun-moon-', () => performSunMoonCharge],
  ['history-', () => performHistoricalCommand],
]

function toggleConsent(state: FightState, side: FightSide): FightState {
  if (!canAct(state[side])) return state
  return { ...state, [side]: { ...state[side], supportConsent: !state[side].supportConsent } }
}

export function arsenalOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const options = [
    ...needleFaceRemovalOptions(state, side),
    ...corpseRemovalOptions(state, side),
    ...paperScatterOptions(state, side),
    ...paperKitOptions(state, side),
    ...paperReceiverOptions(state, side),
    ...judgmentInquiryOptions(state, side),
    ...musseArchiveOptions(state, side),
    ...recordedWindowOptions(state, side),
    ...secretWindowOptions(state, side),
    ...nativeArsenalOptions(state, side),
    ...luiniArsenalOptions(state, side),
    ...sweetHomeOptions(state, side),
    ...padailleEscapeOptions(state, side),
    ...melodyQuestionOptions(state, side),
    ...bashoArsenalOptions(state, side),
    ...loanCommandOptions(state, side, nativeArsenalOptions),
  ]
  const personal = arsenalMindAvailable(state[side])
    ? options
    : options.map((option) => ({ ...option, ready: false }))
  return [...personal, ...personDolphinOptions(state, side), ...halkenburgHostOptions(state, side)]
}
function nativeArsenalOptions(state: FightState, side: FightSide): ArsenalOption[] {
  return [
    consentOption(state, side),
    ...umbrellaOptions(state, side),
    ...historicalWeaponOptions(state, side),
    ...gumHeartOptions(state, side),
    ...modelSelectionOptions(state, side),
    ...illumiMaskOptions(state, side),
    ...guardianStatementOptions(state, side),
    ...benjaminToxinOptions(state, side),
    ...machiCorpseOptions(state, side),
    ...futureFieldOptions(state, side),
    ...franklinAimOptions(state, side),
    ...blinkyEvidenceOptions(state, side),
    ...conditioningOptions(state, side),
    ...biohazardDeviceOptions(state, side),
    ...blackVoiceOptions(state, side),
    ...machiMaterialOptions(state, side),
    ...corpseOptions(state, side),
    ...littleEyeOptions(state, side),
    ...judgmentOptions(state, side),
    ...deviceOptions(state, side),
    ...recordedStatementOptions(state, side),
    ...writingKitOptions(state, side),
    ...bashoQuestionOptions(state, side),
    ...bashoWardOptions(state, side),
    ...dowsingOptions(state, side),
    ...gumArsenalOptions(state, side),
    ...gumResuscitationOptions(state, side),
    ...sunMoonChargeOptions(state, side),
    ...arenaObjectTurnOptions(state, side),
    ...textureSurfaceOptions(state, side),
    ...illumiFaceOptions(state, side),
    ...needleModeOptions(state, side),
    ...nativeIllumiNeedleOption(state, side),
    ...nativeIllumiFaceOption(state, side),
    ...paperDocumentOptions(state, side),
    ...gumObjectAnchorOptions(state, side),
    ...cookieOptions(state, side),
    ...hunterOptions(state, side),
    ...dolphinLoanOptions(state, side),
    ...dolphinArsenalOptions(state, side),
    ...copiedArsenalOptions(state, side),
    ...historicalOptions(state, side),
    ...halkenburgTransferOptions(state, side),
    ...halkenburgSoulOptions(state, side),
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
