import type {
  Body,
  Consciousness,
  Location,
  AbilityActivation,
  Presence,
  Fact,
  Character,
  BodyOccupancy,
  AppearanceState,
} from '@black-whale/domain'
import {
  buildCanonicalCursors,
  createEmptyWorld,
  type StoryCursor,
  type WorldEntityKind,
  type WorldState,
} from '@black-whale/world-engine'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface TimelinePoint {
  chapterId?: string
  eventId?: string
  sequence?: number
  /** Maximum source chapter whose revelations may affect the reconstructed past. */
  revealedThroughChapter?: number
}

export interface WorldSnapshot {
  atEventId: string
  characters: Character[]
  bodies: Body[]
  consciousnesses: Consciousness[]
  locations: Location[]
  activeAbilities: AbilityActivation[]
  bodyStates: Record<string, string>
  presences: Presence[]
  occupancies: BodyOccupancy[]
  appearances: AppearanceState[]
  knownFacts: Fact[]
}

// ──────────────────────────────────────────────
// Interface
// ──────────────────────────────────────────────

export interface ITimelineEngine {
  /**
   * Reconstruct the full world state at a given point in time.
   * Loads the nearest snapshot then replays subsequent events.
   */
  getWorldState(point: TimelinePoint): Promise<WorldSnapshot>

  /** Return all events in chronological order up to a given point. */
  getEventsBefore(point: TimelinePoint): Promise<CanonicalEventRow[]>

  /** Return the nearest persisted snapshot at or before the given point. */
  getNearestSnapshot(point: TimelinePoint): Promise<WorldSnapshot | null>

  /** Adapt legacy interval tables into the deterministic world-kernel state. */
  getKernelState(point: TimelinePoint): Promise<WorldState>
}

// ──────────────────────────────────────────────
// Stub implementation
// ──────────────────────────────────────────────

import type { PrismaClient } from '@black-whale/database'

import {
  compareEventOrder,
  isActiveAt,
  isRevealed,
  type OrderedEvent as Orderable,
  type TemporalRecord,
} from '@black-whale/domain'

// Re-exported so callers that already reach for the timeline engine do not need
// to know these live in the domain package.
export { compareEventOrder, isRevealed }

/** A narrative event row as loaded here: orderable, and carrying its keys. */
export type CanonicalEventRow = Orderable & { id: string; chapterId: string }

/** A temporal row scoped to one body, as the reducers below read it. */
type BodyStateRow = TemporalRecord & { bodyId: string; state: string }
type OccupancyRow = TemporalRecord & { bodyId: string; consciousnessId?: string | null }
type ConsciousnessStateRow = TemporalRecord & { consciousnessId: string; state: string }
type VisibleRow = { id: string; name: string; firstVisibleEvent: Orderable }

export class TimelineEngine implements ITimelineEngine {
  constructor(private readonly prisma: PrismaClient) {}

  async getWorldState(point: TimelinePoint): Promise<WorldSnapshot> {
    const targetEvent = await this.resolveEvent(point)
    if (!targetEvent) {
      throw new Error('Unable to resolve timeline point')
    }
    const revealedThroughChapter = point.revealedThroughChapter ?? targetEvent.chapter.number

    // Récupérer les événements actifs (statuts et présences)
    // Push the chapter bound into SQL. It is the first conjunct of both
    // predicates below, so the rows it removes could never have survived the
    // in-memory pass — which still runs, because the ordinal comparison has no
    // SQL equivalent. Without it every one of these tables was read whole on
    // every request.
    const revealedBound = { chapter: { number: { lte: revealedThroughChapter } } }
    const visibleWhere = { firstVisibleEvent: revealedBound }
    const temporalWhere = { fromEvent: revealedBound }
    const temporalInclude = {
      fromEvent: { include: { chapter: true } },
      untilEvent: { include: { chapter: true } },
    }

    // The reveal check is repeated here on purpose: the SQL bound is an
    // optimisation, not the guarantee. Dropping it would make correctness
    // depend on the query, and a caller reading these rows another way would
    // silently leak.
    const startedBefore = (record: { firstVisibleEvent: unknown }) =>
      isRevealed(record.firstVisibleEvent as CanonicalEventRow, revealedThroughChapter) &&
      compareEventOrder(record.firstVisibleEvent as CanonicalEventRow, targetEvent) <= 0
    const active = (record: unknown) =>
      isActiveAt(record as TemporalRecord, targetEvent, revealedThroughChapter)

    const [
      allCharacters,
      allBodies,
      allConsciousnesses,
      presences,
      states,
      occupancies,
      appearances,
    ] = await Promise.all([
      this.prisma.character.findMany({
        where: visibleWhere,
        include: { firstVisibleEvent: { include: { chapter: true } } },
      }),
      this.prisma.body.findMany({
        where: visibleWhere,
        include: { firstVisibleEvent: { include: { chapter: true } } },
      }),
      this.prisma.consciousness.findMany({
        where: visibleWhere,
        include: { firstVisibleEvent: { include: { chapter: true } } },
      }),
      this.prisma.presence.findMany({
        where: { entityType: 'BODY', ...temporalWhere },
        include: temporalInclude,
      }),
      this.prisma.bodyState.findMany({ where: temporalWhere, include: temporalInclude }),
      this.prisma.bodyOccupancy.findMany({ where: temporalWhere, include: temporalInclude }),
      this.prisma.appearanceState.findMany({ where: temporalWhere, include: temporalInclude }),
    ])

    const characters = allCharacters.filter(startedBefore)
    const bodies = allBodies.filter(startedBefore)
    const consciousnesses = allConsciousnesses.filter(startedBefore)
    const activePresences = presences.filter(active)
    const activeStates = states.filter(active)
    const activeOccupancies = occupancies.filter(active)
    const activeAppearances = appearances.filter(active)

    // Prisma rows carry their joins and their own column names, so they are not
    // domain objects. `as unknown as` keeps the mismatch explicit while still
    // handing callers a checked type — `as any` used to erase it for everyone
    // downstream.
    return {
      atEventId: targetEvent.id,
      characters: characters as unknown as WorldSnapshot['characters'],
      bodies: bodies as unknown as WorldSnapshot['bodies'],
      consciousnesses: consciousnesses as unknown as WorldSnapshot['consciousnesses'],
      locations: [],
      activeAbilities: [],
      bodyStates: (activeStates as unknown as BodyStateRow[]).reduce<Record<string, string>>(
        (acc, state) => {
          // The state is attached to the body, not to the character.
          acc[state.bodyId] = state.state
          return acc
        },
        {},
      ),
      presences: activePresences as unknown as WorldSnapshot['presences'],
      occupancies: activeOccupancies as unknown as WorldSnapshot['occupancies'],
      appearances: activeAppearances as unknown as WorldSnapshot['appearances'],
      knownFacts: [],
    }
  }

