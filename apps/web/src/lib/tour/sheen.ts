/**
 * What tells the eye that the ship is made of metal, and where one dark surface
 * stops and the next begins.
 *
 * `surfaceDetail` gave the steel its *grain* — the variation a pressed sheet has
 * — and that answered the question of scale. It left the other half of the
 * problem standing. `MeshLambertMaterial` is perfectly diffuse by construction:
 * it has no view term at all, so a bulkhead returns the same value from every
 * angle, and the one thing that separates painted board from plate — that metal
 * goes bright when you look along it — is not in the model. Two dark surfaces
 * meeting at a corner therefore meet at no edge whatsoever, which is why the walk
 * has always leaned so hard on the gold outlines: they were carrying a job the
 * shading was not doing.
 *
 * So: a grazing term, and nothing else. Not a specular highlight — that needs a
 * light direction, and the light on this deck is baked into the vertices where
 * no fragment can find it. What a grazing term needs is the surface normal and
 * the eye, both of which Lambert already has in hand, and what it gives back is
 * the two things that were missing:
 *
 * - **the sheen**, a lift of the surface's *own* lit colour at glancing angles.
 *   A multiply and never an add, on the same argument as the grain: a wall the
 *   bake left in shadow stays in shadow, and the sheen only ever makes visible
 *   what the room was already spending on it. That is what makes a floor read as
 *   plate when you look down its length and as matte when you stand over it.
 * - **the rim**, a thin line of light at the silhouette. This one does add, which
 *   is why it is throttled twice — by the surface's own luminance, so unlit steel
 *   does not glow, and by a high power, so it lives in the last few degrees
 *   before the surface turns away. What it buys is depth: a stanchion in front of
 *   a bulkhead stops being a shape cut out of the same value.
 *
 * The brushing is the honest part. Rolled plate has a direction, and a sheen with
 * no direction reads as plastic — so the strength is modulated by a coarse stripe
 * sampled in world space, on the same triplanar argument and at the same physical
 * scale as the grain. No UVs, no textures, no claim about the ship beyond the one
 * the plate seams already make.
 *
 * Chained rather than assigned. `applySurfaceDetail` also hangs itself on
 * `onBeforeCompile`, and a second assignment would silently drop the first — so
 * this keeps whatever was there and calls it, and folds its own key into the
 * cache key rather than replacing it.
 */
import type * as Three from 'three'

/**
 * How far the grazing term lifts the surface's own colour, at the very edge.
 *
 * Just over a third. It sounds like a lot for something that is not a highlight,
 * and it is not: the term is `(1 - N·V)^SHEEN_FALLOFF`, which is already under a
 * tenth by thirty degrees off the silhouette, so what this actually sets is the
 * brightness of a band a few pixels wide down the length of a wall.
 */
export const SHEEN_STRENGTH = 0.38

/**
 * How fast it falls off the silhouette.
 *
 * Five is Schlick's exponent, and it is Schlick's exponent because that is the
 * shape a dielectric Fresnel curve actually has. Steel is not a dielectric, but
 * the ship is painted steel — the walk's albedos are the flat matte colours of a
 * hull under enamel — so the reflectance that matters here is the paint's, and
 * five is right for it.
 */
export const SHEEN_FALLOFF = 5

/** How hard the rim burns, and how tightly it hugs the silhouette. */
export const RIM_STRENGTH = 0.3
export const RIM_FALLOFF = 9

/**
 * How much of the sheen the brushing takes away, and over what period in metres.
 *
 * A half — so the stripes never switch the sheen off, they modulate it — over a
 * period a good deal coarser than `DETAIL_COARSE`. The two must not land on the
 * same scale: a grain and a brush at the same period is one pattern read twice
 * and it reads as a moiré, not as a material.
 */
export const BRUSH_DEPTH = 0.5
export const BRUSH_PERIOD = 0.62

const vertexHead = /* glsl */ `
  varying vec3 vSheenPosition;
`

/**
 * Its own varying rather than the grain's.
 *
 * `surfaceDetail` declares a world position too, and reading it here would make
 * the sheen silently depend on a pass that is off on the `low` palier — where
 * the sheen is on. One extra interpolated `vec3` is the price of the two being
 * independent, and it is the right price.
 */
