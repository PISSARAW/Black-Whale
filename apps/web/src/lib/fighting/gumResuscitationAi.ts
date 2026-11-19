import { traceArsenal } from './arsenalTrace'
import { performArsenalCommand } from './retrospectiveArsenal'
import type { FightState } from './types'

/** An uncertain prior bet in a safe opening, never knowledge of a hidden future death. */
export function gumResuscitationAi(state: FightState): FightState {
  const body = state.opponent
  if (body.id !== 'hisoka' || body.gumResuscitationProgram) return state
  if (body.health > body.maxHealth * 0.45 || Math.abs(body.x - state.player.x) < 16) return state
  const command = { action: 'gum-program-resuscitation' as const }
  return traceArsenal(
    { state, side: 'opponent', command },
    performArsenalCommand(state, 'opponent', command),
  )
}
