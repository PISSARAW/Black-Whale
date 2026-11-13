import { describe, expect, it } from 'vitest'
import type * as Three from 'three'

import { theShip } from './blueprint'
import { buildTierMesh } from './mesh'
import {
  applySurfaceCondition,
  conditionUniformsOf,
  surfaceConditionUniforms,
  trafficAttribute,
} from './surfaceCondition'

describe('room condition on structural steel', () => {
  it('keeps its three per-room controls outside the deck buffers', () => {
    expect(surfaceConditionUniforms()).toEqual({
      uRoomWear: { value: 0 },
      uRoomSoil: { value: 0 },
      uRoomFloor: { value: 0 },
    })
  })

  it('builds one compact traffic value aligned to every surface vertex', () => {
    const plan = theShip().plans.get('tier-5')!
    const mesh = buildTierMesh(plan)
    const traffic = trafficAttribute(mesh, plan)
    expect(traffic).toBeInstanceOf(Uint8Array)
    expect(traffic).toHaveLength(mesh.positions.length / 3)
    expect(traffic.some((value) => value > 0)).toBe(true)
  })

  it('chains onto the steel shader and exposes its uniform block', () => {
    const material = { userData: {} } as unknown as Three.Material
    applySurfaceCondition(material)
    expect(conditionUniformsOf(material)).not.toBeNull()
    expect(material.customProgramCacheKey?.()).toContain('tour-condition-v1')
  })
})
