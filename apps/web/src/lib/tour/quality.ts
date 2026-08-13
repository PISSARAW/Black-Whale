/**
 * What the walk is allowed to spend, said out loud.
 *
 * The renderer used to ask one question — `isHighEndGPU()` — and answer it
 * five times over, once inside each pass that cared, from a GPU string. That
 * is a detection pretending to be a policy: nothing named the tiers, nothing
 * could list what a tier turns off, and the visitor could not disagree with the
 * verdict their driver string had handed them.
 *
 * So the detection stays, and it does what a detection should do: it picks a
 * *default*. The palier itself is a value — `low` or `high` — that every pass
 * reads, that `TourComfortPanel` shows, and that the visitor can override, the
 * same way they already override the field of view and the look speed. The
 * doctrine of `$lib/tour/comfort` is that the walk proposes and the visitor
 * decides; a quality setting is no different, and a laptop that throttles after
 * five minutes is something no driver string will ever tell us.
 *
 * Nothing here reads three.js or the DOM, so the whole policy is testable.
 */

/** The two paliers. Not a scale: each one is a list of decisions. */
export type QualityTier = 'low' | 'high'

/** What the visitor may ask for. `auto` defers to the detection. */
export type QualitySetting = 'auto' | QualityTier

/**
 * GPU families that are integrated, mobile, or both.
 *
 * A deny-list rather than an allow-list because the failure modes are not
 * symmetrical: a discrete card wrongly put in `low` loses an effect nobody
 * misses, and an integrated one wrongly put in `high` drops the walk to eight
 * frames a second, which is the walk not working.
 */
const MODEST_GPUS = ['mali', 'adreno', 'intel', 'hd graphics', 'uhd graphics', 'powervr']

/**
 * The palier this machine gets before the visitor says otherwise.
 *
 * A coarse pointer settles it on its own: a phone is `low` whatever its GPU
 * reports, because the budget there is a battery and a thermal envelope rather
 * than a fill rate.
 */
export function detectTier(options: { renderer: string | null; coarse: boolean }): QualityTier {
  if (options.coarse) return 'low'
  const name = options.renderer?.toLowerCase() ?? ''
  if (!name) return 'high'
  return MODEST_GPUS.some((gpu) => name.includes(gpu)) ? 'low' : 'high'
}

/** The palier in force: what the visitor asked for, or what we detected. */
export function resolveTier(setting: QualitySetting, detected: QualityTier): QualityTier {
  return setting === 'auto' ? detected : setting
}

/**
 * What a palier switches on.
 *
 * One record, read by every pass, so that "what does `low` cost me" is a
 * question with an answer you can read rather than one you have to grep for.
 */
export interface QualityProfile {
  tier: QualityTier
  /**
   * Whether the composer needs its own anti-aliasing.
   *
   * It always does, when there is a composer at all. `EffectComposer` renders
   * into an offscreen target, and the `antialias: true` the canvas was created
   * with applies to the default framebuffer only — so the multisampling the
   * walk thought it had has never once reached the screen. That is why this is
   * keyed on the pointer and not on the palier: a phone asks for no native AA
   * either, and a shader pass over every pixel of a 3× display is exactly the
   * cost a phone cannot pay. Everywhere else, SMAA is not a luxury, it is the
   * anti-aliasing, and turning it off with the palier would mean shipping a
   * `low` desktop with jagged gold outlines it used to be told it had.
   */
  smaa: boolean
  /** Bloom, which is what makes a fitting read as a lamp rather than a tile. */
  bloom: boolean
  /** The vignette and the grade: one pass, and cheap enough for both paliers. */
  grade: boolean
  /**
   * Light shafts at the two windows.
   *
   * `high` only: it is a radial blur, which is a second pass over a
   * half-resolution buffer, for a thing that exists in two rooms of 314.
   */
  godRays: boolean
  /** The air bending around an aura. `high` only: it resamples the frame. */
  auraDistortion: boolean
  /**
   * The procedural grain on the steel. `high` only, and only a fragment cost —
   * the geometry and the buffers are identical either way.
   */
  surfaceDetail: boolean
  /**
   * The lens artefacts inside the grade pass: the halation, the dispersion and
   * the grain. `high` only, and for one of the three — six extra taps per pixel
   * for the bleed. The other two are free, and are switched with it rather than
   * separately because what they make together is one camera and half a camera
   * is not a cheaper camera, it is a stranger one.
   */
  lens: boolean
  /** The grazing sheen and the rim on the steel. See `$lib/tour/sheen`. */
  sheen: boolean
  /**
   * The darkness in the junctions the bake cannot see.
   *
   * `high` only, and not because eighteen taps are ruinous — because it is the
   * one effect on this list whose input is the depth buffer, and the depth
   * buffer only exists on `high`: `createHighTierTarget` allocates it, and a
   * `low` composer never asks for one. Switching this on for a `low` machine
   * would not be an expensive picture, it would be no picture at all.
   */
  occlusion: boolean
  /**
   * Depth of Field (Bokeh).
   *
   * `high` only, because it requires the depth buffer to calculate the circle
   * of confusion for each pixel. It uses a modified BokehShader that reads
   * our existing linear depth texture.
   */
  dof: boolean
  /**
   * Camera-based Motion Blur.
   *
   * `high` only, because it relies on the depth buffer to calculate per-pixel
   * velocity via reprojection.
   */
  motionBlur: boolean
  /**
   * Screen Space Reflections (SSR).
   *
   * `high` only, because it requires raymarching and extra normal buffers.
   */
  ssr: boolean
  /** What fraction of a room's motes are drawn. */
  dustScale: number
}

const PROFILES: Record<QualityTier, Omit<QualityProfile, 'tier' | 'smaa'>> = {
  low: {
    bloom: false,
    grade: true,
    godRays: false,
    auraDistortion: false,
    surfaceDetail: false,
    lens: false,
    // On, on both paliers, and it is the one `low` addition here. The sheen is
    // a dot product and a power in a fragment shader that was going to run
    // anyway — no taps, no buffers — and what it buys is the thing a phone
    // screen needs most: an edge where two dark surfaces meet.
    sheen: true,
    // No depth buffer on this palier to read: see `occlusion` above.
    occlusion: false,
    dof: false,
    motionBlur: false,
    ssr: false,
    // Not zero. The dust is the only thing that makes a six-thousand-square-metre
    // hall read as a volume, and a phone is the screen that needs that most.
    dustScale: 0.45,
  },
  high: {
    bloom: true,
    grade: true,
    godRays: true,
    auraDistortion: true,
    surfaceDetail: true,
    lens: true,
    sheen: true,
    occlusion: true,
    dof: true,
    motionBlur: true,
    ssr: true,
    dustScale: 1,
  },
}

/** The full profile for a palier on this pointer. */
export function qualityProfile(options: { tier: QualityTier; coarse: boolean }): QualityProfile {
  return { tier: options.tier, smaa: !options.coarse, ...PROFILES[options.tier] }
}
