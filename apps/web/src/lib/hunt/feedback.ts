/**
 * What the player is given to go on.
 *
 * Three channels, all of them directional and none of them a position. A sweep
 * that passes over you is felt as a pressure from a bearing — you learn that he
 * looked and roughly from where, not where he is now. Footsteps carry through
 * the room you share and are muffled to nearly nothing through a bulkhead, so
 * the apartment's plan is doing the filtering rather than a radius. And an
 * entrave firing somewhere behind you is heard wherever you are, because that
 * is the one sound the player has bought and paid for.
 *
 * Deliberately no minimap and no marker: the tension the step-1 gate is looking
 * for comes from a bearing and a guess, and a dot on a plan would delete it.
 */
import type { Vec2 } from '../tour/types'

/** Beyond this, footsteps in the same room are lost in the hull noise. */
export const HEARING_RANGE = 20
/** How much a wall takes off. A room away is a rumour, not a location. */
export const THROUGH_A_WALL = 0.35

/**
 * How long a thing that happened goes on being felt.
 *
 * A sweep passes in an instant, and at sixty ticks a second an instant is
 * sixteen milliseconds — a line of text nobody will ever read. So the events
 * ring rather than fire: they are set at full strength and fade, which is both
 * how a pressure across the skin actually behaves and the only way the single
 * most important signal in the hunt is legible at all.
 */
export const ECHO_LASTS = 1.5

/** What is still being felt from something that has already happened. */
export interface Echoes {
  /** Where the last sweep came from, held for as long as it rings. */
  sweptFrom: Vec2 | null
  swept: number
  /** A sweep of the player's own, going out. Fifteen points leaving the body. */
  cast: number
  sprung: number
  found: number
}

export interface HuntFeedback {
  /** Bearing the sweep came from, as a unit vector. Null when none was felt. */
  sweptFrom: Vec2 | null
  /** Bearing and loudness of footsteps, 0 to 1. Null when nothing is audible. */
  footsteps: { bearing: Vec2; nearness: number } | null
  entraveSprung: boolean
  entraveFound: boolean
}

export interface Rang {
  /** Where a sweep the player felt came from. */
  sweptFrom?: Vec2 | null
  cast?: boolean
  sprung?: boolean
  found?: boolean
}

export function noEchoes(): Echoes {
  return { sweptFrom: null, swept: 0, cast: 0, sprung: 0, found: 0 }
}

/** Rings whichever bells the tick struck, each at full strength. */
export function ring(echoes: Echoes, rang: Rang): Echoes {
  return {
    sweptFrom: rang.sweptFrom ?? echoes.sweptFrom,
    swept: rang.sweptFrom ? ECHO_LASTS : echoes.swept,
    cast: rang.cast ? ECHO_LASTS : echoes.cast,
    sprung: rang.sprung ? ECHO_LASTS : echoes.sprung,
    found: rang.found ? ECHO_LASTS : echoes.found,
  }
}

export function fade(echoes: Echoes, dt: number): Echoes {
  const swept = Math.max(0, echoes.swept - dt)
  return {
    sweptFrom: swept > 0 ? echoes.sweptFrom : null,
    swept,
    cast: Math.max(0, echoes.cast - dt),
    sprung: Math.max(0, echoes.sprung - dt),
    found: Math.max(0, echoes.found - dt),
  }
}

export interface Sensed {
  /** Where the player is standing. */
  at: Vec2
  /** Where the hunter is, which only ever becomes a bearing — never a marker. */
  hunterAt: Vec2
  /** How the two rooms relate: the same one, next door, or neither. */
  earshot: 'same' | 'adjacent' | 'apart'
}

export function quietFeedback(): HuntFeedback {
  return { sweptFrom: null, footsteps: null, entraveSprung: false, entraveFound: false }
}

/**
 * Footsteps are read fresh every tick, because they are a thing that is
 * happening; everything else is read off the echoes, because it is a thing that
 * has happened.
 */
export function senseAround(sensed: Sensed, echoes: Echoes): HuntFeedback {
  return {
    sweptFrom: echoes.sweptFrom ? bearing(sensed.at, echoes.sweptFrom) : null,
    footsteps: footstepsIn(sensed),
    entraveSprung: echoes.sprung > 0,
    entraveFound: echoes.found > 0,
  }
}

function bearing(from: Vec2, to: Vec2): Vec2 | null {
  const dx = to[0] - from[0]
  const dz = to[1] - from[1]
  const gap = Math.hypot(dx, dz)
  if (gap === 0) return null
  return [dx / gap, dz / gap]
}

function footstepsIn(sensed: Sensed): HuntFeedback['footsteps'] {
  if (sensed.earshot === 'apart') return null
  const heading = bearing(sensed.at, sensed.hunterAt)
  if (!heading) return null

  const gap = Math.hypot(sensed.hunterAt[0] - sensed.at[0], sensed.hunterAt[1] - sensed.at[1])
  const muffle = sensed.earshot === 'adjacent' ? THROUGH_A_WALL : 1
  const nearness = Math.max(0, 1 - gap / HEARING_RANGE) * muffle
  return nearness > 0.05 ? { bearing: heading, nearness } : null
}
