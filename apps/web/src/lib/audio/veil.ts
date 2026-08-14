import type { Bus } from './output'

/**
 * What the ordinary world sounds like from behind concentrated aura.
 *
 * In the anime the moment a character puts aura in their eyes is not scored by
 * adding anything: it is scored by taking the room away. The music stops mid
 * phrase, the footsteps and the wind go under water, and what is left in the
 * hole is the low sound the aura itself makes. The picture does the same thing
 * — the frame darkens and only the aura keeps its brightness — and the two are
 * the same idea told twice.
 *
 * So the veil is not a filter on the Nen layer. It is a filter on *everything
 * else*: the theme, the flute, the hull, the boots, the rooms answering them.
 * It sits between each ordinary bus and the limiter, and the techniques' bus
 * has none at all — that is the whole trick. Raise the veil and the ship gets
 * further away while a cast stays exactly where it was, which is what a visitor
 * hears as their own hearing changing rather than as the mix moving.
 *
 * It is deliberately a good deal gentler than Three Monkeys' seal in
 * `ambient/mixer`, which closes to 210 Hz and nine per cent. Gyo does not take
 * hearing away; it puts hearing somewhere else, and a visitor in Gyo must still
 * hear a door behind them. See `nen/perception.ts` for who asks for how much.
 */

/**
 * How far each bus goes when the veil is full. The techniques are absent by
 * design, and their absence is the reason any of this is audible.
 *
 * The soundtrack closes hardest — it is the thing the anime actually cuts — and
 * the ship closes less, because the ship is the world the visitor is standing
 * in and a walk that goes silent underfoot reads as a bug rather than as focus.
 */
const DEPTH: Partial<Record<Bus, number>> = { ambient: 1, walk: 0.78 }

/** Open, and where it has got to at full veil. */
const CUTOFF = { open: 18000, closed: 340 }
const AIR = { open: 0, closed: -19 }
const LEVEL = { open: 1, closed: 0.3 }

interface Veil {
  context: AudioContext
  /** This bus's share of the veil, from `DEPTH`. */
  depth: number
  cutoff: BiquadFilterNode
  air: BiquadFilterNode
  level: GainNode
}

const veils: Veil[] = []

/** How closed the world is, from 0 to 1. Kept so a later bus opens correctly. */
let raised = 0

const between = (from: number, to: number, at: number) => from + (to - from) * at

/**
 * Cutoff moves in the log domain and the other two linearly.
 *
 * A low-pass swept linearly from 18 kHz spends the first four fifths of its
 * travel doing nothing the ear can name and then falls off a cliff. Swept
 * geometrically it closes at a constant number of octaves per second, which is
 * what "the room going away" sounds like.
 */
function tune(veil: Veil, seconds: number) {
  const at = Math.min(1, Math.max(0, raised)) * veil.depth
  const now = veil.context.currentTime
  const time = Math.max(0.001, seconds / 3)
  veil.cutoff.frequency.cancelScheduledValues(now)
  veil.cutoff.frequency.setTargetAtTime(
    CUTOFF.open * Math.pow(CUTOFF.closed / CUTOFF.open, at),
    now,
    time,
  )
  veil.air.gain.cancelScheduledValues(now)
  veil.air.gain.setTargetAtTime(between(AIR.open, AIR.closed, at), now, time)
  veil.level.gain.cancelScheduledValues(now)
  veil.level.gain.setTargetAtTime(between(LEVEL.open, LEVEL.closed, at), now, time)
}

/**
 * The node a bus's fader should connect to instead of the limiter.
 *
 * Returns the limiter itself for a bus with no veil, so `output.ts` has one
 * call and no branch: a bus is veiled or it is not, and only this file knows.
 */
export function veiled(context: AudioContext, bus: Bus, into: AudioNode): AudioNode {
  const depth = DEPTH[bus]
  if (!depth) return into

  const cutoff = context.createBiquadFilter()
  cutoff.type = 'lowpass'
  cutoff.frequency.value = CUTOFF.open
  cutoff.Q.value = 0.6

  // The same high shelf the seal uses, for the same reason: a low-pass alone
  // makes a sound duller, and dull is not the same as far. Taking the air off
  // separately is what puts it on the other side of something.
  const air = context.createBiquadFilter()
  air.type = 'highshelf'
  air.frequency.value = 2000
  air.gain.value = AIR.open

  const level = context.createGain()
  level.gain.value = LEVEL.open

  cutoff.connect(air)
  air.connect(level)
  level.connect(into)

  const veil: Veil = { context, depth, cutoff, air, level }
  veils.push(veil)
  tune(veil, 0.001)
  return cutoff
}

/**
 * Closes the world to `next`, from 0 (nothing) to 1 (Gyo held on something).
 *
 * Ramped rather than set, and every bus with the same gesture: two filters
 * moving at different speeds under one aura is two events, and the ear hears
 * the seam.
 */
export function setWorldVeil(next: number, seconds = 0.55): void {
  raised = Math.min(1, Math.max(0, next))
  for (const veil of veils) tune(veil, seconds)
}

/** How closed the world is now, for the tests and for whoever draws it. */
export const worldVeil = (): number => raised
