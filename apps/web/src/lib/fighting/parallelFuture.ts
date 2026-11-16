import {
  beginFutureDivergence,
  futureNenAvailable,
  futureSource,
  stopParallelFuture,
} from './parallelFutureAbility'
import { forecastParallelFuture } from './parallelFutureForecast'
import { FUTURE_PREPARATION_FRAMES, FUTURE_WINDOW_FRAMES } from './parallelFutureTypes'
import type {
  FutureControls,
  ReplayFutureCommand,
  SimulateFutureFrame,
} from './parallelFutureTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

interface FutureEngine {
  simulate: SimulateFutureFrame
  replay: ReplayFutureCommand
}

export function stepParallelFuture(
  state: FightState,
  controls: FutureControls,
  engine: FutureEngine,
): FightState {
  const future = state.parallelFuture
  if (!future) return engine.simulate(state, controls)
  if (!futureValid(state)) return engine.simulate(stopParallelFuture(state), controls)
  if (future.phase === 'preparing') return stepPreparation(state, controls, engine.simulate)
  if (future.phase === 'vision') return stepVision(state, controls)
  return stepDivergence(state, controls, engine)
}

function futureValid(state: FightState): boolean {
  const future = state.parallelFuture!
  const owner = state[future.owner]
  if (!futureNenAvailable(owner) || !futureSource(owner, future.sourceMoveId)) return false
  return future.phase === 'diverging' || owner.nen.mode === 'zetsu'
}

function stepPreparation(
  state: FightState,
  controls: FutureControls,
  simulate: SimulateFutureFrame,
): FightState {
  const future = state.parallelFuture!
  const next = simulate(state, { ...controls, ai: controls.ai && future.owner !== 'opponent' })
  const owner = next[future.owner]
  if (preparationInterrupted(state, next)) return stopParallelFuture(next)
  const preparation = future.preparation + Number(state.hitstop === 0)
  const prepared = { ...next, parallelFuture: { ...future, preparation } }
  if (preparation < FUTURE_PREPARATION_FRAMES) return prepared
  const held = {
    ...controls,
    player: { ...controls.player },
    opponent: controls.opponent && { ...controls.opponent },
  }
  const frames = forecastParallelFuture(prepared, held, simulate)
  return {
    ...prepared,
    parallelFuture: { ...prepared.parallelFuture, phase: 'vision', frames, controls: held },
    [future.owner]: { ...owner, parallelEyesClosed: true },
  }
}

function preparationInterrupted(before: FightState, after: FightState): boolean {
  const side = before.parallelFuture!.owner
  const fighter = after[side]
  return (
    after.phase !== 'fighting' ||
    fighter.health < before[side].health ||
    fighter.hitStun > 0 ||
    fighter.knockdownFrames > 0 ||
    !futureValid(after)
  )
}

function stepVision(state: FightState, controls: FutureControls): FightState {
  const future = state.parallelFuture!
  if (future.owner === 'opponent' && controls.ai) return beginFutureDivergence(state, 'opponent')
  return {
    ...state,
    parallelFuture: { ...future, previewCursor: (future.previewCursor + 4) % FUTURE_WINDOW_FRAMES },
  }
}

function stepDivergence(
  state: FightState,
  controls: FutureControls,
  engine: FutureEngine,
): FightState {
  const future = state.parallelFuture!
  const held = future.controls!
  const replayControls =
    future.owner === 'player'
      ? { ...controls, opponent: held.opponent, ai: false }
      : { ...controls, player: held.player }
  let next = restorePerceivedFacing(engine.simulate(state, replayControls), state)
  if (future.owner === 'player' && held.ai) next = replayAi(next, state, engine.replay)
  if (next.phase !== 'fighting' || future.cursor + 1 >= FUTURE_WINDOW_FRAMES)
    return stopParallelFuture(next)
  return { ...next, parallelFuture: { ...future, cursor: future.cursor + 1 } }
}

function restorePerceivedFacing(next: FightState, original: FightState): FightState {
  const future = original.parallelFuture!
  const observer = future.owner === 'player' ? 'opponent' : 'player'
  return {
    ...next,
    [observer]: { ...next[observer], facing: future.frames[future.cursor][observer].facing },
  }
}

function replayAi(next: FightState, original: FightState, replay: ReplayFutureCommand): FightState {
  const future = original.parallelFuture!
  const frame = future.frames[future.cursor]
  if (next.phase !== 'fighting') return next
  const prepared = { ...next, parallelFuture: { ...future, replaying: true } }
  const acted = frame.command ? replay(prepared, frame.command) : prepared
  return {
    ...acted,
    rng: frame.rng,
    aiCooldown: frame.aiCooldown,
    parallelFuture: { ...future, replaying: false },
  }
}

/** AI decisions and targeting follow the afterimage; collision always uses the real fighter. */
export function futurePerceivedTarget(
  state: FightState,
  observer: FightSide,
  actual: ArcadeFighter,
): ArcadeFighter {
  const future = state.parallelFuture
  if (future?.phase !== 'diverging' || observer === future.owner) return actual
  const frame = future.frames[Math.max(0, future.cursor - 1)]
  return frame[future.owner]
}
