import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { Bone, BufferGeometry, Material, Mesh, Object3D, SkinnedMesh } from 'three'
import type { HumanFigureBuild } from './humanFigure'
import type { HumanProfile } from './humanProfiles'
import type { HumanSide } from './humanExtremityAnchors'
import {
  handFamilyScale,
  humanExtremityFamily,
  usesSkinnedHands,
} from './humanExtremityFamily'

type Three = HumanFigureBuild['THREE']
export type HumanHandPose = 'relaxed' | 'guard' | 'fist' | 'book' | 'pistol' | 'point'

interface FingerBones {
  proximal: Bone
  middle: Bone
  distal: Bone
}

export interface HumanHandRig {
  side: HumanSide
  mesh: SkinnedMesh
  palm: Bone
  fingers: readonly FingerBones[]
  thumb: FingerBones
  pose: (pose: HumanHandPose, amount?: number) => void
}

const RIGS = new WeakMap<Object3D, HumanHandRig>()
const GEOMETRIES = new WeakMap<object, Map<HumanSide, BufferGeometry>>()
const HIDDEN_MATERIALS = new WeakMap<Material, Material>()
const FINGER_X = [-0.0285, -0.0095, 0.0095, 0.0285] as const
const FINGER_LENGTHS = [0.044, 0.054, 0.05, 0.039] as const

/** Install the close hand rig on declared likenesses that do not own bespoke hand geometry. */
export function addHumanHandRigs(options: {
  THREE: Three
  root: Object3D
  profile: HumanProfile
}): readonly HumanHandRig[] {
  if (!usesSkinnedHands(options.profile)) return []
  return (['left', 'right'] as const).map((side) => addHumanHandRig({ ...options, side }))
}

export function humanHandRig(hand: Object3D): HumanHandRig | undefined {
  return RIGS.get(hand)
}

function addHumanHandRig(options: {
  THREE: Three
  root: Object3D
  profile: HumanProfile
  side: HumanSide
}): HumanHandRig {
  const { THREE, root, side } = options
  const hand = requiredMesh(root, `hand-${side}`)
  const held = RIGS.get(hand)
  if (held) return held
  const material = visibleMaterial(hand)
  hand.material = hiddenMaterial(material)
  const oldThumb = hand.getObjectByName(`thumb-${side}`) ?? hand.children.find(isMesh)
  if (oldThumb) oldThumb.visible = false

  const bones = handBones(THREE, side)
  hand.add(bones.palm)
  const mesh = new THREE.SkinnedMesh(handGeometry(THREE, side), material)
  mesh.name = `hand-skin-${side}`
  mesh.frustumCulled = false
  mesh.scale.set(...handFamilyScale(humanExtremityFamily(options.profile)))
  hand.add(mesh)
  hand.updateMatrixWorld(true)
  const skeleton = new THREE.Skeleton(bones.all)
  mesh.bind(skeleton)

  const rig: HumanHandRig = {
    side,
    mesh,
    palm: bones.palm,
    fingers: bones.fingers,
    thumb: bones.thumb,
    pose: (pose, amount = 1) => poseHand(bones, pose, amount),
  }
  rig.pose('relaxed')
  mesh.userData.humanHandRig = 'roster-v1'
  mesh.userData.extremityFamily = humanExtremityFamily(options.profile)
  mesh.userData.likeness = options.profile.likeness
  RIGS.set(hand, rig)
  return rig
}

function handBones(THREE: Three, side: HumanSide) {
  const palm = namedBone(THREE, `hand-palm-bone-${side}`)
  const fingers = FINGER_X.map((x, index) => {
    const length = FINGER_LENGTHS[index]
    return fingerBones(THREE, {
      name: `hand-${side}-finger-${index}`,
      parent: palm,
      at: [x, -0.024, 0],
      lengths: [length * 0.42, length * 0.33],
    })
  })
  const direction = side === 'left' ? -1 : 1
  const thumb = fingerBones(THREE, {
    name: `hand-${side}-thumb`,
    parent: palm,
    at: [direction * 0.035, 0.003, 0.004],
    lengths: [0.022, 0.018],
  })
  thumb.proximal.rotation.z = direction * -0.72
  thumb.proximal.rotation.y = direction * 0.28
  return { palm, fingers, thumb, all: [palm, ...fingers.flatMap(parts), ...parts(thumb)] }
}

function fingerBones(
  THREE: Three,
  options: {
    name: string
    parent: Bone
    at: readonly [number, number, number]
    lengths: readonly [number, number]
  },
): FingerBones {
  const proximal = namedBone(THREE, `${options.name}-proximal`)
  const middle = namedBone(THREE, `${options.name}-middle`)
  const distal = namedBone(THREE, `${options.name}-distal`)
  proximal.position.set(...options.at)
  middle.position.y = -options.lengths[0]
  distal.position.y = -options.lengths[1]
  options.parent.add(proximal)
  proximal.add(middle)
  middle.add(distal)
  return { proximal, middle, distal }
}

