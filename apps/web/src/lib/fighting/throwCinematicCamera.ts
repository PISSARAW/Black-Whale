import type { PerspectiveCamera, Object3D, Vector3, Quaternion } from 'three'
import { introLandmarkBounds, type IntroLandmarkBounds } from './presentation/introLandmarks'
import { introInFrame } from './presentation/introFreeCamera'
import type { ThrowCinematicFrame } from './throwCinematic'
import { throwCinematicPhase } from './throwCinematic'
import type { FightSide, FightState } from './types'
import { fightWorldX } from './fightCoordinates'

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
  const bounds = pairBounds(state, options.models)
  const centre = (bounds.left + bounds.right) / 2
  const lift = smooth(t / 0.5)
  const slam = smooth((t - 0.5) / 0.3)
  const yaw = (0.18 + lift * 0.55 - slam * 0.3) * frame.facing
  const gaze = 1.15 + lift * 0.3 - slam * 0.9
  const height = 1.8 + lift * 0.85 - slam * 1.8
  let radius = Math.max(
    3.8,
    options.minimumDistance ?? 0,
    Math.hypot(base.position.x - centre, base.position.z) * 0.68,
  )
  for (let attempt = 0; attempt < 70; attempt++) {
    camera.position.set(centre + Math.sin(yaw) * radius, height, Math.cos(yaw) * radius)
    camera.lookAt(centre, gaze, 0)
    camera.updateMatrixWorld(true)
    if (introInFrame(camera, { x: centre, height: bounds.top, landmarks: bounds, safeTop: 0.64 }))
      break
    radius *= 1.035
  }
  const weight = smooth(t / 0.12) * (1 - smooth((t - 0.82) / 0.18)) * intensity
  camera.position.lerpVectors(returnPose.position, camera.position.clone(), weight)
  camera.quaternion.slerpQuaternions(returnPose.quaternion, camera.quaternion.clone(), weight)
  camera.updateMatrixWorld(true)
  camera.userData.throwCinematic = {
    phase: throwCinematicPhase(frame),
    age: frame.age,
    attacker: frame.attacker,
    sequence: frame.sequence,
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
