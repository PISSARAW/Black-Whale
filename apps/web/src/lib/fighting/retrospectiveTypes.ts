import type { FightSide, FighterId } from './types'

export interface RetrospectiveFighterState {
  camillaRounds?: number
  luiniSelectedDestination?: string
  luiniExit?: { destinationId: string; mode: import('./luiniPassage').LuiniExitMode }
  luiniPassage?: import('./luiniPassage').LuiniPassage
  luiniComplete?: boolean
  speechPulse?: { frame: number; shape: 'sudden' | 'gradual' }
  melodyAskedAt?: number
  melodyPrompt?: {
    owner: FightSide
    askedAt: number
    question: import('./dowsingTypes').DowsingQuestion
  }
  secretWindowMode?: 'contact' | 'listening'
  padailleEscape?: import('./padailleEscape').PadailleEscape
  weaponsConfiscated?: boolean
  sweetHomeObject?: string
  bashoPrompt?: {
    owner: FightSide
    askedAt: number
    question: import('./dowsingTypes').DowsingQuestion
  }
  dowsingSession?: import('./dowsingTypes').DowsingSession
  dowsingPrompt?: import('./dowsingTypes').DowsingPrompt
  dowsingReading?: import('./dowsingTypes').DowsingReading
  judgmentPreset?: import('./judgmentRules').JudgmentPreset
  judgmentDeclaration?: {
    frame: number
    hostageId?: string
    clauses: readonly import('./judgmentRules').JudgmentClause[]
  }
  heardWords?: { frame: number; speaker: FighterId; text: string }
  chrolloHistorical?: import('./chrolloHistoricalTypes').ChrolloHistoricalState
  clothCapture?: { owner: FightSide }
  skillHunterStolen?: readonly { owner: FightSide; moveId: string }[]
  hunterInterview?: { target: FighterId; askedAt: number; answeredAt?: number }
  hunterQuestion?: { owner: FightSide; askedAt: number }
  moonlightPenaltyFrames?: number
  gumWoundSeals?: number
  gumCatch?: {
    frames: number
    hidden?: boolean
    released?: boolean
    projectile?: import('./types').FightProjectile
    incomingSpeed?: number
  }
  supportConsent?: boolean
  cookie?: CookieSession
  arsenalSleep?: { owner: FightSide; cause: 'cookie' }
}

export const ARSENAL_ACTION_IDS = [
  'umbrella-feint',
  'future-blink',
  'illumi-mask',
  'guardian-answer',
  'benjamin-toxin',
  'future-field-mode',
  'future-field-stop',
  'franklin-aim',
  'blinky-evidence',
  'illumi-needle-mode',
  'illumi-needle-remove',
  'gum-heart',
  'weapon-ready',
  'weapon-throw',
  'weapon-contain',
  'bono-model',
  'illumi-corpse',
  'illumi-corpse-order',
  'illumi-corpse-speak',
  'illumi-corpse-release',
  'dowsing-locate',
  'dowsing-video',
  'judgment-reveal',
  'judgment-return-hostage',
  'machi-suture',
  'machi-length',
  'machi-detach',
  'machi-anchor',
  'machi-corpse',
  'machi-corpse-fire',
  'machi-pull',
  'dolphin-loan',
  'halkenburg-transfer',
  'black-roster',
  'black-order',
  'black-remove',
  'luini-select',
  'luini-peek',
  'luini-cross',
  'luini-travel',
  'luini-retract',
  'luini-emerge',
  'bio-transform',
  'bio-axe-counter',
  'bio-recover',
  'bio-gun-fire',
  'bio-camera-read',
  'bio-camera-move',
  'bio-receiver-give',
  'bio-signal',
  'bio-oyster-hide',
  'window-listen',
  'window-contact',
  'window-stop',
  'basho-compose',
  'basho-ask',
  'basho-answer',
  'melody-ask',
  'melody-answer',
  'sweet-home-object',
  'padaille-escape',
  'dowsing-ask',
  'dowsing-answer',
  'dowsing-stop',
  'judgment-preset',
  'judgment-release',
  'judgment-call',
  'dolphin-move',
  'copied-move',
  'gum-seal',
  'gum-unseal',
  'gum-release',
  'gum-catch',
  'gum-return',
  'gum-limb',
  'gum-anchor',
  'gum-object',
  'gum-select',
  'gum-detach',
  'gum-recall',
  'gum-propel',
  'gum-prepare-throw',
  'gum-rethrow',
  'support-consent',
  'cookie-massage',
  'cookie-piano',
  'cookie-stop',
  'hunter-ask',
  'hunter-answer',
  'hunter-palm',
  'history-phone-criteria',
  'history-phone-call',
  'history-page',
  'history-use',
  'history-release',
  'history-order-wait',
  'history-order-attack',
  'history-shape-left',
  'history-shape-right',
  'history-shape-swap',
] as const
export type ArsenalActionId = (typeof ARSENAL_ACTION_IDS)[number]
export interface ArsenalCommand {
  action: ArsenalActionId
  target?: string
}
export interface CookieSession {
  target: FightSide
  mode: 'massage' | 'piano'
  frames: number
  targetHealth: number
  targetX: number
  targetY: number
}
export interface ArsenalInvocation {
  state: import('./types').FightState
  side: FightSide
  command: ArsenalCommand
}
export interface ArsenalOption {
  command: ArsenalCommand
  labelFr: string
  labelEn: string
  ready: boolean
  conditionFr: string
  conditionEn: string
}
