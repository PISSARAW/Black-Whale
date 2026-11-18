import { Float32BufferAttribute, type BufferGeometry, type Mesh, type Object3D } from 'three'
import type { HumanMotion } from '$lib/tour/humanAnimation'
import type { KameoSlot } from './types'

const GEOMETRIES = new WeakMap<BufferGeometry, BufferGeometry>()
const ACTORS = new WeakMap<Object3D, Mesh[]>()

function puffGeometry(source: BufferGeometry) {
  const cached = GEOMETRIES.get(source)
  if (cached) return cached
  const geometry = source.clone(),
    positions = geometry.getAttribute('position')
  geometry.morphTargetsRelative = true
  geometry.userData.sharedHuman = true
  geometry.morphAttributes.position = [0, 1].map((kind) => {
    const delta = new Float32Array(positions.count * 3)
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        y = positions.getY(i),
        side = Math.sign(x)
      const t = Math.min(1, Math.max(0, (Math.abs(x) - 0.215) / 0.045))
      const loose = t * t * (3 - 2 * t)
      const angle = kind === 0 ? side * 0.1 : 0.08
      delta[i * 3] = -(y - 0.065) * angle * loose
      delta[i * 3 + 1] = (x - side * 0.205) * angle * loose
    }
    return new Float32BufferAttribute(delta, 3)
  })
  geometry.computeBoundingSphere()
  GEOMETRIES.set(source, geometry)
  return geometry
}

function puffsOf(head: Object3D) {
  const cached = ACTORS.get(head)
  if (cached) return cached
  const hair = head.getObjectByName('manga-layered-hair')!
  const meshes = hair.children as Mesh[]
  for (const mesh of meshes) {
    mesh.geometry = puffGeometry(mesh.geometry)
    mesh.updateMorphTargets()
  }
  ACTORS.set(head, meshes)
  return meshes
}

/** Soft puff inertia, with the swept scalp and the two ties held in place. */
export function luzurusPuffMotion(slot: KameoSlot, seconds: number): HumanMotion {
  const dead = slot.phase === 'eliminated' || slot.fighter.health <= 0
  const activity =
    slot.phase === 'acting' ? Math.sin(Math.min(1, slot.phaseFrames / 36) * Math.PI) : 0
  const bounce = dead ? 0 : Math.sin(seconds * 3.1) * 0.18 + activity * 0.38
  const sway = dead ? 0 : Math.sin(seconds * 2.7 - 0.4) * 0.23
  return (human) => {
    for (const mesh of puffsOf(human.head)) {
      mesh.morphTargetInfluences![0] = bounce
      mesh.morphTargetInfluences![1] = sway
    }
  }
}
