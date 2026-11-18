import type { FightSide, FighterId } from './types'

export const LYNCH_MOVE = 'lynch:neutralSpecial'
export const LYNCH_ANSWER_COST = 10
export const LYNCH_QUESTION_RANGE = 18
export type LynchQuestionId = 'identity' | 'nen' | 'in'

export const LYNCH_QUESTIONS: Record<LynchQuestionId, { fr: string; en: string }> = {
  identity: { fr: 'Qui es-tu réellement ?', en: 'Who are you really?' },
  nen: { fr: 'Quel est ton état de Nen actuel ?', en: 'What is your current Nen state?' },
  in: { fr: 'Dissimules-tu ton aura avec In ?', en: 'Are you concealing your aura with In?' },
}

export interface LynchQuestion {
  id: LynchQuestionId
  target: FightSide
  askedFrame: number
  sourceMoveId: string
}

/** A fact captured at contact, not a live query into the opponent or a future command. */
export interface LynchReply {
  frame: number
  question: LynchQuestionId
  questioner: FightSide
  target: FightSide
  identity?: FighterId
  cohortIdentity?: boolean
  nenMode?: string
  concealed?: boolean
}
