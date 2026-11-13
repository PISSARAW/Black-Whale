import type * as Three from 'three'

import type { TierPlan } from './blueprint'
import type { TierMesh } from './mesh'
import { conditionUniformsOf, trafficAttribute } from './surfaceCondition'

/** Shared GPU attributes: one upload, then a draw range for each room. */
export interface TierAttributes {
  position: Three.BufferAttribute
  normal: Three.BufferAttribute
  color: Three.BufferAttribute
  sheen: Three.BufferAttribute
  traffic: Three.BufferAttribute | null
  edge: Three.BufferAttribute
  seam: Three.BufferAttribute
  pattern: Three.BufferAttribute
  fitting: Three.BufferAttribute
  fittingColor: Three.BufferAttribute
  pane: Three.BufferAttribute
  paneColor: Three.BufferAttribute
  sky: Three.BufferAttribute | null
}

export function tierAttributesOf(options: {
  THREE: typeof Three
  mesh: TierMesh
  plan: TierPlan
  surface: Three.Material
}): TierAttributes {
  const { THREE, mesh, plan, surface } = options
  const of = (data: Float32Array, size = 3) => new THREE.BufferAttribute(data, size)
  return {
    position: of(mesh.positions),
    normal: of(mesh.normals),
    color: of(mesh.colors),
    sheen: of(mesh.sheens, 1),
    traffic: conditionUniformsOf(surface)
      ? new THREE.BufferAttribute(trafficAttribute(mesh, plan), 1, true)
      : null,
    edge: of(mesh.edges),
    seam: of(mesh.seams),
    pattern: of(mesh.patterns),
    fitting: of(mesh.fittings),
    fittingColor: of(mesh.fittingColors),
    pane: of(mesh.panes),
    paneColor: of(mesh.paneColors),
    sky: mesh.skies.length ? of(mesh.skies, 1) : null,
  }
}
