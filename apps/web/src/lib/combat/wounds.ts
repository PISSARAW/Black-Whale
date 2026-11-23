import type { FighterState, Impact } from './types'

const NON_WOUNDING_BLINKY_MOVES = new Set([
  'shizuku:neutralSpecial',
  'shizuku:downSpecial',
  'shizuku:backSpecial',
  'shizuku:finisher',
])

/** Only a connected physical Blinky strike creates a wound; ordinary hitstun never does. */
export function recordArenaWound(
  fighter: FighterState,
  moveId: string | undefined,
  impact: Impact,
): FighterState {
  if (!moveId?.startsWith('shizuku:') || NON_WOUNDING_BLINKY_MOVES.has(moveId)) return fighter
  if (impact === 'miss' || impact === 'blocked') return fighter
  return { ...fighter, openWounds: fighter.openWounds + 1 }
}

export function exposedArenaWounds(fighter: FighterState): number {
  return Math.max(0, fighter.openWounds - (fighter.pluggingWounds ? 2 : 0))
}
