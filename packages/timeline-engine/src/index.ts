import type {
  NarrativeEvent,
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
  getEventsBefore(point: TimelinePoint): Promise<NarrativeEvent[]>

  /** Return the nearest persisted snapshot at or before the given point. */
  getNearestSnapshot(point: TimelinePoint): Promise<WorldSnapshot | null>

  /** Adapt legacy interval tables into the deterministic world-kernel state. */
  getKernelState(point: TimelinePoint): Promise<WorldState>
}

// ──────────────────────────────────────────────
// Stub implementation
// ──────────────────────────────────────────────

import type { PrismaClient } from '@black-whale/database'

import { compareEventOrder, isRevealed, type OrderedEvent as Orderable } from '@black-whale/domain'

// Re-exported so callers that already reach for the timeline engine do not need
// to know these live in the domain package.
export { compareEventOrder, isRevealed }

/** A narrative event row as loaded here: orderable, and carrying its keys. */
type OrderedEvent = Orderable & { id: string; chapterId: string }

export class TimelineEngine implements ITimelineEngine {
  constructor(private readonly prisma: PrismaClient) {}

  async getWorldState(point: TimelinePoint): Promise<WorldSnapshot> {
    const targetEvent = await this.resolveEvent(point)
    if (!targetEvent) {
      throw new Error('Unable to resolve timeline point')
    }
    const revealedThroughChapter = point.revealedThroughChapter ?? targetEvent.chapter.number

    // Récupérer les événements actifs (statuts et présences)
    const allCharacters = await this.prisma.character.findMany({
      include: { firstVisibleEvent: { include: { chapter: true } } }
    })
    const characters = allCharacters.filter((character: any) =>
      isRevealed(character.firstVisibleEvent as OrderedEvent, revealedThroughChapter)
      && compareEventOrder(character.firstVisibleEvent as OrderedEvent, targetEvent) <= 0
    )
    const allBodies = await this.prisma.body.findMany({
      include: { firstVisibleEvent: { include: { chapter: true } } }
    })
    const bodies = allBodies.filter((body: any) =>
      isRevealed(body.firstVisibleEvent as OrderedEvent, revealedThroughChapter)
      && compareEventOrder(body.firstVisibleEvent as OrderedEvent, targetEvent) <= 0
    )
    const allConsciousnesses = await this.prisma.consciousness.findMany({
      include: { firstVisibleEvent: { include: { chapter: true } } }
    })
    const consciousnesses = allConsciousnesses.filter((consciousness: any) =>
      isRevealed(consciousness.firstVisibleEvent as OrderedEvent, revealedThroughChapter)
      && compareEventOrder(consciousness.firstVisibleEvent as OrderedEvent, targetEvent) <= 0
    )
    
    const presences = await this.prisma.presence.findMany({
      where: {
        entityType: 'BODY'
      },
      include: {
        fromEvent: { include: { chapter: true } },
        untilEvent: { include: { chapter: true } }
      }
    })

    const activePresences = presences.filter((presence) => {
      const started = isRevealed(presence.fromEvent as OrderedEvent, revealedThroughChapter)
        && compareEventOrder(presence.fromEvent as OrderedEvent, targetEvent) <= 0
      const endIsKnown = presence.untilEvent
        && isRevealed(presence.untilEvent as OrderedEvent, revealedThroughChapter)
      const notEnded = !endIsKnown || compareEventOrder(targetEvent, presence.untilEvent as OrderedEvent) < 0
      return started && notEnded
    })

    const states = await this.prisma.bodyState.findMany({
      include: {
        fromEvent: { include: { chapter: true } },
        untilEvent: { include: { chapter: true } }
      }
    })

    const activeStates = states.filter((state) => {
      const started = isRevealed(state.fromEvent as OrderedEvent, revealedThroughChapter)
        && compareEventOrder(state.fromEvent as OrderedEvent, targetEvent) <= 0
      const endIsKnown = state.untilEvent
        && isRevealed(state.untilEvent as OrderedEvent, revealedThroughChapter)
      const notEnded = !endIsKnown || compareEventOrder(targetEvent, state.untilEvent as OrderedEvent) < 0
      return started && notEnded
    })

    const occupancies = await this.prisma.bodyOccupancy.findMany({
      include: {
        fromEvent: { include: { chapter: true } },
        untilEvent: { include: { chapter: true } }
      }
    })
    const activeOccupancies = occupancies.filter((occupancy) => {
      const started = isRevealed(occupancy.fromEvent as OrderedEvent, revealedThroughChapter)
        && compareEventOrder(occupancy.fromEvent as OrderedEvent, targetEvent) <= 0
      const endIsKnown = occupancy.untilEvent
        && isRevealed(occupancy.untilEvent as OrderedEvent, revealedThroughChapter)
      const notEnded = !endIsKnown || compareEventOrder(targetEvent, occupancy.untilEvent as OrderedEvent) < 0
      return started && notEnded
    })

    const appearances = await this.prisma.appearanceState.findMany({
      include: {
        fromEvent: { include: { chapter: true } },
        untilEvent: { include: { chapter: true } }
      }
    })
    const activeAppearances = appearances.filter((appearance) => {
      const started = isRevealed(appearance.fromEvent as OrderedEvent, revealedThroughChapter)
        && compareEventOrder(appearance.fromEvent as OrderedEvent, targetEvent) <= 0
      const endIsKnown = appearance.untilEvent
        && isRevealed(appearance.untilEvent as OrderedEvent, revealedThroughChapter)
      const notEnded = !endIsKnown || compareEventOrder(targetEvent, appearance.untilEvent as OrderedEvent) < 0
      return started && notEnded
    })

    // Map Prisma models to WorldSnapshot (casting as any for now to align with Domain types)
    return {
      atEventId: targetEvent.id,
      characters: characters as any,
      bodies: bodies as any,
      consciousnesses: consciousnesses as any,
      locations: [],
      activeAbilities: [],
      bodyStates: activeStates.reduce((acc: Record<string, string>, state: any) => {
        // En V2, l'état est lié au bodyId
        acc[state.bodyId] = state.state
        return acc
      }, {}),
      presences: activePresences as any,
      occupancies: activeOccupancies as any,
      appearances: activeAppearances as any,
      knownFacts: []
    }
  }

