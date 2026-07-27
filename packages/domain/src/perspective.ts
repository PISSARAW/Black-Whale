import type { Belief, Fact } from './knowledge.js'

export interface PerspectiveRequest {
  observerCharacterId: string
  eventId: string
  spoilerLimit: number
}

export interface KnownPosition {
  locationId?: string
  knowledgeType: 'CURRENT_CONFIRMED' | 'CURRENT_BELIEVED' | 'LAST_KNOWN' | 'UNKNOWN'
  knownAtEventId?: string
  confidence?: number
}

export interface PerspectiveDifference {
  subjectId: string
  subjectType: string
  dimension:
    | 'EXISTENCE'
    | 'IDENTITY'
    | 'POSITION'
    | 'BIOLOGICAL_STATE'
    | 'ABILITY'
    | 'AFFILIATION'
    | 'EVENT'
    | 'BELIEF'
  leftValue: unknown
  rightValue: unknown
  differenceType: 'LEFT_ONLY' | 'RIGHT_ONLY' | 'CONTRADICTION' | 'CONFIDENCE_GAP' | 'SAME'
}

export interface PerspectiveObserver {
  characterId: string
  consciousnessId: string
  currentBodyId: string
  currentBodyOwnerCharacterId?: string
  apparentCharacterId?: string
  isDissonant?: boolean
}

/**
 * A fact as this observer holds it. `truthStatus` becomes CONTESTED when the
 * observer believes something the world contradicts, so the value carried here
 * is theirs, not the canonical one.
 */
export type SubjectiveFact = Fact & { truthStatus: Fact['truthStatus'] | 'CONTESTED' }

export interface PerspectiveState {
  observer: PerspectiveObserver
  /** Body ids the observer can currently see. */
  visibleBodies: string[]
  /** Character ids the observer knows to exist. */
  knownCharacters: string[]
  /** Location ids the observer knows about. */
  knownLocations: string[]
  /** Event ids the observer has witnessed or been told about. */
  knownEvents: string[]
  knownFacts: SubjectiveFact[]
  beliefs: Belief[]
  /** Ids of things the observer knows they do not know. */
  unknownElements: string[]
  currentBodyId?: string
  currentConsciousnessId?: string
}
