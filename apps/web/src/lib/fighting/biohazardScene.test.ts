import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { createFight } from './engine'
import { createBiohazardScene } from './biohazardScene'
import { BIOHAZARD_TRANSFORM } from './biohazard'
import type { FightState } from './types'

function modelState(phase: 'transforming' | 'flying' | 'bound' | 'dropped'): FightState {
  const state = createFight('hinrigh', 'hisoka')
  return {
    ...state,
    player: {
      ...state.player,
      biohazard: {
        objects: [
          {
            ...state.player.biohazard!.objects[0],
            phase,
            frames: BIOHAZARD_TRANSFORM / 2,
            x: 40,
            y: 6,
          },
        ],
      },
    },
  }
}

describe('physical Biohazard presentation', () => {
  it('draws the object changing shape, then the flying pigeon and latched metal cuffs', () => {
    const scene = new THREE.Scene()
    const effect = createBiohazardScene({ THREE, scene, worldX: (x) => x, worldY: (y) => y })
    effect.sync(modelState('transforming'), 0)
    const bird = scene.getObjectByName('biohazard-pigeon')!
    const cuffs = scene.getObjectByName('biohazard-handcuffs')!
    expect(bird.visible).toBe(true)
    expect(bird.scale.y).toBe(0.5)
    expect(cuffs.visible).toBe(true)
    effect.sync(modelState('flying'), 0)
    expect(bird.scale.y).toBe(1)
    expect(cuffs.visible).toBe(false)
    effect.sync(modelState('bound'), 0)
    expect(bird.visible).toBe(false)
    expect(cuffs.visible).toBe(true)
    effect.sync(modelState('dropped'), 0)
    expect(cuffs.visible).toBe(true)
    effect.dispose()
  })
  it('reuses scene resources across frames and releases every geometry and material', () => {
    const scene = new THREE.Scene()
    const effect = createBiohazardScene({ THREE, scene, worldX: (x) => x, worldY: (y) => y })
    const state = modelState('flying')
    effect.sync(state, 0)
    const geometries = new Set<THREE.BufferGeometry>()
    const materials = new Set<THREE.Material>()
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      geometries.add(object.geometry)
      for (const material of [object.material].flat()) materials.add(material)
    })
    const disposals = [...geometries, ...materials].map((resource) => vi.spyOn(resource, 'dispose'))
    const count = scene.children.length
    for (let frame = 0; frame < 120; frame++) effect.sync({ ...state, frame }, frame / 60)
    expect(scene.children.length).toBe(count)
    effect.dispose()
    expect(scene.children).toHaveLength(0)
    disposals.forEach((spy) => expect(spy).toHaveBeenCalledOnce())
  })
})
