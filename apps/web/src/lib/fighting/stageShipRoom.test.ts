import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { fogDensityOf } from '../tour/atmosphere'
import { theShip } from '../tour/blueprint'
import { buildShipRoomScenery } from './stageShipRoom'
import { FIGHT_BODY_HALF_WIDTH } from './stageRoomCut'

const kit = () => {
  const materials: THREE.Material[] = []
  const geometries: THREE.BufferGeometry[] = []
  return {
    materials,
    geometries,
    value: {
      THREE,
      glow: (colour: number, opacity: number) => {
        const material = new THREE.MeshBasicMaterial({
          color: colour,
          opacity,
          transparent: opacity < 1,
        })
        materials.push(material)
        return material
      },
      geometry: <T extends THREE.BufferGeometry>(geometry: T): T => {
        geometries.push(geometry)
        return geometry
      },
    },
  }
}

describe('2D arena ship-room rendering', () => {
  it.each([
    ['tier-1-princes-burial-chamber-rotunda', 'princes-burial-chamber-manga-details'],
    ['tier-1-vip-casino', 'casino-manga-details'],
  ])('keeps %s behind the widest bodies with an actual material cut', async (space, modelName) => {
    const owned = kit()
    const scenery = await buildShipRoomScenery(owned.value, space)
    const model = scenery.root.getObjectByName(modelName)!
    expect(model).toBeDefined()
    let materials = 0
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      const held = Array.isArray(object.material) ? object.material : [object.material]
      for (const material of held) {
        materials++
        const cut = material.clippingPlanes?.find((plane: THREE.Plane) => plane.normal.z === -1)
        expect(cut?.constant).toBeLessThanOrEqual(-FIGHT_BODY_HALF_WIDTH)
        expect(material.clipIntersection).toBe(true)
      }
    })
    expect(materials).toBeGreaterThan(0)
    scenery.dispose()
  })

  it('reuses the visit atmosphere, surface texture and reflection', async () => {
    const owned = kit()
    const scenery = await buildShipRoomScenery(owned.value, 'tier-2-screening-room')
    const room = theShip().spaces.get('tier-2-screening-room')!

    expect(scenery.fog).toEqual({
      kind: 'exp2',
      colour: 0x0b0e12,
      density: fogDensityOf(room),
    })
    expect(scenery.bloom).toBe(true)
    expect(scenery.update).toBeTypeOf('function')

    let dust = 0
    let reflectors = 0
    let texturedSurface = false
    scenery.root.traverse((object) => {
      if (object instanceof THREE.Points) dust += 1
      if (object.type === 'Reflector') reflectors += 1
      const material = (object as THREE.Mesh).material
      for (const candidate of material ? (Array.isArray(material) ? material : [material]) : []) {
        const key = candidate.customProgramCacheKey()
        if (key.includes('tour-grain') && key.includes('tour-sheen')) texturedSurface = true
      }
    })

    expect(dust).toBeGreaterThan(0)
    expect(reflectors).toBe(1)
    expect(texturedSurface).toBe(true)

    scenery.dispose()
    owned.materials.forEach((material) => material.dispose())
    owned.geometries.forEach((geometry) => geometry.dispose())
  })

  it('cuts foreground furniture below a visible seat outline', async () => {
    const owned = kit()
    const scenery = await buildShipRoomScenery(owned.value, 'tier-2-screening-room')
    const horizontalCuts: THREE.Plane[] = []

    scenery.root.traverse((object) => {
      const material = (object as THREE.Mesh).material
      for (const candidate of material ? (Array.isArray(material) ? material : [material]) : []) {
        for (const plane of candidate.clippingPlanes ?? []) {
          if (plane.normal.y === -1) horizontalCuts.push(plane)
        }
      }
    })

    expect(horizontalCuts.length).toBeGreaterThan(0)
    expect(Math.max(...horizontalCuts.map((plane) => plane.constant))).toBeLessThanOrEqual(0.004)

    scenery.dispose()
    owned.materials.forEach((material) => material.dispose())
    owned.geometries.forEach((geometry) => geometry.dispose())
  })
})
