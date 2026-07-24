// ──────────────────────────────────────────────
// Characters & Identity
// ──────────────────────────────────────────────

export type BiologicalState = 'ALIVE' | 'INJURED' | 'UNCONSCIOUS' | 'DEAD' | 'DESTROYED' | 'PRESERVED' | 'UNKNOWN'
export type MentalState = 'ACTIVE' | 'UNCONSCIOUS' | 'TRANSFERRED' | 'SUPPRESSED' | 'DORMANT' | 'DISCONNECTED' | 'DESTROYED' | 'UNKNOWN'
export type CanonStatus = 'canon' | 'non_canon' | 'theory' | 'simulation'
export type NenCategory = 'enhancer' | 'emitter' | 'transmuter' | 'conjurer' | 'manipulator' | 'specialist' | 'unknown'

export interface Character {
  id: string
  slug: string
  canonicalName: string
  description?: string
  firstVisibleChapter: number
  portraitAssetId?: string
}

export type BodyType = 'ORIGINAL' | 'CLONE' | 'COPY' | 'CONSTRUCT' | 'UNKNOWN'

export interface Body {
  id: string
  originalCharacterId?: string
  label: string
  bodyType: BodyType
  firstVisibleChapter: number
}

export type ConsciousnessType = 'ORIGINAL' | 'COPIED' | 'ARTIFICIAL' | 'NEN_ENTITY' | 'UNKNOWN'

export interface Consciousness {
  id: string
  originCharacterId?: string
  label: string
  consciousnessType: ConsciousnessType
  firstVisibleChapter: number
}

export type OccupancyType = 'ORIGINAL' | 'TRANSFERRED' | 'POSSESSED' | 'CONTROLLED' | 'EMPTY' | 'UNKNOWN'
export type CertaintyLevel = 'CONFIRMED' | 'PROBABLE' | 'UNKNOWN'

export interface BodyOccupancy {
  id: string
  bodyId: string
  consciousnessId?: string
  fromEventId: string
  untilEventId?: string
  occupancyType: OccupancyType
  certainty: CertaintyLevel
  sourceIds?: string[]
}

export interface BodyState {
  id: string
  bodyId: string
  state: BiologicalState
  fromEventId: string
  untilEventId?: string
}

export interface ConsciousnessState {
  id: string
  consciousnessId: string
  state: MentalState
  fromEventId: string
  untilEventId?: string
}

export type AppearanceCause = 'NATURAL' | 'TRANSFORMATION' | 'DISGUISE' | 'NEN_ABILITY' | 'UNKNOWN'

export interface AppearanceState {
  id: string
  entityId: string
  entityType: 'BODY' | 'NEN_ENTITY'
  appearanceCharacterId?: string
  appearanceAssetId?: string
  fromEventId: string
  untilEventId?: string
  cause: AppearanceCause
}

export interface PerceivedIdentity {
  observerId: string
  bodyId: string
  believedCharacterId?: string
  fromEventId: string
  untilEventId?: string
  confidence: 'CERTAIN' | 'LIKELY' | 'SUSPECTED' | 'UNKNOWN'
}

// ──────────────────────────────────────────────
// Temporality
// ──────────────────────────────────────────────

export interface Chapter {
  id: string
  number: number
  title?: string
}

export type EventRelationType = 'precedes' | 'causes' | 'concurrent' | 'reveals'

export interface NarrativeEvent {
  id: string
  chapterId: string
  sequence: number
  title: string
  summary: string
  locationId?: string
  firstVisibleChapter: number
}

// ──────────────────────────────────────────────
// Location
// ──────────────────────────────────────────────

export type ZoneType = 'quarters' | 'corridor' | 'medical' | 'military' | 'utility' | 'external' | 'unknown'
export type LocationType = 'SHIP' | 'TIER' | 'ZONE' | 'ROOM' | 'CORRIDOR' | 'UNKNOWN'

export interface Location {
  id: string
  slug: string
  name: string
  parentLocationId?: string
  type: LocationType
  mapElementId?: string
  firstVisibleChapter: number
}

