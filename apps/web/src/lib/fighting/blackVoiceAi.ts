import { chrolloHasActivePage } from './chrolloBook'
import { performBlackVoiceCommand } from './blackVoiceAction'
import { voiceGear } from './blackVoiceGear'
import { voiceTargets } from './blackVoiceTargets'
import type { FightState } from './types'

export function blackVoiceAi(state: FightState): FightState | null {
  if (state.opponent.id !== 'chrollo' || !chrolloHasActivePage(state.opponent, 'black-voice'))
    return null
  const subject = voiceTargets(state).find(
    (target) =>
      target.control?.owner === 'opponent' &&
      target.control.ownerMember === (state.teamMatch?.seats.opponent.active ?? 0) &&
      !target.control.active &&
      target.health > 0,
  )
  if (!subject) return null
  const gear = voiceGear(state, 'opponent')
  const command = gear.phone?.hand
    ? { action: 'voice-stay' as const, target: subject.id }
    : { action: 'voice-phone' as const }
  const next = performBlackVoiceCommand(state, 'opponent', command)
  return next === state ? null : next
}
