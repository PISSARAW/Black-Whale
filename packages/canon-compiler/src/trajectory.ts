import type { TrajectoryLeg } from '@black-whale/contracts'
import type { Certainty } from './characters.js'

/**
 * Turning a declared route into presence bounds.
 *
 * A presence is half-open: it stops reporting at its closing event. So a leg
 * that hands over to the next one closes *at* the successor's start, while a
 * leg that names its own last chapter closes at the event *after* it — the
 * catalogue's `untilChapterId` means "still there through this", and a victim
 * is present in the chapter that kills them.
 */

/** Where a leg stops, and whether the named event is the first one excluded. */
export interface LegEnd {
  chapterId: string
  /** True when the bound is the event *after* `chapterId`, not that event. */
  exclusive: boolean
}

export interface PlannedLeg {
  /** Position in the declared array. Ids are built from it, so it never shifts. */
  index: number
  location: string
  from: string
  until: LegEnd | null
  certainty: Certainty
}

/**
 * The bounds of every leg, derived rather than restated.
 *
 * A declared `untilChapterId` wins over the handoff, and that is the fix this
 * port carries: the previous compiler only looked at it on a final leg, so a
 * declared end in the middle of a route was silently stretched to the next
 * leg's start. Momoze dies in her room at 368 and is carried to the burial
 * chamber at 371 — the catalogue says the room empties at 368, and the map
 * used to keep her lying in it for three chapters.
 */
export function planTrajectory(legs: readonly TrajectoryLeg[]): PlannedLeg[] {
  return legs.map((leg, index) => {
    const next = legs[index + 1]
    const until: LegEnd | null = leg.untilChapterId
      ? { chapterId: leg.untilChapterId, exclusive: true }
      : next
        ? { chapterId: next.fromChapterId, exclusive: false }
        : null
    return {
      index,
      location: leg.location,
      from: leg.fromChapterId,
      until,
      certainty: leg.certainty ?? 'CONFIRMED',
    }
  })
}

/** A leg once its chapter references have been resolved to real events. */
export interface ResolvedLeg {
  index: number
  locationId: string
  fromEventId: string
  untilEventId: string | null
  certainty: Certainty
}

/**
 * Drop the legs the event log cannot separate.
 *
 * The catalogue sometimes records finer movement than `events.json` carries:
 * Hisoka crosses the Tier 3 block into the cineplex inside chapter 392, and
 * neither leg pins an event. Both resolve to the same one, so the first has
 * zero width — it can never be active, and writing it leaves a row that no
 * query returns and every count includes.
 *
 * The last leg of such a group wins, because that is the position the chapter
 * leaves the body in. Nothing is guessed: pinning `ch-392.2` on the later leg
 * makes them distinct and both survive.
 */
export function dropZeroWidthLegs(legs: readonly ResolvedLeg[]): ResolvedLeg[] {
  return legs.filter((leg, index) => {
    const next = legs[index + 1]
    return !next || next.fromEventId !== leg.fromEventId
  })
}
