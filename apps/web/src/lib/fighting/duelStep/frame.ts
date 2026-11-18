import { advanceHalkenburgSouls } from '../halkenburgSouls'
import { advanceRetrospectiveHitstop } from '../retrospectiveClocks'
import { performArenaAction } from '../arenaActions'
import { advanceArena, readArenaInputs } from '../arenaSimulation'
import { reconcileBattleCantabile } from '../battleCantabileFrame'
import { advancePreparation } from '../preparationSimulation'
import { advancePredatorClock } from '../predatorSeal'
import { reconcileMelodySound } from '../melodyChannel'
import { advanceCatsName } from '../camillaCat'
import { fightResolutionPending } from '../fightOutcome'
import { advanceEmperorClock } from '../kurapikaActions'
import { FIGHT_FPS } from '../fightClock'
import { finishExpiredFight } from '../fightTimeout'
import type { FightState } from '../types'
import type { DuelAttack, DuelInputs, DuelPhaseResult } from './types'
import { bufferKameoCalls } from '../kameos/buffer'

/** Shared world clocks, preparation and arena, before any body moves. */
export function openFrame(
  state: FightState,
  inputs: DuelInputs,
  attack: DuelAttack,
): DuelPhaseResult {
  state = advancePredatorClock(state)
  if (state.catsName) return { state: advanceCatsName(state), pending: true }
  state = advanceEmperorClock(state)
  if (state.hitstop > 0)
    return { state: hitstopFrame(bufferKameoCalls(state, inputs)), pending: true }
  state = advanceHalkenburgSouls(state)
  state = advancePreparation(state, inputs)
  state = readArenaInputs(state, inputs, (current, side) =>
    performArenaAction(current, side, attack),
  )
  state = advanceArena(state)
  return { state, pending: fightResolutionPending(state) }
}

function hitstopFrame(state: FightState): FightState {
  return advanceRetrospectiveHitstop({
    ...state,
    frame: state.frame + 1,
    hitstop: state.hitstop - 1,
  })
}

/** Advances the frame counter and round clock from the frame's opening world. */
export function closeFrame(start: FightState, resolved: FightState): FightState {
  const remainingFrames =
    start.mode === 'training' ? start.remainingFrames : Math.max(0, start.remainingFrames - 1)
  const next = {
    ...resolved,
    frame: start.frame + 1,
    remainingFrames,
    time: remainingFrames / FIGHT_FPS,
  }
  return reconcileBattleCantabile(reconcileMelodySound(finishExpiredFight(next)))
}
