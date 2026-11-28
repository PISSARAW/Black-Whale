import { disposeCatalogueTeeth } from './expressionTeeth'
import type { BufferGeometry, Color, Mesh, MeshBasicMaterial, Object3D, Vector3 } from 'three'
import type { ExpressionFaceRig } from './faceRig'
import type { ExpressionPose } from './types'

interface SkinTint {
  mesh: Mesh
  original: MeshBasicMaterial
  material: MeshBasicMaterial
  color: Color
}
interface FaceEffects {
  drops?: { tears: Mesh[]; sweat: Mesh[] }
  skin?: SkinTint[]
}
const EFFECTS = new WeakMap<Object3D, FaceEffects>()

/** Effect materials belong to one head; shared catalogue skin is never recoloured. */
export function drawFaceEffects(
  rig: ExpressionFaceRig,
  pose: ExpressionPose,
  seconds: number,
): void {
  let effects = EFFECTS.get(rig.head)
  if (!effects) {
    if (pose.tears + pose.sweat + pose.blush + pose.pallor <= 0) return
    effects = {}
    EFFECTS.set(rig.head, effects)
  }
  if (pose.tears + pose.sweat > 0) effects.drops ??= createDrops(rig)
  animateDrops(effects, pose, seconds)
  if (pose.blush + pose.pallor > 0) effects.skin ??= captureSkin(rig)
  tintSkin(effects, pose)
}
function createDrops(rig: ExpressionFaceRig) {
  const { THREE, head } = rig
  if (rig.eyes.length === 0) return { tears: [], sweat: [] }
  const geometry = new THREE.SphereGeometry(0.007, 8, 6)
  const positions = geometry.getAttribute('position')
  for (let i = 0; i < positions.count; i++) {
    const upper = Math.max(0, positions.getY(i) / 0.007)
    positions.setX(i, positions.getX(i) * (1 - upper * 0.7))
    positions.setZ(i, positions.getZ(i) * (1 - upper * 0.7))
  }
  geometry.computeVertexNormals()
  const tears: Mesh[] = [],
    sweat: Mesh[] = []
  for (const side of [-1, 1]) {
    const eye = rig.eyes.find((part) => part.side === side)?.node
    if (!eye) continue
    const point = head.worldToLocal(eye.getWorldPosition(new THREE.Vector3()))
    for (const kind of ['tear', 'sweat']) {
      const drop = makeDrop(rig, { geometry, point, side, kind })
      ;(kind === 'tear' ? tears : sweat).push(drop)
    }
  }
  return { tears, sweat }
}
function makeDrop(
  rig: ExpressionFaceRig,
  options: { geometry: BufferGeometry; point: Vector3; side: number; kind: string },
) {
  const { THREE, head } = rig
  const { geometry, point, side, kind } = options
  const tear = kind === 'tear'
  const material = new THREE.MeshBasicMaterial({
    color: tear ? 0xa9dce9 : 0xcce4e8,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  })
  const drop = new THREE.Mesh(geometry, material)
  drop.name = `expression-${kind}-${side}`
  drop.position.set(
    point.x + side * (tear ? 0.005 : 0.045),
    point.y + (tear ? -0.02 : 0.055),
    point.z,
  )
  fitDrop(rig, drop)
  drop.userData.restY = drop.position.y
  drop.scale.set(0.8, tear ? 3 : 1.8, 0.55)
  drop.visible = false
  head.add(drop)
  return drop
}
function fitDrop(rig: ExpressionFaceRig, drop: Mesh) {
  const { THREE, head } = rig
  const face = head.getObjectByName('manga-face') ?? head.getObjectByName('kurapika-face')
  if (!face) {
    drop.position.z += 0.008
    return
  }
  head.updateWorldMatrix(true, true)
  const origin = head.localToWorld(drop.position.clone().setZ(1))
  const direction = head.localToWorld(drop.position.clone().setZ(-1)).sub(origin).normalize()
  const hits = new THREE.Raycaster(origin, direction).intersectObject(face, true)
  if (hits[0]) drop.position.z = head.worldToLocal(hits[0].point).z + 0.005
}
function animateDrops(effects: FaceEffects, pose: ExpressionPose, seconds: number) {
  for (const [kind, intensity] of [
    ['tears', pose.tears],
    ['sweat', pose.sweat],
  ] as const) {
    const drops = effects.drops?.[kind] ?? []
    drops.forEach((drop, index) => {
      drop.visible = intensity > 0.01
      ;(drop.material as MeshBasicMaterial).opacity = Math.min(0.9, intensity * 0.85)
      drop.position.y =
        drop.userData.restY - ((seconds * 0.35 + index * 0.5) % 1) * intensity * 0.018
    })
  }
}
function captureSkin(rig: ExpressionFaceRig): SkinTint[] {
  const parts: SkinTint[] = []
  rig.head.traverse((node) => {
    const mesh = node as Mesh
    const material = mesh.material as MeshBasicMaterial | undefined
    if (!mesh.isMesh || !material?.isMeshBasicMaterial) return
    if (material.color.getHex() !== rig.skin) return
    const copy = material.clone()
    parts.push({ mesh, original: material, material: copy, color: material.color.clone() })
  })
  return parts
}
function tintSkin(effects: FaceEffects, pose: ExpressionPose) {
  for (const part of effects.skin ?? []) {
    if (pose.blush + pose.pallor <= 0) {
      part.mesh.material = part.original
      continue
    }
    part.mesh.material = part.material
    part.material.color.copy(part.color)
    part.material.color.lerp(
      { r: 0.86, g: 0.25, b: 0.22 } as Color,
      Math.min(0.35, pose.blush * 0.3),
    )
    part.material.color.lerp(
      { r: 0.94, g: 0.93, b: 0.85 } as Color,
      Math.min(0.6, pose.pallor * 0.5),
    )
  }
}

/** Release head-owned GPU resources when either game removes a figure. */
export function disposeExpressionEffects(root: Object3D): void {
  const meshes: Mesh[] = []
  root.traverse((node) => {
    if ((node as Mesh).isMesh) meshes.push(node as Mesh)
  })
  meshes.forEach(disposeCatalogueTeeth)
  root.traverse((head) => {
    const effects = EFFECTS.get(head)
    if (!effects) return
    for (const part of effects.skin ?? []) {
      part.mesh.material = part.original
      part.material.dispose()
    }
    for (const drop of [...(effects.drops?.tears ?? []), ...(effects.drops?.sweat ?? [])]) {
      ;(drop.material as MeshBasicMaterial).dispose()
    }
    EFFECTS.delete(head)
  })
}

export function suspendFaceEffects(head: Object3D): () => void {
  const effects = EFFECTS.get(head)
  if (!effects) return () => {}
  const drops = [...(effects.drops?.tears ?? []), ...(effects.drops?.sweat ?? [])]
  const visible = drops.map((drop) => drop.visible)
  drops.forEach((drop) => {
    drop.visible = false
  })
  const skin = effects.skin ?? []
  const materials = skin.map((part) => part.mesh.material)
  skin.forEach((part) => {
    part.mesh.material = part.original
  })
  return () => {
    drops.forEach((drop, index) => {
      drop.visible = visible[index]
    })
    skin.forEach((part, index) => {
      part.mesh.material = materials[index]
    })
  }
}
