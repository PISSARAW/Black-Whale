import type { CombatAction } from '../combat/types'
import type { ArenaDirection } from './moveSlot'

/** Turns the held first-person direction into a deterministic planar jump drift. */
export function arenaJumpAction(
  heading: number,
  direction: ArenaDirection,
): Extract<CombatAction, { type: 'JUMP' }> {
  const sign = direction === 'forward' ? 1 : direction === 'back' ? -1 : 0
  return {
    type: 'JUMP',
    side: 'player',
    vector: [-Math.sin(heading) * sign, -Math.cos(heading) * sign],
  }
}
