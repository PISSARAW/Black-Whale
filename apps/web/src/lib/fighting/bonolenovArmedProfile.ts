import type { ArcadeFighter, MoveSlot } from './types'

interface SpearNormal {
  reach: number
  /** Contact along the actual shaft, in rig units from the grip. */
  contact: number
  pitch: number
  sweep: number
}

const NORMALS: Partial<Record<MoveSlot, SpearNormal>> = {
  standingLight: { reach: 3.1, contact: 1.59, pitch: 0, sweep: 0 },
  standingHeavy: { reach: 2.6, contact: 1, pitch: 0.1, sweep: 0.43 },
  lowLight: { reach: 2.1, contact: 1.59, pitch: -0.29, sweep: 0 },
  lowHeavy: { reach: 2.8, contact: 1.12, pitch: -0.24, sweep: -0.46 },
  airLight: { reach: 2.5, contact: 1.59, pitch: -0.22, sweep: 0.11 },
  airHeavy: { reach: 2.8, contact: 1.23, pitch: -0.42, sweep: 0.31 },
  forwardLight: { reach: 3.3, contact: 1.59, pitch: -0.03, sweep: 0 },
  forwardHeavy: { reach: 3, contact: 1.17, pitch: 0.18, sweep: 0.7 },
  backHeavy: { reach: 1.8, contact: -1.2, pitch: 0.1, sweep: -0.17 },
}

export function bonolenovHasSpear(fighter: ArcadeFighter): boolean {
  return (
    fighter.id === 'bonolenov' &&
    Boolean(fighter.battleCantabile?.prologue) &&
    !fighter.weaponsConfiscated
  )
}

export function spearNormal(fighter: ArcadeFighter, slot?: MoveSlot): SpearNormal | undefined {
  return slot && bonolenovHasSpear(fighter) ? NORMALS[slot] : undefined
}
