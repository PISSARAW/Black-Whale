import { describe, expect, it } from 'vitest'
import { PerspectiveCamera } from 'three'
import {
  OCCLUSION_BIAS,
  OCCLUSION_REACH,
  OCCLUSION_RADIUS,
  OCCLUSION_STRENGTH,
  occlusionUniforms,
  projectionScale,
} from './ambientOcclusion'

describe('the occlusion pass', () => {
  it('measures its disc in metres of ship, not in pixels', () => {
    const wide = new PerspectiveCamera(90, 1, 0.1, 500)
    wide.updateProjectionMatrix()
    const narrow = new PerspectiveCamera(45, 1, 0.1, 500)
    narrow.updateProjectionMatrix()

    // At 90° the frustum is exactly as tall as it is deep, so one metre at one
    // metre covers half the frame: 0.5 in uv.
    expect(projectionScale(wide)[1]).toBeCloseTo(0.5)
    // A narrower lens magnifies, so the same half-metre corner covers more of
    // the screen and the disc has to grow with it.
    expect(projectionScale(narrow)[1]).toBeGreaterThan(projectionScale(wide)[1])
  })

  it('scales the disc separately across and up, so uv being unsquare cannot bend it', () => {
    const camera = new PerspectiveCamera(60, 16 / 9, 0.1, 500)
    camera.updateProjectionMatrix()
    const [across, up] = projectionScale(camera)

    expect(across).toBeCloseTo(up / (16 / 9))
  })

  it('starts from the tuned constants, so a test can hold what the walk spends', () => {
    const uniforms = occlusionUniforms()

    expect(uniforms.uRadius.value).toBe(OCCLUSION_RADIUS)
    expect(uniforms.uStrength.value).toBe(OCCLUSION_STRENGTH)
    expect(uniforms.uBias.value).toBe(OCCLUSION_BIAS)
    expect(uniforms.uReach.value).toBe(OCCLUSION_REACH)
    // Handed in at build time and per frame respectively: neither has a
    // sensible value before there is a scene.
    expect(uniforms.tDepth.value).toBeNull()
    expect(uniforms.uInverseProjection.value).toBeNull()
  })

  it('looks no further than the fog does', () => {
    // A hall on this ship is a hundred metres long and closes well before then.
    // Occlusion applied out there would be darkening haze, not steel.
    expect(OCCLUSION_REACH).toBeLessThan(50)
    // And it looks for junctions rather than for whole walls.
    expect(OCCLUSION_RADIUS).toBeLessThan(1)
  })
})
