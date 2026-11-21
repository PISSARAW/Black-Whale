import type { ArcadeFighter } from './types'

/**
 * Esquive basse (Dix tours, un poing, signatureCombosBiscuitPhinks.ts): holding down while
 * double-tapping forward, Phinks advances a short way crouched, under high strikes, instead of
 * dashing. A martial step, not a Hatsu; the Cyclotron keeps turning (rotation en mouvement).
 * About six units over 12 frames. Duel tuning, not canon.
 */
export const PHINKS_LOW_DODGE = { frames: 12, peak: 60 } as const

export function phinksLowDodge(
  fighter: ArcadeFighter,
  direction: -1 | 1,
): { frames: number; peak: number } | null {
  const low = fighter.id === 'phinks' && fighter.crouching && direction === fighter.facing
  return low ? PHINKS_LOW_DODGE : null
}
