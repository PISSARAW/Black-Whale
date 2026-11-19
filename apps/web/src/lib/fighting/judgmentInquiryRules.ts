import { judgmentClauses } from './judgmentRules'
import { recipientBody, recipientHears } from './fightSpeechRecipient'
import { voiceAvailable } from './kallutoListening'
import type { SpeechRecipient } from './fightSpeechRecipient'
import type { FightSide, FightState } from './types'

export function judgmentQuestionReady(state: FightState, side: FightSide): boolean {
  const other = side === 'player' ? 'opponent' : 'player'
  const seal = state[other].judgmentChain
  if (!seal || seal.owner !== side || !judgmentClauses(state[other]).includes('truthful-answers'))
    return false
  if ((seal.ownerMember ?? 0) !== (state.teamMatch?.seats[side].active ?? 0)) return false
  return voiceAvailable(state, side) && recipientHears(state, side, { seat: other })
}

export function judgmentAnswerRecipient(
  state: FightState,
  side: FightSide,
): SpeechRecipient | null {
  const seal = state[side].judgmentChain
  if (!seal?.inquiry || !judgmentClauses(state[side]).includes('truthful-answers')) return null
  return ownerRecipient(state, { owner: seal.owner, member: seal.ownerMember ?? 0 })
}

function ownerRecipient(
  state: FightState,
  owner: { owner: FightSide; member: number },
): SpeechRecipient | null {
  const { member } = owner
  const seat = state.teamMatch?.seats[owner.owner]
  if (!seat && member !== 0) return null
  if (seat && !seat.members[member]) return null
  return { seat: owner.owner, reserve: member === (seat?.active ?? 0) ? undefined : member }
}

export function judgmentAnswerReady(state: FightState, side: FightSide): boolean {
  const recipient = judgmentAnswerRecipient(state, side)
  return Boolean(
    recipient &&
    recipientBody(state, recipient).health > 0 &&
    voiceAvailable(state, side) &&
    recipientHears(state, side, recipient),
  )
}

export function judgmentRecipientTarget(state: FightState, side: FightSide): string | undefined {
  const recipient = judgmentAnswerRecipient(state, side)
  return recipient?.reserve === undefined
    ? undefined
    : `reserve:${recipient.seat}:${recipient.reserve}`
}