  async getEventsBefore(point: TimelinePoint): Promise<CanonicalEventRow[]> {
    const targetEvent = await this.resolveEvent(point)
    if (!targetEvent) return []
    const revealedThroughChapter = point.revealedThroughChapter ?? targetEvent.chapter.number

    const events = await this.prisma.narrativeEvent.findMany({
      where: { chapter: { number: { lte: revealedThroughChapter } } },
      include: { chapter: true },
    })

    return events
      .filter(
        (event) =>
          isRevealed(event as CanonicalEventRow, revealedThroughChapter) &&
          compareEventOrder(event as CanonicalEventRow, targetEvent) <= 0,
      )
      .sort((left, right) =>
        compareEventOrder(left as CanonicalEventRow, right as CanonicalEventRow),
      )
  }

  async getNearestSnapshot(_point: TimelinePoint): Promise<WorldSnapshot | null> {
    return null // Pas de snapshot implémenté en V1
  }

  async getKernelState(point: TimelinePoint): Promise<WorldState> {
    const targetEvent = await this.resolveEvent(point)
    if (!targetEvent) throw new Error('Unable to resolve timeline point')

    const kernelRevealedThrough = point.revealedThroughChapter ?? targetEvent.chapter.number

    const [snapshot, orderedEvents, locations, occupancies, consciousnessStates] =
      await Promise.all([
        this.getWorldState({ ...point, eventId: targetEvent.id }),
        this.prisma.narrativeEvent.findMany({
          where: { chapter: { number: { lte: kernelRevealedThrough } } },
          include: { chapter: true },
        }),
        this.prisma.location.findMany({
          where: { firstVisibleEvent: { chapter: { number: { lte: kernelRevealedThrough } } } },
          include: { firstVisibleEvent: { include: { chapter: true } } },
        }),
        this.prisma.bodyOccupancy.findMany({
          where: { fromEvent: { chapter: { number: { lte: kernelRevealedThrough } } } },
          include: {
            fromEvent: { include: { chapter: true } },
            untilEvent: { include: { chapter: true } },
          },
        }),
        this.prisma.consciousnessState.findMany({
          where: { fromEvent: { chapter: { number: { lte: kernelRevealedThrough } } } },
          include: {
            fromEvent: { include: { chapter: true } },
            untilEvent: { include: { chapter: true } },
          },
        }),
      ])

    const cursors = buildCanonicalCursors(orderedEvents as unknown as CanonicalEventRow[])
    const cursor =
      cursors.find((candidate) => candidate.eventId === targetEvent.id) ??
      ({
        branchId: 'canon',
        ordinal: 0,
        eventId: targetEvent.id,
        chapterNumber: targetEvent.chapter.number,
        localSequence: targetEvent.sequence,
      } satisfies StoryCursor)
    const state = createEmptyWorld(cursor)
    const revealedThroughChapter = kernelRevealedThrough

    const activeConsciousnessState = new Map<string, string>()
    for (const consciousnessState of consciousnessStates as unknown as ConsciousnessStateRow[]) {
      if (isActiveAt(consciousnessState, targetEvent, revealedThroughChapter))
        activeConsciousnessState.set(consciousnessState.consciousnessId, consciousnessState.state)
    }

    const register = (entity: {
      id: string
      label: string
      kind: WorldEntityKind
      originalCharacterId?: string
      metadata?: Record<string, unknown>
    }) => {
      state.entities[entity.id] = entity
    }
    for (const character of snapshot.characters) {
      const consciousness = snapshot.consciousnesses.find(
        (candidate) => candidate.originCharacterId === character.id,
      )
      const originalBody = snapshot.bodies.find(
        (candidate) => candidate.originalCharacterId === character.id,
      )
      const biologicalState = originalBody ? snapshot.bodyStates[originalBody.id] : undefined
      const legacyMentalState =
        biologicalState === 'UNCONSCIOUS'
          ? 'UNCONSCIOUS'
          : biologicalState === 'DEAD' || biologicalState === 'DESTROYED'
            ? 'DESTROYED'
            : 'ACTIVE'
      register({
        id: character.id,
        label: character.canonicalName,
        kind: 'CHARACTER',
        originalCharacterId: character.id,
        metadata: {
          mentalState: consciousness
            ? (activeConsciousnessState.get(consciousness.id) ?? legacyMentalState)
            : legacyMentalState,
        },
      })
    }
    for (const body of snapshot.bodies) {
      register({
        id: body.id,
        label: body.label,
        kind: 'BODY',
        originalCharacterId: body.originalCharacterId,
      })
    }
    for (const consciousness of snapshot.consciousnesses) {
      register({
        id: consciousness.id,
        label: consciousness.label,
        kind: 'CONSCIOUSNESS',
        originalCharacterId: consciousness.originCharacterId,
        metadata: { mentalState: activeConsciousnessState.get(consciousness.id) ?? 'ACTIVE' },
      })
    }
    for (const location of (locations as unknown as VisibleRow[]).filter(
      (candidate) =>
        isRevealed(candidate.firstVisibleEvent, revealedThroughChapter) &&
        compareEventOrder(candidate.firstVisibleEvent, targetEvent) <= 0,
    )) {
      register({ id: location.id, label: location.name, kind: 'LOCATION' })
    }

    for (const [bodyId, bodyState] of Object.entries(snapshot.bodyStates))
      state.bodyStates[bodyId] = bodyState
    for (const presence of snapshot.presences) {
      const kind = presence.entityType as WorldEntityKind
      if (!state.entities[presence.entityId]) {
        register({ id: presence.entityId, label: presence.entityId, kind })
      }
      state.presences[presence.entityId] = {
        entity: { id: presence.entityId, kind },
        locationId: presence.locationId,
        precision: presence.precision,
        certainty: presence.certainty,
        observedAtEventId: presence.fromEventId,
      }
    }

    for (const occupancy of occupancies as unknown as OccupancyRow[]) {
      if (isActiveAt(occupancy, targetEvent, revealedThroughChapter))
        state.consciousnessByBody[occupancy.bodyId] = occupancy.consciousnessId ?? null
    }

    return state
  }