const vertexBody = /* glsl */ `
  vSheenPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
`

const fragmentHead = /* glsl */ `
  uniform float uSheen;
  uniform float uSheenFalloff;
  uniform float uRim;
  uniform float uRimFalloff;
  uniform float uBrushDepth;
  uniform float uBrushPeriod;
  varying vec3 vSheenPosition;
`

/**
 * Inserted before `<opaque_fragment>`, which is the chunk that writes
 * `outgoingLight` into `gl_FragColor` — so this runs on the lit colour, after
 * every light in the scene and after the vertex bake, and before tone mapping,
 * fog and the colour-space transform. Any later and the sheen would be added to
 * a value that had already been rolled off by the filmic curve, which is the
 * definition of light that does not belong to the scene.
 *
 * `vViewPosition` is the vector from the fragment to the camera in view space,
 * which `MeshLambertMaterial` already carries; `normal` is the shading normal
 * `<normal_fragment_begin>` has settled by this point. Neither costs anything
 * new.
 */
const fragmentBody = /* glsl */ `
  {
    vec3 towardsEye = normalize(vViewPosition);
    float facing = clamp(dot(normalize(normal), towardsEye), 0.0, 1.0);
    float grazing = 1.0 - facing;

    // The brush: one stripe field, summed on the three world axes so a wall, a
    // floor and a lintel all carry it at the same pitch without an unwrap. Not
    // blended by the normal like the grain is — a brush that vanished on the
    // surfaces facing the camera would be a brush nobody ever saw.
    float stripes = sin(vSheenPosition.x / uBrushPeriod)
                  + sin(vSheenPosition.y / uBrushPeriod)
                  + sin(vSheenPosition.z / uBrushPeriod);
    float brush = 1.0 - uBrushDepth * (0.5 - stripes / 6.0);

    // The sheen: the surface's own light, more of it along the glance.
    outgoingLight *= 1.0 + pow(grazing, uSheenFalloff) * uSheen * brush;

    // The rim, twice throttled: by a high power, so it lives in the last few
    // degrees before the surface turns away, and by the surface's own luminance,
    // so a corridor the bake left black does not acquire an outline it has not
    // earned. The rim lifts what is lit and barely touches what is not.
    float lit = dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722));
    outgoingLight += outgoingLight * pow(grazing, uRimFalloff) * uRim
                   * (0.25 + 0.75 * clamp(lit * 4.0, 0.0, 1.0));
  }
`

/** The uniforms the hook adds, kept where a test can read them. */
export function sheenUniforms(strength = SHEEN_STRENGTH) {
  return {
    uSheen: { value: strength },
    uSheenFalloff: { value: SHEEN_FALLOFF },
    uRim: { value: RIM_STRENGTH },
    uRimFalloff: { value: RIM_FALLOFF },
    uBrushDepth: { value: BRUSH_DEPTH },
    uBrushPeriod: { value: BRUSH_PERIOD },
  }
}

/**
 * Hangs the sheen on a material, keeping whatever was already hung on it.
 *
 * The chaining is the whole subtlety. `onBeforeCompile` is a single slot, and
 * `applySurfaceDetail` is usually in it by the time this runs — so the existing
 * hook is called first and this one edits the shader it has already edited. The
 * cache key is folded rather than replaced for the same reason: two materials
 * differing only in whether they carry the grain must not share a program.
 */
export function applySheen(
  material: Three.Material,
  strength = SHEEN_STRENGTH,
): Record<string, { value: number }> {
  const uniforms = sheenUniforms(strength)
  const earlier = material.onBeforeCompile
  const earlierKey = material.customProgramCacheKey

  material.onBeforeCompile = (shader, renderer) => {
    earlier?.call(material, shader, renderer)
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${vertexHead}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${vertexBody}`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${fragmentHead}`)
      .replace('#include <opaque_fragment>', `${fragmentBody}\n#include <opaque_fragment>`)
  }
  material.customProgramCacheKey = () =>
    `${earlierKey?.call(material) ?? ''}|tour-sheen-${strength}`
  material.needsUpdate = true
  return uniforms
}
