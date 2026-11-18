import type { PerspectiveCamera, Object3D, Vector3, Quaternion } from 'three'
import { introLandmarkBounds, type IntroLandmarkBounds } from './presentation/introLandmarks'
import type { ThrowCinematicFrame } from './throwCinematic'
import { throwCinematicPhase } from './throwCinematic'
import type { FightSide, FightState } from './types'
import { fightWorldX } from './fightCoordinates'
import { directedThrowShot, fitThrowShot } from './throws/camera'
import { throwEquipmentBounds } from './throws/cameraAnchors'

type Models = Record<FightSide, { model: { turns: Object3D } }>
const cameraStarts = new WeakMap<
  PerspectiveCamera,
  { frame: ThrowCinematicFrame; position: Vector3; quaternion: Quaternion }
>()

function cameraStart(camera: PerspectiveCamera, frame: ThrowCinematicFrame) {
  const previous = cameraStarts.get(camera)
  if (previous?.frame === frame) return previous
  const start = { frame, position: camera.position.clone(), quaternion: camera.quaternion.clone() }
  cameraStarts.set(camera, start)
  return start
}
const smooth = (value: number) => {
  const t = Math.min(1, Math.max(0, value))
  return t * t * (3 - 2 * t)
}

/** The lens follows the real posed pair, reserving the HUD area on wide and portrait screens. */
export function applyThrowCamera(
  camera: PerspectiveCamera,
  options: {
    state: FightState
    frame: ThrowCinematicFrame
    models?: Models
    intensity: number
    minimumDistance?: number
    returnToCombat?: boolean
  },
): boolean {
  const { frame, state, intensity } = options
  if (!frame.active || intensity <= 0) return false
  const t = frame.age / frame.duration
  const base = cameraStart(camera, frame)
  const returnPose = options.returnToCombat
    ? { position: camera.position.clone(), quaternion: camera.quaternion.clone() }
    : base
  const bounds = throwEquipmentBounds(
    pairBounds(state, options.models),
    options.models?.[frame.attacker].model.turns,
    frame,
  )
  const centre = (bounds.left + bounds.right) / 2
  const shot = directedThrowShot({
    frame,
    bounds,
    models: options.models,
    minimumDistance: options.minimumDistance,
    baseRadius: Math.max(
      options.minimumDistance ?? 0,
      Math.hypot(base.position.x - centre, base.position.z),
    ),
  })
  fitThrowShot(camera, shot)
  const weight = (1 - smooth((t - 0.82) / 0.18)) * intensity
  camera.position.lerpVectors(returnPose.position, camera.position.clone(), weight)
  camera.quaternion.slerpQuaternions(returnPose.quaternion, camera.quaternion.clone(), weight)
  camera.updateMatrixWorld(true)
  camera.userData.throwCinematic = {
    phase: throwCinematicPhase(frame),
    age: frame.age,
    attacker: frame.attacker,
    sequence: frame.sequence,
    performance: frame.performance,
    powered: frame.powered,
    shot: shot.beat,
  }
  return true
}

function pairBounds(state: FightState, models?: Models): IntroLandmarkBounds {
  const bodies = (['player', 'opponent'] as const).map(
    (side) => introLandmarkBounds(models?.[side].model.turns) ?? fallbackBounds(state, side),
  )
  return {
    left: Math.min(...bodies.map((body) => body.left)),
    right: Math.max(...bodies.map((body) => body.right)),
    bottom: Math.min(...bodies.map((body) => body.bottom)),
    top: Math.max(...bodies.map((body) => body.top)),
    near: Math.min(...bodies.map((body) => body.near)),
    far: Math.max(...bodies.map((body) => body.far)),
  }
}

function fallbackBounds(state: FightState, side: FightSide): IntroLandmarkBounds {
  const x = fightWorldX(state[side].x)
  return { left: x - 1.1, right: x + 1.1, bottom: 0, top: 2.8, near: -0.5, far: 0.5 }
}
