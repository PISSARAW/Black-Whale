import { distanceToBoundary } from '$lib/tour/geometry'
import type { Space, Vec2 } from '$lib/tour/types'

import { setFacing, setListener } from '../space'
import { orientEnvironment } from './environment'
import { currentGraph, setCurrentFacing } from './graph'
import { nearWall } from './rooms'

/**
 * Where the visitor is standing, and which way they are looking, told to the ear
 * rather than to the eye.
 *
 * The walk already reported this to the audio layer, but only as a number: how
 * far the nearest wall is, so the early reflection could move. Everything else
 * a listener has — where they are on the deck, which way they are facing, which
 * room they are in — stopped at the renderer, and the whole of `space.ts`
 * needs it. So the one call the walk already made carries all of it now, and the
 * near wall is worked out here instead of at the call site.
 *
 * It is two calls rather than one because the two halves cost differently.
 * Moving is rare and expensive: a new room, a new wall distance, a polygon
 * walked. Looking round is constant and nearly free, and it was the half the ear
 * was never told about — a visitor could turn a full circle on the spot and
 * every sound aboard stayed exactly where it was, which is the one thing a
 * binaural mix must never do.
 */

/** What the walk knows about the visitor when they have moved. */
export interface Standing {
  at: Vec2
  heading: number
  /** Radians, positive looking up. */
  pitch: number
  space: Pick<Space, 'id' | 'footprint'> | null
}

/**
 * Called on the same quarter-metre threshold the minimap is redrawn on, not
 * every frame: the wall distance is a walk of the room's footprint, and a
 * quarter of a metre is well under what the ear can place.
 */
export function listenFrom(where: Standing): void {
  const { at, heading, pitch, space } = where
  setListener({ at, heading, pitch, spaceId: space?.id ?? null })
  lookFrom(heading, pitch)
  if (space) nearWall(distanceToBoundary(at, space.footprint))
}

/**
 * Called whenever the visitor turns or tilts, which is most frames they are
 * doing anything at all.
 *
 * Six audio parameters and a pair of trigonometric functions. Nothing here
 * touches the geometry of the room, which is what makes it safe to call this
 * often — and it has to be called often, because the ear notices a source that
 * lags the picture long before the eye notices anything at all.
 */
export function lookFrom(heading: number, pitch: number): void {
  setFacing(heading, pitch)
  const facing = { heading, pitch }
  // Remembered above the graph, like the deck is: the walk can be silent when
  // the visitor turns and audible a second later, and the ship has to come back
  // pointing the way it was left. See `setCurrentFacing`.
  setCurrentFacing(facing)
  const walk = currentGraph()
  if (walk) orientEnvironment(walk.env, facing)
}
