import type { StoryCursor } from './cursor.js'

export type WorldEntityKind =
  | 'CHARACTER'
  | 'BODY'
  | 'CONSCIOUSNESS'
  | 'OBJECT'
  | 'NEN_ENTITY'
  | 'AURA_ENTITY'
  | 'COHORT'
  | 'PORTAL'
  | 'CURSE'
  | 'CONSTRUCT'
  | 'LOCATION'

export interface EntityRef {
  id: string
  kind: WorldEntityKind
}

export interface WorldEntity extends EntityRef {
  label: string
  originalCharacterId?: string
  metadata?: Record<string, unknown>
}

export type PresencePrecision = 'EXACT_ROOM' | 'ZONE' | 'TIER' | 'UNKNOWN'
export type PresenceCertainty = 'CONFIRMED' | 'PROBABLE' | 'LAST_KNOWN'

export interface SpatialEstimate {
  entity: EntityRef
  locationId?: string
  precision: PresencePrecision
  certainty: PresenceCertainty
  observedAtEventId?: string
  probability?: number
}

export type EffectKind =
  | 'ELASTIC_BINDING'
  | 'ADHESIVE_BINDING'
  | 'PERCEPTION_MASK'
  | 'CONTROL_LINK'
  | 'PORTAL'
  | 'CURSE'
  | 'AURA_MODIFIER'
  | 'ABILITY_GRANT'
  | 'CONSTRAINT'
  | 'CUSTOM'

export interface EffectAnchor {
  entity?: EntityRef
  locationId?: string
  point?: { x: number; y: number; coordinateSpace: string }
}

export interface EffectInstance {
  id: string
  kind: EffectKind
  abilityId: string
  source: EntityRef
  targets: EntityRef[]
  anchors?: EffectAnchor[]
  state: 'ACTIVE' | 'DORMANT' | 'TRIGGERED' | 'ENDED'
  attributes: Record<string, unknown>
  startedAt: StoryCursor
  endedAt?: StoryCursor
}

export interface KnowledgeRecord {
  factId: string
  state: 'KNOWN' | 'BELIEVED' | 'SUSPECTED' | 'DOUBTED' | 'REJECTED' | 'UNKNOWN'
  confidence?: number
  acquiredAt: StoryCursor
}

export interface Vestige {
  type: string // VestigeType from domain
  occurredAt: StoryCursor
  metadata?: Record<string, string | number | boolean>
}

export interface WorldState {
  schemaVersion: 1
  cursor: StoryCursor
  entities: Record<string, WorldEntity>
  bodyStates: Record<string, string>
  consciousnessByBody: Record<string, string | null>
  presences: Record<string, SpatialEstimate>
  effects: Record<string, EffectInstance>
  knowledgeByObserver: Record<string, Record<string, KnowledgeRecord>>
  abilitiesByOwner: Record<string, string[]>
  vestiges: Record<string, Vestige[]>
}

export function createEmptyWorld(cursor: StoryCursor): WorldState {
  return {
    schemaVersion: 1,
    cursor,
    entities: {},
    bodyStates: {},
    consciousnessByBody: {},
    presences: {},
    effects: {},
    knowledgeByObserver: {},
    abilitiesByOwner: {},
    vestiges: {},
  }
}

export function cloneWorld(state: WorldState): WorldState {
  return cloneValue(state)
}

export function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
