// ──────────────────────────────────────────────
// Characters & Identity
// ──────────────────────────────────────────────

export type BiologicalState = 'alive' | 'dead' | 'unknown' | 'revived' | 'possessed'
export type MentalState = 'normal' | 'unconscious' | 'controlled' | 'split' | 'unknown'
export type CertaintyLevel = 'confirmed' | 'strongly_implied' | 'deduction' | 'theory' | 'simulation' | 'contradicted'
export type CanonStatus = 'canon' | 'non_canon' | 'theory' | 'simulation'
export type NenCategory = 'enhancer' | 'emitter' | 'transmuter' | 'conjurer' | 'manipulator' | 'specialist' | 'unknown'

export interface Character {
  id: string
  canonicalName: string
  aliases: string[]
  description: string
  factionId?: string
  firstAppearanceChapterId?: string
  canonStatus: CanonStatus
}

export interface Body {
  id: string
  originalCharacterId: string
  biologicalState: BiologicalState
  currentLocationId?: string
}

export interface Consciousness {
  id: string
  originalCharacterId: string
  currentBodyId: string
  mentalState: MentalState
}

export interface AuraIdentity {
  id: string
  ownerId: string
  currentHolderId: string
  nenCategory: NenCategory
}

/** Full resolved identity for a character at a point in time */
export interface CharacterIdentity {
  characterId: string
  body: Body
  consciousness: Consciousness
  aura: AuraIdentity
  /** Who witnesses believe this person to be */
  perceivedAs: string
}

// ──────────────────────────────────────────────
// Temporality
// ──────────────────────────────────────────────

export interface Chapter {
  id: string
  number: number
  publicationOrder: number
  title?: string
}

export type EventRelationType = 'precedes' | 'causes' | 'concurrent' | 'reveals'

export interface NarrativeEvent {
  id: string
  chapterId: string
  sequence: number
  /** Narrative in-story timestamp, if known */
  narrativeTimestamp?: string
  title: string
  description?: string
  canonStatus: CanonStatus
}

export interface EventRelation {
  eventId: string
  precedingEventId: string
  relationType: EventRelationType
}

// ──────────────────────────────────────────────
// Location
// ──────────────────────────────────────────────

export type ZoneType = 'quarters' | 'corridor' | 'medical' | 'military' | 'utility' | 'external' | 'unknown'

export interface Location {
  id: string
  name: string
  parentLocationId?: string
  deck?: number
  room?: string
  zoneType: ZoneType
  /** SVG geometry identifier */
  geometryId?: string
  capacity?: number
  entrances: string[]
  exits: string[]
  accessRules: string[]
}

export type EntityType = 'body' | 'consciousness' | 'nen_creature' | 'guardian_beast' | 'clone' | 'object'

export interface Presence {
  entityType: EntityType
  entityId: string
  locationId: string
  fromEventId: string
  untilEventId?: string
  certainty: CertaintyLevel
}

// ──────────────────────────────────────────────
// Nen
// ──────────────────────────────────────────────

export type AbilityRuleType = 'activation' | 'cost' | 'target' | 'effect' | 'termination' | 'restriction'
export type AbilityState = 'inactive' | 'active' | 'post_mortem' | 'broken' | 'transferred'

export interface NenAbility {
  id: string
  ownerId: string
  name: string
  category: NenCategory
  description: string
  canonStatus: CanonStatus
  /** Key linking to an ability-module implementation */
  moduleKey?: string
}

export interface AbilityRule {
  id: string
  abilityId: string
  ruleType: AbilityRuleType
  expression: string
  priority: number
}

export interface AbilityActivation {
  id: string
  abilityId: string
  actorId: string
  startedAtEventId: string
  endedAtEventId?: string
  state: AbilityState
}

export interface NenEffect {
  id: string
  activationId: string
  targetId: string
  effectType: string
  payload: Record<string, unknown>
  startedAtEventId: string
  endedAtEventId?: string
}

// ──────────────────────────────────────────────
// Canonical Nen Interaction Types
// ──────────────────────────────────────────────

export type CanonStatusDetailed = 'CONFIRMED' | 'PARTIAL' | 'UNKNOWN'

export interface CanonRule {
  type: 'activation' | 'target' | 'maintenance' | 'termination' | 'restriction'
  description: string
  expression?: string
  isCritical: boolean
}

export interface InteractionInput {
  name: string
  type: 'boolean' | 'number' | 'string' | 'entity_id' | 'duration' | 'selection'
  description: string
  required: boolean
  constraints?: Record<string, unknown>
}

export interface CanonEffect {
  type: 'immediate' | 'persistent' | 'conditional'
  description: string
  targetType: 'self' | 'target' | 'environment' | 'group'
  duration?: string
  magnitude?: string | number
  conditions?: string[]
}

export interface CanonCost {
  type: 'aura' | 'lifespan' | 'stamina' | 'nen_restriction' | 'post_mortem' | 'resource'
  description: string
  amount?: string | number
  duration?: string
}

export interface PerspectiveModifier {
  type: 'visual' | 'auditory' | 'memory' | 'perception' | 'identity'
  description: string
  affects: 'user' | 'target' | 'observers' | 'all'
  effect: string
}

export interface BodyModifier {
  type: 'transformation' | 'control' | 'restriction' | 'enhancement'
  description: string
  target: 'self' | 'other' | 'object'
  effect: string
}

export interface ConsciousnessModifier {
  type: 'transfer' | 'split' | 'control' | 'memory' | 'perception'
  description: string
  source: string
  target: string
  effect: string
}

export interface TimelineModifier {
  type: 'vision' | 'rewind' | 'fast_forward' | 'branch'
  description: string
  duration: string
  effect: string
}

export interface CanonicalNenInteraction {
  abilityId: string
  name: string
  ownerId: string
  canonStatus: CanonStatusDetailed
  category?: NenCategory
  
  activationConditions: CanonRule[]
  validTargets: CanonRule[]
  requiredInputs: InteractionInput[]
  
  immediateEffects: CanonEffect[]
  persistentEffects: CanonEffect[]
  costs: CanonCost[]
  terminationConditions: CanonRule[]
  
  perspectiveChanges?: PerspectiveModifier[]
  bodyChanges?: BodyModifier[]
  consciousnessChanges?: ConsciousnessModifier[]
  timelineChanges?: TimelineModifier[]
  
  unknownProperties: string[]
  forbiddenInferences: string[]
  
  chapterSources: number[]
  notes?: string
}

// ──────────────────────────────────────────────
// Knowledge & Facts
// ──────────────────────────────────────────────

export type BeliefStatus = 'known' | 'suspected' | 'believed' | 'rejected' | 'unknown'

export interface Fact {
  id: string
  subjectId: string
  predicate: string
  value: unknown
  validFromEventId: string
  validUntilEventId?: string
  certainty: CertaintyLevel
  sourceIds: string[]
}

export interface FactKnowledge {
  factId: string
  observerId: string
  knownFromEventId: string
  knownUntilEventId?: string
  belief: BeliefStatus
  /** 0–1 */
  confidence: number
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

export interface Claim {
  id: string
  statement: string
  status: CertaintyLevel
  sourceId: string
}

// ──────────────────────────────────────────────
// Simulation
// ──────────────────────────────────────────────

export type SimulationMode = 'strict-canon' | 'rule-compatible' | 'sandbox'

export interface SimulationEvent {
  id: string
  branchId: string
  sequence: number
  type: string
  payload: Record<string, unknown>
  appliedRules: string[]
}

export interface SimulationBranch {
  id: string
  parentEventId: string
  ownerId?: string
  mode: SimulationMode
  events: SimulationEvent[]
}
