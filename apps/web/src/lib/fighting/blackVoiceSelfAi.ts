import { voiceSelfMissionAvailable } from './blackVoiceAutopilot'
import { performBlackVoiceCommand } from './blackVoiceAction'
import { voiceGear } from './blackVoiceGear'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { FightState } from './types'

/** Draw, implant, take the phone and activate; no body, pin or free aura is fabricated. */
export function blackVoiceSelfAi(state: FightState): FightState | null {
  if (!voiceSelfMissionAvailable(state, 'opponent') || state.opponent.blackVoiceAftermath)
    return null
  const actor = state.opponent
  const pending = actor.blackVoiceControl
  const gear = voiceGear(state, 'opponent')
  let action: ArsenalCommand['action']
  if (pending) action = gear.phone?.hand ? 'voice-autopilot' : 'voice-phone'
  else {
    if (!selfEmergency(state)) return null
    action = drawSelfStep(state)
  }
  const next = performBlackVoiceCommand(state, 'opponent', { action })
  return next === state ? null : next
}

function selfEmergency(state: FightState): boolean {
  return (
    state.opponent.health <= 35 &&
    state.opponent.aura >= 65 &&
    !state.player.blackVoiceControl?.active
  )
}
function drawSelfStep(state: FightState): ArsenalCommand['action'] {
  const gear = voiceGear(state, 'opponent')
  if (gear.armed) return 'voice-self-implant'
  return gear.phone?.hand ? 'voice-pocket' : 'voice-arm'
}
