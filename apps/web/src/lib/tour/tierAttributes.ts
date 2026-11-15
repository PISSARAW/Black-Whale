import type * as Three from 'three'

import type { TierPlan } from './blueprint'
import type { TierMesh } from './mesh'
import { conditionUniformsOf, trafficAttribute } from './surfaceCondition'
import { fittingFlickerAttribute, fittingFlickerUniformsOf } from './fittingFlicker'

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
  fittingFlicker: Three.BufferAttribute | null
  pane: Three.BufferAttribute
  paneColor: Three.BufferAttribute
  sky: Three.BufferAttribute | null
}

export function tierAttributesOf(options: {
  THREE: typeof Three
  mesh: TierMesh
  plan: TierPlan
  surface: Three.Material
  fitting: Three.Material
}): TierAttributes {
  const { THREE, mesh, plan, surface, fitting } = options
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
    fittingFlicker: fittingFlickerUniformsOf(fitting)
      ? new THREE.BufferAttribute(fittingFlickerAttribute(mesh, plan), 2)
      : null,
    pane: of(mesh.panes),
    paneColor: of(mesh.paneColors),
    sky: mesh.skies.length ? of(mesh.skies, 1) : null,
  }
}
