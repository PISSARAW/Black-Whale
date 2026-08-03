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
  varying vec2 vUv;

  void main() {
    vec4 texel = texture2D(tDiffuse, vUv);
    vec3 colour = texel.rgb;

    // Contrast about a dark pivot, then saturation about the same luminance
    // the eye weighs the channels by. Neither step may reorder the channels:
    // a warm pixel stays warmer than a cold one at every setting of both.
    colour = (colour - uPivot) * uContrast + uPivot;
    float luma = dot(colour, vec3(0.2126, 0.7152, 0.0722));
    colour = mix(vec3(luma), colour, uSaturation);

    // Distance from the centre in units of the half-diagonal, so the falloff is
    // a circle on the screen whatever the aspect ratio — an ellipse keyed to the
    // viewport would tighten every time the visitor opened the side panel.
    float radius = length(vUv - 0.5) * 1.41421356;
    float falloff = smoothstep(uVignetteStart, 1.0, radius);
    colour *= 1.0 - uVignette * falloff;

    gl_FragColor = vec4(max(colour, 0.0), texel.a);
  }
`

/** The uniform block, built as an object so the pass and the tests agree. */
export function gradeUniforms(settings = GRADE_DEFAULTS) {
  return {
    tDiffuse: { value: null },
    uVignette: { value: settings.vignette },
    uVignetteStart: { value: settings.vignetteStart },
    uContrast: { value: settings.contrast },
    uPivot: { value: settings.pivot },
    uSaturation: { value: settings.saturation },
  }
}

export const GRADE_SHADER = { uniforms: gradeUniforms(), vertexShader, fragmentShader }

/** The pass itself. Imported lazily, like every other pass in the walk. */
export async function createGradePass(): Promise<PostPass> {
  const { ShaderPass } = await import('three/examples/jsm/postprocessing/ShaderPass.js')
  return new ShaderPass({
    uniforms: gradeUniforms(),
    vertexShader,
    fragmentShader,
  }) as unknown as PostPass
}
