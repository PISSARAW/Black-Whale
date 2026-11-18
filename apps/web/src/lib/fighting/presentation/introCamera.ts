import type { Object3D, PerspectiveCamera } from 'three'
import { fitCinematicView, type CinematicFrame } from '../cinematicTrack'
import { introShot, type IntroFrame } from './introPlayback'
import { applyIntroFreeCamera } from './introFreeCamera'
import { applyThrowCamera } from '../throwCinematicCamera'
import type { ThrowCinematicFrame } from '../throwCinematic'
import type { FightState, FightSide } from '../types'

interface CameraOptions {
  camera: PerspectiveCamera
  state: FightState
  authored?: CinematicFrame
  intro: IntroFrame | null
  reduced: boolean
  intensity: number
  models?: Record<FightSide, { model: { turns: Object3D } }>
  throwFrame?: ThrowCinematicFrame | null
  minimumDistance?: number
}

function entranceCamera(options: CameraOptions): boolean {
  const { camera, state, intro } = options
  if (!intro || intro.waiting || intro.mode !== 'full' || options.intensity === 0) return false
  const shot = introShot(intro)
  if (!shot.side) return false
  return applyIntroFreeCamera(camera, {
    fighter: state[shot.side],
    progress: shot.progress,
    intensity: options.intensity,
    figure: options.models?.[shot.side].model.turns,
  })
}

/** Authored films keep their existing framing; entrances may focus on one actor. */
export function applyPresentationCamera(options: CameraOptions): boolean {
  options.camera.userData.throwCinematic = null
  if (options.reduced) return false
  if (!options.authored) return entranceCamera(options) || throwCamera(options)
  const pose = fitCinematicView(options.authored, options.state, options.camera.aspect)
  options.camera.position.set(pose.x, pose.y, pose.z)
  options.camera.lookAt(pose.x, pose.lookY, 0)
  return true
}

function throwCamera(options: CameraOptions): boolean {
  if (!options.throwFrame) return false
  return applyThrowCamera(options.camera, {
    state: options.state,
    frame: options.throwFrame,
    models: options.models,
    intensity: options.intensity,
    minimumDistance: options.minimumDistance,
  })
}
