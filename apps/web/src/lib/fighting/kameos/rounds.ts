import type { ArcadeFighter, FightSide } from '../types'
import type { FightKameos, KameoSlot } from './types'

/** Leaders' spawn points, shared by kameo bodies while they wait in reserve. */
export const KAMEO_SPAWN: Record<FightSide, { x: number; facing: -1 | 1 }> = {
  player: { x: 22, facing: 1 },
  opponent: { x: 78, facing: -1 },
}

/** Rebuilds a body for the next round, keeping what the engine carries across rounds. */
export type RoundRebuild = (previous: ArcadeFighter, side: FightSide) => ArcadeFighter

/**
 * Round boundary: a living kameo returns to reserve with a fresh body, like its leader.
 * A dead kameo stays dead; nothing brings a body back between rounds.
 */
export function nextRoundKameos(kameos: FightKameos, rebuild: RoundRebuild): FightKameos {
  const next: FightKameos = {}
  for (const side of ['player', 'opponent'] as const) {
    const slot = kameos[side]
    if (slot) next[side] = nextRoundSlot(slot, (fighter) => rebuild(fighter, side))
  }
  return next
}

function nextRoundSlot(
  slot: KameoSlot,
  rebuild: (fighter: ArcadeFighter) => ArcadeFighter,
): KameoSlot {
  if (slot.phase === 'eliminated') return slot
  return {
    fighter: rebuild(slot.fighter),
    phase: 'reserve',
    call: null,
    cooldownFrames: 0,
    phaseFrames: 0,
  }
}
