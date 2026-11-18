import { getContext } from 'svelte'
import { attackPoseFraction, createAttackTravel } from './fightAttackTravel'
import {
  FIGHT_VISUAL_PREDICTION,
  responsiveFightPosition,
  visualFighter,
  type ReadFightVisualPrediction,
} from './fightVisualPrediction'
import type { FightSide, FightState } from './types'

export function createFightPresentation() {
  const read = getContext<ReadFightVisualPrediction>(FIGHT_VISUAL_PREDICTION) ?? (() => null)
  const travel = { player: createAttackTravel(), opponent: createAttackTravel() }
  return {
    position: (state: FightState, side: FightSide) => responsiveFightPosition(state, side, read()),
    fighter: (state: FightState, side: FightSide) => visualFighter(state, side, read()),
    poseFraction: attackPoseFraction,
    bodyPosition(state: FightState, side: FightSide) {
      const prediction = read()
      return travel[side](
        responsiveFightPosition(state, side, prediction),
        visualFighter(state, side, prediction),
        state,
      )
    },
  }
}
