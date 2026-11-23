import type { PhaseFrames } from './keyPoseTimeline'
import { ROSTER_WAVE_TWO_FIGHTERS, ROSTER_WAVE_TWO_SLOTS } from './keyPosesRosterWaveTwo'
import { moveById } from './movesets'
import type { ArcadeFighter } from './types'

const FIGHTERS = new Set<string>(ROSTER_WAVE_TWO_FIGHTERS)
const SLOTS = new Set<string>(ROSTER_WAVE_TWO_SLOTS)

export function rosterWaveTwoSupport(fighter: ArcadeFighter, frames: PhaseFrames) {
  const attack = fighter.attack
  const slot = moveById(attack?.moveId)?.slot
  if (!attack || !slot || !FIGHTERS.has(fighter.id) || !SLOTS.has(slot)) return null
  const forward = slot === 'forwardLight'
  const heavy = slot === 'standingHeavy'
  const supportFoot = heavy || forward ? ('lead' as const) : ('rear' as const)
  const pivotFoot = supportFoot === 'lead' ? ('rear' as const) : ('lead' as const)
  const load = smooth(Math.min(1, attack.frame / Math.max(1, frames.startup)))
  const recovery = Math.max(0, attack.frame - frames.startup - frames.active)
  const release = 1 - smooth(Math.min(1, recovery / Math.max(1, frames.recovery * 0.72)))
  return {
    supportFoot,
    pivotFoot,
    pivotAngle: (heavy ? 0.2 : forward ? 0.15 : 0.1) * load * release,
  }
}

function smooth(value: number): number {
  return value * value * (3 - 2 * value)
}
