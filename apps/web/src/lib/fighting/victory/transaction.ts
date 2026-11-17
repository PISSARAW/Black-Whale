import type { Material, Mesh, Object3D, PerspectiveCamera } from 'three'

export function victoryTransaction(camera: PerspectiveCamera) {
  const restores: Array<() => void> = []
  const seen = new Set<Object3D>()
  const position = camera.position.clone(),
    rotation = camera.quaternion.clone(),
    up = camera.up.clone()
  const save = (node: Object3D) => {
    if (seen.has(node)) return
    seen.add(node)
    const p = node.position.clone(),
      q = node.quaternion.clone(),
      scale = node.scale.clone(),
      visible = node.visible
    restores.push(() => {
      node.position.copy(p)
      node.quaternion.copy(q)
      node.scale.copy(scale)
      node.visible = visible
    })
  }
  return {
    save,
    defer: (restore: () => void) => restores.push(restore),
    material(mesh: Mesh, material: Material | Material[]) {
      const previous = mesh.material
      restores.push(() => {
        mesh.material = previous
      })
      mesh.material = material
    },
    restore() {
      restores.reverse().forEach((restore) => restore())
      seen.forEach((node) => node.updateWorldMatrix(true, false))
      camera.position.copy(position)
      camera.quaternion.copy(rotation)
      camera.up.copy(up)
      camera.updateMatrixWorld(true)
    },
  }
}
