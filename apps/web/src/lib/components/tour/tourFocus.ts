import type { Camera, Object3D, Raycaster, Vector2 } from 'three'

export function approachTourFocus({
  picker,
  reticle,
  camera,
  visible,
  solids,
  focusDistance,
  delta,
}: {
  picker: Raycaster
  reticle: Vector2
  camera: Camera
  visible?: Object3D
  solids: Record<string, { mesh: Object3D } | undefined>
  focusDistance: number
  delta: number
}): number {
  picker.setFromCamera(reticle, camera)
  const intersectables = visible ? [visible] : []
  for (const solid of Object.values(solids)) {
    if (solid) intersectables.push(solid.mesh)
  }
  const [hit] = picker.intersectObjects(intersectables, true)
  const targetDistance = hit?.distance ?? 100
  return focusDistance + (targetDistance - focusDistance) * Math.min(1, delta * 5)
}
