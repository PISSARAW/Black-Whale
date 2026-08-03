import type { PrismaClient } from '@prisma/client'
import type { Character, Location } from '@black-whale/contracts'
import { chapterNumber } from '../chapters.js'
import { deathChapter, isDeadStatus } from '../characters.js'
import { EventIndex, type EventRef } from './events.js'
import { syncLocations, type LocationIndex } from './locations.js'
import { mergeDuplicateCharacters, pruneGeneratedPassengerOrphans } from './duplicates.js'
import {
  ensureIdentity,
  loadCharacterRecords,
  rebaseIdentityHistory,
  reconcileMortality,
  seedIdentityHistory,
  upsertCharacter,
  type CharacterRecord,
} from './identity.js'
import {
  NO_CHANGES,
  reconcileSinglePosition,
  syncTrajectory,
  type PositionBounds,
  type PresenceTally,
} from './presences.js'

/**
 * `data/` projected onto the map.
 *
 * `migrate deploy` only moves the schema. Everything the archive shows —
 * locations, characters, presences — lives in `data/*.json` and reaches the
 * database solely through this pass, so a deploy that stopped at the schema
 * shipped new code onto an old catalogue.
 */

/** The chapter the ship sails; anything undated boards here. */
const BOARDING_CHAPTER = 358

export interface CompileMapReport {
  locationsSynced: number
  duplicatesMerged: number
  generatedPassengerOrphansPruned: number
  charactersCreated: number
  presencesCreated: number
  presencesUpdated: number
  presencesEnded: number
  trajectoriesSynced: number
  mortalitiesReconciled: number
  positionsAlreadyCovered: number
  positionsWithoutLocation: number
}

export interface CompileMap {
  prisma: PrismaClient
  catalogue: { characters: readonly Character[]; locations: readonly Location[] }
  report?: (message: string) => void
}

/** Index of every character row by slug and by canonical name. */
class RecordIndex {
  private readonly bySlug = new Map<string, CharacterRecord>()
  private readonly byName = new Map<string, CharacterRecord[]>()

  constructor(records: readonly CharacterRecord[]) {
    for (const record of records) this.remember(record)
  }

  remember(record: CharacterRecord): void {
    this.bySlug.set(record.slug, record)
    const group = this.byName.get(record.canonicalName) ?? []
    if (!group.some((entry) => entry.id === record.id)) group.push(record)
    this.byName.set(record.canonicalName, group)
  }

  has(slug: string): boolean {
    return this.bySlug.has(slug)
  }

  /**
   * Whoever already holds the body for this name.
   *
   * Two rows can share a canonical name while only one owns the body; the
   * position belongs on that one, or a rename strands a passenger on a fresh
   * empty identity while the old one keeps every presence ever written.
   */
  bodyOwnerFor(record: CharacterRecord): CharacterRecord {
    if (record.originalBody) return record
    const group = this.byName.get(record.canonicalName) ?? []
    return group.find((candidate) => candidate.originalBody) ?? record
  }
}

/** Where the catalogue opens and closes this entry's single position. */
async function positionBounds({
  entry,
  events,
  anchors,
}: {
  entry: Character
  events: EventIndex
  anchors: { boarding: EventRef; bodyFirst: EventRef; death: EventRef | null }
}): Promise<PositionBounds> {
  const startChapter = chapterNumber(entry.mapPresenceFromChapterId)
  const start = startChapter === null ? null : await events.ensure(startChapter)

  // `mapPresenceUntilChapterId` may pin the exact event, which is finer than
  // the chapter a death status can name.
  const pinned = await events.resolve(entry.mapPresenceUntilChapterId)
  const lastPresent = pinned ?? anchors.death

  return {
    start: start && startChapter !== null ? { event: start, chapter: startChapter } : null,
    // Anyone the catalogue does not date boards with the ship; anyone dated
    // later starts when they first appear.
    fallbackStart:
      anchors.bodyFirst.chapter.number > BOARDING_CHAPTER ? anchors.bodyFirst : anchors.boarding,
    lastPresentChapter: lastPresent?.chapter.number ?? null,
    until: await events.after(lastPresent),
    leaves: anchors.death !== null || isDeadStatus(entry.shipLocation?.status),
  }
}

function accumulate(into: CompileMapReport, tally: PresenceTally): void {
  into.presencesCreated += tally.created
  into.presencesUpdated += tally.updated
  into.presencesEnded += tally.ended
}

