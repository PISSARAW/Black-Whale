import type { Vec2 } from '$lib/tour/types'

import { earLocal, type Facing } from './ears'
import { currentGraph } from './steps/graph'

/**
 * Where a sound is made, and where it is heard from.
 *
 * The walk was mono. Every technique, every refusal and every beast came out of
 * the middle of the visitor's head at the same level, whether it happened at
 * their feet or on the far side of a hall — while the picture in front of them
 * had the thing thirty metres away and to the left. The ear places a source
 * faster than the eye does, and the walk was throwing that away.
 *
 * Three things happen here, and they are one thing: what the walk knows about
 * where the visitor stands (`setListener`), what it knows about where a cast
 * landed (`soundedFrom`), and the little piece of graph that turns the
 * difference between the two into something audible (`emissionTarget`).
 *
 * The variation is here for the same reason. A one-shot played from an exact
 * schedule is identical every time, which the ear reads as a machine rather
 * than as an event — the footsteps have always varied and the techniques never
 * did. The jitter belongs to the *emission*, not to the voice: a cast is
 * detuned once and every oscillator in it moves together, so a tune played by
 * Melody's flute is a hair flat rather than falling apart note by note.
 */

/** A point the walk can put a sound at, and the room it is in. */
export interface Place {
  at: Vec2
  /** The space it happens in, for the wall between it and the ear. */
  spaceId: string | null
}

export interface Listener extends Place, Facing {}

let listener: Listener = { at: [0, 0], heading: 0, pitch: 0, spaceId: null }

/** Called by the walk as the visitor moves; see `steps/listener.ts`. */
export function setListener(next: Listener): void {
  listener = next
}

/**
 * The same ear, turned without being moved.
 *
 * Standing still and looking round is the commonest thing a visitor does, and
 * until now it changed nothing: `setListener` was only ever called on the
 * quarter-metre threshold the minimap is redrawn on, so a cast made to the left
 * stayed on the left when the visitor turned to face it. This is the cheap half
 * of that call — no room, no wall, no geometry — and the walk makes it on every
 * meaningful change of heading or pitch.
 */
export function setFacing(heading: number, pitch: number): void {
  listener = { ...listener, heading, pitch }
}

export const listenerNow = (): Listener => listener

/** How far a sound has to be before distance takes anything off it, in metres. */
const REFERENCE = 5

/**
 * The furthest a cast is ever placed, in metres.
 *
 * Direction is kept whatever the distance; the distance itself is clamped. Air
 * Blow strips a room from across the ship and Remote Punch runs the length of a
 * deck — placed honestly, those arrive some three hundred metres away, which
 * inverse-square puts below the hull. A cast the visitor made must always be
 * audible to them: what happens is their doing, and a key that appears to do
 * nothing is the one failure the walk refuses everywhere else. So a far cast is
 * heard in the right direction, and a good deal quieter than one at their feet,
 * but heard.
 */
const FURTHEST = 18

/** What a wall does: this much of the sound gets through, and only the low end. */
const THROUGH_A_WALL = { level: 0.5, cutoff: 760 }

/** How much of a cast is fed into the room the visitor is standing in. */
const ROOM_SEND = 0.5

interface Emission {
  place: Place | null
  /** Cents, applied to every oscillator in this emission at once. */
  detune: number
  /** A multiplier on filter cutoffs, so noise-based voices vary too. */
  colour: number
  /** A multiplier on peak level. */
  level: number
  /** One panner per graph, shared by every voice of the emission. */
  targets: Map<AudioNode, AudioNode>
}

let emission: Emission | null = null

const spread = (amount: number) => 1 + (Math.random() * 2 - 1) * amount

/**
 * Plays something as having happened at a place.
 *
 * Everything the callback schedules synchronously is panned, distanced,
 * occluded and detuned together. Nothing that runs later is: a loop started
 * inside one of these would be pinned to where it began and never move, so the
 * held sounds — the vacuum, the engine, the requiem — are deliberately started
 * outside any emission and stay where they have always been, at the visitor.
 */
