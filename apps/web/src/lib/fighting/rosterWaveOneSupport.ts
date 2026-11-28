import type { PhaseFrames } from './keyPoseTimeline'
import { ROSTER_WAVE_ONE_FIGHTERS, ROSTER_WAVE_ONE_SLOTS } from './keyPosesRosterWaveOne'
import { ROSTER_WAVE_ONE_DIRECTIONAL_SLOTS } from './keyPosesRosterWaveOneDirectional'
import { groundedStrikeSupport } from './groundedStrikeSupport'
import { moveById } from './movesets'
import type { ArcadeFighter } from './types'

const FIGHTERS = new Set<string>(ROSTER_WAVE_ONE_FIGHTERS)
const SLOTS = new Set<string>([
  ...ROSTER_WAVE_ONE_SLOTS,
  ...ROSTER_WAVE_ONE_DIRECTIONAL_SLOTS,
  'lowHeavy',
])

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
  return groundedStrikeSupport(slot, attack.frame, frames)
}
