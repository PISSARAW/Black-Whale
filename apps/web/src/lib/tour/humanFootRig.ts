import type { Bone, BufferGeometry, Group, Material, Mesh, Object3D, SkinnedMesh } from 'three'
import type { HumanFigureBuild } from './humanFigure'
import type { HumanProfile } from './humanProfiles'
import type { HumanSide } from './humanExtremityAnchors'

type Three = HumanFigureBuild['THREE']
export type HumanFootPose = 'flat' | 'pivot' | 'kick' | 'crouch' | 'land'
export type HumanFootwear = 'dress-shoe' | 'soft-shoe' | 'boot' | 'bare'

export interface HumanFootRig {
  side: HumanSide
  footwear: HumanFootwear
  surface: SkinnedMesh
  edge: SkinnedMesh
  ankle: Bone
  heel: Bone
  ball: Bone
  toe: Bone
  pose: (pose: HumanFootPose, amount?: number) => void
}

const RIGS = new WeakMap<Object3D, HumanFootRig>()
const GEOMETRIES = new WeakMap<object, Map<HumanFootwear, BufferGeometry>>()

export function addHumanFootRigs(options: {
  THREE: Three
  root: Object3D
  profile: HumanProfile
}): readonly HumanFootRig[] {
  if (!['kurapika', 'hisoka'].includes(options.profile.likeness ?? '')) return []
  return (['left', 'right'] as const).map((side) => addHumanFootRig({ ...options, side }))
}

export function humanFootRig(foot: Object3D): HumanFootRig | undefined {
  return RIGS.get(foot)
}

function addHumanFootRig(options: {
  THREE: Three
  root: Object3D
  profile: HumanProfile
  side: HumanSide
}): HumanFootRig {
  const { THREE, root, profile, side } = options
  const foot = requiredGroup(root, `foot-${side}`)
  const held = RIGS.get(foot)
  if (held) return held
  const meshes = foot.children.filter(isMesh)
  const edgeMaterial = oneMaterial(meshes[0])
  const surfaceMaterial = oneMaterial(meshes[1])
  meshes.forEach((mesh) => (mesh.visible = false))
  const footwear = footwearFor(profile)
  const geometry = footGeometry(THREE, footwear)
  const bones = footBones(THREE, side)
  foot.add(bones.ankle)
  const edge = new THREE.SkinnedMesh(geometry, edgeMaterial)
  edge.name = `foot-skin-edge-${side}`
  edge.scale.set(1.025, 1.02, 1.025)
  const surface = new THREE.SkinnedMesh(geometry, surfaceMaterial)
  surface.name = `foot-skin-${side}`
  foot.add(edge, surface)
  foot.updateMatrixWorld(true)
  const skeleton = new THREE.Skeleton(bones.all)
  edge.bind(skeleton)
  surface.bind(skeleton)
  const rig: HumanFootRig = {
    side,
    footwear,
    surface,
    edge,
    ...bones,
    pose: (pose, amount = 1) => poseFoot(bones, pose, amount),
  }
  rig.pose('flat')
  foot.userData.skinnedFootRig = 'hero-pilot-v1'
  surface.userData.footwear = footwear
  RIGS.set(foot, rig)
  return rig
}

function footBones(THREE: Three, side: HumanSide) {
  const ankle = namedBone(THREE, `foot-${side}-ankle-bone`)
  const heel = namedBone(THREE, `foot-${side}-heel-bone`)
  const ball = namedBone(THREE, `foot-${side}-ball-bone`)
  const toe = namedBone(THREE, `foot-${side}-toe-bone`)
  heel.position.set(0, -0.025, -0.065)
  ball.position.set(0, -0.032, 0.045)
  toe.position.set(0, 0, 0.075)
  ankle.add(heel, ball)
  ball.add(toe)
  return { ankle, heel, ball, toe, all: [ankle, heel, ball, toe] }
}

function footGeometry(THREE: Three, footwear: HumanFootwear): BufferGeometry {
  const key = THREE as unknown as object
  let cache = GEOMETRIES.get(key)
  if (!cache) {
    cache = new Map()
    GEOMETRIES.set(key, cache)
  }
  const held = cache.get(footwear)
  if (held) return held
  const stations = footwearStations(footwear)
  const vertices = stations.flatMap(({ z, width, bottom, top }) => [
    -width,
    bottom,
    z,
    width,
    bottom,
    z,
    -width,
    top,
    z,
    width,
    top,
    z,
  ])
  const indices: number[] = []
  for (let index = 0; index < stations.length - 1; index += 1)
    addSection(indices, index * 4, (index + 1) * 4)
  indices.push(0, 2, 3, 0, 3, 1)
  const last = (stations.length - 1) * 4
  indices.push(last, last + 1, last + 3, last, last + 3, last + 2)
  const indexed = new THREE.BufferGeometry()
  indexed.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  indexed.setIndex(indices)
  indexed.computeVertexNormals()
  const geometry = indexed.toNonIndexed()
  indexed.dispose()
  addFootSkin(THREE, geometry)
  geometry.userData = { sharedHuman: true, skinnedFoot: true, footwear }
  cache.set(footwear, geometry)
  return geometry
}