  private async resolveEvent(point: TimelinePoint): Promise<CanonicalEventRow | null> {
    if (point.eventId) {
      return this.prisma.narrativeEvent.findUnique({
        where: { id: point.eventId },
        include: { chapter: true },
      })
    }

    if (point.chapterId) {
      return this.prisma.narrativeEvent.findFirst({
        where: { chapterId: point.chapterId },
        orderBy: { sequence: 'desc' },
        include: { chapter: true },
      })
    }

    // Backward-compatible fallback for legacy callers. A sequence alone is
    // ambiguous, so select the latest chapter containing that local sequence.
    if (point.sequence !== undefined) {
      return this.prisma.narrativeEvent.findFirst({
        where: { sequence: point.sequence },
        orderBy: { chapter: { number: 'desc' } },
        include: { chapter: true },
      })
    }

    return null
  }
}

/**
 * List the canonical Black Whale events in reading order, each annotated with
 * its chronological cursor. `spoilerLimit` caps the chapters a reader may see.
 */
export async function listCanonicalEvents(prisma: PrismaClient, spoilerLimit?: number) {
  const events = await prisma.narrativeEvent.findMany({
    where: {
      occursOnBlackWhale: true,
      ...(Number.isFinite(spoilerLimit) ? { chapter: { number: { lte: spoilerLimit } } } : {}),
    },
    include: { chapter: true },
    orderBy: [{ chapter: { number: 'asc' } }, { sequence: 'asc' }],
  })

  const cursorByEvent = new Map(
    buildCanonicalCursors(events).map((cursor) => [cursor.eventId, cursor]),
  )
  return events.map((event) => ({ ...event, cursor: cursorByEvent.get(event.id) }))
}

// ──────────────────────────────────────────────
// Pure derivations
// ──────────────────────────────────────────────
//
// Reconstructing a snapshot needs the database; reading one does not. These
// modules hold the logic that used to sit inline in SvelteKit `load`s, where
// it could only be exercised by booting a route with a seeded database.

export * from './selection.js'
export * from './snapshot.js'
export * from './affiliations.js'