export function soundedFrom<T>(place: Place | null, play: () => T): T {
  const outer = emission
  emission = {
    place,
    detune: (Math.random() * 2 - 1) * 14,
    colour: spread(0.04),
    level: spread(0.08),
    targets: new Map(),
  }
  try {
    return play()
  } finally {
    emission = outer
  }
}

/** Cents to add to every oscillator of the sound being played, or none. */
export const emissionDetune = (): number => emission?.detune ?? 0

/** A multiplier on filter cutoffs for the sound being played, or one. */
export const emissionColour = (): number => emission?.colour ?? 1

/** A multiplier on the peak level of the sound being played, or one. */
export const emissionLevel = (): number => emission?.level ?? 1

/**
 * Listener-local coordinates of a point: x to the right, +y up, −z ahead.
 *
 * The walk gives a cast a `Vec2`, so every cast happens at the visitor's own
 * height and `y` goes in as nought. It does not come out as nought: looking up
 * tips the whole world down, and a gong on the far side of the hall drops below
 * the line of sight exactly as the picture says it should. The rotation itself
 * is in `./ears`, shared with the machinery and the sea, which are the two
 * sources that do have a height of their own.
 */
function localTo(at: Vec2): { x: number; y: number; z: number } {
  let dx = at[0] - listener.at[0]
  let dz = at[1] - listener.at[1]
  const away = Math.hypot(dx, dz)
  if (away > FURTHEST) {
    dx = (dx / away) * FURTHEST
    dz = (dz / away) * FURTHEST
  }
  return earLocal({ x: dx, y: 0, z: dz }, listener)
}

/**
 * The room the visitor is standing in, as a node to feed.
 *
 * This is the whole of the second repair. The convolution that makes the hold
 * sound like the hold is built by the walk from the blueprint's own volume, and
 * until the context was shared it could only be applied to footsteps. A cast
 * now goes into the same send, so a gong struck in the hold rings for four
 * seconds and the same gong in a cabin is over in half of one.
 *
 * Null when the walk is silent, which is the honest answer: with no walk there
 * is no room, and the technique is heard dry.
 */
function roomSend(context: AudioContext): AudioNode | null {
  const walk = currentGraph()
  if (!walk || walk.context !== context) return null
  return walk.send
}

interface Sink {
  context: AudioContext
  muffle: AudioNode
}

function buildTarget(g: Sink, place: Place | null): AudioNode {
  const { context } = g
  const tap = context.createGain()
  tap.connect(g.muffle)

  const room = roomSend(context)
  if (room) {
    const send = context.createGain()
    send.gain.value = ROOM_SEND
    tap.connect(send)
    send.connect(room)
  }

  if (!place) return tap

  const panner = context.createPanner()
  panner.panningModel = 'HRTF'
  panner.distanceModel = 'inverse'
  panner.refDistance = REFERENCE
  panner.rolloffFactor = 0.6
  panner.maxDistance = 240
  const { x, y, z } = localTo(place.at)
  panner.positionX.value = x
  panner.positionY.value = y
  panner.positionZ.value = z
  panner.connect(tap)

  // Through a wall, and only the low end of it. The walk already knows which
  // room the visitor is in and which room the cast landed in; a sound made in
  // another one arriving at full brightness was the last thing left saying the
  // ship has no walls.
  const occluded = place.spaceId !== null && place.spaceId !== listener.spaceId
  if (!occluded) return panner

  const wall = context.createBiquadFilter()
  wall.type = 'lowpass'
  wall.frequency.value = THROUGH_A_WALL.cutoff
  wall.Q.value = 0.5
  const muted = context.createGain()
  muted.gain.value = THROUGH_A_WALL.level
  wall.connect(muted)
  muted.connect(panner)
  return wall
}

/**
 * What a voice should connect to instead of the mixer's own filter.
 *
 * Outside an emission this is a plain tap into the room and the mixer, which is
 * what the theme and the held loops want. Inside one it is the whole chain —
 * wall, panner, room — built once and shared by every oscillator of the cast.
 */
export function emissionTarget(g: Sink): AudioNode {
  const held = emission?.targets.get(g.muffle)
  if (held) return held
  const built = buildTarget(g, emission?.place ?? null)
  emission?.targets.set(g.muffle, built)
  return built
}
