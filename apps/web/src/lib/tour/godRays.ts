/**
 * Light shafts, at the only two places on the ship where light comes in.
 *
 * The proposals asked for god rays as an atmosphere: shafts down corridors,
 * shafts in stairwells, shafts wherever the frame looked empty. That is a lie
 * about a hull. There is no daylight inside the Black Whale — no ambient, no
 * envmap, no sun — and a shaft in a corridor would be light arriving from
 * outside a room that has no outside. The doctrine is the same one that keeps
 * `scene.environment` out: an unlit corridor stays black.
 *
 * The ship has exactly two openings, and the blueprint says so: the observation
 * deck's bay (ch. 380) and the King's great window (ch. 382). Those are the two
 * rooms where the claim "light is coming in from over there" is drawn in the
 * manga, so those are the two rooms that get shafts, and everywhere else the
 * pass is off — `uStrength` at zero, which costs one branch.
 *
 * The two are never on screen together: one is on Tier 3 and one on Tier 1. So
 * the pass carries one source, not a list, and the walk hands it whichever
 * window the visitor is on the deck of.
 *
 * The occlusion mask is free, and this is why the effect is honest rather than
 * painted on. A classic light-scattering pass needs a second render of the
 * scene in black to know what is in front of the source. Here the frame already
 * separates them: a window pane is written above white (`WINDOW_GLOW`, up to
 * 1.28) and every wall in front of it is a true albedo well under it. A
 * luminance threshold above 1 selects the pane and nothing else, so what the
 * shafts are made of is the light of the actual window, cut by the actual
 * geometry standing in front of it, at the cost of no extra draw call.
 */
import { structureFootprint } from './geometry'
import type { TierPlan } from './blueprint'
import type { PostPass } from './postTypes'
import type { Structure } from './types'

/** How many steps the march takes towards the source. */
const SAMPLES = 24

/**
 * How hard the shafts blow when the window is dead ahead.
 *
 * Low. What is outside is an overcast sky over a grey sea — the panel of ch.
 * 380 draws cloud, not a sun — and a shaft that reads as a beam would be
 * daylight the manga does not show. What this is for is the fall of light
 * across the floor of two rooms, and being able to tell, from the far end of
 * the observation deck, that the light there comes from somewhere.
 *
 * The hour of the voyage moves it now — `skyOf(...).peak` in `$lib/tour/sky` —
 * and this is the row of that table the manga draws: the overcast noon of ch.
 * 380, from which every other hour is derived. Kept here because it is a
 * statement about the *pass* rather than about the sky, and because the table
 * has to be checkable against the state that was here before it existed.
 */
export const SHAFT_PEAK = 0.55

/**
 * Where a window's light is taken to come from, in ship metres.
 *
 * Not the centre of the pane. `SEA_GLOW` paints everything below the horizon at
 * 45% of the sky's value, which is under the threshold — so the part of the
 * glass that actually feeds the shafts is the part above the eye, and anchoring
 * at the middle would aim them at water that is not bright enough to be there.
 */
export interface ShaftAnchor {
  structureId: string
  spaceId: string
  position: readonly [number, number, number]
}

/** Two thirds of the way up the opening: the middle of the sky half of it. */
const ANCHOR_HEIGHT = 0.66

/** The world anchor of one window, given the deck it stands on. */
export function shaftAnchorOf(structure: Structure, elevation: number): ShaftAnchor {
  const outline = structureFootprint(structure)
  const x = outline.reduce((sum, point) => sum + point[0], 0) / outline.length
  const z = outline.reduce((sum, point) => sum + point[1], 0) / outline.length
  return {
    structureId: structure.id,
    spaceId: structure.spaceId,
    position: [x, elevation + structure.base + structure.height * ANCHOR_HEIGHT, z],
  }
}

/**
 * Every window on a deck, which on this ship is one deck in five and one
 * window on it. A list rather than an option because the blueprint is data:
 * the day a third opening is sourced, this keeps working.
 */
