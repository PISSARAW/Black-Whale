import { martialSlots, type ArsenalAiContext } from './arsenalAiTypes'
import { hasPlantedPaper, paperState } from './kallutoPaper'
import type { MoveSlot } from './types'

/** Mark, then cut the marked zone. Surveillance is an occasional safe-distance choice. */
export function kallutoAiSlots(context: ArsenalAiContext): readonly MoveSlot[] {
  const { state, gap, roll } = context
  const fighter = state.opponent
  if (fighter.weaponsConfiscated) return martialSlots(context)
  if (gap < 7) return ['standingLight', 'backHeavy', 'lowLight']
  const paper = paperState(fighter)
  if (!hasPlantedPaper(state, 'opponent', paper.zone))
    return [paper.zone === 'feet' ? 'downSpecial' : 'neutralSpecial']
  if (gap > 20 && roll > 0.9 && !paper.doll) return ['backSpecial', 'forwardSpecial']
  return ['forwardSpecial', 'finisher', 'standingLight']
}
