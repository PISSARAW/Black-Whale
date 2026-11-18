import { dowsingAnswerText } from './dowsingAnswers'
import { DOWSING_QUESTIONS, DOWSING_TEXT_LENGTH } from './dowsingTypes'
import type { DowsingQuestion } from './dowsingTypes'
import type { SpokenMessage } from './judgmentInquiryTypes'
import type { ArcadeFighter } from './types'

export interface DowsingInquiry {
  question: DowsingQuestion | 'free'
  text: string
}
export function dowsingInquiry(target?: string): DowsingInquiry | null {
  if (!target) return null
  if (Object.hasOwn(DOWSING_QUESTIONS, target)) {
    const question = target as DowsingQuestion
    return { question, text: DOWSING_QUESTIONS[question].fr }
  }
  if (!target.startsWith('question:')) return null
  const text = target.slice('question:'.length).trim()
  return text && text.length <= DOWSING_TEXT_LENGTH ? { question: 'free', text } : null
}

export function dowsingReply(actor: ArcadeFighter, target?: string): SpokenMessage | null {
  const prompt = actor.dowsingPrompt
  if (!prompt || !target) return null
  if (prompt.question !== 'free') return factualReply(actor, target)
  const separator = target.indexOf(':')
  const intent = target.slice(0, separator)
  const text = target.slice(separator + 1).trim()
  if (!['truth', 'lie'].includes(intent) || !text || text.length > DOWSING_TEXT_LENGTH) return null
  return {
    text,
    statementIntent: intent === 'lie',
    replyQuestion: prompt.text,
    dowsingReply: { askedAt: prompt.askedAt },
  }
}
function factualReply(actor: ArcadeFighter, target: string): SpokenMessage | null {
  const prompt = actor.dowsingPrompt!
  if (prompt.question === 'free' || !['sincere', 'lie'].includes(target)) return null
  return {
    text: dowsingAnswerText(actor, prompt.question, target === 'lie'),
    statementIntent: target === 'lie',
    statementFact: prompt.question,
    dowsingReply: { askedAt: prompt.askedAt },
  }
}
