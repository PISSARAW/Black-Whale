import { distanceToBoundary } from '$lib/tour/geometry'
import type { Space, Vec2 } from '$lib/tour/types'

import { setListener } from '../space'
import { nearWall } from './rooms'

/**
 * Where the visitor is standing, told to the ear rather than to the eye.
 *
 * The walk already reported this to the audio layer, but only as a number: how
 * far the nearest wall is, so the early reflection could move. Everything else
 * a listener has — where they are on the deck, which way they are facing, which
 * room they are in — stopped at the renderer, and the whole of `space.ts`
 * needs it. So the one call the walk already made carries all four now, and the
 * near wall is worked out here instead of at the call site.
 *
 * Called on the same quarter-metre threshold the minimap is redrawn on, not
 * every frame: a panner moved sixty times a second costs more than the ear can
 * hear, and a quarter of a metre is well under what it can place.
 */
export function listenFrom(
  at: Vec2,
  heading: number,
  standing: Pick<Space, 'id' | 'footprint'> | null,
): void {
  setListener({ at, heading, spaceId: standing?.id ?? null })
  if (standing) nearWall(distanceToBoundary(at, standing.footprint))
}
