/**
 * Turning a world-state presence into a map marker.
 *
 * This lived inside `MapOverlay.svelte` as one 190-line `.map()` callback over
 * `any`, which is what made it the most complex function in the repository. The
 * engines already type everything it reads — `getWorldState()` returns a
 * `WorldSnapshot`, `buildPerspective()` a `PerspectiveState` — so the `any` was
 * erasing checks rather than standing in for missing ones.
 *
 * It then grew to fourteen hundred lines, most of them the tables that say
 * where in a drawn room each passenger stands. ADR-002 moves those into
 * `projection/`, one file per question: which deck draws a room, where in it a
 * marker goes, what the archive is worth, who the viewer is allowed to see, and
 * how a crowd fans out at each zoom. This file stays the door everything else
 * comes in by — every import in the app still names it, and nothing that reads
 * it needs to know which of the nine modules answers.
 */

export type {
  MapCharacter,
  MapEvent,
  MapMarker,
  MapNextChapterState,
  MapPresence,
  MapWorldState,
  ProjectionContext,
  ZoomLevel,
} from './projection/types'

export { anchorFor, belongsToLocation, resolveTierSlug } from './projection/tierAnchors'
export {
  tierLabelFor,
  tierOverviewBand,
  tierOverviewSpan,
  tierOverviewY,
} from './projection/overview'
export { calculatePresencePosition } from './projection/position'
export { getTemporalVisual } from './projection/certainty'
export { projectFutureMarker, projectPresenceMarker } from './projection/markers'
export { packMarkersForZoom } from './projection/packing'