export function shaftAnchors(plan: TierPlan): ShaftAnchor[] {
  return plan.structures
    .filter((structure) => structure.kind === 'window')
    .map((structure) => shaftAnchorOf(structure, plan.tier.elevation))
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform vec2 uSource;
  uniform float uStrength;
  uniform float uThreshold;
  uniform float uDensity;
  uniform float uDecay;
  uniform vec3 uTint;
  varying vec2 vUv;

  void main() {
    vec4 texel = texture2D(tDiffuse, vUv);
    if (uStrength <= 0.0) {
      gl_FragColor = texel;
      return;
    }

    // The march: from this pixel towards the window, in equal steps, adding up
    // only what is brighter than the threshold. Everything on board that is not
    // the pane sits below it, so the sum is the pane seen past whatever is in
    // the way — which is what a shaft is.
    vec2 step = (vUv - uSource) * (uDensity / float(${SAMPLES}));
    vec2 cursor = vUv;
    float fade = 1.0;
    vec3 shaft = vec3(0.0);

    for (int i = 0; i < ${SAMPLES}; i++) {
      cursor -= step;
      vec3 sampled = texture2D(tDiffuse, clamp(cursor, 0.0, 1.0)).rgb;
      float luma = dot(sampled, vec3(0.2126, 0.7152, 0.0722));
      shaft += max(luma - uThreshold, 0.0) * fade * sampled;
      fade *= uDecay;
    }

    // Additive, and tinted by the window's own colour rather than by white: the
    // whole reason for drawing these two rooms differently is that their light
    // is the cold one. A white shaft would put the ship's warm interior light
    // in front of the one opening that does not have it.
    gl_FragColor = vec4(texel.rgb + shaft * uTint * (uStrength / float(${SAMPLES})), texel.a);
  }
`

export function shaftUniforms() {
  return {
    tDiffuse: { value: null },
    /** Where the window is on screen, in uv. Off-screen values are harmless. */
    uSource: { value: [0.5, 0.5] },
    /** Zero everywhere but the two rooms. The pass stays added and stays cheap. */
    uStrength: { value: 0 },
    /** Above what a lit steel wall can reach, below what a pane is written at. */
    uThreshold: { value: 0.9 },
    /** How much of the way to the source the march covers. */
    uDensity: { value: 0.7 },
    uDecay: { value: 0.94 },
    /** `WINDOW_GLOW`, normalised: the hue of the sky the ship is sailing under. */
    uTint: { value: [0.48, 0.67, 1.0] },
  }
}

export const SHAFT_SHADER = { uniforms: shaftUniforms(), vertexShader, fragmentShader }

/** The pass itself. Lazily imported, like every other pass in the walk. */
export async function createShaftPass(): Promise<PostPass> {
  const { ShaderPass } = await import('three/examples/jsm/postprocessing/ShaderPass.js')
  return new ShaderPass({
    uniforms: shaftUniforms(),
    vertexShader,
    fragmentShader,
  }) as unknown as PostPass
}

/**
 * How hard the shafts blow, given where the visitor is looking.
 *
 * Screen-space marching has one failure mode and it is loud: as the source
 * leaves the frame, the direction every pixel marches in swings, and the shafts
 * flick across the picture. So the strength falls to nothing over the margin
 * outside the viewport rather than being switched off at its edge, and a window
 * behind the camera contributes nothing at all.
 *
 * `ndc` is the anchor projected by the camera; `z` past 1 is behind the near
 * plane, which is three.js's way of saying the window is at your back.
 */
export function shaftStrength(ndc: { x: number; y: number; z: number }, peak = 1): number {
  if (ndc.z > 1) return 0
  const outside = Math.max(Math.abs(ndc.x), Math.abs(ndc.y))
  if (outside > 1.6) return 0
  const fade = outside <= 1 ? 1 : 1 - (outside - 1) / 0.6
  return peak * fade
}
