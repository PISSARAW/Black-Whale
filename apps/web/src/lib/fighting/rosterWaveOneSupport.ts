import type { PhaseFrames } from './keyPoseTimeline'
import { ROSTER_WAVE_ONE_FIGHTERS, ROSTER_WAVE_ONE_SLOTS } from './keyPosesRosterWaveOne'
import { moveById } from './movesets'
import type { ArcadeFighter } from './types'

const FIGHTERS = new Set<string>(ROSTER_WAVE_ONE_FIGHTERS)
const SLOTS = new Set<string>(ROSTER_WAVE_ONE_SLOTS)

export interface RosterWaveOneSupport {
  supportFoot: 'lead' | 'rear'
  pivotFoot: 'lead' | 'rear'
  pivotAngle: number
}

/** Semantic foot lock for the first-wave grounded attacks. */
export function rosterWaveOneSupport(
  fighter: ArcadeFighter,
  frames: PhaseFrames,
): RosterWaveOneSupport | null {
  const attack = fighter.attack
  const slot = moveById(attack?.moveId)?.slot
  if (!attack || !slot || !FIGHTERS.has(fighter.id) || !SLOTS.has(slot)) return null
  const forward = slot === 'forwardLight'
  const heavy = slot === 'standingHeavy'
  const supportFoot = heavy || forward ? 'lead' : 'rear'
  const pivotFoot = supportFoot === 'lead' ? 'rear' : 'lead'
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
