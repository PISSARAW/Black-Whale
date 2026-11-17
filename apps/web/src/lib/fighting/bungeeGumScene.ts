import { createVisitHatsuModel } from './visitHatsuModel'
import { bungeeVisible } from './hisokaTechnique'
import { gyoSight } from './nenPerception'
import {
  createHisokaPresentationClock,
  HISOKA_ACCENT_FRAMES,
  type HisokaFrames,
} from './hisokaPresentation'
import { hisokaChest, hisokaHand, hisokaReduced } from './hisokaEffectAnchors'
import { createHisokaGumAccent } from './hisokaGumAccent'
import type { EffectSceneOptions, FighterEffectScene } from './fighterEffectScene'
import type { FightState } from './types'
import type { Mesh } from 'three'

/** Deform the visit's strand along the actual tether, retaining its thickness and anchor. */
export function createBungeeGumScene(options: EffectSceneOptions): FighterEffectScene {
  const { THREE } = options
  const clock = createHisokaPresentationClock()
  const accent = createHisokaGumAccent(options)
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
    sync(state) {
      const frames = clock(state)
      const age = state.bungeeGum ? frames[state.bungeeGum.owner] : null
      const animated = hisokaReduced(options) ? null : age
      const points = gumPoints(options, state, animated)
      model.root.visible = bungeeVisible(state, options.viewer?.() ?? 'player') && points.length > 1
      accent.sync(model.root.visible ? points : [], animated)
      model.root.userData.accents = age
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
      poseGumAnchor(options, { state, anchor, center, points, pulse: gumPulse(animated) })
      materials.forEach((material) => {
        material.opacity = state.bungeeGum?.hidden ? 0.4 : 0.82
      })
    },
    dispose() {
      accent.dispose()
      model.dispose()
    },
  }
}

function gumPulse(frames: HisokaFrames | null) {
  const age = frames?.attach ?? frames?.pull ?? frames?.rebound
  return age == null ? 0 : Math.sin((Math.PI * age) / HISOKA_ACCENT_FRAMES)
}
function gumPoints(options: EffectSceneOptions, state: FightState, frames: HisokaFrames | null) {
  const attachment = state.bungeeGum
  if (!attachment) return []
  const owner = hisokaHand(options, state, attachment.owner)
  const target = hisokaChest(options, state, attachment.target)
  const pulse = gumPulse(frames)
  const taut = attachment.retracting ? 0.035 : 0.12
  return Array.from({ length: 49 }, (_, index) => {
    const ratio = index / 48
    const point = owner.clone().lerp(target, ratio)
    point.y += Math.sin(ratio * Math.PI) * (-taut + Math.sin(ratio * Math.PI * 3) * pulse * 0.08)
    return point
  })
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
    points: import('three').Vector3[]
    pulse: number
  },
) {
  const { state, anchor, center, points, pulse } = context
  const gum = state.bungeeGum!
  const viewer = options.viewer?.() ?? 'player'
  const hidden = gum.hidden && gum.owner !== viewer && !gyoSight(state[viewer])
  anchor.visible = !hidden
  anchor.position.copy(points[Math.floor(points.length / 2)]).sub(center)
  anchor.scale.set(0.65, 0.45 + pulse * 0.035, 0.65)
}
