import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createFight } from './engine'
import { createProjectileScene } from './projectileScene'
import type { FightProjectile } from './types'

const shot: FightProjectile = {
  id: 1,
  owner: 'opponent',
  fighterId: 'franklin',
  matter: 'nen',
  concealed: true,
  x: 50,
  y: 6,
  velocityX: -80,
  width: 0.5,
  height: 0.3,
  damage: 10,
  hitstun: 10,
  blockstun: 6,
  hitstop: 2,
  knockback: 1,
  targetZone: 'torso',
  shape: 'bullet',
  colour: '#ff0000',
  age: 0,
  lifetime: 90,
}
function setup() {
  const scene = new THREE.Scene()
  const geometry = vi.fn((made: THREE.BufferGeometry) => made)
  const layer = createProjectileScene({
    THREE,
    scene,
    geometry: <T extends THREE.BufferGeometry>(made: T): T => {
      geometry(made)
      return made
    },
    glow: (color, opacity) => new THREE.MeshBasicMaterial({ color, opacity }),
    worldX: (x) => x,
    worldY: (y) => y,
  })
  const mesh = (id: number) => scene.getObjectByName(`fight-projectile:${id}`) as THREE.Mesh
  return { scene, layer, geometry, mesh }
}

describe('projectile rendering resources stay bounded over long matches', () => {
  it('reuses one immutable geometry across thousands of successive bullets', () => {
    const { layer, geometry, mesh, scene } = setup()
    layer.sync([shot], 0)
    const shape = mesh(1).geometry
    const vertices = [...shape.getAttribute('position').array]
    for (let id = 2; id < 1200; id++) {
      layer.sync([{ ...shot, id }], id / 60)
      expect(mesh(id).geometry).toBe(shape)
    }
    expect(geometry).toHaveBeenCalledTimes(1)
    expect([...shape.getAttribute('position').array]).toEqual(vertices)
    layer.sync([], 20)
    expect(scene.children).toHaveLength(0)
    layer.dispose()
  })
  it('keeps physical handgun dimensions distinct from Franklin’s Nen bullets', () => {
    const { layer, mesh, geometry } = setup()
    layer.sync([shot, { ...shot, id: 2, fighterId: 'theta', matter: 'object' }], 0)
    expect(mesh(1).geometry).not.toBe(mesh(2).geometry)
    mesh(1).geometry.computeBoundingBox()
    mesh(2).geometry.computeBoundingBox()
    expect(mesh(2).geometry.boundingBox!.max.y).toBeLessThan(mesh(1).geometry.boundingBox!.max.y)
    expect(geometry).toHaveBeenCalledTimes(2)
    layer.dispose()
  })
  it('never shares visibility even when opposing projectiles share geometry', () => {
    const { layer, mesh } = setup()
    const observer = createFight('hisoka', 'franklin').player
    layer.sync([shot, { ...shot, id: 2, owner: 'player' }], 0, observer)
    expect(mesh(1).geometry).toBe(mesh(2).geometry)
    expect(mesh(1).visible).toBe(false)
    expect(mesh(2).visible).toBe(true)
    layer.dispose()
  })
  it('reuses the physical stone material and releases it once with its scene', () => {
    const { layer, mesh } = setup()
    const stone = { ...shot, fighterId: 'phinks', shape: 'stone', matter: 'object' } as const
    layer.sync([stone], 0)
    const material = mesh(1).material as THREE.Material
    const dispose = vi.spyOn(material, 'dispose')
    layer.sync([{ ...stone, id: 2 }], 1)
    expect(mesh(2).material).toBe(material)
    layer.dispose()
    expect(dispose).toHaveBeenCalledOnce()
  })
})