  async getEventsBefore(point: TimelinePoint): Promise<any[]> {
    const targetEvent = await this.resolveEvent(point)
    if (!targetEvent) return []
    const revealedThroughChapter = point.revealedThroughChapter ?? targetEvent.chapter.number

    const events = await this.prisma.narrativeEvent.findMany({
      include: { chapter: true }
    })

    return events
      .filter((event) => isRevealed(event as OrderedEvent, revealedThroughChapter)
        && compareEventOrder(event as OrderedEvent, targetEvent) <= 0)
      .sort((left, right) => compareEventOrder(left as OrderedEvent, right as OrderedEvent))
  }

  async getNearestSnapshot(_point: TimelinePoint): Promise<WorldSnapshot | null> {
    return null // Pas de snapshot implémenté en V1
  }

  async getKernelState(point: TimelinePoint): Promise<WorldState> {
    const targetEvent = await this.resolveEvent(point)
    if (!targetEvent) throw new Error('Unable to resolve timeline point')

    const [snapshot, orderedEvents, locations, occupancies, consciousnessStates] = await Promise.all([
      this.getWorldState({ ...point, eventId: targetEvent.id }),
      this.prisma.narrativeEvent.findMany({ include: { chapter: true } }),
      this.prisma.location.findMany({ include: { firstVisibleEvent: { include: { chapter: true } } } }),
      this.prisma.bodyOccupancy.findMany({
        include: {
          fromEvent: { include: { chapter: true } },
          untilEvent: { include: { chapter: true } },
        },
      }),
      this.prisma.consciousnessState.findMany({
        include: {
          fromEvent: { include: { chapter: true } },
          untilEvent: { include: { chapter: true } },
        },
      }),
    ])

    const cursors = buildCanonicalCursors(orderedEvents as any[])
    const cursor = cursors.find((candidate) => candidate.eventId === targetEvent.id) ?? {
      branchId: 'canon',
      ordinal: 0,
      eventId: targetEvent.id,
      chapterNumber: targetEvent.chapter.number,
      localSequence: targetEvent.sequence,
    } satisfies StoryCursor
    const state = createEmptyWorld(cursor)
    const revealedThroughChapter = point.revealedThroughChapter ?? targetEvent.chapter.number

    const activeConsciousnessState = new Map<string, string>()
    for (const consciousnessState of consciousnessStates as any[]) {
      const active = isRevealed(consciousnessState.fromEvent, revealedThroughChapter)
        && compareEventOrder(consciousnessState.fromEvent, targetEvent) <= 0
        && (!consciousnessState.untilEvent
          || !isRevealed(consciousnessState.untilEvent, revealedThroughChapter)
          || compareEventOrder(targetEvent, consciousnessState.untilEvent) < 0)
      if (active) activeConsciousnessState.set(consciousnessState.consciousnessId, consciousnessState.state)
    }

    const register = (entity: { id: string; label: string; kind: WorldEntityKind; originalCharacterId?: string; metadata?: Record<string, unknown> }) => {
      state.entities[entity.id] = entity
    }
    for (const character of snapshot.characters) {
      const consciousness = snapshot.consciousnesses.find((candidate) => candidate.originCharacterId === character.id)
      const originalBody = snapshot.bodies.find((candidate) => candidate.originalCharacterId === character.id)
      const biologicalState = originalBody ? snapshot.bodyStates[originalBody.id] : undefined
      const legacyMentalState = biologicalState === 'UNCONSCIOUS'
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
            ? activeConsciousnessState.get(consciousness.id) ?? legacyMentalState
            : legacyMentalState,
        },
      })
    }
    for (const body of snapshot.bodies) {
      register({ id: body.id, label: body.label, kind: 'BODY', originalCharacterId: body.originalCharacterId })
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
    for (const location of locations.filter((candidate: any) =>
      isRevealed(candidate.firstVisibleEvent, revealedThroughChapter)
      && compareEventOrder(candidate.firstVisibleEvent, targetEvent) <= 0
    )) {
      register({ id: location.id, label: location.name, kind: 'LOCATION' })
    }

    for (const [bodyId, bodyState] of Object.entries(snapshot.bodyStates)) state.bodyStates[bodyId] = bodyState
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

    for (const occupancy of occupancies as any[]) {
      const active = isRevealed(occupancy.fromEvent, revealedThroughChapter)
        && compareEventOrder(occupancy.fromEvent, targetEvent) <= 0
        && (!occupancy.untilEvent
          || !isRevealed(occupancy.untilEvent, revealedThroughChapter)
          || compareEventOrder(targetEvent, occupancy.untilEvent) < 0)
      if (active) state.consciousnessByBody[occupancy.bodyId] = occupancy.consciousnessId ?? null
    }

    return state
  }

  private async resolveEvent(point: TimelinePoint): Promise<OrderedEvent | null> {
    if (point.eventId) {
      return this.prisma.narrativeEvent.findUnique({
        where: { id: point.eventId },
        include: { chapter: true }
      })
    }

    if (point.chapterId) {
      return this.prisma.narrativeEvent.findFirst({
        where: { chapterId: point.chapterId },
        orderBy: { sequence: 'desc' },
        include: { chapter: true }
      })
    }

    // Backward-compatible fallback for legacy callers. A sequence alone is
    // ambiguous, so select the latest chapter containing that local sequence.
    if (point.sequence !== undefined) {
      return this.prisma.narrativeEvent.findFirst({
        where: { sequence: point.sequence },
        orderBy: { chapter: { number: 'desc' } },
        include: { chapter: true }
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

  const cursorByEvent = new Map(buildCanonicalCursors(events).map((cursor) => [cursor.eventId, cursor]))
  return events.map((event) => ({ ...event, cursor: cursorByEvent.get(event.id) }))
}
