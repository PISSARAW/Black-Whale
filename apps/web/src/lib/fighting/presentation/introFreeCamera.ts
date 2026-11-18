import { Vector3, type PerspectiveCamera, type Object3D } from 'three'
import type { ArcadeFighter } from '../types'
import { fightWorldX } from '../fightCoordinates'
import { introPerformance } from './introPerformances'
import { sampleIntroCamera } from './introPerformanceSample'
import { introLandmarkBounds, type IntroLandmarkBounds } from './introLandmarks'

interface IntroBounds {
  x: number
  height: number
  landmarks?: IntroLandmarkBounds
  safeTop?: number
}

interface Orbit {
  x: number
  yaw: number
  height: number
  radius: number
  gaze: number
  roll: number
}
const point = new Vector3()

function place(camera: PerspectiveCamera, orbit: Orbit, scale: number) {
  camera.position.set(
    orbit.x + Math.sin(orbit.yaw) * orbit.radius * scale,
    Math.max(0.35, orbit.gaze + (orbit.height - orbit.gaze) * scale),
    Math.cos(orbit.yaw) * orbit.radius * scale,
  )
  camera.lookAt(orbit.x, orbit.gaze, 0)
  camera.rotateZ(orbit.roll)
  camera.updateMatrixWorld(true)
}

function refineFit(
  camera: PerspectiveCamera,
  orbit: Orbit,
  bounds: IntroBounds & { low: number; high: number },
) {
  for (let step = 0; step < 16; step++) {
    const middle = (bounds.low + bounds.high) / 2
    place(camera, orbit, middle)
    if (introInFrame(camera, bounds)) bounds.high = middle
    else bounds.low = middle
  }
  place(camera, orbit, bounds.high)
}

/** Includes extended hands, head and feet rather than fitting only an idle silhouette. */
export function introInFrame(camera: PerspectiveCamera, bounds: IntroBounds): boolean {
  const box = bounds.landmarks ?? {
    left: bounds.x - 1.2,
    right: bounds.x + 1.2,
    bottom: 0.03,
    top: bounds.height,
    near: -0.45,
    far: 0.45,
  }
  for (const x of [box.left, box.right])
    for (const y of [box.bottom, box.top])
      for (const z of [box.near, box.far]) {
        point.set(x, y, z).project(camera)
        if (
          Math.abs(point.x) > 0.86 ||
          point.y > (bounds.safeTop ?? 0.82) ||
          point.y < -0.82 ||
          point.z > 1
        )
          return false
      }
  return true
}

/** A true 3D orbit: yaw, elevation, dolly, gaze height and optional gentle roll. */
export function applyIntroFreeCamera(
  camera: PerspectiveCamera,
  options: {
    fighter: ArcadeFighter
    progress: number
    intensity: number
    figure?: Object3D
  },
): boolean {
  const performance = introPerformance(options.fighter.id)
  if (!performance) return false
  const [yaw, height, radius, gaze, roll = 0] = sampleIntroCamera(performance, options.progress)
  const strength = options.intensity
  const orbit: Orbit = {
    x: fightWorldX(options.fighter.x),
    yaw: (0.45 + (yaw - 0.45) * strength) * options.fighter.facing,
    height: 1.8 + (height - 1.8) * strength,
    radius: 4.8 + (radius - 4.8) * strength,
    gaze,
    roll: roll * strength * options.fighter.facing,
  }
  const bounds = {
    x: orbit.x,
    height: introActorHeight(options.fighter),
    landmarks: introLandmarkBounds(options.figure),
  }
  // Widen continuously at the current orbit angle, preserving the authored camera direction.
  let scale = 1
  let previous = scale
  for (let attempt = 0; attempt < 60; attempt++) {
    place(camera, orbit, scale)
    if (introInFrame(camera, bounds)) {
      if (previous < scale) refineFit(camera, orbit, { ...bounds, low: previous, high: scale })
      return true
    }
    previous = scale
    scale *= 1.035
  }
  return true
}

export function introActorHeight(fighter: ArcadeFighter): number {
  if (fighter.biscuitTrueForm) return 3.25
  if (['franklin', 'beyond'].includes(fighter.id)) return 3.1
  if (['melody', 'biscuit', 'kalluto'].includes(fighter.id)) return 2.25
  return 2.75
}
