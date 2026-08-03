/**
 * How the walk is driven, kept between visits.
 *
 * A first-person camera is not a neutral thing to put in front of someone. A
 * 72° field of view on a 320 mm laptop screen is a fisheye, a mouse
 * sensitivity that suits one hand is unusable in another, and a view that
 * swings while the body does not is what actually makes people ill. None of
 * that has a right answer, so all of it is the visitor's to set — and the
 * settings survive a reload, because being made to dial them in again on every
 * visit is the same as not having them.
 *
 * `prefers-reduced-motion` sets the defaults rather than being layered over
 * them: a visitor who has asked their system for less movement gets a narrower
 * field of view, a slower look, snap turns and the walk already in jump-only
 * mode — and can still turn any of it back on, which a hard override would not
 * allow.
 */
import { writable } from 'svelte/store'
import type { QualitySetting } from './quality'

const KEY = 'black-whale:tour-comfort'

const QUALITY_SETTINGS: readonly QualitySetting[] = ['auto', 'low', 'high']

export interface Comfort {
  /** Vertical field of view, in degrees. */
  fov: number
  /** Multiplier on the mouse and finger look speed. 1 is the default hand. */
  sensitivity: number
  /**
   * Turn in fixed steps rather than continuously — the arrows always snap, this
   * makes the mouse and the finger do it too.
   */
  snapTurn: boolean
  /** The size of one snap, in degrees. */
  snapAngle: number
  /**
   * Do not walk at all: the deck is reached by jumping from the plan or the
   * index, which removes the moving camera without removing the ship.
   */
  jumpOnly: boolean
  /**
   * How far the light the visitor carries reaches, in metres. Zero puts it out.
   *
   * The ship lights itself — every room by its own fittings, baked into the deck
   * — and this is the one light left that is not the ship's. It exists because a
   * stairwell the deck plans put no lamp over is genuinely dark, and being unable
   * to see the step in front of you is not atmosphere, it is a wall.
   *
   * A setting rather than a constant, and one that goes all the way to nothing,
   * because the two visitors who want it are asking for opposite things: one
   * wants to see the steps, and one wants the ship exactly as lit as the ship is.
   * Neither is wrong, and the reconstruction has no business deciding for them.
   */
  nightLight: number
  /**
   * How much the walk is allowed to spend on the picture.
   *
   * `auto` is the driver string's verdict — see `$lib/tour/quality` — and the
   * other two are the visitor overruling it. Both directions are real requests:
   * a laptop that reports a discrete card and then throttles wants `low`, and a
   * machine whose GPU string says `intel` because the browser is masking it
   * wants `high`. Neither is something a detection can be made to get right,
   * which is why it is here and not in the renderer.
   */
  quality: QualitySetting
}

export const FOV_RANGE = [55, 100] as const
export const SENSITIVITY_RANGE = [0.25, 2.5] as const
export const SNAP_ANGLE_RANGE = [15, 90] as const
/** Out, to a couple of paces of floor. Never a torch: see `nightLight`. */
export const NIGHT_LIGHT_RANGE = [0, 12] as const

const LIVELY: Comfort = {
  fov: 72,
  sensitivity: 1,
  snapTurn: false,
  snapAngle: 45,
  jumpOnly: false,
  nightLight: 8,
  quality: 'auto',
}

const CALM: Comfort = {
  fov: 62,
  sensitivity: 0.6,
  snapTurn: true,
  snapAngle: 30,
  jumpOnly: true,
  // A visitor who has asked their system for less movement is not asking for a
  // darker ship, and jumping from room to room does not make a dark stairwell
  // easier to read. Left where the walk leaves it.
  nightLight: 8,
  // Reduced motion is a request about movement, not about fidelity. The palier
  // is left to the machine, the same as for anyone else.
  quality: 'auto',
}

/** Whether the system has been asked for less movement. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/** The defaults for this visitor, before anything they have set themselves. */
export function comfortDefaults(reduced = prefersReducedMotion()): Comfort {
  return { ...(reduced ? CALM : LIVELY) }
}

const clamp = (value: number, [low, high]: readonly [number, number]) =>
  Math.min(high, Math.max(low, value))

/**
 * One stored field read back, or the default.
 *
 * Three of these rather than one branch per field inline: the settings are a
 * list that grows, and a validator written as a straight line grows a branch
 * with it until nothing can be checked without reading all of it.
 */
const readNumber = (value: unknown, range: readonly [number, number], fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? clamp(value, range) : fallback

const readFlag = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback

const readQuality = (value: unknown, fallback: QualitySetting): QualitySetting =>
  QUALITY_SETTINGS.includes(value as QualitySetting) ? (value as QualitySetting) : fallback

/**
 * A stored setting read back, field by field.
 *
 * Anything missing or out of range falls back to the default rather than
 * failing: the shape of this grows over time, and an old entry in a visitor's
 * browser must not be able to hand the camera a field of view of zero.
 */
export function readComfort(raw: string | null, reduced = prefersReducedMotion()): Comfort {
  const defaults = comfortDefaults(reduced)
  if (!raw) return defaults
  let stored: Partial<Comfort>
  try {
    stored = JSON.parse(raw) as Partial<Comfort>
  } catch {
    return defaults
  }
  if (!stored || typeof stored !== 'object') return defaults
  return {
    fov: readNumber(stored.fov, FOV_RANGE, defaults.fov),
    sensitivity: readNumber(stored.sensitivity, SENSITIVITY_RANGE, defaults.sensitivity),
    snapTurn: readFlag(stored.snapTurn, defaults.snapTurn),
    snapAngle: readNumber(stored.snapAngle, SNAP_ANGLE_RANGE, defaults.snapAngle),
    jumpOnly: readFlag(stored.jumpOnly, defaults.jumpOnly),
    nightLight: readNumber(stored.nightLight, NIGHT_LIGHT_RANGE, defaults.nightLight),
    quality: readQuality(stored.quality, defaults.quality),
  }
}

export const comfort = writable<Comfort>(comfortDefaults(false))

/**
 * Reads the stored settings in. Called from the walk on mount, not at module
 * scope: the server has no `localStorage` and no media query to ask.
 */
export function loadComfort() {
  const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY)
  comfort.set(readComfort(raw))
}

export function setComfort(change: Partial<Comfort>) {
  comfort.update((current) => {
    const next = { ...current, ...change }
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(next))
    return next
  })
}

/** Back to what this visitor's system asks for, and forget what was stored. */
export function resetComfort() {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY)
  comfort.set(comfortDefaults())
}
