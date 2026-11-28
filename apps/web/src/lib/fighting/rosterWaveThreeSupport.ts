import type { PhaseFrames } from './keyPoseTimeline'
import { ROSTER_WAVE_THREE_FIGHTERS, ROSTER_WAVE_THREE_SLOTS } from './keyPosesRosterWaveThree'
import { ROSTER_WAVE_THREE_DIRECTIONAL_SLOTS } from './keyPosesRosterWaveThreeDirectional'
import { groundedStrikeSupport } from './groundedStrikeSupport'
import { moveById } from './movesets'
import type { ArcadeFighter } from './types'

const FIGHTERS = new Set<string>(ROSTER_WAVE_THREE_FIGHTERS)
const SLOTS = new Set<string>([
  ...ROSTER_WAVE_THREE_SLOTS,
  ...ROSTER_WAVE_THREE_DIRECTIONAL_SLOTS,
  'lowHeavy',
])

export function rosterWaveThreeSupport(fighter: ArcadeFighter, frames: PhaseFrames) {
  const attack = fighter.attack
  const slot = moveById(attack?.moveId)?.slot
  if (!attack || !slot || !FIGHTERS.has(fighter.id) || !SLOTS.has(slot)) return null
  return groundedStrikeSupport(slot, attack.frame, frames)
}
