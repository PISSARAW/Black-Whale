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

export class TimelineEngine implements ITimelineEngine {
  async getWorldState(point: TimelinePoint): Promise<WorldSnapshot> {
    throw new Error(`TimelineEngine.getWorldState not implemented — point: ${JSON.stringify(point)}`)
  }

  async getEventsBefore(point: TimelinePoint): Promise<NarrativeEvent[]> {
    throw new Error(`TimelineEngine.getEventsBefore not implemented — point: ${JSON.stringify(point)}`)
  }

  async getNearestSnapshot(point: TimelinePoint): Promise<WorldSnapshot | null> {
    throw new Error(`TimelineEngine.getNearestSnapshot not implemented — point: ${JSON.stringify(point)}`)
  }
}
