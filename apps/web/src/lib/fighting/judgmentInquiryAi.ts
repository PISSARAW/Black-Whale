import { performJudgmentInquiry } from './judgmentInquiryAction'
import { judgmentQuestionReady, judgmentAnswerReady } from './judgmentInquiryRules'
import type { FightState } from './types'

/** No invented knowledge for an arbitrary written question. Ordinary represented self-facts are answerable. */
export function judgmentInquiryAi(state: FightState): FightState | null {
  if (knownReplyDue(state))
    return performJudgmentInquiry(state, 'opponent', {
      action: 'judgment-answer',
      target: 'sincere',
    })
  if (!judgmentQuestionReady(state, 'opponent') || state.player.judgmentChain?.inquiry) return null
  const last = state.player.judgmentChain?.lastInquiryAt ?? -360
  if (state.frame - last < 360) return null
  return performJudgmentInquiry(state, 'opponent', { action: 'judgment-ask', target: 'identity' })
}

function knownReplyDue(state: FightState): boolean {
  const inquiry = state.opponent.judgmentChain?.inquiry
  return Boolean(
    inquiry?.fact && state.frame - inquiry.askedAt >= 30 && judgmentAnswerReady(state, 'opponent'),
  )
}
