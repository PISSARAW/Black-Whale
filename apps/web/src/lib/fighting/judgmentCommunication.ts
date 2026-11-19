import { chrolloCopiedMove } from './chrolloBook'
import { judgmentClauses } from './judgmentRules'
import { troupeMember } from './troupeMembership'
import { chainRuleDeath } from './kurapikaActions'
import type { ArcadeFighter, FighterId, FightSide, FightState } from './types'

/** An actual recipient is required; proximity, being overheard or a paper disguise is not an initiated contact. */
export function judgmentForbidsContact(speaker: ArcadeFighter, recipient: FighterId): boolean {
  return judgmentClauses(speaker).includes('no-troupe-contact') && troupeMember(recipient)
}
export function resolveJudgmentCommunication(
  state: FightState,
  speaker: FightSide,
  recipient: FighterId,
): FightState {
  const disclosure =
    judgmentClauses(state[speaker]).includes('no-disclosure') &&
    state[speaker].judgmentDisclosure === state.frame
  return disclosure || judgmentForbidsContact(state[speaker], recipient)
    ? chainRuleDeath(state, speaker)
    : state
}

export function aiJudgmentSpeechAllowed(
  state: FightState,
  side: FightSide,
  moveId: string,
): boolean {
  const recipient = state[side === 'player' ? 'opponent' : 'player']
  if (!judgmentForbidsContact(state[side], recipient.id)) return true
  const native = state[side].id === 'chrollo' ? chrolloCopiedMove(state[side], moveId) : moveId
  return !['lynch:neutralSpecial', 'mizaistom:neutralSpecial', 'longhi:neutralSpecial'].includes(
    native ?? moveId,
  )
}