export async function compileMap({
  prisma,
  catalogue,
  report = () => {},
}: CompileMap): Promise<CompileMapReport> {
  const events = new EventIndex(prisma)
  const boarding = await events.ensure(BOARDING_CHAPTER, { title: 'Eve' })
  const locations = await syncLocations({
    prisma,
    catalogue: catalogue.locations,
    firstVisibleEventId: boarding.id,
    report,
  })

  const characters = catalogue.characters
  const duplicatesMerged = await mergeDuplicateCharacters({ prisma, catalogue: characters, report })
  const orphansPruned = await pruneGeneratedPassengerOrphans(prisma, characters)
  const records = new RecordIndex(await loadCharacterRecords(prisma))

  const summary: CompileMapReport = {
    locationsSynced: locations.size,
    duplicatesMerged,
    generatedPassengerOrphansPruned: orphansPruned,
    charactersCreated: 0,
    presencesCreated: 0,
    presencesUpdated: 0,
    presencesEnded: 0,
    trajectoriesSynced: 0,
    mortalitiesReconciled: 0,
    positionsAlreadyCovered: 0,
    positionsWithoutLocation: 0,
  }

  for (const entry of characters) {
    const tally = await compileCharacter({ prisma, entry, world: { events, locations, records } })
    if (!tally) {
      summary.positionsWithoutLocation += 1
      continue
    }
    summary.charactersCreated += tally.charactersCreated
    summary.trajectoriesSynced += tally.trajectoriesSynced
    summary.mortalitiesReconciled += tally.mortalitiesReconciled
    summary.positionsAlreadyCovered += tally.positionsAlreadyCovered
    accumulate(summary, tally.presences)
  }

  // A catalogue entry may have been created during this run for a legacy seed
  // record — Vincent is the historical example — so merge once more.
  summary.duplicatesMerged += await mergeDuplicateCharacters({
    prisma,
    catalogue: characters,
    report,
  })
  return summary
}

interface CharacterTally {
  charactersCreated: number
  trajectoriesSynced: number
  mortalitiesReconciled: number
  positionsAlreadyCovered: number
  presences: PresenceTally
}

interface CompileCharacter {
  prisma: PrismaClient
  entry: Character
  world: { events: EventIndex; locations: LocationIndex; records: RecordIndex }
}

/** Null when the catalogue names a place the database does not hold. */
async function compileCharacter({
  prisma,
  entry,
  world,
}: CompileCharacter): Promise<CharacterTally | null> {
  const location = world.locations.resolve(entry.shipLocation)
  if (!location) return null

  const { events, locations, records } = world
  const requested = chapterNumber(entry.firstAppearanceChapterId)
  const firstEvent =
    requested === null ? await events.ensure(BOARDING_CHAPTER) : await events.ensure(requested)

  const created = !records.has(entry.id)
  const record = await upsertCharacter({ prisma, entry, firstEvent })
  records.remember(record)

  const identity = await ensureIdentity({
    prisma,
    owner: records.bodyOwnerFor(record),
    fallbackEvent: firstEvent,
  })
  await seedIdentityHistory({ prisma, identity, entry })
  if (entry.replaceMapPresenceHistory) {
    await rebaseIdentityHistory({ prisma, identity, event: firstEvent })
  }

  const tally: CharacterTally = {
    charactersCreated: created ? 1 : 0,
    trajectoriesSynced: 0,
    mortalitiesReconciled: 0,
    positionsAlreadyCovered: 0,
    presences: NO_CHANGES,
  }
  const hasTrajectory = (entry.mapTrajectory?.length ?? 0) > 0

  // `temporalIdentityManaged` means the identity pass owns this body's history
  // — which consciousness rides it, when it dies, where the corpse goes — and
  // that the single position inferred from `shipLocation` must not compete with
  // it. A `mapTrajectory` is not an inference though: it is an explicitly
  // authored route, and skipping it left the princes in their apartments
  // through scenes that happen elsewhere.
  if (entry.temporalIdentityManaged) {
    tally.positionsAlreadyCovered = 1
    if (!hasTrajectory) return tally
    tally.presences = await syncTrajectory({
      prisma,
      entry,
      world: { events, locations, bodyId: identity.bodyId },
    })
    tally.trajectoriesSynced = 1
    return tally
  }

  const chapterOfDeath = deathChapter(entry)
  const death = chapterOfDeath === null ? null : await events.ensure(chapterOfDeath)
  if (death) {
    const pinned = await events.resolve(entry.mapPresenceUntilChapterId)
    const diedAt = pinned?.chapter.number === chapterOfDeath ? pinned : death
    tally.mortalitiesReconciled = await reconcileMortality({
      prisma,
      bodyId: identity.bodyId,
      bounds: { first: identity.firstEvent, death: diedAt },
    })
  }

  if (hasTrajectory) {
    tally.presences = await syncTrajectory({
      prisma,
      entry,
      world: { events, locations, bodyId: identity.bodyId },
    })
    tally.trajectoriesSynced = 1
    return tally
  }

  const bounds = await positionBounds({
    entry,
    events,
    anchors: {
      boarding: await events.ensure(BOARDING_CHAPTER),
      bodyFirst: identity.firstEvent,
      death,
    },
  })
  tally.presences = await reconcileSinglePosition({
    prisma,
    entry,
    world: { locations, bodyId: identity.bodyId, location, bounds },
  })
  tally.positionsAlreadyCovered = tally.presences.created === 0 ? 1 : 0
  return tally
}
