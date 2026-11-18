import { currentDowsingQuestion } from './dowsingRules'
import type { SpeechRecipient } from './fightSpeechRecipient'
import type { SpokenMessage } from './judgmentInquiryTypes'
import type { FightSide, FightState } from './types'

/** Reads an actual, intentionally identified answer; unrepresented intent never means sincerity. */
export function resolveDowsingReply(
  state: FightState,
  side: FightSide,
  speech: { recipient: SpeechRecipient; message: SpokenMessage },
): FightState {
  const prompt = state[side].dowsingPrompt
  if (!prompt || !currentDowsingQuestion(state, side, prompt)) return state
  if (speech.recipient.seat !== prompt.asker || speech.recipient.reserve !== undefined) return state
  if (!answersDowsing(state, side, speech.message)) return state
  const session = state[prompt.asker].dowsingSession!
  const intent = speech.message.statementIntent
  return {
    ...state,
    [side]: { ...state[side], dowsingPrompt: undefined },
    [prompt.asker]: {
      ...state[prompt.asker],
      dowsingSession: { ...session, readingAt: state.frame, swings: intent === true },
      dowsingReading: {
        frame: state.frame,
        text: speech.message.text,
        swings: intent === true,
        inconclusive: intent === undefined || undefined,
      },
    },
  }
}
function answersDowsing(state: FightState, side: FightSide, message: SpokenMessage): boolean {
  const prompt = state[side].dowsingPrompt!
  return (
    message.dowsingReply?.askedAt === prompt.askedAt ||
    Boolean(prompt.text && message.replyQuestion === prompt.text) ||
    (prompt.question !== 'free' && message.statementFact === prompt.question)
  )
}
