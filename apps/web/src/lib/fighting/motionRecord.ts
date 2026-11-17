import { controlSchemeOf } from './controlScheme'
import { appendMotion, numpadDirection } from './motionInput'
import type { ArcadeFighter, FightInput } from './types'

/**
 * Logs this tick's direction for classic motions. Simplified fighters keep no log, so their
 * state (and replay checkpoints) stay exactly as before the control schemes existed.
 */
export function recordMotion(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  if (controlSchemeOf(fighter) !== 'classic') return fighter
  const direction = numpadDirection(fighter.facing, input)
  return { ...fighter, motionLog: appendMotion(fighter.motionLog, direction) }
}
