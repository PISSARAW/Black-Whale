import type { FightSide, FighterId } from './types'

export interface RetrospectiveFighterState {
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
  'paper-kit-take',
  'paper-kit-drop',
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
  'gum-unseal',
  'gum-release',
  'gum-catch',
  'gum-return',
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
export interface ArsenalOption {
  command: ArsenalCommand
  labelFr: string
  labelEn: string
  ready: boolean
  conditionFr: string
  conditionEn: string
}
