import type { PhaseFrames } from './keyPoseTimeline'
import { ROSTER_WAVE_TWO_FIGHTERS, ROSTER_WAVE_TWO_SLOTS } from './keyPosesRosterWaveTwo'
import { ROSTER_WAVE_TWO_DIRECTIONAL_SLOTS } from './keyPosesRosterWaveTwoDirectional'
import { groundedStrikeSupport } from './groundedStrikeSupport'
import { moveById } from './movesets'
import type { ArcadeFighter } from './types'

const FIGHTERS = new Set<string>(ROSTER_WAVE_TWO_FIGHTERS)
const SLOTS = new Set<string>([
  ...ROSTER_WAVE_TWO_SLOTS,
  ...ROSTER_WAVE_TWO_DIRECTIONAL_SLOTS,
  'lowHeavy',
])

export function rosterWaveTwoSupport(fighter: ArcadeFighter, frames: PhaseFrames) {
  const attack = fighter.attack
  const slot = moveById(attack?.moveId)?.slot
  if (!attack || !slot || !FIGHTERS.has(fighter.id) || !SLOTS.has(slot)) return null
  return groundedStrikeSupport(slot, attack.frame, frames)
}
