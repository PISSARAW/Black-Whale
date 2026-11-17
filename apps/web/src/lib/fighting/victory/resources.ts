import { AdditiveBlending, Line, Mesh } from 'three'
import type { BufferGeometry, Material, Object3D, Texture } from 'three'

export const ease = (value: number) => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}
export function suppressVictoryFlashes(root: Object3D, save: (node: Object3D) => void) {
  root.traverse((node) => {
    if (!(node instanceof Mesh) && !(node instanceof Line)) return
    const materials = Array.isArray(node.material) ? node.material : [node.material]
    if (
      !(node instanceof Line) &&
      !materials.some((material) => material.blending === AdditiveBlending)
    )
      return
    save(node)
    node.visible = false
  })
}
export function disposeVictoryObject(root: Object3D) {
  const geometry = new Set<BufferGeometry>(),
    materials = new Set<Material>(),
    textures = new Set<Texture>()
  root.removeFromParent()
  root.traverse((node) => {
    if (!(node instanceof Mesh) && !(node instanceof Line)) return
    geometry.add(node.geometry)
    const list = Array.isArray(node.material) ? node.material : [node.material]
    list.forEach((material) => {
      materials.add(material)
      const map = (material as import('three').MeshBasicMaterial).map
      if (map) textures.add(map)
    })
    if ('isInstancedMesh' in node) (node as import('three').InstancedMesh).dispose()
  })
  geometry.forEach((item) => item.dispose())
  textures.forEach((item) => item.dispose())
  materials.forEach((item) => item.dispose())
}
