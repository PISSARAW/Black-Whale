import { describe, expect, it } from 'vitest'
import * as THREE from 'three'

import { theShip } from './blueprint'
import { createLampAirMaterial, lampAirOf } from './lampAir'
import { buildTierMesh } from './mesh'

describe('air made visible around existing lamps', () => {
  it('builds nothing for the low palier', () => {
    expect(createLampAirMaterial(THREE, false)).toBeNull()
  })

  it('batches one point cloud for a whole high-tier deck', () => {
    const plan = theShip().plans.get('tier-5')!
    const cloud = lampAirOf({
      THREE,
      mesh: buildTierMesh(plan),
      plan,
      material: createLampAirMaterial(THREE, true),
    })!
    expect(cloud).not.toBeNull()
    expect(cloud.geometry.getAttribute('position').count).toBeGreaterThan(0)
    expect(cloud.geometry.getAttribute('aHaloSize').count).toBe(
      cloud.geometry.getAttribute('position').count,
    )
  })
})
