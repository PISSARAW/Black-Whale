/**
 * The grain of the steel, made out of nothing but the position of the pixel.
 *
 * The problem it answers is real: a bulkhead is one flat albedo across twelve
 * metres, and flat albedo under flat light has no scale. A wall three metres
 * off and a wall thirty metres off are the same value, so the eye has nothing
 * to measure the room with except the plate seams along the floor.
 *
 * The proposals answered it with UVs in the mesh builder and a set of PBR
 * texture maps per category of room — carpet for the public decks, plate for
 * the infrastructure ones. That is refused elsewhere in this plan and for a
 * plain reason: a carpet nobody drew is a claim about the ship. It would also
 * cost UVs on every vertex of 314 rooms, an image budget, and a second axis of
 * provenance nothing could answer.
 *
 * What this does instead makes no new claim at all. The ship is steel — the
 * plate seams already say so, and they are sourced — so the surface is given
 * the *variation* steel has and nothing else: a value noise sampled in world
 * space, modulating the colour that is already baked into the vertex, by a few
 * per cent either way. No hue, no pattern, no material identity. Zero UVs, zero
 * images, zero bytes of geometry: it is a handful of instructions in a fragment
 * shader that was going to run anyway.
 *
 * Triplanar because there are no UVs to unwrap onto — the noise is sampled on
 * all three world planes and blended by the normal, which is what lets a wall,
 * a floor and the underside of a lintel all take the same grain at the same
 * physical scale without anything being unwrapped. It is also what keeps the
 * grain the *same size in metres* everywhere, which is the entire point: it is
 * a ruler, and a ruler that stretched with the surface would measure nothing.
 */
import type * as Three from 'three'

/**
 * How far the grain moves the albedo, as a fraction, at full strength.
 *
 * Small. Past about a third it stops reading as a surface and starts reading as
 * noise on the image, and the walk already has one thing that must not be
 * mistaken for a rendering artefact — the deliberate cold tint on everything
 * the reconstruction invented. A grain loud enough to compete with that would
 * be undoing the tint's job.
 */
export const DETAIL_STRENGTH = 0.26

/**
 * The two scales, in metres per period.
 *
 * Coarse is the roll of the plate — the slow unevenness of a sheet that was
 * pressed rather than cast. Fine is the tooth of the surface itself, at about
 * the size the eye stops resolving it at arm's length. Two octaves and not
 * four: the third would cost as much as the first two and be gone by the time
 * it reached the screen through a 1.5 pixel-ratio cap and an SMAA pass.
 */
export const DETAIL_COARSE = 1.7
export const DETAIL_FINE = 0.21

const vertexHead = /* glsl */ `
  varying vec3 vGrainPosition;
  varying vec3 vGrainNormal;
`

/**
 * World position and world normal, taken after the deck's own transform.
 *
 * `objectNormal` rather than `normal`: it is the one three.js has already
 * settled morphing and skinning onto, and it is what the rest of the chunk
 * chain reads. The deck is not scaled non-uniformly, so the plain normal matrix
 * is the model matrix's rotation and this is exact.
 */
const vertexBody = /* glsl */ `
  vGrainPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
  vGrainNormal = normalize(mat3(modelMatrix) * objectNormal);
`

const fragmentHead = /* glsl */ `
  uniform float uGrainStrength;
  uniform float uGrainCoarse;
  uniform float uGrainFine;
  varying vec3 vGrainPosition;
  varying vec3 vGrainNormal;

  float grainHash(vec2 cell) {
    return fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453123);
  }

  /** Value noise: four hashes and a smoothstep. No texture, no gradient table. */
  float grainNoise(vec2 point) {
    vec2 cell = floor(point);
    vec2 fraction = fract(point);
    vec2 weight = fraction * fraction * (3.0 - 2.0 * fraction);
    float a = grainHash(cell);
    float b = grainHash(cell + vec2(1.0, 0.0));
    float c = grainHash(cell + vec2(0.0, 1.0));
    float d = grainHash(cell + vec2(1.0, 1.0));
    return mix(mix(a, b, weight.x), mix(c, d, weight.x), weight.y);
  }

  /**
   * The same noise read on all three world planes and blended by the normal.
   *
   * The fourth power on the blend weights is what keeps a wall from carrying a
   * ghost of the floor's noise: at the first power a vertical surface is still
   * a third horizontal, and the two samples cross-fade into mush instead of one
   * of them winning.
   */
  float grainAt(vec3 position, vec3 normal, float scale) {
    vec3 blend = abs(normal);
    blend = blend * blend * blend * blend;
    blend /= max(blend.x + blend.y + blend.z, 1e-4);
    return grainNoise(position.yz / scale) * blend.x
         + grainNoise(position.xz / scale) * blend.y
         + grainNoise(position.xy / scale) * blend.z;
  }
`

/**
 * Placed after `<color_fragment>`, which is the chunk that folds the vertex
 * colour into `diffuseColor` — so this modulates the baked colour, including
 * everything the bake says about provenance and about which lamp lit it, rather
 * than replacing any part of it. A multiply and never an add: a surface the
 * reconstruction painted black stays black, whatever the noise says.
 */
const fragmentBody = /* glsl */ `
  {
    vec3 grainNormal = normalize(vGrainNormal);
    float coarse = grainAt(vGrainPosition, grainNormal, uGrainCoarse);
    float fine = grainAt(vGrainPosition, grainNormal, uGrainFine);
    float grain = mix(coarse, fine, 0.45) - 0.5;
    diffuseColor.rgb *= 1.0 + grain * uGrainStrength;
  }
`

/** The uniforms the hook adds, kept where a test can read them. */
export function detailUniforms(strength = DETAIL_STRENGTH) {
  return {
    uGrainStrength: { value: strength },
    uGrainCoarse: { value: DETAIL_COARSE },
    uGrainFine: { value: DETAIL_FINE },
  }
}

/**
 * Hangs the grain on a material, and hands back the uniforms.
 *
 * `onBeforeCompile` rather than a `ShaderMaterial` of our own: the deck is lit
 * by `MeshLambertMaterial`, and reimplementing Lambert to add nine lines to it
 * would mean owning fog, tone mapping, vertex colours and every other chunk
 * three.js maintains. This adds the nine lines and leaves the rest alone.
 *
 * `customProgramCacheKey` is not optional. Without it three caches the compiled
 * program by the material's *stock* signature, and a second Lambert in the same
 * scene — the visitor's own, a portal's — would be handed this one's program.
 */
export function applySurfaceDetail(
  material: Three.Material,
  strength = DETAIL_STRENGTH,
): Record<string, { value: number }> {
  const uniforms = detailUniforms(strength)
  const previousOnBeforeCompile = material.onBeforeCompile
  material.onBeforeCompile = (shader, renderer) => {
    previousOnBeforeCompile?.call(material, shader, renderer)
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${vertexHead}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${vertexBody}`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${fragmentHead}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${fragmentBody}`)
  }
  const previousCustomProgramCacheKey = material.customProgramCacheKey
  material.customProgramCacheKey = () => {
    const prevKey = previousCustomProgramCacheKey?.call(material) || ''
    return prevKey + `tour-grain-${strength}`
  }
  material.needsUpdate = true
  return uniforms
}
