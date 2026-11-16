import { biohazardCanLaunch } from './biohazard'
import type { FightState, MoveSlot } from './types'

export function biohazardAiSlots(
  state: FightState,
  roll: number,
  gap: number,
): readonly MoveSlot[] {
  const objects = state.opponent.biohazard?.objects ?? []
  if (objects.some((o) => o.phase === 'bound')) return ['standingHeavy', 'standingLight']
  const passed = objects.some(
    (o) => o.phase === 'flying' && (state.player.x - o.x) * o.direction < -5,
  )
  if (passed) return ['downSpecial', 'forwardHeavy']
  if (
    gap > 12 &&
    roll > 0.5 &&
    !state.player.biohazardGraceFrames &&
    biohazardCanLaunch(state.opponent)
  )
    return ['neutralSpecial', 'forwardHeavy']
  return roll < 0.4 ? ['standingLight', 'lowLight'] : ['forwardHeavy', 'standingHeavy']
}
