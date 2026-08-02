import { countOf } from './telemetry'
import type { HuntState } from './state'

export type TutorialStep = 'move' | 'zetsu' | 'en' | 'hatsu' | 'contact' | 'done'

/** One lesson at a time, derived from play rather than advanced by a Next button. */
export function tutorialStep(state: HuntState): TutorialStep {
  if (state.duel || countOf(state.log, 'duelOpened') > 0) return 'done'
  const usedHatsu = state.hatsu.uses > 0 || countOf(state.log, 'laidEntrave') > 0
  if (usedHatsu) return 'contact'
  if (countOf(state.log, 'sweptEn') > 0) return 'hatsu'
  if (countOf(state.log, 'wentZetsu') > 0) return 'en'
  if (state.clock > 0.25 && !state.player.atRest) return 'zetsu'
  return 'move'
}
