import { describe, expect, it, vi } from 'vitest'
import type * as Three from 'three'
import { applySurfaceDetail } from './surfaceDetail'
import { RIM_FALLOFF, SHEEN_FALLOFF, applySheen, sheenUniforms } from './sheen'

/** A material stub: the two slots the hooks live in, and nothing else. */
const material = () => ({}) as unknown as Three.Material

/** The two shader sources three hands a hook, at the chunks it edits. */
const shader = () => ({
  uniforms: {} as Record<string, unknown>,
  vertexShader: '#include <common>\nvoid main() {\n#include <begin_vertex>\n}',
  fragmentShader: '#include <common>\nvoid main() {\n#include <opaque_fragment>\n}',
})

const compile = (target: Three.Material) => {
  const source = shader()
  target.onBeforeCompile?.(source as never, undefined as never)
  return source
}

describe('applySheen', () => {
  it('reads the eye and the normal the material already carries', () => {
    const source = compile((applySheen(material()), material()))
    expect(source.fragmentShader).toBe(shader().fragmentShader)
  })

  it('adds the grazing term before the chunk that writes the pixel', () => {
    const target = material()
    applySheen(target)
    const { fragmentShader, vertexShader, uniforms } = compile(target)
    // Before, not after: any later and the lift would be added past tone mapping.
    expect(fragmentShader.indexOf('vViewPosition')).toBeLessThan(
      fragmentShader.indexOf('#include <opaque_fragment>'),
    )
    expect(fragmentShader).toContain('outgoingLight')
    expect(vertexShader).toContain('vSheenPosition')
    expect(vertexShader).toContain('aSheen')
    expect(fragmentShader).toContain('vSheen')
    expect(uniforms.uSheen).toBeDefined()
    expect(uniforms.uRim).toBeDefined()
  })

  it('keeps a hook that was already there, and calls it first', () => {
    const target = material()
    const earlier = vi.fn()
    target.onBeforeCompile = earlier
    applySheen(target)
    compile(target)
    expect(earlier).toHaveBeenCalledOnce()
  })

  it('composes with the grain rather than replacing it', () => {
    const target = material()
    applySurfaceDetail(target)
    applySheen(target)
    const { fragmentShader, uniforms } = compile(target)
    expect(uniforms.uGrainStrength).toBeDefined()
    expect(uniforms.uSheen).toBeDefined()
    expect(fragmentShader).toContain('grainAt')
    expect(fragmentShader).toContain('uSheenFalloff')
  })

  it('gives the two hooks distinct programs, and folds the earlier key in', () => {
    const grained = material()
    applySurfaceDetail(grained)
    const both = material()
    applySurfaceDetail(both)
    applySheen(both)
    const bare = material()
    applySheen(bare)

    const keyOf = (m: Three.Material) => m.customProgramCacheKey?.()
    expect(keyOf(both)).toContain('tour-grain')
    expect(keyOf(both)).toContain('tour-sheen')
    expect(keyOf(both)).not.toBe(keyOf(grained))
    expect(keyOf(both)).not.toBe(keyOf(bare))
  })

  it('hugs the silhouette more tightly with the rim than with the sheen', () => {
    // The rim adds light and the sheen only multiplies what is there, so the
    // rim has to live in a narrower band or it would be a glow on the geometry.
    expect(RIM_FALLOFF).toBeGreaterThan(SHEEN_FALLOFF)
  })

  it('carries the strength it was asked for', () => {
    expect(sheenUniforms(0.1).uSheen.value).toBe(0.1)
    const target = material()
    applySheen(target, 0.2)
    expect(compile(target).uniforms.uSheen).toEqual({ value: 0.2 })
  })
})
