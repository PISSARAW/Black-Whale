import { attackData } from './frameData'
import type { AttackFrameData } from './frameData'
import type { ArcadeFighter } from './types'

export const BENJAMIN_BURST_SHOTS = 3
export const BENJAMIN_BURST_INTERVAL = 6

export function benjaminRangedData(data: AttackFrameData, fighter: ArcadeFighter): AttackFrameData {
  if (fighter.id !== 'benjamin' || fighter.attack?.kind !== 'ranged') return data
  return { ...data, active: 13, recovery: 22, cancelEnd: data.startup + 13 + 22 }
}

/** Emissions happen on distinct frames, so an interrupted burst stops firing. */
export function benjaminBurstReady(fighter: ArcadeFighter): boolean {
  const attack = fighter.attack
  if (!attack) return false
  if (fighter.id !== 'benjamin') return !attack.projectileSpawned
  const offset = attack.frame - attackData('ranged', fighter).startup
  const emitted = attack.projectilesSpawned ?? 0
  return (
    emitted < BENJAMIN_BURST_SHOTS &&
    offset >= emitted * BENJAMIN_BURST_INTERVAL &&
    offset % BENJAMIN_BURST_INTERVAL === 0
  )
}
