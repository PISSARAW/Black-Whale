import { getContext } from 'svelte'
import {
  FIGHT_VISUAL_PREDICTION,
  responsiveFightPosition,
  visualFighter,
  type ReadFightVisualPrediction,
} from './fightVisualPrediction'
import type { FightSide, FightState } from './types'

export function createFightPresentation() {
  const read = getContext<ReadFightVisualPrediction>(FIGHT_VISUAL_PREDICTION) ?? (() => null)
  return {
    position: (state: FightState, side: FightSide) => responsiveFightPosition(state, side, read()),
    fighter: (state: FightState, side: FightSide) => visualFighter(state, side, read()),
  }
}