function handGeometry(THREE: Three, side: HumanSide): BufferGeometry {
  const key = THREE as unknown as object
  let cache = GEOMETRIES.get(key)
  if (!cache) {
    cache = new Map()
    GEOMETRIES.set(key, cache)
  }
  const held = cache.get(side)
  if (held) return held
  const parts: BufferGeometry[] = []
  parts.push(skinnedPart(THREE, palmGeometry(THREE), 0))
  let boneIndex = 1
  for (let finger = 0; finger < 4; finger += 1) {
    const length = FINGER_LENGTHS[finger]
    const lengths = [length * 0.42, length * 0.33, length * 0.25]
    let y = -0.024
    for (const [section, sectionLength] of lengths.entries()) {
      const geometry = phalanxGeometry(THREE, {
        x: FINGER_X[finger],
        y,
        length: sectionLength,
        radius: (0.0094 - finger * 0.0003) * (1 - section * 0.09),
      })
      parts.push(skinnedPart(THREE, geometry, boneIndex++))
      y -= sectionLength
    }
  }
  const direction = side === 'left' ? -1 : 1
  let thumbY = 0.003
  for (const [section, length] of [0.022, 0.018, 0.014].entries()) {
    const geometry = phalanxGeometry(THREE, {
      x: direction * (0.035 + section * 0.008),
      y: thumbY,
      length,
      radius: 0.0092 - section * 0.0006,
      z: 0.004 + section * 0.005,
      angle: direction * -0.72,
    })
    parts.push(skinnedPart(THREE, geometry, boneIndex++))
    thumbY -= length * 0.68
  }
  const merged = mergeGeometries(parts, false)
  parts.forEach((part) => part.dispose())
  if (!merged) throw new Error('Unable to merge skinned hand geometry')
  merged.userData = { sharedHuman: true, skinnedHand: true, side }
  cache.set(side, merged)
  return merged
}

function palmGeometry(THREE: Three): BufferGeometry {
  return new THREE.SphereGeometry(1, 10, 6)
    .toNonIndexed()
    .scale(0.045, 0.052, 0.027)
    .translate(0, 0.015, 0)
}

function phalanxGeometry(
  THREE: Three,
  options: { x: number; y: number; length: number; radius: number; z?: number; angle?: number },
): BufferGeometry {
  const geometry = new THREE.CapsuleGeometry(
    options.radius,
    Math.max(0.002, options.length - options.radius * 2),
    2,
    6,
  ).toNonIndexed()
  if (options.angle) geometry.rotateZ(options.angle)
  return geometry.translate(options.x, options.y - options.length / 2, options.z ?? 0)
}

function skinnedPart(THREE: Three, geometry: BufferGeometry, bone: number): BufferGeometry {
  const count = geometry.getAttribute('position').count
  const indices = new Uint16Array(count * 4)
  const weights = new Float32Array(count * 4)
  for (let index = 0; index < count; index += 1) {
    indices[index * 4] = bone
    weights[index * 4] = 1
  }
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4))
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4))
  return geometry
}

function poseHand(bones: ReturnType<typeof handBones>, pose: HumanHandPose, amount: number): void {
  const target = POSES[pose]
  bones.fingers.forEach((finger, index) => {
    const turns = pose === 'point' && index === 1 ? POSES.relaxed.fingers : target.fingers
    rotateFinger(finger, { turns, rest: POSES.relaxed.fingers, amount })
  })
  rotateFinger(bones.thumb, { turns: target.thumb, rest: POSES.relaxed.thumb, amount })
}

const POSES: Record<
  HumanHandPose,
  { fingers: readonly [number, number, number]; thumb: readonly [number, number, number] }
> = {
  relaxed: { fingers: [-0.08, -0.12, -0.08], thumb: [-0.12, -0.1, -0.06] },
  guard: { fingers: [-0.24, -0.34, -0.25], thumb: [-0.3, -0.24, -0.16] },
  fist: { fingers: [-1.02, -1.18, -0.92], thumb: [-0.72, -0.62, -0.42] },
  book: { fingers: [-0.34, -0.48, -0.32], thumb: [-0.46, -0.32, -0.22] },
  pistol: { fingers: [-0.72, -0.86, -0.64], thumb: [-0.36, -0.28, -0.16] },
  point: { fingers: [-0.92, -1.05, -0.78], thumb: [-0.5, -0.4, -0.26] },
}

function rotateFinger(
  finger: FingerBones,
  options: {
    turns: readonly [number, number, number]
    rest: readonly [number, number, number]
    amount: number
  },
): void {
  const { turns, rest, amount } = options
  finger.proximal.rotation.x = blend(rest[0], turns[0], amount)
  finger.middle.rotation.x = blend(rest[1], turns[1], amount)
  finger.distal.rotation.x = blend(rest[2], turns[2], amount)
}

function blend(from: number, to: number, amount: number): number {
  return from + (to - from) * Math.min(1, Math.max(0, amount))
}

function namedBone(THREE: Three, name: string): Bone {
  const bone = new THREE.Bone()
  bone.name = name
  return bone
}

function parts(finger: FingerBones): Bone[] {
  return [finger.proximal, finger.middle, finger.distal]
}

function visibleMaterial(hand: Mesh): Material {
  if (Array.isArray(hand.material)) throw new Error('Human hand requires one skin material')
  return hand.material
}

function hiddenMaterial(source: Material): Material {
  const held = HIDDEN_MATERIALS.get(source)
  if (held) return held
  const made = source.clone()
  made.visible = false
  HIDDEN_MATERIALS.set(source, made)
  return made
}

function requiredMesh(root: Object3D, name: string): Mesh {
  const part = root.getObjectByName(name) as Mesh | undefined
  if (!part?.isMesh) throw new Error(`Missing human hand mesh: ${name}`)
  return part
}

function isMesh(node: Object3D): node is Mesh {
  return (node as Mesh).isMesh === true
}
