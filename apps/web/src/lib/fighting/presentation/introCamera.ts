import type { Object3D, PerspectiveCamera } from 'three'
import { fitCinematicView, type CinematicFrame } from '../cinematicTrack'
import { introShot, type IntroFrame } from './introPlayback'
import { applyIntroFreeCamera } from './introFreeCamera'
import type { FightState, FightSide } from '../types'

interface CameraOptions {
  camera: PerspectiveCamera
  state: FightState
  authored?: CinematicFrame
  intro: IntroFrame | null
  reduced: boolean
  intensity: number
  models?: Record<FightSide, { model: { turns: Object3D } }>
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
  if (options.reduced) return false
  if (!options.authored) return entranceCamera(options)
  const pose = fitCinematicView(options.authored, options.state, options.camera.aspect)
  options.camera.position.set(pose.x, pose.y, pose.z)
  options.camera.lookAt(pose.x, pose.lookY, 0)
  return true
}
