import { visibleBodyAppearance } from './fightBodyIdentity'
import { canHear } from './melodyRules'
import type { ArcadeFighter, FightSide, FightState } from './types'

export interface SpeechRecipient {
  seat: FightSide
  reserve?: number
}
export function speechRecipient(
  state: FightState,
  speaker: FightSide,
  target?: string,
): SpeechRecipient | null {
  if (!target) return { seat: speaker === 'player' ? 'opponent' : 'player' }
  const match = /^reserve:(player|opponent):([0-2])$/.exec(target)
  if (!match) return null
  const seat = match[1] as FightSide,
    reserve = Number(match[2])
  const team = state.teamMatch?.seats[seat]
  return team && reserve !== team.active && team.members[reserve] ? { seat, reserve } : null
}
export function recipientBody(state: FightState, recipient: SpeechRecipient): ArcadeFighter {
  if (recipient.reserve === undefined) return state[recipient.seat]
  const body = state.teamMatch!.seats[recipient.seat].members[recipient.reserve]
  // Reserves physically wait beyond their side's gate; no telephone or remote Nen is supplied.
  return { ...body, x: recipient.seat === 'player' ? 7 : 93, y: 0 }
}
export function recipientHears(
  state: FightState,
  speaker: FightSide,
  recipient: SpeechRecipient,
): boolean {
  const body = recipientBody(state, recipient)
  return (
    canHear(body) &&
    !body.arsenalSleep &&
    !recipientUnconscious(body) &&
    Math.hypot(state[speaker].x - body.x, state[speaker].y - body.y) <= 18
  )
}
export function recordHeardWords(
  state: FightState,
  recipient: SpeechRecipient,
  words: { speaker: FightSide; text: string },
): FightState {
  if (recipientBody(state, recipient).blackVoiceAutopilot) return state
  const heardWords = {
    frame: state.frame,
    speaker: visibleBodyAppearance(state[words.speaker]),
    text: words.text,
  }
  if (recipient.reserve === undefined)
    return { ...state, [recipient.seat]: { ...state[recipient.seat], heardWords } }
  const team = state.teamMatch!,
    seat = team.seats[recipient.seat]
  return {
    ...state,
    teamMatch: {
      ...team,
      seats: {
        ...team.seats,
        [recipient.seat]: {
          ...seat,
          members: seat.members.map((member, index) =>
            index === recipient.reserve ? { ...member, heardWords } : member,
          ),
        },
      },
    },
  }
}

function recipientUnconscious(body: ArcadeFighter): boolean {
  return (body.kurapika?.blackoutFrames ?? 0) > 0
}
