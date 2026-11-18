import type { DowsingQuestion } from './dowsingTypes'

export interface JudgmentInquiry {
  text: string
  askedAt: number
  fact?: DowsingQuestion
}
export interface SpokenMessage {
  text: string
  recipient?: string
  statementIntent?: boolean
  statementFact?: DowsingQuestion
  replyQuestion?: string
  judgmentReply?: { askedAt: number; refuse?: boolean }
  dowsingReply?: { askedAt: number }
}

export const JUDGMENT_QUESTION_LENGTH = 160
export const JUDGMENT_REPLY_LENGTH = 160

export function judgmentTargetLimit(action: string): number {
  if (action === 'judgment-ask') return JUDGMENT_QUESTION_LENGTH + 'question:'.length
  return action === 'judgment-answer' ? JUDGMENT_REPLY_LENGTH + 'truth:'.length : 100
}
