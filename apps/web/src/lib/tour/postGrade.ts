/**
 * The last thing that happens to the frame: a vignette and a light grade.
 *
 * One pass, not two. A vignette is a multiply and a grade is a curve, and
 * running them as separate `ShaderPass`es would mean two full-screen resolves
 * of a buffer that is already the most expensive thing on the phone — for two
 * operations that fit in nine lines of the same fragment shader.
 *
 * What it is allowed to do is deliberately small, and the reason is doctrinal
 * rather than technical. The walk's whole system of proof is a colour one: a
 * filament is warm and above white, a window is cold and above white, and every
 * other surface is a true albedo lit by one of the two. A film LUT — the
 * "thriller grade" the proposals asked for — would flatten exactly that
 * distinction into a single house tint, and the ship would stop being able to
 * say which of its two light sources you are standing under. So: no hue
 * rotation, no channel crosstalk, no LUT. A pivot contrast that deepens the
 * blacks the fog leaves grey, a saturation nudge that keeps warm and cold
 * apart rather than pulling them together, and a corner falloff.
 *
 * It is also why this pass comes *after* the sRGB fix in `mesh.ts`: graded on
 * albedos that were five times too light, every constant below would have been
 * dialled in against a signal that was wrong, and correcting the signal later
 * would have made the grade wrong instead.
 */
import type { PostPass } from './postTypes'

/**
 * The three lens artefacts the pass grew, and why each one is allowed.
 *
 * The file comment above refuses a house grade, and none of these is one. What
 * they have in common is that they are properties of a *camera* rather than
 * decisions about a *ship*: a lens disperses, an emulsion scatters, a sensor has
 * a noise floor. They are added after the two colour operations for exactly that
 * reason — the grade is what the picture is, and these are what looking at it
 * through something costs.
 *
 * The halation is the one that needed the most care. Film halation is
 * red-dominant because red light penetrates the emulsion furthest before it
 * reflects off the base, and every implementation in the wild tints the bleed
 * warm because of it. That tint is precisely what this pass may not do: the
 * window is cold and above white, the filament is warm and above white, and a
 * warm bleed round both would put the walk's whole system of proof through one
 * house colour. So the bleed here carries **the colour of what bled** — a
 * filament halates amber, a pane halates the sky it is showing — which costs
 * nothing extra, keeps the two sources tellable apart at the only place they are
 * bright enough to matter, and is the more honest of the two anyway.
 */
export interface Lens {
  halation: number
  halationRadius: number
  halationThreshold: number
  aberration: number
  grain: number
  breath: number
  breathPeriod: number
}

export const LENS_DEFAULTS: Lens = {
  /**
   * How far the bleed reaches, in fractions of the frame, and how much of it
   * comes back.
   *
   * Only what is above `halationThreshold` bleeds at all, and that is the lamps,
   * the panes and the aura — the three things on this ship written above white
   * on purpose. Everything else contributes exactly nothing, which is what keeps
   * six taps affordable.
   */
  halation: 0.34,
  halationRadius: 0.011,
  halationThreshold: 0.85,
  /**
   * Radial dispersion, in fractions of the frame at the very corner.
   *
   * Tiny, and quadratic in the radius, so the centre of the picture — where a
   * visitor reads a room — is untouched to the pixel and only the extreme edge
   * fringes. Past about three times this it stops reading as a lens and starts
   * reading as a broken renderer.
   */
  aberration: 0.0016,
  /**
   * The noise floor, and where it lives.
   *
   * Weighted into the shadows: film grain is loudest where the emulsion is least
   * exposed, and grain on the filaments would crawl on the one part of the frame
   * the eye is locked to. Multiplicative for the same reason the steel's grain
   * is — a surface the reconstruction painted black stays black.
   */
  grain: 0.055,
  /**
   * How much the corners breathe, as a fraction of the vignette, and how slowly.
   *
   * A hair, and over eleven seconds: what it is for is to keep the frame from
   * being a dead mask welded to the screen, not to be noticed. Set to zero for a
   * visitor who asked for less movement — a breathing frame is movement,
   * whatever it is a frame of.
   */
  breath: 0.06,
  breathPeriod: 11,
}

