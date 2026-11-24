import type { CombatAction } from '../combat/types'
import type { Vec2 } from '../tour/types'

/** Turns the held first-person direction into a deterministic planar jump drift. */
export function arenaJumpAction(vector: Vec2): Extract<CombatAction, { type: 'JUMP' }> {
  return {
    type: 'JUMP',
    side: 'player',
    vector,
  }
}
