import type {
  AppearanceState,
  Body,
  BodyOccupancy,
  Character,
  Consciousness,
  Location,
  Presence,
} from '@black-whale/domain'
import type { PerspectiveState } from '@black-whale/domain'

import type { FollowMode, MarkerIdentityState } from '$lib/components/perspective/types'
import type { BeyondLineageStatus } from '$lib/beyondLineage'
import type { Locale } from '$lib/i18n/config'

/**
 * Turning a world-state presence into a map marker.
 *
 * This lived inside `MapOverlay.svelte` as one 190-line `.map()` callback over
 * `any`, which is what made it the most complex function in the repository. The
 * engines already type everything it reads — `getWorldState()` returns a
 * `WorldSnapshot`, `buildPerspective()` a `PerspectiveState` — so the `any` was
 * erasing checks rather than standing in for missing ones.
 */

/** A character as the ship loader hands it over: the domain row plus roster tags. */
export type MapCharacter = Character & {
  factionTags?: string[]
  beyondLineage?: BeyondLineageStatus
  hatsuNames?: string[]
  hatsuIds?: string[]
}

/** A presence row with the two event relations the temporal badge reads. */
export type MapPresence = Presence & {
  fromEvent?: { sequence?: number | null; chapterId?: string | null } | null
  untilEvent?: { sequence?: number | null } | null
}

/** Only the event fields the projection consults. */
export type MapEvent = { id: string; chapterId?: string | null; title?: string | null }

export interface MapWorldState {
  characters: MapCharacter[]
  bodies: Body[]
  consciousnesses: Consciousness[]
  presences: MapPresence[]
  occupancies: BodyOccupancy[]
  appearances: AppearanceState[]
  locations: Location[]
  bodyStates?: Record<string, string>
}

export interface MapNextChapterState extends MapWorldState {
  chapterNumber?: number
}

export type MapMarker = MarkerIdentityState & {
  tierId: string | null
  locationId?: string
  /** Catalogue slug of the body's owner, which is what `localSpotAnchors` keys on. */
  characterSlug?: string
  location?: Location | null
  /** Selected narrative event, used when a chapter depicts an exact position inside a room. */
  currentEventTitle?: string | null
  overviewX: number
  overviewY: number
}

export interface ProjectionContext {
  world: MapWorldState
  perspective: PerspectiveState | null
  nextChapterState: MapNextChapterState | null
  followMode: FollowMode
  perspectiveIsReader: boolean
  currentEvent: MapEvent | null
  currentSequence: number
  /** Names come out of a partly French catalogue; the locale decides whether they are anglicised. */
  locale?: Locale
}

export type ZoomLevel = 'OVERVIEW' | 'TIER' | 'LOCAL'
