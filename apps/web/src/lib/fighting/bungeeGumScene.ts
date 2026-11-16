import { createVisitHatsuModel } from './visitHatsuModel'
import { bungeeVisible } from './hisokaTechnique'
import { gyoSight, insideEn } from './nenPerception'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightState } from './types'
import type { Mesh } from 'three'

/** Deform the visit's strand along the actual tether, retaining its thickness and anchor. */
export function createBungeeGumScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE } = options
  const model = createVisitHatsuModel(THREE, {
    model: 'bungee-gum',
    joints: ['gum-strand', 'gum-anchor'],
  })
  model.root.name = 'hisoka-bungee-gum'
  model.body.position.set(0, 0, 0)
  const strand = model.root.getObjectByName('gum-strand') as Mesh
  const original = Float32Array.from(strand.geometry.attributes.position.array)
  const deformation = gumRings(THREE, original)
  const anchor = model.joints.get('gum-anchor')!
  const materials = new Set<import('three').Material>()
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
    sync(state, seconds) {
      const points = gumPoints(options, state)
      model.root.visible = bungeeVisible(state) && points.length > 1
      if (!model.root.visible) return
      const center = points[0].clone().lerp(points[points.length - 1], 0.5)
      model.root.position.copy(center)
      const curve = new THREE.CatmullRomCurve3(points)
      const positions = strand.geometry.attributes.position
      for (const ring of deformation.rings) {
        curve.getPoint(ring.t, ring.point).sub(center)
        curve.getTangent(ring.t, ring.tangent).normalize()
      }
      for (let index = 0; index < positions.count; index++) {
        const { point, tangent } = deformation.rings[deformation.indices[index]]
        const radius = original[index * 3]
        // Inverse of the visit strand's PI/2 Z turn, so the authored tube follows XY.
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
      poseGumAnchor(options, { state, anchor, center, seconds })
      materials.forEach((material) => {
        material.opacity = state.bungeeGum?.hidden ? 0.4 : 0.82
      })
    },
    dispose: model.dispose,
  }
}

function gumPoints(options: EffectSceneOptions, state: FightState) {
  const attachment = state.bungeeGum
  if (!attachment) return []
  const owner = state[attachment.owner]
  const target = state[attachment.target]
  const localOnly = attachment.hidden && attachment.owner !== 'player' && !gyoSight(state.player)
  return Array.from({ length: 49 }, (_, index) => {
    const ratio = index / 48
    return {
      x: owner.x + (target.x - owner.x) * ratio,
      y: owner.y + (target.y - owner.y) * ratio,
      sag: Math.sin(ratio * Math.PI) * -0.32,
    }
  })
    .filter((point) => !localOnly || insideEn(state.player, point))
    .map(
      (point) =>
        new options.THREE.Vector3(
          options.worldX(point.x),
          options.worldY(point.y) + 1.15 + point.sag,
          0.28,
        ),
    )
}

/** Each tube ring shares one curve evaluation across all of its radial vertices. */
function gumRings(THREE: EffectSceneOptions['THREE'], original: Float32Array) {
  const lookup = new Map<number, number>()
  const rings: Array<{
    t: number
    point: import('three').Vector3
    tangent: import('three').Vector3
  }> = []
  const indices: number[] = []
  for (let index = 0; index < original.length / 3; index++) {
    const t = Math.max(0, Math.min(1, (original[index * 3 + 1] + 1) / 2))
    if (!lookup.has(t)) {
      lookup.set(t, rings.length)
      rings.push({ t, point: new THREE.Vector3(), tangent: new THREE.Vector3() })
    }
    indices.push(lookup.get(t)!)
  }
  return { rings, indices }
}

function poseGumAnchor(
  options: EffectSceneOptions,
  context: {
    state: FightState
    anchor: import('three').Group
    center: import('three').Vector3
    seconds: number
  },
) {
  const { state, anchor, center, seconds } = context
  const gum = state.bungeeGum!
  const owner = state[gum.owner]
  const target = state[gum.target]
  const middle = { x: (owner.x + target.x) / 2, y: (owner.y + target.y) / 2 }
  const hidden = gum.hidden && gum.owner !== 'player' && !gyoSight(state.player)
  anchor.visible = !hidden || insideEn(state.player, middle)
  anchor.position
    .set(options.worldX(middle.x), options.worldY(middle.y) + 1.15 - 0.32, 0.28)
    .sub(center)
  anchor.scale.set(0.65, 0.45 + Math.sin(seconds * 6) * 0.025, 0.65)
}
