import { availablePaperScatter, paperControlBusy } from './kallutoScatter'
import type { FightSide, FightState } from './types'

/** One continuous manipulation: subsequent commands reuse actual confetti, never another fresh burst. */
export function paperDolphinContinues(state: FightState, side: FightSide, moveId: string): boolean {
  const held = state[side].kurapika?.held
  if (held?.source !== 'kalluto' || held.returned || !held.used) return false
  if (!['kalluto:forwardSpecial', 'kalluto:finisher'].includes(moveId)) return false
  return paperControlBusy(state, side) && Boolean(availablePaperScatter(state, side))
}
