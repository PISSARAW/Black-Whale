import type { FightSide } from './types'

export type DowsingQuestion = 'identity' | 'nen' | 'in'
export interface DowsingSession {
  question: DowsingQuestion | 'free' | 'recording'
  text?: string
  askerMember?: number
  targetMember?: number
  video?: { deviceId: string }
  target: FightSide
  startedAt: number
  readingAt?: number
  swings?: boolean
}
export interface DowsingPrompt {
  asker: FightSide
  question: DowsingQuestion | 'free'
  text?: string
  askerMember?: number
  targetMember?: number
  askedAt: number
}
/** The indication concerns a deliberate statement, never an objective truth oracle. */
export interface DowsingReading {
  frame: number
  text: string
  swings: boolean
  inconclusive?: boolean
  source?: { deviceId: string; recordedAt: number; sampleId: number }
}
export const DOWSING_MOVE = 'kurapika:forwardSpecial'
export const DOWSING_COST = 3
export const DOWSING_TEXT_LENGTH = 160
export const DOWSING_QUESTIONS: Record<DowsingQuestion, { fr: string; en: string }> = {
  identity: { fr: 'Qui es-tu réellement ?', en: 'Who are you really?' },
  nen: { fr: 'Quel est ton état de Nen actuel ?', en: 'What is your current Nen state?' },
  in: { fr: 'Dissimules-tu ton aura avec In ?', en: 'Are you concealing your aura with In?' },
}
