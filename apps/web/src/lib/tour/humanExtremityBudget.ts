import type { BufferGeometry, Mesh, Object3D } from 'three'

export const EXTREMITY_QUALITY_TARGET = {
  nearDistance: 8,
  midDistance: 24,
  hand: { maxTriangles: 1_500, bones: 16, maxDrawCalls: 2 },
  foot: { maxTriangles: 900, bones: 4, maxDrawCalls: 2 },
  maxAddedDrawCalls: 4,
} as const

export interface GeometryMetrics {
  drawCalls: number
  triangles: number
  vertices: number
}

/** Render cost of a subtree; shared buffers still count once per rendered mesh. */
export function geometryMetrics(root: Object3D): GeometryMetrics {
  const metrics: GeometryMetrics = { drawCalls: 0, triangles: 0, vertices: 0 }
  root.traverse((node) => {
    const mesh = node as Mesh<BufferGeometry>
    if (!mesh.isMesh || !mesh.visible) return
    const position = mesh.geometry.getAttribute('position')
    if (!position) return
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    const visibleMaterials = materials.filter((material) => material.visible)
    if (!visibleMaterials.length) return
    metrics.drawCalls += visibleMaterials.length
    metrics.vertices += position.count
    metrics.triangles += Math.floor((mesh.geometry.index?.count ?? position.count) / 3)
  })
  return metrics
}
