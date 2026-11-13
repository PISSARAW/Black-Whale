import type { TourAuraObject, TourAuraTrace } from './types'

interface TraceUse {
  id: string
  chapter: number
  status: string
  auraTrace?: { locationId: string; anchor?: string; persistsUntilChapter?: number }
}

export function auraTracesThrough(uses: readonly TraceUse[], chapter: number): TourAuraTrace[] {
  return uses.flatMap((use) => {
    const trace = use.auraTrace
    if (
      !trace ||
      use.chapter > chapter ||
      (trace.persistsUntilChapter !== undefined && trace.persistsUntilChapter < chapter) ||
      (use.status !== 'ACTIVATED' && use.status !== 'MAINTAINED')
    )
      return []
    return [{ id: use.id, ...trace }]
  })
}

export interface AuraObjectRecord {
  id: string
  canonicalName: string
  aura?: {
    fromChapter: number
    kind: string
    visibility: 'awakened' | 'gyo'
    sourceChapterId: string
  }
  sightings: Array<{
    fromChapter: number
    locationSlug: string
    precision: string
    tourAnchor?: string
  }>
}

export function auraObjectsThrough(
  objects: readonly AuraObjectRecord[],
  chapter: number,
): TourAuraObject[] {
  return objects.flatMap((object) => {
    if (!object.aura || object.aura.fromChapter > chapter) return []
    const sighting = object.sightings
      .filter(
        (candidate) =>
          candidate.fromChapter <= chapter &&
          (candidate.precision === 'EXACT_ROOM' || candidate.precision === 'ZONE'),
      )
      .at(-1)
    if (!sighting) return []
    return [
      {
        id: object.id,
        name: object.canonicalName,
        locationId: sighting.locationSlug,
        visibility: object.aura.visibility,
        kind: object.aura.kind,
        anchor: sighting.tourAnchor,
        approximate: !sighting.tourAnchor,
      },
    ]
  })
}
