import { watchVoiceSubject } from './blackVoiceVision'
import { canSpeak } from './saiyuSenses'
import { freeDeviceHand } from './deviceHands'
import { implantVoiceTarget, issueVoiceOrder } from './blackVoice'
import { dropVoicePiece, performVoiceGearCommand, voiceGearBodyReady } from './blackVoiceGear'
import { changeVoiceTarget, voiceTarget } from './blackVoiceTargets'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { BlackVoiceOrder } from './blackVoiceTypes'
import type { FightSide, FightState } from './types'

const ORDERS: Record<string, BlackVoiceOrder> = {
  'voice-stay': 'stay',
  'voice-retreat': 'retreat',
  'voice-approach': 'approach',
  'voice-attack': 'attack',
}
export function performBlackVoiceCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (!voiceGearBodyReady(state, side)) return state
  const target = command.target ?? (side === 'player' ? 'opponent' : 'player')
  if (command.action === 'voice-watch') return watchVoiceSubject(state, side, target)
  if (command.action === 'voice-implant') return implantVoiceTarget(state, side, target)
  if (command.action === 'voice-remove') return removeVoiceAntenna(state, side, target)
  const order = ORDERS[command.action]
  // Buttons issue the simple orders; speech is not an additional vow for operating the keys.
  if (order) return issueVoiceOrder(state, side, { targetId: target, order })
  if (command.action === 'voice-spoken-attack')
    return canSpeak(state[side])
      ? issueVoiceOrder(state, side, { targetId: target, order: 'attack' })
      : state
  return performVoiceGearCommand(state, side, command)
}
function removeVoiceAntenna(state: FightState, side: FightSide, id: string): FightState {
  if (!freeDeviceHand(state, side)) return state
  const target = voiceTarget(state, id),
    control = target?.control
  if (!target || !control || Math.hypot(target.x - state[side].x, target.y - state[side].y) > 4)
    return state
  // A controlled victim cannot act voluntarily to undo the control. A free third body can.
  const released = changeVoiceTarget(state, target, {
    blackVoiceControl: undefined,
    ...(target.body ? { hatsuEffects: { ...target.body.hatsuEffects, manipulatedFrames: 0 } } : {}),
  })
  return dropVoicePiece(released, side, control.antenna)
}
