import type { StrikeShape } from './rosterChoreography'
import type { Foot } from './standingStrikeDirections'
import type { FighterId, MoveSlot } from './types'

type Footwork = readonly [
  shape: StrikeShape,
  support: Foot,
  chamberAt: number,
  pivot: number,
  compression: number,
  reachStep: number,
]

/** Neutral J and K. Angles, weight and travel are authored for each strike. */
const FOOTWORK: Partial<Record<FighterId, readonly [light: Footwork, heavy: Footwork]>> = {
  biscuit: [
    ['palm', 'rear', 0.38, -0.23, 0.25, 0.03],
    ['uppercut', 'lead', 0.74, 0.54, 0.63, 0.12],
  ],
  franklin: [
    ['cross', 'rear', 0.54, 0.26, 0.26, 0.05],
    ['hammer', 'lead', 0.78, 0.22, 0.73, 0.09],
  ],
}

export function standingFootwork(id: FighterId, slot: MoveSlot): Footwork | undefined {
  if (slot !== 'standingLight' && slot !== 'standingHeavy') return undefined
  return FOOTWORK[id]?.[slot === 'standingLight' ? 0 : 1]
}
