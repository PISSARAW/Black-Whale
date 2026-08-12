/**
 * What a body takes away from the floor it stands on.
 *
 * Everything that stands in the walk already had a patch under it — a
 * `CircleGeometry` in ink at a fifth of an alpha, in `humanFigure` and again in
 * `nenCreatureFigure` — and both had the same three faults. They were painted
 * *on* rather than multiplied *out*: normal blending puts a near-black at 20 %
 * over whatever is there, which is a flat grey sticker on a lit Tier 1 floor and
 * nothing at all on the hold, where the floor is already darker than the sticker.
 * They had no falloff, so the edge of the patch was a line on the deck instead of
 * the place a shadow ran out. And at twelve segments the line was a dodecagon.
 *
 * A shadow is not a colour laid down, it is light not arriving, so this one
 * multiplies. `MultiplyBlending` makes the frame buffer the source factor, which
 * means the patch is exactly a fraction taken off whatever the bake put there —
 * strong under a lamp, invisible on a floor that was already black, and
 * automatically right on all five decks without a single number per deck. It is
 * also why nothing here has a hue: multiplying by a grey removes the same share
 * of the warm filament and of the cold pane, so the walk's system of proof —
 * see the file comment in `$lib/tour/postGrade` — survives standing on it.
 *
 * There is still no shadow map and no second light. This is a contact patch: it
 * says a body interrupts the floor directly under itself, which is the one thing
 * about a shadow that a visitor reads at walking pace, and it says nothing about
 * where a lamp is — because on this ship a room has eight of them.
 */
import type { BufferGeometry, Material, Mesh } from 'three'

type Three = typeof import('three')

/** How dark the floor goes directly under a body, as a share of what it was. */
export const CONTACT_STRENGTH = 0.5

/**
 * How much shorter the patch is than it is wide.
 *
 * Kept from the two discs this replaces: a circle on the floor seen from eye
 * height is already an ellipse, and squashing it along the view-neutral axis
 * makes a figure sit into the deck rather than on a coin. It is a drawing
 * convention rather than a projection — a real one would depend on where the
 * lamp is, and a room here has eight.
 */
export const CONTACT_SQUASH = 0.5

/**
 * A hair above the floor, in metres.
 *
 * Enough to clear the deck's own polygons at grazing angles down a
 * hundred-metre coursive, small enough that a visitor standing over it cannot
 * see the gap. `polygonOffset` would be the tidier fix and is not available:
 * the patch is drawn with depth writing off and has to lose to the deck at any
 * angle, which an offset only guarantees for coplanar surfaces.
 */
export const CONTACT_LIFT = 0.01

export interface ContactShadow {
  /** How wide the patch is, in metres — the radius of the unsquashed circle. */
  radius: number
  /** How much of the floor is taken. Defaults to `CONTACT_STRENGTH`. */
  strength?: number
  /** How short the ellipse is. Defaults to `CONTACT_SQUASH`. */
  squash?: number
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * The falloff, and why it is not a smoothstep.
 *
 * A shadow under a standing body is dense where the body meets the floor and
 * runs out fast, not half-dark across its whole width — a smoothstep would
 * give a plateau under the feet and a soft ring, which reads as a puddle. The
 * exponent bends the curve the other way: nearly all of the darkness sits in
 * the middle third, and the rim reaches zero with a slope rather than a step,
 * so there is no edge to see. No texture, and nothing to preload — the same
 * bargain the grain in `$lib/tour/postGrade` makes.
 */
const fragmentShader = /* glsl */ `
  uniform float uStrength;
  varying vec2 vUv;

  void main() {
    float radius = length(vUv - 0.5) * 2.0;
    float density = pow(max(1.0 - radius, 0.0), 1.8);
    // White outside, and (1 - strength) at the centre: under MultiplyBlending
    // this is a share of the floor kept, so a black floor stays black.
    gl_FragColor = vec4(vec3(1.0 - uStrength * density), 1.0);
  }
`

/**
 * The unit disc every patch is a scaling of, one per three.js instance.
 *
 * Thirty-two segments rather than the twelve it replaces, because the rim is
 * now a falloff rather than a line and the only place the polygon count still
 * shows is the silhouette against a bright floor. One geometry for the whole
 * cast: a promenade of forty people is one upload.
 */
const discs = new WeakMap<Three, BufferGeometry>()

function contactDisc(THREE: Three): BufferGeometry {
  const held = discs.get(THREE)
  if (held) return held
  const made = new THREE.CircleGeometry(1, 32)
  discs.set(THREE, made)
  return made
}

/**
 * Materials shared by strength, the way `glow` shares them by colour.
 *
 * The strength is a uniform rather than a vertex attribute because there are
 * two or three distinct values in the whole walk — a person, a beast, a crate —
 * and three materials is cheaper than an attribute on every disc.
 */
const materials = new WeakMap<Three, Map<number, Material>>()

function contactMaterial(THREE: Three, strength: number): Material {
  let byStrength = materials.get(THREE)
  if (!byStrength) {
    byStrength = new Map()
    materials.set(THREE, byStrength)
  }
  const key = Math.round(strength * 100) / 100
  const held = byStrength.get(key)
  if (held) return held
  const made = new THREE.ShaderMaterial({
    uniforms: { uStrength: { value: key } },
    vertexShader,
    fragmentShader,
    transparent: true,
    blending: THREE.MultiplyBlending,
    depthWrite: false,
    // Fog would tint the multiplier towards the air colour with distance, which
    // on a multiply is not haze but a shadow that inverts into a highlight down
    // a long coursive. The patch is small and near the floor; it fades with the
    // floor it is multiplying, which is the correct depth cue and is free.
    fog: false,
  })
  byStrength.set(key, made)
  return made
}

/**
 * A patch, laid flat and lifted clear, ready to be added to a body's root.
 *
 * Returned rather than added, so the caller keeps the say over where in its
 * hierarchy the shadow hangs: a figure wants it on the root so it stays on the
 * deck while the body leans, and a crate wants it on the crate.
 */
export function contactShadow(THREE: Three, options: ContactShadow): Mesh {
  const strength = options.strength ?? CONTACT_STRENGTH
  const patch = new THREE.Mesh(contactDisc(THREE), contactMaterial(THREE, strength))
  patch.name = 'contact-shadow'
  patch.rotation.x = -Math.PI / 2
  patch.scale.set(options.radius, options.radius * (options.squash ?? CONTACT_SQUASH), 1)
  patch.position.y = CONTACT_LIFT
  // Behind everything that stands in it: the patch writes no depth, so without
  // this it would be drawn over a boot that happens to be sorted later.
  patch.renderOrder = -1
  return patch
}
