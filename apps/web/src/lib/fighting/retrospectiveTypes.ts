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

  personalEncounters?: readonly import('./personalEncounters').PersonalEncounter[]
  deviceTouchId?: string
  devicePlayback?: import('./deviceTypes').DevicePlayback
  receiverReading?: import('./deviceTypes').ReceiverReading
  dowsingScreened?: readonly { deviceId: string; sampleId: number }[]
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
  gumWoundOrigin?: import('./bungeeSource').GumSource
  gumCatch?: import('./bungeeSource').GumSource & {
    frames: number
    hand?: import('./deviceHands').DeviceHand
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
  'gum-anchor-attach',
  'gum-anchor-self',
  'gum-anchor-object',
  'gum-anchor-stop',
  'gum-anchor-release',
  'bono-model',
  'illumi-corpse',
  'illumi-corpse-order',
  'illumi-corpse-speak',
  'illumi-corpse-release',
  'dowsing-locate',
  'judgment-reveal',
  'judgment-return-hostage',
  'machi-suture',
  'machi-length',
  'machi-detach',
  'machi-anchor',
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
  'window-contact',
  'window-stop',
  'basho-compose',
  'melody-ask',
  'melody-answer',
  'sweet-home-object',
  'padaille-escape',
  'paper-release-confetti',
  'paper-kit-take',
  'paper-kit-drop',
  'paper-kit-gather',
  'paper-stop-listening',
  'window-recall',
  'window-stop-listening',
  'window-listen',
  'window-archive',
  'window-archive-close',
  'window-recorded',
  'person-dolphin-use',
  'person-dolphin-close',
  'person-eye-left',
  'person-eye-right',
  'person-eye-look-left',
  'person-eye-look-right',
  'person-eye-stay',
  'person-eye-release',
  'little-eye-left',
  'little-eye-right',
  'little-eye-stay',
  'little-eye-look-left',
  'little-eye-look-right',
  'little-eye-release',
  'voice-self-implant',
  'voice-autopilot',
  'voice-watch',
  'voice-arm',
  'voice-phone',
  'voice-pocket',
  'voice-drop',
  'voice-pickup',
  'voice-implant',
  'voice-remove',
  'voice-stay',
  'voice-retreat',
  'voice-approach',
  'voice-attack',
  'voice-spoken-attack',
  'biohazard-device',
  'biohazard-device-cancel',
  'biohazard-device-end',
  'biohazard-swallow',
  'biohazard-place',
  'biohazard-cat-left',
  'biohazard-cat-right',
  'biohazard-cat-stay',
  'biohazard-cat-recall',
  'device-pickup',
  'device-drop',
  'device-record',
  'device-watch',
  'device-fire',
  'device-signal',
  'device-face-left',
  'device-face-right',
  'basho-ask',
  'basho-answer',
  'basho-ward',
  'basho-remove-ward',
  'writing-take',
  'writing-drop',
  'statement-sincere',
  'statement-lie',
  'dowsing-video',
  'dowsing-ask',
  'dowsing-answer',
  'dowsing-stop',
  'judgment-preset',
  'judgment-release',
  'judgment-call',
  'judgment-ask',
  'judgment-answer',
  'dolphin-lend',
  'dolphin-use',
  'dolphin-move',
  'copied-move',
  'gum-seal',
  'gum-prosthesis',
  'gum-prosthesis-release',
  'gum-spring-step',
  'texture-target',
  'texture-remove',
  'texture-apply',
  'document-draw',
  'illumi-face-mode',
  'illumi-face-apply',
  'illumi-face-remove',
  'document-take',
  'document-drop',
  'document-read',
  'document-show',
  'texture-paper',
  'texture-paper-text',
  'texture-paper-remove',
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
  'history-gallery-locate',
  'history-gallery-stop',
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
  loan?: boolean
}
export interface CookieSession {
  loan?: boolean
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