export type SpatialEntityType = 'BODY' | 'NEN_BEAST' | 'CLONE' | 'OBJECT' | 'AURA_ENTITY'
export type PresencePrecision = 'EXACT_ROOM' | 'ZONE' | 'TIER' | 'UNKNOWN'
export type PresenceCertainty = 'CONFIRMED' | 'PROBABLE' | 'LAST_KNOWN'

export interface Presence {
  id: string
  entityType: SpatialEntityType
  entityId: string
  locationId?: string
  fromEventId: string
  untilEventId?: string
  precision: PresencePrecision
  certainty: PresenceCertainty
  sourceIds?: string[]
}

// ──────────────────────────────────────────────
// Knowledge & Facts
// ──────────────────────────────────────────────

export type FactSubjectType = 'CHARACTER' | 'BODY' | 'CONSCIOUSNESS' | 'LOCATION' | 'EVENT' | 'ABILITY' | 'AFFILIATION'
export type TruthStatus = 'CONFIRMED' | 'STRONGLY_IMPLIED' | 'DEDUCTION' | 'CONTESTED'

export interface Fact {
  id: string
  subjectType: FactSubjectType
  subjectId: string
  predicate: string
  value: unknown
  validFromEventId: string
  validUntilEventId?: string
  truthStatus: TruthStatus
  firstVisibleChapter: number
  sourceIds?: string[]
}

export type EpistemicState = 'KNOWN' | 'BELIEVED' | 'SUSPECTED' | 'DOUBTED' | 'REJECTED' | 'UNKNOWN'
export type AcquisitionMethod = 'DIRECT_OBSERVATION' | 'TOLD_BY_OTHER' | 'DEDUCTION' | 'NEN_ABILITY' | 'DOCUMENT' | 'RUMOR' | 'UNKNOWN'

export interface KnowledgeState {
  id: string
  observerCharacterId: string
  factId: string
  fromEventId: string
  untilEventId?: string
  epistemicState: EpistemicState
  confidence?: number
  acquisitionMethod: AcquisitionMethod
  sourceCharacterId?: string
  acquisitionEventId: string
}

export interface Belief {
  id: string
  observerCharacterId: string
  subjectType: string
  subjectId: string
  predicate: string
  believedValue: unknown
  fromEventId: string
  untilEventId?: string
  confidence: number
  sourceEventId: string
}

export type TransmissionType = 'DIRECT_SPEECH' | 'PHONE' | 'MESSAGE' | 'REPORT' | 'BROADCAST' | 'NEN_LINK'
export type Reliability = 'TRUSTED' | 'UNVERIFIED' | 'DECEPTIVE' | 'UNKNOWN'

export interface InformationTransferEvent {
  id: string
  senderId: string
  receiverIds: string[]
  factIds: string[]
  transmissionType: TransmissionType
  reliability: Reliability
}

// ──────────────────────────────────────────────
// Perspective
// ──────────────────────────────────────────────

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

// Defines a generic difference model for the Compare feature
export interface PerspectiveDifference {
  subjectId: string
  subjectType: string
  dimension: 'EXISTENCE' | 'IDENTITY' | 'POSITION' | 'BIOLOGICAL_STATE' | 'ABILITY' | 'AFFILIATION' | 'EVENT' | 'BELIEF'
  leftValue: unknown
  rightValue: unknown
  differenceType: 'LEFT_ONLY' | 'RIGHT_ONLY' | 'CONTRADICTION' | 'CONFIDENCE_GAP' | 'SAME'
}

export interface PerspectiveObserver {
  characterId: string
  consciousnessId: string
  currentBodyId: string
}

export interface PerspectiveState {
  observer: PerspectiveObserver
  visibleBodies: any[]
  knownCharacters: any[]
  knownLocations: any[]
  knownEvents: any[]
  knownFacts: any[]
  beliefs: any[]
  unknownElements: any[]
  currentBodyId?: string
  currentConsciousnessId?: string
}

// ──────────────────────────────────────────────
// Sources
// ──────────────────────────────────────────────

export type SourceType = 'manga' | 'anime' | 'databook' | 'interview' | 'community'

export interface Source {
  id: string
  type: SourceType
  chapter?: number
  page?: number
  panel?: string
  description: string
}
