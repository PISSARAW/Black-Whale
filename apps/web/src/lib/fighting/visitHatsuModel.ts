import { EXTRA_VISIT_MODELS } from './visitHatsuSources'
import { CANONICAL_MODELS } from '$lib/nen/archive-models'
import { batchNenModel } from '$lib/tour/nenModelBatch'
import { styleNenCreature } from '$lib/tour/nenCreatureFigure'
import type { BasicApparitionContext } from '$lib/tour/apparitionBasicView'
import type { Apparition } from '$lib/tour/apparitions'
import type { Group, Object3D, Mesh, Material, BufferGeometry } from 'three'

type Three = typeof import('three')
type ArchiveModel = keyof typeof CANONICAL_MODELS
export type VisitHatsuKind = ArchiveModel | keyof typeof EXTRA_VISIT_MODELS
interface ModelOptions {
  model: VisitHatsuKind
  stage?: number
  climb?: number
  anchor?: 'center' | 'floor'
  /** Named parts kept out of static batching so combat can animate them. */
  joints?: readonly string[]
  figureOwned?: boolean
}
const MOUNTED = new WeakMap<Object3D, () => void>()

/** The exact visit/Nendex builders, palettes and anatomy; only staging belongs to fighting. */
export function createVisitHatsuModel(THREE: Three, options: ModelOptions) {
  const spec = modelSource(options.model)
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.name = `visit-hatsu:${options.model}`
  root.userData.visitModel = options.model
  root.userData.apparitionKind = spec.apparitionKind
  root.userData.variantStage = options.stage ?? spec.stage
  root.add(body)
  const materials = new Map<string, import('three').MeshBasicMaterial>()
  const glow: BasicApparitionContext['glow'] = (color, opacity) => {
    const key = `${color}:${opacity}`
    if (!materials.has(key)) materials.set(key, new THREE.MeshBasicMaterial({
      color, opacity, transparent: opacity < 1, toneMapped: false,
    }))
    return materials.get(key)!
  }
  const seen: Apparition = { id: root.name, kind: spec.apparitionKind, at: [0, 0], y: 0,
    size: 1, colour: spec.colour, stage: options.stage ?? spec.stage,
    hidden: false, spaceId: 'fighting', tierId: 'fighting', climb: options.climb }
  spec.build(seen, { THREE, root: body, glow, skin: glow(spec.colour, 1) })
  const joints = retainJoints(THREE, body, options.joints ?? [])
  batchNenModel(body)
  styleNenCreature(THREE, body, { kind: seen.kind, size: 1, shadow: false })
  const bounds = new THREE.Box3().setFromObject(body)
  if (bounds.isEmpty()) throw new Error(`Missing visit anatomy: ${options.model}`)
  const size = bounds.getSize(new THREE.Vector3())
  const center = bounds.getCenter(new THREE.Vector3())
  body.position.set(-center.x, options.anchor === 'floor' ? -bounds.min.y : -center.y, -center.z)
  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    MOUNTED.delete(root)
    root.removeFromParent()
    disposeModel(body, [...materials.values()])
  }
  if (options.figureOwned) MOUNTED.set(root, dispose)
  return {
    root, body, size, joints,
    fit(dimensions: { width?: number; height?: number; depth?: number }) {
      const limits = [dimensions.width ? dimensions.width / size.x : Infinity,
        dimensions.height ? dimensions.height / size.y : Infinity,
        dimensions.depth ? dimensions.depth / size.z : Infinity]
      const scale = Math.min(...limits)
      root.scale.setScalar(Number.isFinite(scale) && scale > 0 ? scale : 1)
      return root
    },
    dispose,
  }
}

export type VisitHatsuModel = ReturnType<typeof createVisitHatsuModel>

function modelSource(model: VisitHatsuKind) {
  if (model in EXTRA_VISIT_MODELS) return EXTRA_VISIT_MODELS[model as keyof typeof EXTRA_VISIT_MODELS]
  return CANONICAL_MODELS[model as ArchiveModel]
}

function retainJoints(THREE: Three, body: Group, names: readonly string[]): Map<string, Group> {
  const result = new Map<string, Group>()
  for (const name of names) {
    const part = body.getObjectByName(name)
    if (!part?.parent) continue
    const joint = new THREE.Group()
    joint.name = `${name}:combat-joint`
    joint.position.copy(part.position)
    joint.quaternion.copy(part.quaternion)
    joint.scale.copy(part.scale)
    part.parent.add(joint)
    joint.add(part)
    part.position.set(0, 0, 0)
    part.rotation.set(0, 0, 0)
    part.scale.set(1, 1, 1)
    result.set(name, joint)
  }
  return result
}

/** Figure rebuilds release attached Hatsu, while scene-owned effects may be reparented. */
export function disposeMountedVisitHatsu(figure: Object3D): void {
  const disposers: Array<() => void> = []
  figure.traverse((part) => { const dispose = MOUNTED.get(part); if (dispose) disposers.push(dispose) })
  disposers.forEach((dispose) => dispose())
}

function disposeModel(root: Group, owned: Material[]): void {
  const geometries = new Set<BufferGeometry>()
  const materials = new Set(owned)
  root.traverse((part) => {
    const mesh = part as Mesh
    if (mesh.geometry && !mesh.geometry.userData.sharedHuman) geometries.add(mesh.geometry)
    if (Array.isArray(mesh.material)) mesh.material.forEach((material) => materials.add(material))
    else if (mesh.material) materials.add(mesh.material)
  })
  geometries.forEach((geometry) => geometry.dispose())
  materials.forEach((material) => material.dispose())
}
