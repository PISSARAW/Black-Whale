/**
 * What the principles look like while they are being used.
 *
 * This file computes the cues and draws none of them: it turns the state of a
 * game into a list of "this, this strongly, from this bearing", and the veil
 * component turns that into light. Keeping the arithmetic here is what makes
 * the animation testable at all — a fade curve nobody can assert is a fade
 * curve nobody can tell has broken.
 *
 * Every cue is derived from something the player has already been charged for,
 * and none of them says anything the text HUD does not. That is deliberate, and
 * it is the step-3 gate's doing: the brief wants to know whether simple poses
 * and a clear halo are legible *before* anything is animated, so the animation
 * has to be a second reading of the same facts rather than the only one. Turn
 * `NenVeil` off and the game is still playable, which is the property the gate
 * needs and the reason this is a separate layer.
 */
import { ECHO_LASTS, type Echoes } from './feedback'
import type { NenState } from './nen/states'
import { KO_WINDUP } from './duel/ko'
import type { DuelState } from './duel/state'
import type { Vec2 } from '../tour/types'

export type CueKind =
  /** A sweep of the player's own, going out. */
  | 'cast'
  /** A sweep that passed over the player, coming in from a bearing. */
  | 'swept'
  /** The aura dropped: the world goes cold and quiet. */
  | 'zetsu'
  /** Aura held, the default. A slow presence rather than an event. */
  | 'ten'
  /** Looking hard: the edges narrow. */
  | 'gyo'
  /** Concealing: the player's own light goes out of their own view. */
  | 'in'
  /** Covered everywhere. */
  | 'ken'
  /** A Ko coming to the boil — strength is how far through the wind-up it is. */
  | 'gathering'
  /** Something of the player's has gone off. */
  | 'sprung'
  /** Something of the player's has been found. */
  | 'found'

export interface Cue {
  kind: CueKind
  /** 0 to 1. For events, it fades; for states, it is steady. */
  strength: number
  /**
   * How far a travelling cue has got, 0 to 1 — the inverse of its strength, so
   * a sweep is drawn as a ring that grows outward as it dies away.
   */
  travel: number
  /** Radians clockwise from straight ahead, or null when the cue has no side. */
  bearing: number | null
}

export interface VeilReading {
  echoes: Echoes
  nen: NenState
  /** Where the player is standing, so a world bearing can be made relative. */
  at: Vec2
  heading: number
  duel: DuelState | null
}

/**
 * A bearing in the world, turned into one relative to the way the player is
 * facing. A cue that arrives "from the north" means nothing to someone who does
 * not know which way they are pointed.
 */
export function relativeBearing(at: Vec2, from: Vec2, heading: number): number | null {
  const dx = from[0] - at[0]
  const dz = from[1] - at[1]
  if (Math.hypot(dx, dz) === 0) return null
  return Math.atan2(dx, -dz) - heading
}

/** How much of an echo is left, 0 to 1. */
export function remaining(seconds: number): number {
  return Math.max(0, Math.min(1, seconds / ECHO_LASTS))
}

/**
 * Eased so the first moments are loud and the tail is long. A linear fade reads
 * as a dimmer being turned down; this reads as something that happened.
 */
export function easeOut(fraction: number): number {
  const clamped = Math.max(0, Math.min(1, fraction))
  return clamped * clamped
}

export function cuesFor(reading: VeilReading): Cue[] {
  return [...huntCues(reading), ...duelCues(reading.duel)].filter((cue) => cue.strength > 0.001)
}

function huntCues(reading: VeilReading): Cue[] {
  const { echoes } = reading
  const cues: Cue[] = [
    event('cast', echoes.cast),
    event('sprung', echoes.sprung),
    event('found', echoes.found),
  ]

  if (echoes.swept > 0 && echoes.sweptFrom) {
    cues.push({
      ...event('swept', echoes.swept),
      bearing: relativeBearing(reading.at, echoes.sweptFrom, reading.heading),
    })
  }

  // Ten and Zetsu are conditions rather than events: they do not fade, they are
  // simply what is true until the player changes it.
  cues.push(steady(reading.nen === 'zetsu' ? 'zetsu' : 'ten', 1))
  return cues
}

function duelCues(duel: DuelState | null): Cue[] {
  if (!duel) return []
  const { player } = duel
  const cues: Cue[] = []

  if (player.gyo) cues.push(steady('gyo', 1))
  if (player.in) cues.push(steady('in', 1))
  if (player.ken) cues.push(steady('ken', 1))
  if (player.zetsu) cues.push(steady('zetsu', 1))

  // The wind-up, as a bar filling: the one cue whose strength is a progress and
  // not a fade, because what the player needs to feel is how long they have
  // been standing there with three zones open.
  if (player.ko) {
    cues.push({
      kind: 'gathering',
      strength: Math.min(1, player.gathering / KO_WINDUP),
      travel: Math.min(1, player.gathering / KO_WINDUP),
      bearing: null,
    })
  }

  return cues
}

function event(kind: CueKind, seconds: number): Cue {
  const left = remaining(seconds)
  return { kind, strength: easeOut(left), travel: 1 - left, bearing: null }
}

function steady(kind: CueKind, strength: number): Cue {
  return { kind, strength, travel: 0, bearing: null }
}

/** The strongest cue of a kind, for a component that draws one of each. */
export function cueOf(cues: readonly Cue[], kind: CueKind): Cue | null {
  return cues.find((cue) => cue.kind === kind) ?? null
}
