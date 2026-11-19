import { dowsingAnswerText } from './dowsingAnswers'
import { DOWSING_QUESTIONS } from './dowsingTypes'
import { speakPaperWords } from './kallutoListening'
import {
  judgmentQuestionReady,
  judgmentAnswerReady,
  judgmentRecipientTarget,
} from './judgmentInquiryRules'
import { JUDGMENT_QUESTION_LENGTH, JUDGMENT_REPLY_LENGTH } from './judgmentInquiryTypes'
import type { DowsingQuestion } from './dowsingTypes'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function performJudgmentInquiry(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (command.action === 'judgment-ask') return askJudgmentQuestion(state, side, command.target)
  if (command.action === 'judgment-answer')
    return answerJudgmentQuestion(state, side, command.target)
  return state
}

function askJudgmentQuestion(state: FightState, side: FightSide, target?: string): FightState {
  const question = readQuestion(target)
  if (!question || !judgmentQuestionReady(state, side)) return state
  const { text, fact } = question
  const other = side === 'player' ? 'opponent' : 'player'
  const spoken = speakPaperWords(state, side, text)
  if (spoken.phase !== 'fighting' || spoken[side].health <= 0) return spoken
  const body = spoken[other]
  return {
    ...spoken,
    [other]: {
      ...body,
      judgmentChain: {
        ...body.judgmentChain!,
        inquiry: { text, fact, askedAt: state.frame },
        lastInquiryAt: state.frame,
      },
    },
  }
}

function readQuestion(target?: string): { text: string; fact?: DowsingQuestion } | null {
  if (!target) return null
  if (target.startsWith('question:')) {
    const text = target.slice(9).trim()
    return text && text.length <= JUDGMENT_QUESTION_LENGTH ? { text } : null
  }
  if (!Object.hasOwn(DOWSING_QUESTIONS, target)) return null
  const fact = target as DowsingQuestion
  return { text: DOWSING_QUESTIONS[fact].fr, fact }
}

function answerJudgmentQuestion(state: FightState, side: FightSide, target?: string): FightState {
  if (!judgmentAnswerReady(state, side)) return state
  const inquiry = state[side].judgmentChain!.inquiry!
  const reply = readReply({ target, fact: inquiry.fact, state, side })
  if (!reply) return state
  return speakPaperWords(state, side, {
    ...reply,
    recipient: judgmentRecipientTarget(state, side),
    replyQuestion: inquiry.text,
    statementFact: inquiry.fact,
    judgmentReply: { askedAt: inquiry.askedAt, refuse: target === 'refuse' },
  })
}

function readReply(input: {
  target?: string
  fact?: DowsingQuestion
  state: FightState
  side: FightSide
}): { text: string; statementIntent: boolean } | null {
  const { target, fact, state, side } = input
  if (target === 'refuse')
    return { text: 'Je refuse de répondre à ta question.', statementIntent: false }
  if (fact && (target === 'sincere' || target === 'lie'))
    return {
      text: dowsingAnswerText(state[side], fact, target === 'lie'),
      statementIntent: target === 'lie',
    }
  const match = /^(truth|lie):([\s\S]+)$/.exec(target ?? '')
  const text = match?.[2].trim()
  return match && text && text.length <= JUDGMENT_REPLY_LENGTH
    ? { text, statementIntent: match[1] === 'lie' }
    : null
}

export function judgmentInquiryOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const options: ArsenalOption[] = []
  if (judgmentQuestionReady(state, side))
    for (const [id, labels] of Object.entries(DOWSING_QUESTIONS))
      options.push({
        command: { action: 'judgment-ask', target: id },
        labelFr: `Judgment · Demander : ${labels.fr}`,
        labelEn: `Judgment · Ask: ${labels.en}`,
        ready: true,
        conditionFr:
          'Question prononcée et réellement entendue par le porteur de la clause de sincérité.',
        conditionEn: 'Spoken question actually heard by the bearer of the truthful-answer clause.',
      })
  const inquiry = state[side].judgmentChain?.inquiry
  if (!inquiry) return options
  const replies = inquiry.fact ? (['sincere', 'lie', 'refuse'] as const) : (['refuse'] as const)
  const names = {
    sincere: ['Répondre sincèrement', 'Answer truthfully'],
    lie: ['Répondre par un mensonge conscient', 'Knowingly answer falsely'],
    refuse: ['Refuser de répondre', 'Refuse to answer'],
  }
  for (const answer of replies)
    options.push({
      command: { action: 'judgment-answer', target: answer },
      labelFr: `Judgment · ${names[answer][0]}`,
      labelEn: `Judgment · ${names[answer][1]}`,
      ready: judgmentAnswerReady(state, side),
      conditionFr:
        'Réponse volontaire à la question en attente. Mentir ou refuser est fatal ; le silence et le texte libre ne sont pas interprétés automatiquement.',
      conditionEn:
        'Voluntary answer to the pending question. Lying or refusing is fatal; silence and free text are not automatically interpreted.',
    })
  return options
}
