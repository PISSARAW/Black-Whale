import type { AnimationMixer, Group, Mesh, Object3D } from 'three'
import type { HumanFigure } from './humanFigure'
import { humanAnimationRig, type AnimatedHuman } from './humanAnimation'
import { createCharacterRig, type CharacterRig } from './characterModelRig'
import { bodyAuraSkins, wrapModelInAura } from './characterModelAura'
import {
  cachedCharacterModel,
  loadCharacterModel,
  type LoadedCharacterModel,
} from './characterModelLoader'
import { characterModel } from './characterModels'

type Three = typeof import('three')

/**
 * A procedural body wearing its authored GLB.
 *
 * The procedural body is kept whole — joints, named attaches (`hand-left`,
 * `hand-right`, `knee-*`, `torso`, `head`), aura shells, equipment — and only
 * its own meshes are taken out of the camera's layers. Everything that hangs a
 * projectile, a weapon or a Nen effect on a joint keeps finding the joint it
 * always found; the GLB is laid on those joints by `characterModelRig`.
 */
export interface CharacterModelWear {
  THREE: Three
  figure: HumanFigure
  modelId: string | undefined
  /** The procedural meshes the GLB replaces; see `characterBodyMeshes`. */
  body: Mesh[]
  /** The walk may hand the legs to the model's own clip; the combat never does. */
  clips?: boolean
}

/** The body's own meshes: everything under the figure but the aura. */
export function characterBodyMeshes(turns: Object3D): Mesh[] {
  const found: Mesh[] = []
  const visit = (node: Object3D) => {
    if (node.name.startsWith('nen-')) return
    if ((node as Mesh).isMesh) found.push(node as Mesh)
    for (const child of node.children) visit(child)
  }
  visit(turns)
  return found
}

/** Whether this identity has a GLB at all, cached or not. */
export function wearsCharacterModel(modelId: string | undefined): boolean {
  return Boolean(characterModel(modelId))
}

/**
 * Dress now if the model is cached, otherwise as soon as it arrives. Any
 * failure leaves the procedural body exactly as it was built.
 */
export function wearCharacterModel(wear: CharacterModelWear): void {
  if (!wearsCharacterModel(wear.modelId)) return
  const cached = cachedCharacterModel(wear.modelId)
  if (cached) {
    dress(wear, cached)
    return
  }
  void loadCharacterModel(wear.THREE, wear.modelId).then((model) => {
    if (model) dress(wear, model)
  })
}

function dress(wear: CharacterModelWear, model: LoadedCharacterModel): Group | undefined {
  const { THREE, figure } = wear
  const rig = humanAnimationRig(figure.turns)
  if (!rig) return undefined
  const holder = new THREE.Group()
  holder.name = `character-model:${model.modelId}`
  const instance = model.instance()
  holder.add(instance)
  standOnFigure(THREE, { figure, rig, holder, height: model.config.height })
  const adapter = createCharacterRig({ THREE, rig, instance, bones: model.config.bones })
  if (!adapter) {
    figure.turns.remove(holder)
    return undefined
  }
  const walk = wear.clips ? walkClip(THREE, model, instance) : undefined
  const skins = bodyAuraSkins(wear.body)
  const aura = wrapModelInAura(THREE, instance, skins)
  followOnUpdate(holder, { adapter, aura, clipDriven: () => walk?.playing() ?? false })
  const body = bodySwitch([...wear.body, ...skins])
  body(false)
  figure.lod.detail = (distance) => {
    const near = distance <= model.config.nearDistance
    holder.visible = near
    body(!near)
  }
  if (walk) figure.animate = walk.wrap(figure.animate)
  return holder
}

/** Scale the GLB to the procedural body's crown and stand it on the same floor. */
function standOnFigure(
  THREE: Three,
  placed: { figure: HumanFigure; rig: AnimatedHuman; holder: Group; height: number },
): void {
  const { figure, rig, holder, height } = placed
  figure.root.updateMatrixWorld(true)
  const ground = figure.root.getWorldPosition(new THREE.Vector3())
  const crown = new THREE.Box3().setFromObject(rig.head).max.y
  const unit = figure.turns.getWorldScale(new THREE.Vector3()).y || 1
  holder.scale.setScalar(Math.max(crown - ground.y, 0.1) / height / unit)
  holder.position.set(0, figure.turns.worldToLocal(ground.clone()).y, 0)
  figure.turns.add(holder)
  holder.updateWorldMatrix(true, true)
}

/**
 * Re-lay the bones when three.js refreshes world matrices — after every pose
 * layer, every equipment tweak and every motion step of the frame has run, and
 * before the skeleton is uploaded. The holder is added last under the figure,
 * so the procedural joints it reads were refreshed just before it.
 */
function followOnUpdate(
  holder: Group,
  follow: { adapter: CharacterRig; aura: (() => void) | undefined; clipDriven: () => boolean },
): void {
  const update = holder.updateMatrixWorld.bind(holder)
  holder.updateMatrixWorld = (force?: boolean) => {
    if (shown(holder) && !follow.clipDriven()) follow.adapter.follow()
    follow.aura?.()
    update(force)
  }
}

function shown(node: Object3D): boolean {
  for (let at: Object3D | null = node; at; at = at.parent) if (!at.visible) return false
  return true
}

/** Layers rather than `visible`: face rigs toggle their own meshes' visibility. */
function bodySwitch(body: Mesh[]): (shown: boolean) => void {
  const masks = body.map((mesh) => mesh.layers.mask)
  return (visible) => {
    body.forEach((mesh, index) => {
      mesh.layers.mask = visible ? (masks[index] ?? 1) : 0
    })
  }
}

interface WalkClip {
  playing: () => boolean
  wrap: (animate: HumanFigure['animate']) => HumanFigure['animate']
}

/**
 * The model's own walk, for the visit only. Its hips translation is dropped:
 * the walk moves the root itself, and a clip that also walks forward would
 * slide away from it and snap back each loop.
 */
function walkClip(
  THREE: Three,
  model: LoadedCharacterModel,
  instance: Object3D,
): WalkClip | undefined {
  const name = model.config.animations.walk
  const source = name ? model.clips.find((clip) => clip.name === name) : undefined
  if (!source) return undefined
  const clip = source.clone()
  clip.tracks = clip.tracks.filter((track) => !track.name.endsWith('.position'))
  const mixer: AnimationMixer = new THREE.AnimationMixer(instance)
  const action = mixer.clipAction(clip)
  let walking = false
  let last: number | undefined
  return {
    playing: () => walking,
    wrap: (animate) => (seconds, pose, layer) => {
      animate(seconds, pose, layer)
      walking = pose === 'walk'
      if (walking && !action.isRunning()) action.play()
      if (!walking) action.stop()
      mixer.update(last === undefined ? 0 : Math.max(0, seconds - last))
      last = seconds
    },
  }
}
