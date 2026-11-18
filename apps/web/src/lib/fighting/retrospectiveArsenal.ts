import { performMachiCorpse, machiCorpseOptions } from './machiCorpses'
import { performBenjaminToxin, benjaminToxinOptions } from './benjaminToxin'
import { performUmbrellaFeint, umbrellaOptions } from './feitanUmbrella'
import { performModelSelection, modelSelectionOptions } from './metamorphosenModels'
import { corpseOptions } from './illumiCorpses'
import { illumiMaskOptions } from './illumiMask'
import { performGuardianStatement, guardianStatementOptions } from './tserriednichGuardian'
import { performFutureField, futureFieldOptions } from './futureIllusion'
import { performFranklinAim, franklinAimOptions } from './franklinAim'
import { performBlinkyEvidence, blinkyEvidenceOptions } from './blinkyEvidence'
import { performIllumiSupplement, conditioningOptions } from './illumiConditioning'
import { futureAcceptsMove } from './parallelFutureAbility'
import { historicalWeaponOptions } from './historicalWeapons'
import { performGumHeart, gumHeartOptions } from './hisokaHeart'
import { traceArsenal } from './arsenalTrace'
import { performMachiMaterial, machiMaterialOptions } from './machiMaterial'
import { performDolphinLoan, dolphinLoanOptions } from './dolphinLoan'
import { performHalkenburgTransfer, halkenburgTransferOptions } from './halkenburgTransfer'
import { performBlackVoice, blackVoiceOptions } from './blackVoiceControl'
import { performBiohazardDevice } from './biohazardDevices'
import { biohazardDeviceOptions } from './biohazardDeviceArsenal'
import { performDowsingCommand } from './dowsingAction'
import { secretWindowOptions } from './secretWindowArsenal'
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

const COMMAND_FAMILIES: Record<string, typeof performDowsingCommand | undefined> = {
  dowsing: performDowsingCommand,
  judgment: performJudgmentCommand,
  gum: performGumCommand,
  cookie: performCookie,
  hunter: performHunterInterview,
  history: performHistoricalCommand,
}

const INVOCATION_FAMILIES: Record<
  string,
  ((options: import('./retrospectiveTypes').ArsenalInvocation) => FightState) | undefined
> = {
  umbrella: performUmbrellaFeint,
  bono: performModelSelection,
  illumi: performIllumiSupplement,
  machi: (options) =>
    options.command.action.startsWith('machi-corpse')
      ? performMachiCorpse(options)
      : performMachiMaterial(options),
  dolphin: performDolphinLoan,
  halkenburg: performHalkenburgTransfer,
  black: performBlackVoice,
  bio: performBiohazardDevice,
  benjamin: performBenjaminToxin,
  guardian: performGuardianStatement,
  future: performFutureField,
  franklin: performFranklinAim,
  blinky: performBlinkyEvidence,
}

export function performArsenalCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  return traceArsenal({ state, side, command }, executeArsenalCommand(state, side, command))
}

function executeArsenalCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (
    !fightAcceptsCommands(state) ||
    !futureAcceptsMove(state, side) ||
    !validArsenalCommand(command)
  )
    return state
  const invocation = INVOCATION_FAMILIES[command.action.split('-')[0]]
  if (invocation) return invocation({ state, side, command })
  if (command.action === 'gum-heart') return performGumHeart({ state, side, command })
  if (command.action === 'support-consent') return toggleConsent(state, side)
  const family = COMMAND_FAMILIES[command.action.split('-')[0]]
  return family ? family(state, side, command) : state
}

function toggleConsent(state: FightState, side: FightSide): FightState {
  if (!canAct(state[side])) return state
  return { ...state, [side]: { ...state[side], supportConsent: !state[side].supportConsent } }
}

export function arsenalOptions(state: FightState, side: FightSide): ArsenalOption[] {
  return [
    consentOption(state, side),
    ...umbrellaOptions(state, side),
    ...historicalWeaponOptions(state, side),
    ...gumHeartOptions(state, side),
    ...modelSelectionOptions(state, side),
    ...corpseOptions(state, side),
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
    ...halkenburgTransferOptions(state, side),
    ...dolphinLoanOptions(state, side),
    ...machiMaterialOptions(state, side),
    ...judgmentOptions(state, side),
    ...secretWindowOptions(state, side),
    ...bashoArsenalOptions(state, side),
    ...melodyQuestionOptions(state, side),
    ...luiniArsenalOptions(state, side),
    ...sweetHomeOptions(state, side),
    ...padailleEscapeOptions(state, side),
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
