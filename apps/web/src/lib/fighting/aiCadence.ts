import type { FightState } from './types'

/** The AI picks an action every 16–24 frames (about a third of a second). */
const AI_MIN_FRAMES = 16
const AI_SPREAD_FRAMES = 9

/**
 * Counts the AI's decision delay in simulated frames, inside the fixed tick, so
 * that its rhythm no longer depends on the display rate or on dropped frames.
 */
export function advanceAiCadence(
  state: FightState,
  decide: (state: FightState) => FightState,
): FightState {
  if (state.phase !== 'fighting') return state
  const cooldown = (state.aiCooldown ?? AI_MIN_FRAMES + 4) - 1
  if (cooldown > 0) return { ...state, aiCooldown: cooldown }
  const decided = decide(state)
  return { ...decided, aiCooldown: AI_MIN_FRAMES + (decided.rng % AI_SPREAD_FRAMES) }
}
