import { futureVisibleState } from './parallelFuturePresentation'
import type { FightSide, FightState } from './types'
import type { FutureFrame, ParallelFutureState } from './parallelFutureTypes'
import type { CinematicDirection } from './cinematicTypes'
import { createCinematicTrack, type CinematicFrame } from './cinematicTrack'

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
const tracks = new WeakMap<readonly FutureFrame[], CinematicFrame[]>()
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
      cameraFrame: predictionTrack(state, future)[index],
      damage: Math.max(
        0,
        future.frames[Math.max(0, index - 8)][future.owner].health - frame[future.owner].health,
      ),
      damageTaken: Math.max(0, future.frames[0][future.owner].health - frame[future.owner].health),
      realHealth: state[future.owner].health,
      elapsedFrames: future.phase === 'vision' ? index + 1 : future.cursor,
      durationFrames: future.frames.length,
    } as FutureCameraView,
  }
}
function predictionTrack(state: FightState, future: ParallelFutureState) {
  let track = tracks.get(future.frames)
  if (!track) {
    // The exact dolly/fit code used by SolarVision in the reference film.
    const states = future.frames.map((frame, index) => ({
      ...predictedFightState(state, frame, { origin: 0, index }),
      phase: 'fighting' as const,
      winner: null,
    }))
    track = createCinematicTrack(states).frames
    tracks.set(future.frames, track)
  }
  return track
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
