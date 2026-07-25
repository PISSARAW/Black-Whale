import type {
  NarrativeEvent,
  Body,
  Consciousness,
  Location,
  AbilityActivation,
  Presence,
  Fact,
  Character,
} from '@black-whale/domain'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface TimelinePoint {
  chapterId?: string
  eventId?: string
  sequence?: number
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
}

// ──────────────────────────────────────────────
// Stub implementation
// ──────────────────────────────────────────────

import type { PrismaClient } from '@black-whale/database'

type OrderedEvent = {
  id: string
  chapterId: string
  sequence: number
  chapter: { number: number }
}

function compareEventOrder(left: OrderedEvent, right: OrderedEvent) {
  return left.chapter.number - right.chapter.number || left.sequence - right.sequence
}

export class TimelineEngine implements ITimelineEngine {
  constructor(private readonly prisma: PrismaClient) {}

  async getWorldState(point: TimelinePoint): Promise<WorldSnapshot> {
    const targetEvent = await this.resolveEvent(point)
    if (!targetEvent) {
      throw new Error('Unable to resolve timeline point')
    }

    // Récupérer les événements actifs (statuts et présences)
    const allCharacters = await this.prisma.character.findMany({
      include: { firstVisibleEvent: { include: { chapter: true } } }
    })
    const characters = allCharacters.filter((character: any) =>
      compareEventOrder(character.firstVisibleEvent as OrderedEvent, targetEvent) <= 0
    )
    const allBodies = await this.prisma.body.findMany({
      include: { firstVisibleEvent: { include: { chapter: true } } }
    })
    const bodies = allBodies.filter((body: any) =>
      compareEventOrder(body.firstVisibleEvent as OrderedEvent, targetEvent) <= 0
    )
    const allConsciousnesses = await this.prisma.consciousness.findMany({
      include: { firstVisibleEvent: { include: { chapter: true } } }
    })
    const consciousnesses = allConsciousnesses.filter((consciousness: any) =>
      compareEventOrder(consciousness.firstVisibleEvent as OrderedEvent, targetEvent) <= 0
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
      const started = compareEventOrder(presence.fromEvent as OrderedEvent, targetEvent) <= 0
      const notEnded = !presence.untilEvent || compareEventOrder(targetEvent, presence.untilEvent as OrderedEvent) < 0
      return started && notEnded
    })

    const states = await this.prisma.bodyState.findMany({
      include: {
        fromEvent: { include: { chapter: true } },
        untilEvent: { include: { chapter: true } }
      }
    })

    const activeStates = states.filter((state) => {
      const started = compareEventOrder(state.fromEvent as OrderedEvent, targetEvent) <= 0
      const notEnded = !state.untilEvent || compareEventOrder(targetEvent, state.untilEvent as OrderedEvent) < 0
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
      knownFacts: []
    }
  }

  async getEventsBefore(point: TimelinePoint): Promise<any[]> {
    const targetEvent = await this.resolveEvent(point)
    if (!targetEvent) return []

    const events = await this.prisma.narrativeEvent.findMany({
      include: { chapter: true }
    })

    return events
      .filter((event) => compareEventOrder(event as OrderedEvent, targetEvent) <= 0)
      .sort((left, right) => compareEventOrder(left as OrderedEvent, right as OrderedEvent))
  }

  async getNearestSnapshot(point: TimelinePoint): Promise<WorldSnapshot | null> {
    return null // Pas de snapshot implémenté en V1
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
