import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { buildFightFigure } from './fighterFigure'
import { FIGHTING_ROSTER } from './roster'
import { createFightState } from './fightState'
import { combatFaceGeometry } from './fightFaceReadability'
import { trackFightOpponent, FIGHTER_FACING_ANGLE } from './fighterFacing'
import type { AnimatedHuman } from '$lib/tour/humanAnimation'

const glow = (color: number, opacity: number) =>
  new THREE.MeshBasicMaterial({ color, opacity, transparent: opacity < 1 })
function counts(root: THREE.Object3D) {
  let meshes = 0,
    triangles = 0
  root.traverse((node) => {
    const mesh = node as THREE.Mesh
    if (!mesh.isMesh) return
    meshes++
    triangles += (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3
  })
  return { meshes, triangles }
}

describe('combat face readability without extra rendering work', () => {
  it.each(FIGHTING_ROSTER)(
    '$name keeps its model topology, signature and simulation data',
    ({ id }) => {
      const fighter = createFightState(id, 'hisoka').player
      const before = JSON.stringify(fighter)
      const original = buildFightFigure({ THREE, glow, fighter, readability: false })
      const readable = buildFightFigure({ THREE, glow, fighter })
      const duplicate = buildFightFigure({ THREE, glow, fighter })
      expect(counts(readable.root)).toEqual(counts(original.root))
      const head = readable.root.getObjectByName('face-eye-left')!.parent!
      const oldHead = original.root.getObjectByName('face-eye-left')!.parent!
      expect(head.scale.y).toBeGreaterThan(oldHead.scale.y)
      const skin: THREE.Mesh[] = []
      head.traverse((node) => {
        if ((node as THREE.Mesh).isMesh && (node as THREE.Mesh).geometry.getAttribute('color'))
          skin.push(node as THREE.Mesh)
      })
      expect(skin.length).toBeGreaterThan(0)
      const otherSkin: THREE.Mesh[] = []
      duplicate.root.getObjectByName('face-eye-left')!.parent!.traverse((node) => {
        if ((node as THREE.Mesh).isMesh && (node as THREE.Mesh).geometry.getAttribute('color'))
          otherSkin.push(node as THREE.Mesh)
      })
      skin.forEach((node, index) => expect(node.geometry).toBe(otherSkin[index].geometry))
      const originalNames: string[] = [],
        readableNames: string[] = []
      oldHead.traverse((node) => originalNames.push(node.name))
      head.traverse((node) => readableNames.push(node.name))
      expect(readableNames).toEqual(originalNames)
      expect(JSON.stringify(fighter)).toBe(before)
    },
  )
  it('caches baked tones and never changes the common tour geometry', () => {
    const original = new THREE.SphereGeometry(1, 16, 12)
    const saved = Array.from(original.attributes.position.array)
    const shaped = combatFaceGeometry(original)
    expect(shaped).not.toBe(original)
    expect(combatFaceGeometry(original)).toBe(shaped)
    expect(original.getAttribute('color')).toBeUndefined()
    expect(Array.from(original.attributes.position.array)).toEqual(saved)
    expect(Array.from(shaped.attributes.position.array)).toEqual(saved)
    expect(shaped.attributes.normal.array).toEqual(original.attributes.normal.array)
    expect(shaped.index?.array).toEqual(original.index?.array)
    const colors = Array.from(shaped.attributes.color.array)
    expect(Math.min(...colors)).toBeLessThan(0.7)
    expect(Math.max(...colors)).toBe(1)
    expect(shaped.index?.count).toBe(original.index?.count)
  })
  it.each([1, -1] as const)(
    'exposes the face in direction %s without turning attacks or changing positions',
    (facing) => {
      const fighter = { facing, x: 50, y: 0 }
      const figure = new THREE.Group(),
        head = new THREE.Group()
      const rig = { figure, head } as unknown as AnimatedHuman
      trackFightOpponent({
        fighter,
        opponent: { x: 50 + facing * 25, y: 0 },
        bodyAngle: facing * FIGHTER_FACING_ANGLE,
        seconds: 0,
      })(rig)
      const worldYaw = facing * FIGHTER_FACING_ANGLE + head.rotation.y
      expect(Math.abs(worldYaw)).toBeLessThan(1)
      expect(Math.sign(worldYaw)).toBe(facing)
      expect(figure.rotation.y).toBe(0)
      expect(fighter).toEqual({ facing, x: 50, y: 0 })
    },
  )
})
