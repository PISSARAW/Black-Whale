import { fieldDeceives } from './futureIllusion'
import { capturePositions } from './fightInterpolation'
import { advanceCatsName } from './camillaCat'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'
import type { FutureControls, SimulateFutureFrame } from './parallelFutureTypes'

/** Solo opponents cannot disclose their private divergence through the player's presentation. */
export function soloFutureDeceives(state: FightState): boolean {
  if (state.mode !== 'versus-ai' || state.phase !== 'fighting') return false
  if (state.futureIllusion) return fieldDeceives(state, 'player')
  return soloFutureControlsLive(state)
}

export function soloFutureControlsLive(state: FightState): boolean {
  return (
    state.mode === 'versus-ai' &&
    state.parallelFuture?.owner === 'opponent' &&
    state.parallelFuture.phase === 'diverging'
  )
}

function perceptionActive(state: FightState): boolean {
  return (
    state.mode === 'versus-ai' &&
    state.phase === 'fighting' &&
    (state.futureIllusion?.owner === 'opponent' || soloFutureControlsLive(state))
  )
}

export function startFuturePerception(state: FightState): FightState {
  if (!soloFutureDeceives(state) || state.futurePerception) return state
  return {
    ...state,
    futurePerception: structuredClone({
      ...state,
      parallelFuture: undefined,
      futureIllusion: undefined,
      futurePerception: undefined,
      forecastSimulation: true,
      opponent: { ...state.opponent, parallelEyesClosed: true, futureIllusionActive: false },
    }),
  }
}

/** Dispatch the same human command in both worlds. Only the real world can decide the match. */
export function performFuturePerceptionAction(
  state: FightState,
  side: FightSide,
  perform: (state: FightState) => FightState,
): FightState | null {
  if (side !== 'player' || !state.futurePerception || !perceptionActive(state)) return null
  // Removing the perception makes nested move/arsenal callbacks dispatch exactly once.
  const detached = { ...state, futurePerception: undefined }
  const real = perform(detached)
  if (!perceptionActive(real)) return real
  const perception = perform(state.futurePerception)
  if (real === detached && perception === state.futurePerception) return state
  return { ...real, futurePerception: perception }
}

export function simulateFuturePerception(
  state: FightState,
  controls: FutureControls,
  simulate: SimulateFutureFrame,
): FightState {
  const previous = state.futurePerception
  const real = simulate(state, controls)
  if (!previous) return real
  if (!perceptionActive(real)) return { ...real, futurePerception: undefined }
  const perception = stepPerception(previous, controls, simulate)
  return {
    ...real,
    player: soloFutureDeceives(real)
      ? { ...real.player, facing: perception.player.facing }
      : real.player,
    futurePerception: { ...perception, previousPositions: capturePositions(previous) },
  }
}

function stepPerception(
  state: FightState,
  controls: FutureControls,
  simulate: SimulateFutureFrame,
): FightState {
  if (state.catsName) return advanceCatsName(state)
  if (state.phase !== 'fighting') return state
  return simulate(state, { ...controls, ai: false, opponent: EMPTY_INPUT })
}

export function futurePerceptionView(
  state: FightState,
  viewer: FightSide = 'player',
): FightState | null {
  if (viewer !== 'player') return null
  if (!state.futurePerception || !soloFutureDeceives(state)) return null
  const perception = state.futurePerception
  const finished = perception.phase === 'finished'
  return {
    ...perception,
    frame: finished ? perception.frame : state.frame,
    time: finished ? perception.time : state.time,
    remainingFrames: finished ? perception.remainingFrames : state.remainingFrames,
    frameAccumulator: state.frameAccumulator,
    forecastSimulation: undefined,
  }
}

export function showFuturePanel(state: FightState, viewer: FightSide): boolean {
  if (state.mode !== 'versus-ai') return true
  if (state.parallelFuture) return state.parallelFuture.owner === viewer
  return viewer === 'player' && state.player.id === 'tserriednich'
}
