import type { AnimationClip, Material, Mesh, Object3D } from 'three'
import { characterModel, type CharacterModel } from './characterModels'

type Three = typeof import('three')

/** What the cache holds: the parsed scene, never shown itself, and its clips. */
export interface LoadedCharacterModel {
  modelId: string
  config: CharacterModel
  source: Object3D
  clips: AnimationClip[]
  /** Independent instance: its own skeleton, its own bones, shared geometry. */
  instance: () => Object3D
}

const loaded = new Map<string, LoadedCharacterModel>()
const pending = new Map<string, Promise<LoadedCharacterModel | undefined>>()
const failed = new Set<string>()

/** The cached model, or nothing: synchronous, for builders that cannot wait. */
export function cachedCharacterModel(
  modelId: string | undefined,
): LoadedCharacterModel | undefined {
  return modelId ? loaded.get(modelId) : undefined
}

/**
 * Load a model once. Every caller of the same identity shares one request,
 * and a failure is remembered: the procedural body is the answer from then on,
 * not a retry on every rebuild.
 */
export function loadCharacterModel(
  THREE: Three,
  modelId: string | undefined,
): Promise<LoadedCharacterModel | undefined> {
  const config = characterModel(modelId)
  if (!modelId || !config || failed.has(modelId)) return Promise.resolve(undefined)
  const held = loaded.get(modelId)
  if (held) return Promise.resolve(held)
  const inFlight = pending.get(modelId)
  if (inFlight) return inFlight
  const request = fetchModel(THREE, modelId, config)
    .then((model) => {
      loaded.set(modelId, model)
      return model
    })
    .catch((error: unknown) => {
      failed.add(modelId)
      console.warn(`[characterModels] ${modelId} stays procedural:`, error)
      return undefined
    })
    .finally(() => pending.delete(modelId))
  pending.set(modelId, request)
  return request
}

/** Warm several identities at once; resolves when all have settled. */
export async function preloadCharacterModels(
  THREE: Three,
  modelIds: ReadonlyArray<string | undefined>,
): Promise<void> {
  await Promise.all([...new Set(modelIds)].map((id) => loadCharacterModel(THREE, id)))
}

async function fetchModel(
  THREE: Three,
  modelId: string,
  config: CharacterModel,
): Promise<LoadedCharacterModel> {
  const [{ GLTFLoader }, { clone }] = await Promise.all([
    import('three/examples/jsm/loaders/GLTFLoader.js'),
    import('three/examples/jsm/utils/SkeletonUtils.js'),
  ])
  const gltf = await new GLTFLoader().loadAsync(config.url)
  const source = gltf.scene
  flattenMaterials(THREE, source)
  // A plain `Object3D.clone()` keeps the source skeleton: two fighters would
  // share bones. SkeletonUtils rebinds each copy to its own.
  return { modelId, config, source, clips: gltf.animations, instance: () => clone(source) }
}

/**
 * The house look is flat and unlit (`glow` hands out MeshBasicMaterial). A PBR
 * material in a scene without lights renders black, so the GLB keeps its
 * colour texture and drops the shading model, once, on the cached source.
 */
function flattenMaterials(THREE: Three, source: Object3D): void {
  const flat = new Map<Material, Material>()
  source.traverse((node) => {
    const mesh = node as Mesh
    if (!mesh.isMesh) return
    mesh.frustumCulled = false
    const swap = (material: Material) => {
      const held = flat.get(material)
      if (held) return held
      const standard = material as Material & { map?: unknown; color?: unknown }
      const made = new THREE.MeshBasicMaterial({
        map: (standard.map as never) ?? null,
        transparent: material.transparent,
        alphaTest: material.alphaTest,
        side: material.side,
      })
      flat.set(material, made)
      return made
    }
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material)
  })
}
