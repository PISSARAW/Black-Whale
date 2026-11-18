import { createVisitHatsuModel } from './visitHatsuModel'
import type { EffectSceneOptions } from './fighterEffectScene'
import type { HisokaFrames } from './hisokaPresentation'
import type { Vector3, Mesh, Material } from 'three'

/** Reuses the authored gum tube; vertices are deformed in place, never reallocated per frame. */
export function createBungeeStrand(options: EffectSceneOptions, name: string) {
  const { THREE } = options
  const model = createVisitHatsuModel(THREE, {
    model: 'bungee-gum',
    joints: ['gum-strand', 'gum-anchor'],
  })
  model.root.name = name
  model.body.position.set(0, 0, 0)
  model.root.visible = false
  const strand = model.root.getObjectByName('gum-strand') as Mesh
  const original = Float32Array.from(strand.geometry.attributes.position.array)
  const rings = gumRings(THREE, original)
  const anchor = model.joints.get('gum-anchor')!
  const materials = new Set<Material>()
  model.root.traverse((part) => {
    const material = (part as Mesh).material
    if (material)
      for (const held of [material].flat()) {
        held.transparent = true
        materials.add(held)
      }
  })
  options.scene.add(model.root)
  return {
    root: model.root,
    sync(context: { points: Vector3[]; hidden: boolean; frames: HisokaFrames | null }) {
      const { points, hidden, frames } = context
      model.root.userData.accents = frames
      model.root.visible = points.length > 1
      if (!model.root.visible) return
      const center = points[0].clone().lerp(points[points.length - 1], 0.5)
      model.root.position.copy(center)
      const curve = new THREE.CatmullRomCurve3(points)
      const positions = strand.geometry.attributes.position
      for (const ring of rings.values) {
        curve.getPoint(ring.t, ring.point).sub(center)
        curve.getTangent(ring.t, ring.tangent).normalize()
      }
      for (let index = 0; index < positions.count; index++) {
        const { point, tangent } = rings.values[rings.indices[index]]
        const radius = original[index * 3]
        positions.setXYZ(
          index,
          point.y + tangent.x * radius,
          -point.x + tangent.y * radius,
          original[index * 3 + 2],
        )
      }
      positions.needsUpdate = true
      strand.geometry.computeBoundingSphere()
      strand.geometry.computeBoundingBox()
      anchor.position.copy(points[Math.floor(points.length / 2)]).sub(center)
      anchor.scale.set(0.65, 0.45, 0.65)
      materials.forEach((material) => {
        material.opacity = hidden ? 0.4 : 0.82
      })
    },
    dispose: () => model.dispose(),
  }
}
function gumRings(THREE: EffectSceneOptions['THREE'], original: Float32Array) {
  const lookup = new Map<number, number>()
  const values: Array<{ t: number; point: Vector3; tangent: Vector3 }> = []
  const indices: number[] = []
  for (let index = 0; index < original.length / 3; index++) {
    const t = Math.max(0, Math.min(1, (original[index * 3 + 1] + 1) / 2))
    if (!lookup.has(t)) {
      lookup.set(t, values.length)
      values.push({ t, point: new THREE.Vector3(), tangent: new THREE.Vector3() })
    }
    indices.push(lookup.get(t)!)
  }
  return { values, indices }
}
