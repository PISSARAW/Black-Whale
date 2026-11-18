import { judgmentAnswerRecipient } from './judgmentInquiryRules'
import { chainRuleDeath } from './kurapikaActions'
import type { SpeechRecipient } from './fightSpeechRecipient'
import type { JudgmentInquiry, SpokenMessage } from './judgmentInquiryTypes'
import type { FightSide, FightState } from './types'

/** Only an actual, intentionally declared answer counts. Free text is never parsed as a lie or refusal. */
export function resolveJudgmentReply(
  state: FightState,
  side: FightSide,
  speech: { recipient: SpeechRecipient; message: SpokenMessage },
): FightState {
  const seal = state[side].judgmentChain
  const inquiry = seal?.inquiry
  const owner = judgmentAnswerRecipient(state, side)
  if (!inquiry || !owner || !sameRecipient(owner, speech.recipient)) return state
  const message = speech.message
  if (!answersInquiry(inquiry, message)) return state
  if (message.judgmentReply?.refuse || message.statementIntent === true)
    return chainRuleDeath(state, side)
  if (message.statementIntent !== false) return state
  return { ...state, [side]: { ...state[side], judgmentChain: { ...seal!, inquiry: undefined } } }
}

function sameRecipient(left: SpeechRecipient, right: SpeechRecipient): boolean {
  return left.seat === right.seat && left.reserve === right.reserve
}

function answersInquiry(inquiry: JudgmentInquiry, message: SpokenMessage): boolean {
  return (
    message.judgmentReply?.askedAt === inquiry.askedAt ||
    Boolean(inquiry.fact && message.statementFact === inquiry.fact)
  )
}
