import type { PrismaClient } from '@prisma/client'
import type { Location } from '@black-whale/contracts'
import { locationCandidates, locationType, type ShipPosition } from '../rooms.js'

/**
 * `data/locations/locations.json` projected into Location rows, and the index
 * a position is resolved against afterwards.
 */

export interface LocationRow {
  id: string
  slug: string
  type: string
}

/** What the compiler writes for a passenger it cannot place at all. */
export const UNKNOWN_LOCATION_SLUG = 'black-whale-unknown'

export class LocationIndex {
  constructor(private readonly bySlug: ReadonlyMap<string, LocationRow>) {}

  get size(): number {
    return this.bySlug.size
  }

  get(slug: string): LocationRow | null {
    return this.bySlug.get(slug) ?? null
  }

  get unknown(): LocationRow | null {
    return this.get(UNKNOWN_LOCATION_SLUG)
  }

  /** The first candidate this position names that the database actually holds. */
  resolve(position: ShipPosition | null | undefined): LocationRow | null {
    for (const slug of locationCandidates(position)) {
      const row = this.get(slug)
      if (row) return row
    }
    return null
  }
}

/**
 * Write the catalogue's locations, parents before children.
 *
 * The hierarchy is declared by id rather than ordered in the file, so this
 * walks the pending list until a pass places nothing new — which, for a cycle
 * or a missing parent, is the point at which it says so instead of looping.
 */
async function writeHierarchy(
  prisma: PrismaClient,
  catalogue: readonly Location[],
  firstVisibleEventId: string,
): Promise<Map<string, LocationRow>> {
  const synced = new Map<string, LocationRow>()
  const pending = [...catalogue]

  while (pending.length) {
    let progressed = false
    for (let index = pending.length - 1; index >= 0; index -= 1) {
      const location = pending[index]!
      const parent = location.parentLocationId ? synced.get(location.parentLocationId) : null
      if (location.parentLocationId && !parent) continue

      const shape = {
        name: location.name,
        parentLocationId: parent?.id ?? null,
        type: locationType(location.zoneType),
      }
      const record = await prisma.location.upsert({
        where: { slug: location.id },
        update: shape,
        create: {
          ...shape,
          slug: location.id,
          mapElementId: `${location.id}-svg`,
          firstVisibleEventId,
        },
      })
      synced.set(location.id, { id: record.id, slug: record.slug, type: record.type })
      pending.splice(index, 1)
      progressed = true
    }
    if (!progressed) {
      throw new Error(
        `Hiérarchie de lieux non résolue : ${pending.map((item) => item.id).join(', ')}`,
      )
    }
  }
  return synced
}

/**
 * Earlier passes seeded rooms under slugs the catalogue later renamed, so the
 * database accumulated pairs describing one place — `tier-5-central-cafeteria`
 * beside `tier-5-central-dining-hall`. Whichever slug the map happened to query
 * looked empty.
 *
 * The catalogue is the source of truth: a location it no longer declares is a
 * leftover and goes, but only once nothing points at it. Anything still
 * carrying presences, cohorts, events or children is left in place and
 * reported, because that is a rename to reconcile by hand, not a stray row.
 */
async function pruneOutsideCatalogue(
  prisma: PrismaClient,
  keptSlugs: readonly string[],
  report: (message: string) => void,
): Promise<void> {
  const blocked = new Map<string, number>()
  let progressed = true

  // A stray can parent another stray, and Prisma refuses to delete a row that
  // still has children. Each pass frees one level of nesting.
  while (progressed) {
    progressed = false
    const strays = await prisma.location.findMany({
      where: { slug: { notIn: [...keptSlugs] } },
      include: { _count: { select: { presences: true, cohorts: true, childLocations: true } } },
    })

    for (const stray of strays) {
      const events = await prisma.narrativeEvent.count({ where: { locationId: stray.id } })
      const dependents =
        stray._count.presences + stray._count.cohorts + stray._count.childLocations + events
      if (dependents > 0) {
        blocked.set(stray.slug, dependents)
        continue
      }
      await prisma.location.delete({ where: { id: stray.id } })
      blocked.delete(stray.slug)
      report(`Lieu hors catalogue supprimé : ${stray.slug}`)
      progressed = true
    }
  }

  for (const [slug, dependents] of blocked) {
    report(
      `Lieu hors catalogue conservé (${dependents} référence(s)) : ${slug}. ` +
        'Ajoutez-le à data/locations/locations.json ou déplacez ses références.',
    )
  }
}

export interface SyncLocations {
  prisma: PrismaClient
  catalogue: readonly Location[]
  /** The event new locations become visible at — boarding, in practice. */
  firstVisibleEventId: string
  report: (message: string) => void
}

export async function syncLocations({
  prisma,
  catalogue,
  firstVisibleEventId,
  report,
}: SyncLocations): Promise<LocationIndex> {
  const synced = await writeHierarchy(prisma, catalogue, firstVisibleEventId)

  // Not a catalogue entry: it is where the compiler puts a body whose position
  // canon stops reporting, and it hangs under the ship so the map can still
  // draw it aboard.
  const ship = synced.get('black-whale-1') ?? synced.get('black-whale') ?? null
  const shape = {
    name: 'Position inconnue à bord',
    parentLocationId: ship?.id ?? null,
    type: 'UNKNOWN' as const,
    mapElementId: null,
  }
  const unknown = await prisma.location.upsert({
    where: { slug: UNKNOWN_LOCATION_SLUG },
    update: shape,
    create: { ...shape, slug: UNKNOWN_LOCATION_SLUG, firstVisibleEventId },
  })
  synced.set(UNKNOWN_LOCATION_SLUG, { id: unknown.id, slug: unknown.slug, type: unknown.type })

  await pruneOutsideCatalogue(prisma, [...synced.keys()], report)
  return new LocationIndex(synced)
}
