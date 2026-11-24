import type * as THREE from 'three'
import type { Vec2 } from '$lib/tour/types'

const SPRINT_FOV = 4
const FOV_EASE = 0.25

interface FovFrame {
  base: number
  gait: number
  moving: boolean
  delta: number
}

export class TourCameraFov {
  private lift = 0

  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  /** Opens on the run and closes on actual movement, not merely on held input. */
  update({ base, gait, moving, delta }: FovFrame): void {
    const target = moving ? Math.min(1, gait / 1.5) ** 2 * SPRINT_FOV : 0
    if (Math.abs(target - this.lift) <= 1e-4) return
    this.lift += (target - this.lift) * Math.min(1, delta / FOV_EASE)
    this.camera.fov = base + this.lift
    this.camera.updateProjectionMatrix()
  }
}

interface CameraPlacement {
  camera: THREE.PerspectiveCamera
  at: Vec2
  eye: number
  yaw: number
  pitch: number
  roll: number
  pullback: number
  impulse?: Vec2
}

export interface ThirdPersonCamera {
  target: Vec2
  distance: number
  shoulder: number
  lockOn?: boolean
}

/** Keeps authored and combat eye offsets inside the same camera placement seam. */
export function placeTourCamera(options: CameraPlacement): void {
  const { camera, at, eye, yaw, pitch, roll, pullback, impulse = [0, 0] } = options
  camera.position.set(at[0] + Math.sin(yaw) * pullback, eye, at[1] + Math.cos(yaw) * pullback)
  camera.rotation.set(0, 0, 0)
  camera.rotateY(yaw + impulse[0])
  camera.rotateX(pitch + impulse[1])
  camera.rotateZ(roll)
}

/** Places a shoulder camera behind the walked body while keeping the reticle on its target. */
export function placeThirdPersonCamera(
  options: CameraPlacement & { thirdPerson: ThirdPersonCamera; ground: number },
): void {
  const { camera, at, eye, yaw, pitch, roll, impulse = [0, 0], thirdPerson, ground } = options
  const distance = thirdPerson.distance * Math.max(1, 1.15 / camera.aspect)
  camera.position.set(
    at[0] + Math.sin(yaw) * distance + Math.cos(yaw) * thirdPerson.shoulder,
    eye + 0.18,
    at[1] + Math.cos(yaw) * distance - Math.sin(yaw) * thirdPerson.shoulder,
  )
  camera.up.set(0, 1, 0)
  camera.lookAt(thirdPerson.target[0], ground + 1.05, thirdPerson.target[1])
  camera.rotateX(pitch + impulse[1])
  camera.rotateY(impulse[0])
  camera.rotateZ(roll)
}

/** Heading used by the walk and by Arena attacks while a target is locked. */
export function thirdPersonHeading(at: Vec2, target: Vec2): number {
  return Math.atan2(at[0] - target[0], at[1] - target[1])
}
