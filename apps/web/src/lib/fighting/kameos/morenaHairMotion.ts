import { Float32BufferAttribute, type BufferGeometry, type Mesh, type Object3D } from 'three'
import type { HumanMotion } from '$lib/tour/humanAnimation'
import type { KameoSlot } from './types'

const GEOMETRIES = new WeakMap<BufferGeometry, BufferGeometry>()
const ACTORS = new WeakMap<Object3D, Mesh[]>()

function flowingGeometry(source: BufferGeometry) {
  const cached = GEOMETRIES.get(source)
  if (cached) return cached
  const geometry = source.clone()
  const positions = geometry.getAttribute('position')
  geometry.morphTargetsRelative = true
  geometry.userData.sharedHuman = true
  geometry.morphAttributes.position = [0, 1].map((kind) => {
    const delta = new Float32Array(positions.count * 3)
    for (let i = 0; i < positions.count; i++) {
      const fall = Math.min(1, Math.max(0, (-positions.getY(i) - 0.18) / 0.95))
      delta[i * 3] = kind === 0 ? fall ** 1.8 * 0.024 : 0
      delta[i * 3 + 2] = kind === 0 ? fall ** 1.6 * 0.006 : fall ** 1.4 * 0.022
    }
    return new Float32BufferAttribute(delta, 3)
  })
  geometry.computeBoundingSphere()
  GEOMETRIES.set(source, geometry)
  return geometry
}

function hairMeshes(head: Object3D) {
  const cached = ACTORS.get(head)
  if (cached) return cached
  const hair = head.getObjectByName('manga-layered-hair')!
  const strands = head.getObjectByName('morena-hair-strands') as Mesh
  const meshes = [...(hair.children as Mesh[]), strands]
  for (const mesh of meshes) {
    mesh.geometry = flowingGeometry(mesh.geometry)
    mesh.updateMorphTargets()
  }
  ACTORS.set(head, meshes)
  return meshes
}

/** Anchored scalp; only the loose lengths move. Absolute sampling also supports replay seeks. */
export function morenaHairMotion(slot: KameoSlot, seconds: number): HumanMotion {
  const dead = slot.phase === 'eliminated' || slot.fighter.health <= 0
  const amplitude = dead ? 0 : slot.fighter.hitStun > 0 ? 0.2 : 1
  const gesture =
    slot.phase === 'acting' ? Math.sin(Math.min(1, slot.phaseFrames / 36) * Math.PI) : 0
  const sway = Math.sin(seconds * 2.5) * 0.36 * amplitude
  const lag = (Math.sin(seconds * 2.5 - 0.65) * 0.16 + gesture * 0.65) * amplitude
  return (human) => {
    for (const mesh of hairMeshes(human.head)) {
      mesh.morphTargetInfluences![0] = sway
      mesh.morphTargetInfluences![1] = lag
    }
  }
}
