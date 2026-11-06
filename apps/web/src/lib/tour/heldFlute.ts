import type { Object3D, Vector3 } from 'three'

/** A transverse flute follows the camera's forward/right basis at every heading. */
export function positionHeldFlute(
  root: Object3D,
  camera: Vector3,
  options: {
    yaw: number
    seconds: number
    playing: boolean
  },
): void {
  const { yaw, seconds, playing } = options
  const sin = Math.sin(yaw),
    cos = Math.cos(yaw)
  const ahead = playing ? 0.48 : 0.4
  const aside = playing ? 0.12 : 0.42
  const drop = playing ? 0.21 : 0.72
  root.position.set(
    camera.x - sin * ahead + cos * aside,
    camera.y - drop + Math.sin(seconds * (playing ? 7 : 1.5)) * (playing ? 0.006 : 0.02),
    camera.z - cos * ahead - sin * aside,
  )
  root.rotation.set(0, yaw, 0)
  root.rotateZ(playing ? -0.12 : -0.95)
  root.rotateX(playing ? 0.06 : 0.3)
}