/** How the two paliers differ here: they do not. It is one multiply-add. */
export const GRADE_DEFAULTS = {
  /** How dark the corners go, at the very corner. 0 is off. */
  vignette: 0.34,
  /** Where the falloff starts, as a fraction of the half-diagonal. */
  vignetteStart: 0.42,
  /**
   * Contrast about a dark pivot.
   *
   * The pivot is 0.18 rather than the usual 0.5 because the walk is a dark
   * image: pivoting at mid-grey would push almost every pixel on screen down
   * and read as the exposure being wrong rather than as contrast.
   */
  contrast: 1.12,
  pivot: 0.18,
  /**
   * Slightly above 1. Not a stylistic choice — see the file comment: the warm
   * and the cold have to stay tellable apart, and tone mapping has already
   * pulled them towards each other on the way through.
   */
  saturation: 1.06,
} as const

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform float uVignette;
  uniform float uVignetteStart;
  uniform float uContrast;
  uniform float uPivot;
  uniform float uSaturation;
  uniform float uHalation;
  uniform float uHalationRadius;
  uniform float uHalationThreshold;
  uniform float uAberration;
  uniform float uGrain;
  uniform float uBreath;
  uniform float uBreathRate;
  uniform float uTime;
  varying vec2 vUv;

  const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

  /**
   * The frame sampled with the channels pulled apart along the radius.
   *
   * Red long, blue short, green where it is — which is the order a simple lens
   * disperses them in. The offset is quadratic in the radius, so this is the
   * identity at the centre of the picture and a fraction of a pixel anywhere a
   * visitor is actually reading.
   */
  vec3 disperse(vec2 uv) {
    vec2 fromCentre = uv - 0.5;
    if (uAberration <= 0.0) return texture2D(tDiffuse, uv).rgb;
    vec2 shift = fromCentre * dot(fromCentre, fromCentre) * 4.0 * uAberration;
    return vec3(
      texture2D(tDiffuse, uv + shift).r,
      texture2D(tDiffuse, uv).g,
      texture2D(tDiffuse, uv - shift).b
    );
  }

  /**
   * What the bright things bleed, in their own colour.
   *
   * Six taps on a ring rather than a separable blur: the pass is one draw and
   * has to stay one draw, and what it is reaching for is a soft ring round a
   * lamp rather than a correct Gaussian. Each tap contributes only what it
   * carries above the threshold, so the 99 % of the frame that is lit steel adds
   * nothing at all and the ring is made entirely of the sources.
   */
  vec3 halate(vec2 uv) {
    vec3 gathered = vec3(0.0);
    for (int i = 0; i < 6; i++) {
      float angle = float(i) * 1.04719755;
      vec2 tap = uv + vec2(cos(angle), sin(angle)) * uHalationRadius;
      vec3 sampled = texture2D(tDiffuse, tap).rgb;
      // Above the threshold, and keeping its hue: a cold pane bleeds cold.
      gathered += max(sampled - uHalationThreshold, 0.0);
    }
    return gathered * (1.0 / 6.0);
  }

  /** A hash of a pixel and a moment. No texture, and nothing to preload. */
  float grainAt(vec2 uv, float t) {
    return fract(sin(dot(uv * 1024.0 + t, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  }

  void main() {
    vec4 texel = texture2D(tDiffuse, vUv);
    vec3 colour = disperse(vUv);

    // The bleed goes on before the grade rather than after it, because it is
    // light arriving at the film and the grade is what the film does with it.
    if (uHalation > 0.0) colour += halate(vUv) * uHalation;

    // Contrast about a dark pivot, then saturation about the same luminance
    // the eye weighs the channels by. Neither step may reorder the channels:
    // a warm pixel stays warmer than a cold one at every setting of both.
    colour = (colour - uPivot) * uContrast + uPivot;
    float luma = dot(colour, LUMA);
    colour = mix(vec3(luma), colour, uSaturation);

    // Distance from the centre in units of the half-diagonal, so the falloff is
    // a circle on the screen whatever the aspect ratio — an ellipse keyed to the
    // viewport would tighten every time the visitor opened the side panel.
    float radius = length(vUv - 0.5) * 1.41421356;
    float falloff = smoothstep(uVignetteStart, 1.0, radius);
    float breathing = 1.0 + uBreath * sin(uTime * uBreathRate);
    colour *= 1.0 - uVignette * breathing * falloff;

    // Last, and in the shadows: see the grain note in LENS_DEFAULTS.
    if (uGrain > 0.0) {
      float shadowed = 1.0 - smoothstep(0.0, 0.7, luma);
      colour *= 1.0 + grainAt(vUv, uTime) * uGrain * shadowed;
    }

    gl_FragColor = vec4(max(colour, 0.0), texel.a);
  }
`

/** The uniform block, built as an object so the pass and the tests agree. */
export function gradeUniforms(settings = GRADE_DEFAULTS, lens = LENS_DEFAULTS) {
  return {
    tDiffuse: { value: null },
    uVignette: { value: settings.vignette },
    uVignetteStart: { value: settings.vignetteStart },
    uContrast: { value: settings.contrast },
    uPivot: { value: settings.pivot },
    uSaturation: { value: settings.saturation },
    uHalation: { value: lens.halation },
    uHalationRadius: { value: lens.halationRadius },
    uHalationThreshold: { value: lens.halationThreshold },
    uAberration: { value: lens.aberration },
    uGrain: { value: lens.grain },
    uBreath: { value: lens.breath },
    uBreathRate: { value: (Math.PI * 2) / lens.breathPeriod },
    uTime: { value: 0 },
  }
}

/**
 * The lens off, for the `low` palier and for a visitor who asked for less.
 *
 * Not a second shader: the three artefacts are each gated on their own uniform
 * being above zero, so switching them off is three writes and no recompile — and
 * a machine that cannot afford six extra taps never pays for them.
 */
export const LENS_OFF: Lens = {
  ...LENS_DEFAULTS,
  halation: 0,
  aberration: 0,
  grain: 0,
  breath: 0,
}

export const GRADE_SHADER = { uniforms: gradeUniforms(), vertexShader, fragmentShader }

/** The pass itself. Imported lazily, like every other pass in the walk. */
export async function createGradePass(lens = LENS_DEFAULTS): Promise<PostPass> {
  const { ShaderPass } = await import('three/examples/jsm/postprocessing/ShaderPass.js')
  return new ShaderPass({
    uniforms: gradeUniforms(GRADE_DEFAULTS, lens),
    vertexShader,
    fragmentShader,
  }) as unknown as PostPass
}

/**
 * The grade the hour asks for, written onto a live pass.
 *
 * Three numbers and a clock, once a frame. It is here rather than in the walk
 * because the names of the uniforms are this file's business and nobody else's —
 * the same reason `shaftUniforms` is in `godRays` and `skyPoolUniforms` in
 * `skyPool`.
 */
export function applyGrade(
  pass: PostPass | null,
  frame: {
    grade: { contrast: number; saturation: number; vignette: number }
    clock: number
    /**
     * Whether the visitor asked for less movement.
     *
     * It stops the corners breathing and nothing else: the grain is noise on a
     * still image rather than motion in it, and a frame that stopped grading
     * itself would be a different picture rather than a calmer one.
     */
    calm: boolean
    /** What the lens was built with, so the breath has somewhere to come back to. */
    lens: Lens
  },
): void {
  const uniforms = pass?.uniforms
  if (!uniforms) return
  uniforms.uContrast.value = frame.grade.contrast
  uniforms.uSaturation.value = frame.grade.saturation
  uniforms.uVignette.value = frame.grade.vignette
  uniforms.uBreath.value = frame.calm ? 0 : frame.lens.breath
  uniforms.uTime.value = frame.clock
}
