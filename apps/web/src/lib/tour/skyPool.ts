/**
 * The pool a window throws on the floor of its own room, put back under the
 * hour of the voyage.
 *
 * The bake used to write the daylight into the vertex colour along with the
 * lamplight, which was right while there was one sky: both are light arriving
 * at a surface, and one multiplier said so. It stopped being right the day the
 * sky got an hour — the two are then different claims, one settled by the deck
 * plans and one settled by the voyage clock, and a single number cannot carry
 * both.
 *
 * So `mesh.ts` bakes the lamplight into the colour and the daylight's *share*
 * into an attribute — see `RoomLight.skyShare` — and this puts them back
 * together in the one place that knows what time it is:
 *
 *     diffuseColor.rgb *= 1.0 + aSky * (uSkyGlow / reference)
 *
 * A multiply and not an add, because the albedo is already folded into the
 * vertex colour and cannot be recovered from it: added, the sky would light the
 * deck in the sky's own colour rather than in the room's, which is not a claim
 * the bake has ever made. At `uSkyGlow` = the drawn state of ch. 380 the factor
 * is exactly one and the walk is pixel for pixel what it was before any of this
 * existed — that is the test, and it is the licence for every other hour.
 *
 * Hung on two materials in two rooms out of three hundred and fourteen. The
 * other 312 have no window, so they have no attribute, no patched program and
 * no branch: an unlit corridor is black at every hour by construction rather
 * than by a check.
 */
import type * as Three from 'three'
import { WINDOW_GLOW } from './mesh'

/** A vec3 literal for GLSL, so the reference lives in exactly one file. */
const glsl = (value: readonly [number, number, number]) =>
  `vec3(${value.map((channel) => channel.toFixed(6)).join(', ')})`

const vertexHead = /* glsl */ `
  attribute float aSky;
  varying float vSkyShare;
`

/**
 * Read straight off the attribute. No transform: it is a ratio between two
 * quantities the bake computed at the same point, so it is already in the only
 * space it means anything in.
 */
const vertexBody = /* glsl */ `
  vSkyShare = aSky;
`

const fragmentHead = /* glsl */ `
  uniform vec3 uSkyGlow;
  varying float vSkyShare;
`

/**
 * After `<color_fragment>`, which is the chunk that folds the vertex colour
 * into `diffuseColor` — so what is being lifted is the surface as the bake
 * painted it, provenance and all. `max` on the divisor guards nothing real; it
 * is there because a shader that can divide by zero is a shader that will.
 */
const fragmentBody = /* glsl */ `
  {
    vec3 lift = uSkyGlow / max(${glsl(WINDOW_GLOW)}, vec3(1e-4));
    diffuseColor.rgb *= 1.0 + vSkyShare * lift;
  }
`

/** The uniform the hook adds, kept where the walk and a test can both reach it. */
export function skyPoolUniforms(glow: readonly [number, number, number] = WINDOW_GLOW) {
  return { uSkyGlow: { value: [glow[0], glow[1], glow[2]] } }
}

/**
 * Hangs the pool on a material, and hands back the uniform.
 *
 * Composed with whatever hook is already on the material rather than replacing
 * it: the deck's Lambert may already carry the grain of the steel — see
 * `applySurfaceDetail` — and the two are independent multiplies on the same
 * `diffuseColor`. The cache key is composed for the same reason, and it is not
 * optional: without it three would hand this program to any other Lambert in
 * the scene, and the visitor's own surfaces would start reading an attribute
 * they do not have.
 */
export function applySkyPool(material: Three.Material): Record<string, { value: number[] }> {
  const uniforms = skyPoolUniforms()
  const hook = material.onBeforeCompile
  const key = material.customProgramCacheKey
  material.onBeforeCompile = function (shader, renderer) {
    hook?.call(this, shader, renderer)
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${vertexHead}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${vertexBody}`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${fragmentHead}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${fragmentBody}`)
  }
  material.customProgramCacheKey = function () {
    return `tour-sky-${key ? key.call(this) : ''}`
  }
  material.needsUpdate = true
  return uniforms
}
