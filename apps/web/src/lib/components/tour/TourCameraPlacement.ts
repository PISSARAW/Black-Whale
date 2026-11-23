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

/** Keeps authored and combat eye offsets inside the same camera placement seam. */
export function placeTourCamera(options: CameraPlacement): void {
  const { camera, at, eye, yaw, pitch, roll, pullback, impulse = [0, 0] } = options
  camera.position.set(at[0] + Math.sin(yaw) * pullback, eye, at[1] + Math.cos(yaw) * pullback)
  camera.rotation.set(0, 0, 0)
  camera.rotateY(yaw + impulse[0])
  camera.rotateX(pitch + impulse[1])
  camera.rotateZ(roll)
}
