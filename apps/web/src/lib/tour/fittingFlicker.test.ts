import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'

import { theShip } from './blueprint'
import {
  applyFittingFlicker,
  bindFittingFlicker,
  fittingFlickerAttribute,
  fittingFlickerUniformsOf,
} from './fittingFlicker'
import { buildTierMesh } from './mesh'

describe('separate real-time fitting flicker', () => {
  it('derives one phase/depth pair per fitting vertex and leaves most lamps steady', () => {
    const plan = theShip().plans.get('tier-5')!
    const mesh = buildTierMesh(plan)
    const values = fittingFlickerAttribute(mesh, plan)
    expect(values).toHaveLength((mesh.fittings.length / 3) * 2)
    const depths = values.filter((_, index) => index % 2 === 1)
    expect(depths.some((value) => value > 0)).toBe(true)
    expect(depths.some((value) => value === 0)).toBe(true)
  })

  it('updates only the fitting shader clock at draw time', () => {
    const material = new THREE.MeshBasicMaterial()
    const uniforms = applyFittingFlicker(material)
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material)
    vi.spyOn(performance, 'now').mockReturnValue(2500)
    bindFittingFlicker(mesh, material)
    mesh.onBeforeRender(
      {} as THREE.WebGLRenderer,
      {} as THREE.Scene,
      {} as THREE.Camera,
      mesh.geometry,
      material,
      {} as THREE.Group,
    )
    expect(uniforms.uFlickerTime.value).toBe(2.5)
    expect(fittingFlickerUniformsOf(material)).toBe(uniforms)
    expect(material.customProgramCacheKey()).toContain('tour-flicker-v1')
    vi.restoreAllMocks()
  })
})
