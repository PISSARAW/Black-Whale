import { Mesh } from 'three'
import type { Material, Object3D } from 'three'
import type { victoryTransaction } from './transaction'

export function victoryLighting(level = 0.32) {
  const cache = new WeakMap<Material, Material>(),
    owned = new Set<Material>()
  const dim = (source: Material) => {
    const held = cache.get(source)
    if (held) return held
    const next = source.clone()
    ;(next as import('three').MeshBasicMaterial).color?.multiplyScalar(level)
    cache.set(source, next)
    owned.add(next)
    return next
  }
  return {
    apply(root: Object3D, transaction: ReturnType<typeof victoryTransaction>) {
      root.traverse((node) => {
        if (!(node instanceof Mesh)) return
        transaction.material(
          node,
          Array.isArray(node.material) ? node.material.map(dim) : dim(node.material),
        )
      })
    },
    dispose() {
      owned.forEach((material) => material.dispose())
      owned.clear()
    },
  }
}
