import { voicePhoneReady, voiceGearBodyReady } from './blackVoiceGear'
import { voiceSourceActive } from './blackVoice'
import { voiceTarget, type VoiceTarget } from './blackVoiceTargets'
import { sleepingBody } from './hanzoProjection'
import { visibleBodyAppearance } from './fightBodyIdentity'
import { senseDeprived } from './saiyuSenses'
import { DEVICE_CAMERA_RANGE } from './deviceTypes'
import type { ArcadeFighter, FighterId, FightSide, FightState } from './types'

export interface BlackVoiceScreen {
  subject: string
  frame: number
  blank: boolean
  pictures: readonly { appearance: FighterId; x: number; y: number; projection?: boolean }[]
}
declare module './types' {
  interface ArcadeFighter {
    blackVoiceScreen?: BlackVoiceScreen
  }
}
/** The original phone shows the subject's current visual field, never thoughts or hidden pages. */
export function watchVoiceSubject(state: FightState, side: FightSide, id: string): FightState {
  const target = voiceTarget(state, id)
  if (!target || !canWatch(state, side, target)) return state
  const blank = subjectBlind(target.body)
  const pictures = blank
    ? []
    : (['player', 'opponent'] as const).flatMap((seat) => pictureBody(state, target, seat))
  return {
    ...state,
    [side]: {
      ...state[side],
      blackVoiceScreen: { subject: target.id, frame: state.frame, blank, pictures },
    },
  }
}
function canWatch(state: FightState, side: FightSide, target: VoiceTarget): boolean {
  const control = target.control
  if (!control?.active || !voiceSourceActive(state, control) || !voiceGearBodyReady(state, side))
    return false
  return (
    control.owner === side &&
    control.ownerMember === (state.teamMatch?.seats[side].active ?? 0) &&
    voicePhoneReady(state, side, control.antenna.pairId)
  )
}
function subjectBlind(body?: ArcadeFighter): boolean {
  return Boolean(
    body &&
    (senseDeprived(body, 'sight') ||
      body.parallelEyesClosed ||
      body.arsenalSleep ||
      body.clothCapture ||
      body.hanzoProjection),
  )
}
function pictureBody(
  state: FightState,
  target: VoiceTarget,
  seat: FightSide,
): BlackVoiceScreen['pictures'][number][] {
  const actor = state[seat],
    point = sleepingBody(actor)
  if (
    actor.clothCapture ||
    (target.side === seat && target.member === (state.teamMatch?.seats[seat].active ?? 0))
  )
    return []
  const pictures: BlackVoiceScreen['pictures'][number][] = inView(target, point)
    ? [{ appearance: visibleBodyAppearance(actor), x: point.x, y: point.y }]
    : []
  if (actor.hanzoProjection && inView(target, actor))
    pictures.push({
      appearance: visibleBodyAppearance(actor),
      x: actor.x,
      y: actor.y,
      projection: true,
    })
  return pictures
}
function inView(target: VoiceTarget, point: { x: number; y: number }): boolean {
  const direction = target.body?.facing ?? (target.control!.owner === 'player' ? 1 : -1)
  return (
    Math.hypot(point.x - target.x, point.y - target.y) <= DEVICE_CAMERA_RANGE &&
    (point.x - target.x) * direction >= 0
  )
}
