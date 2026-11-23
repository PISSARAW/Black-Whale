import { futureVisibleState } from './parallelFuturePresentation'
import type { FightSide, FightState } from './types'
import {
  FUTURE_WINDOW_FRAMES,
  type FutureFrame,
  type ParallelFutureState,
} from './parallelFutureTypes'
import type { CinematicDirection } from './cinematicTypes'
import type { CinematicFrame } from './cinematicTrack'
import { fightWorldX, fightWorldY } from './fightCoordinates'

export interface FutureCameraView {
  state: FightState
  owner: FightSide
  index: number
  phase: 'vision' | 'diverging'
  cameraFrame: CinematicFrame
  damage: number
  damageTaken: number
  realHealth: number
  elapsedFrames: number
  durationFrames: number
}
export function parallelFutureMain(state: FightState, viewer: FightSide, preview?: number | null) {
  return state.parallelFuture?.frames.length && canCompare(state, viewer)
    ? state
    : futureVisibleState(state, viewer, preview)
}
/** Owner view and shared local play compare reality to the opponent's predicted perception. */
export function parallelFutureCamera(
  state: FightState,
  viewer: FightSide,
  preview?: number | null,
) {
  const future = state.parallelFuture
  if (
    !future ||
    !future.frames.length ||
    future.phase === 'preparing' ||
    !canCompare(state, viewer)
  )
    return { main: futureVisibleState(state, viewer, preview), prediction: null }
  const cursor = futureIndex(future, preview)
  const index = Math.max(0, Math.min(future.frames.length - 1, Math.floor(cursor)))
  const frame = future.frames[index]
  const origin = state.frame - (future.phase === 'diverging' ? future.cursor : 0)
  const predicted = predictedFightState(state, frame, { origin, index })
  return {
    main: state,
    prediction: {
      state: predicted,
      owner: future.owner,
      index,
      phase: future.phase,
      cameraFrame: predictionCameraFrame(frame),
      damage: Math.max(
        0,
        future.frames[Math.max(0, index - 8)][future.owner].health - frame[future.owner].health,
      ),
      damageTaken: Math.max(0, future.frames[0][future.owner].health - frame[future.owner].health),
      realHealth: state[future.owner].health,
      elapsedFrames: future.phase === 'vision' ? index + 1 : future.cursor,
      durationFrames: FUTURE_WINDOW_FRAMES,
    } as FutureCameraView,
  }
}
/** The inset fits the selected pose to its real aspect ratio when drawing. */
function predictionCameraFrame(frame: FutureFrame): CinematicFrame {
  const height = Math.max(fightWorldY(frame.player.y), fightWorldY(frame.opponent.y))
  const midpoint = (fightWorldX(frame.player.x) + fightWorldX(frame.opponent.x)) / 2
  return { x: midpoint, lookY: 1.24 + height * 0.42, z: 5.9, intensity: 0 }
}
function canCompare(state: FightState, viewer: FightSide) {
  return (
    state.parallelFuture?.owner === viewer ||
    state.mode === 'versus-local' ||
    state.mode === 'training'
  )
}
function futureIndex(future: ParallelFutureState, preview?: number | null) {
  return future.phase === 'vision'
    ? (preview ?? future.previewCursor)
    : Math.max(0, future.cursor - 1)
}
function predictedFightState(
  state: FightState,
  frame: FutureFrame,
  { origin, index }: { origin: number; index: number },
): FightState {
  const scene: Partial<NonNullable<FutureFrame['scene']>> = frame.scene ?? {}
  return {
    ...state,
    ...scene,
    frame: origin + index + 1,
    phase: frame.phase,
    time: frame.time,
    rng: frame.rng,
    arena: frame.arena,
    voconteDoors: frame.voconteDoors,
    battlefield: frame.battlefield,
    player: frame.player,
    opponent: frame.opponent,
    projectiles: frame.projectiles,
    impact: frame.impact,
    parallelFuture: undefined,
    forecastSimulation: undefined,
    bungeeGum: scene.bungeeGum ?? null,
    gumNetwork: scene.gumNetwork,
    catsName: scene.catsName,
    catsNameConsumed: scene.catsNameConsumed,
    moonlight: scene.moonlight,
    lsdf: scene.lsdf,
    expulsion: scene.expulsion,
    winner: scene.winner ?? null,
    finishReason: scene.finishReason ?? null,
    hitstop: scene.hitstop ?? 0,
    previousPositions: {
      player: { x: frame.player.x, y: frame.player.y },
      opponent: { x: frame.opponent.x, y: frame.opponent.y },
    },
  }
}
export function futureCameraDirection(owner: FightSide): CinematicDirection {
  return {
    strength: 0.7,
    side: owner,
    detail: {
      kind: 'focus',
      side: owner,
      sourceSide: owner,
      source: 'tserriednich',
      eventId: 'tserriednich.prediction',
      labelFr: 'Laplace Demon · Image prédite',
      labelEn: 'Laplace Demon · Predicted image',
    },
  }
}
