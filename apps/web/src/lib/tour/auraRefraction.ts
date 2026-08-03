/**
 * The air, bent by the aura standing in it.
 *
 * `NenSceneAura` draws the aura as light: shells, shaders, a colour added over
 * the room. That is a halo, and a halo is something the *image* has rather than
 * something the *ship* has — you can see it, but the corridor behind it is
 * untouched, so nothing in the world admits the aura is there. This is the
 * other half: the frame behind the aura is resampled through it, so the seams
 * of the deck plating and the gold outline of the far bulkhead pull as the
 * visitor raises their Ren. The aura stops being drawn over the room and starts
 * being in it.
 *
 * It is deliberately *not* a heat shimmer and not a bubble. Nen is not hot, and
 * a lens around the head would be a claim that aura refracts like glass. What
 * this is is a slow, wide swim in the picture, keyed to how much aura is
 * actually out — which is the one thing the technique state can honestly say.
 *
 * Off entirely on the `low` palier: it resamples the full frame with a noise
 * behind it, which is precisely the shape of cost a phone cannot absorb, and it
 * is an addition to a scene that already reads without it.
 *
 * `prefers-reduced-motion` is answered by the caller, not here: a moving
 * distortion is movement, and `$lib/tour/comfort` is where the walk keeps the
 * one rule about that.
 */
import type { NenTechniqueState } from '@black-whale/nen-engine'
import type { PostPass } from './postTypes'

/**
 * How much of the frame each state of the aura is allowed to move.
 *
 * Ordered the way the techniques are: Zetsu puts the aura out and takes the
 * distortion with it, Ten is a skin and barely reads, Ren is the aura *out* and
 * is the one this exists for, and Ko is all of it in one place, which is the
 * hardest bend on the list even though it is the smallest area.
 *
 * These are fractions of `REFRACTION_SPAN`, not pixels: the effect has to look
 * the same on a phone and on a thirty-inch display, and a fixed pixel offset
 * would be a gale on one and nothing on the other.
 */
export const REFRACTION_BY_MODE = {
  zetsu: 0,
  ten: 0.18,
  ren: 0.7,
} as const

/** Full strength, in uv. About four pixels on a 1080-tall viewport. */
export const REFRACTION_SPAN = 0.004

/**
 * What the aura is doing, as one number.
 *
 * Pure, and separate from the pass, because this is the part with an argument
 * in it: Ken is Ren held as a shell, so it bends as hard as Ren and more
 * evenly; Ko empties every other zone into one, so the total aura out is the
 * same but it is concentrated, and it reads as a harder bend. En is a radius
 * rather than an output — it is aura made *aware*, not aura made *large* — so
 * it adds nothing here at all, which is the one result worth writing a test for.
 */
export function refractionAmount(state: NenTechniqueState | null): number {
  if (!state) return 0
  if (state.mode === 'zetsu') return REFRACTION_BY_MODE.zetsu
  const base = state.mode === 'ren' ? REFRACTION_BY_MODE.ren : REFRACTION_BY_MODE.ten
  // On is a Ren the walker cannot put down. It bends as hard as one, and being
  // unable to stop is not a reason for the room to bend less.
  const raised = state.on ? Math.max(base, REFRACTION_BY_MODE.ren) : base
  if (state.ko) return Math.min(1, raised * 1.25)
  if (state.ken) return Math.min(1, raised * 1.1)
  return raised
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
  uniform float uAmount;
  uniform float uTime;
  uniform float uSpan;
  varying vec2 vUv;

  float swimHash(vec2 cell) {
    return fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float swimNoise(vec2 point) {
    vec2 cell = floor(point);
    vec2 fraction = fract(point);
    vec2 weight = fraction * fraction * (3.0 - 2.0 * fraction);
    return mix(
      mix(swimHash(cell), swimHash(cell + vec2(1.0, 0.0)), weight.x),
      mix(swimHash(cell + vec2(0.0, 1.0)), swimHash(cell + vec2(1.0, 1.0)), weight.x),
      weight.y
    );
  }

  void main() {
    if (uAmount <= 0.0) {
      gl_FragColor = texture2D(tDiffuse, vUv);
      return;
    }

    // Two samples of the same field, a half period apart, read as a horizontal
    // and a vertical displacement. Cheaper than a gradient and, at this scale,
    // indistinguishable from one.
    vec2 field = vUv * 7.0 + vec2(uTime * 0.11, uTime * -0.09);
    vec2 offset = vec2(
      swimNoise(field) - 0.5,
      swimNoise(field + vec2(31.7, 17.3)) - 0.5
    );

    // Strongest away from the centre of the frame, because in first person the
    // aura is *around* the eye: the middle of the screen is the far end of the
    // corridor, seen down the axis of the shell, and the edges are the shell
    // itself passing the camera. A bend that peaked in the middle would be a
    // lens held in front of the visitor rather than an aura worn by them.
    float radius = length(vUv - 0.5) * 1.41421356;
    float reach = smoothstep(0.12, 1.0, radius);

    vec2 warped = vUv + offset * uSpan * uAmount * reach;
    gl_FragColor = texture2D(tDiffuse, clamp(warped, 0.0, 1.0));
  }
`

export function refractionUniforms() {
  return {
    tDiffuse: { value: null },
    /** Zero whenever the aura is in — which is most of the walk. */
    uAmount: { value: 0 },
    uTime: { value: 0 },
    uSpan: { value: REFRACTION_SPAN },
  }
}

export const REFRACTION_SHADER = { uniforms: refractionUniforms(), vertexShader, fragmentShader }

/** The pass itself. Lazily imported, like every other pass in the walk. */
export async function createRefractionPass(): Promise<PostPass> {
  const { ShaderPass } = await import('three/examples/jsm/postprocessing/ShaderPass.js')
  return new ShaderPass({
    uniforms: refractionUniforms(),
    vertexShader,
    fragmentShader,
  }) as unknown as PostPass
}