function footwearStations(footwear: HumanFootwear) {
  const boot = footwear === 'boot' ? 0.025 : 0
  const soft = footwear === 'soft-shoe' ? 0.94 : 1
  return [
    { z: -0.105, width: 0.043 * soft, bottom: -0.05, top: 0.04 + boot },
    { z: -0.065, width: 0.052 * soft, bottom: -0.05, top: 0.054 + boot },
    { z: 0, width: 0.058 * soft, bottom: -0.05, top: 0.052 },
    { z: 0.065, width: 0.059 * soft, bottom: -0.05, top: 0.04 },
    { z: 0.12, width: 0.053 * soft, bottom: -0.05, top: 0.027 },
    { z: 0.165, width: 0.03 * soft, bottom: -0.048, top: 0.016 },
  ]
}

function addSection(indices: number[], current: number, next: number): void {
  indices.push(current, next + 1, next, current, current + 1, next + 1)
  indices.push(current + 2, next + 2, next + 3, current + 2, next + 3, current + 3)
  indices.push(current, next, next + 2, current, next + 2, current + 2)
  indices.push(current + 1, current + 3, next + 3, current + 1, next + 3, next + 1)
}

function addFootSkin(THREE: Three, geometry: BufferGeometry): void {
  const position = geometry.getAttribute('position')
  const indices = new Uint16Array(position.count * 4)
  const weights = new Float32Array(position.count * 4)
  for (let vertex = 0; vertex < position.count; vertex += 1) {
    const influences = footInfluences(position.getZ(vertex), position.getY(vertex))
    for (const [slot, influence] of influences.entries()) {
      indices[vertex * 4 + slot] = influence[0]
      weights[vertex * 4 + slot] = influence[1]
    }
  }
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4))
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4))
}

function footInfluences(z: number, y: number): readonly (readonly [number, number])[] {
  if (z < -0.035) return [[1, 1]]
  if (z < 0.075)
    return y > 0
      ? [
          [0, 0.35],
          [2, 0.65],
        ]
      : [[2, 1]]
  const toe = Math.min(1, Math.max(0, (z - 0.075) / 0.09))
  return [
    [2, 1 - toe],
    [3, toe],
  ]
}

const FOOT_POSES: Record<HumanFootPose, readonly [number, number, number, number]> = {
  flat: [0, 0, 0, 0],
  pivot: [0, 0.05, -0.18, -0.36],
  kick: [-0.16, 0, 0.08, 0.2],
  crouch: [0.08, -0.04, -0.12, -0.18],
  land: [0.06, -0.18, 0.1, 0.14],
}

function poseFoot(bones: ReturnType<typeof footBones>, pose: HumanFootPose, amount: number): void {
  const turns = FOOT_POSES[pose]
  const factor = Math.min(1, Math.max(0, amount))
  bones.ankle.rotation.x = turns[0] * factor
  bones.heel.rotation.x = turns[1] * factor
  bones.ball.rotation.x = turns[2] * factor
  bones.toe.rotation.x = turns[3] * factor
}

function footwearFor(profile: HumanProfile): HumanFootwear {
  if (profile.likeness === 'hisoka') return 'soft-shoe'
  if (profile.clothing === 'combat') return 'boot'
  return 'dress-shoe'
}

function namedBone(THREE: Three, name: string): Bone {
  const bone = new THREE.Bone()
  bone.name = name
  return bone
}

function oneMaterial(mesh: Mesh | undefined): Material {
  if (!mesh || Array.isArray(mesh.material)) throw new Error('Human foot requires one material')
  return mesh.material
}

function requiredGroup(root: Object3D, name: string): Group {
  const part = root.getObjectByName(name) as Group | undefined
  if (!part?.isGroup) throw new Error(`Missing human foot group: ${name}`)
  return part
}

function isMesh(node: Object3D): node is Mesh {
  return (node as Mesh).isMesh === true
}
