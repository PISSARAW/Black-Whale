import { getContext } from 'svelte'
import { attackPoseFraction, createAttackTravel } from './fightAttackTravel'
import { closeFightPosition } from './fightCloseSpacing'
import { withThrowPresentation } from './throwPresentationLayer'
import { deathMatchBodyPosition } from './heavensDeathMatch/fightBridge'
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
  return withThrowPresentation({
    position: (state: FightState, side: FightSide) => responsiveFightPosition(state, side, read()),
    fighter: (state: FightState, side: FightSide) => visualFighter(state, side, read()),
    poseFraction: attackPoseFraction,
    bodyPosition(state: FightState, side: FightSide) {
      const prediction = read()
      const body = travel[side](
        responsiveFightPosition(state, side, prediction),
        visualFighter(state, side, prediction),
        state,
      )
      const lane = closeFightPosition(state, side, {
        body,
        rival: responsiveFightPosition(
          state,
          side === 'player' ? 'opponent' : 'player',
          prediction,
        ),
      })
      // In the death match, Chrollo is drawn where the plan put him in the stands.
      return deathMatchBodyPosition(state, side, lane)
    },
  })
}

export function fightFrameDeltaSeconds(previousFrame: number | undefined, frame: number) {
  return Math.min(0.1, Math.max(0, (frame - (previousFrame ?? frame)) / 60))
}
