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
  biologicalStates: Record<string, string>
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

import type { PrismaClient, NarrativeEvent as PrismaEvent } from '@black-whale/database'

export class TimelineEngine implements ITimelineEngine {
  constructor(private readonly prisma: PrismaClient) {}

  async getWorldState(point: TimelinePoint): Promise<WorldSnapshot> {
    const sequence = await this.resolveSequence(point)
    if (sequence === undefined) {
      throw new Error('Unable to resolve timeline point')
    }

    // Récupérer les événements actifs (statuts et présences)
    const characters = await this.prisma.character.findMany()
    
    // We only need the presence that is active at this sequence
    const activePresences = await this.prisma.presence.findMany({
      where: {
        fromEvent: {
          sequence: { lte: sequence }
        },
        OR: [
          { untilEventId: null },
          {
            untilEvent: {
              sequence: { gt: sequence }
            }
          }
        ]
      },
      include: {
        fromEvent: true,
        untilEvent: true
      }
    })

    const activeStates = await this.prisma.biologicalState.findMany({
      where: {
        fromEvent: {
          sequence: { lte: sequence }
        },
        OR: [
          { untilEventId: null },
          {
            untilEvent: {
              sequence: { gt: sequence }
            }
          }
        ]
      }
    })

    // Map Prisma models to WorldSnapshot (casting as any for now to align with Domain types)
    return {
      atEventId: point.eventId || 'unknown',
      characters: characters as any,
      bodies: [],
      consciousnesses: [],
      locations: [],
      activeAbilities: [],
      biologicalStates: activeStates.reduce((acc, state) => {
        acc[state.characterId] = state.state
        return acc
      }, {} as Record<string, string>),
      presences: activePresences as any,
      knownFacts: []
    }
  }

  async getEventsBefore(point: TimelinePoint): Promise<any[]> {
    const sequence = await this.resolveSequence(point)
    if (sequence === undefined) return []

    return this.prisma.narrativeEvent.findMany({
      where: {
        sequence: { lte: sequence }
      },
      orderBy: { sequence: 'asc' }
    })
  }

  async getNearestSnapshot(point: TimelinePoint): Promise<WorldSnapshot | null> {
    return null // Pas de snapshot implémenté en V1
  }

  private async resolveSequence(point: TimelinePoint): Promise<number | undefined> {
    if (point.sequence !== undefined) return point.sequence
    
    if (point.eventId) {
      const event = await this.prisma.narrativeEvent.findUnique({
        where: { id: point.eventId },
        select: { sequence: true }
      })
      return event?.sequence
    }

    if (point.chapterId) {
      // Find the last event of the chapter
      const event = await this.prisma.narrativeEvent.findFirst({
        where: { chapterId: point.chapterId },
        orderBy: { sequence: 'desc' },
        select: { sequence: true }
      })
      return event?.sequence
    }
    
    return undefined
  }
}
