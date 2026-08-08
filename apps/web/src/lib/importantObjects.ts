import type { Location, PresenceCertainty, PresencePrecision } from '@black-whale/domain'

export interface ImportantObjectSighting {
  fromChapter: number
  untilChapter?: number
  locationSlug: string | null
  precision: PresencePrecision
  certainty: PresenceCertainty
  note: string
}

export interface ImportantObject {
  id: string
  canonicalName: string
  aliases?: string[]
  category: string
  firstVisibleChapter: number
  description: string
  sightings: ImportantObjectSighting[]
}

export interface TrackedObjectSnapshot {
  id: string
  canonicalName: string
  category: string
  description: string
  sighting: ImportantObjectSighting | null
  location: Location | null
}

type LocationRow = Omit<Location, 'parentLocationId' | 'mapElementId'> & {
  parentLocationId?: string | null
  mapElementId?: string | null
}

/** The latest sighting which is still valid at the selected chapter. */
export function sightingAt(
  object: ImportantObject,
  chapter: number,
): ImportantObjectSighting | null {
  return (
    [...object.sightings]
      .filter(
        (sighting) =>
          sighting.fromChapter <= chapter &&
          (sighting.untilChapter === undefined || chapter < sighting.untilChapter),
      )
      .sort((left, right) => right.fromChapter - left.fromChapter)[0] ?? null
  )
}

export function objectSnapshotsAt(
  objects: ImportantObject[],
  options: {
    chapter: number
    locations: readonly LocationRow[]
    spoilerLimit?: number
  },
): TrackedObjectSnapshot[] {
  const { chapter, locations, spoilerLimit } = options
  const visibleThrough = Math.min(chapter, spoilerLimit ?? Number.POSITIVE_INFINITY)

  return objects
    .filter((object) => object.firstVisibleChapter <= visibleThrough)
    .map((object) => {
      const sighting = sightingAt(object, visibleThrough)
      const found = sighting?.locationSlug
        ? (locations.find((location) => location.slug === sighting.locationSlug) ?? null)
        : null
      const location: Location | null = found
        ? {
            ...found,
            parentLocationId: found.parentLocationId ?? undefined,
            mapElementId: found.mapElementId ?? undefined,
          }
        : null

      return {
        id: object.id,
        canonicalName: object.canonicalName,
        category: object.category,
        description: object.description,
        sighting,
        location,
      }
    })
}
