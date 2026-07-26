import type {
  Character,
  Body,
  Consciousness,
  Location,
  NenAbility,
  AbilityActivation,
  Fact,
  KnowledgeState,
  Presence,
} from '@black-whale/domain'

// ──────────────────────────────────────────────
// World State
// ──────────────────────────────────────────────

export interface WorldStateQuery {
  eventId?: string
  chapterId?: string
  spoilerLimit?: number
}

export interface WorldStateDto {
  characters: Character[]
  bodies: Body[]
  consciousnesses: Consciousness[]
  locations: Location[]
  activeAbilities: AbilityActivation[]
  presences: Presence[]
  knownFacts: Fact[]
  worldVersion: number
}

// ──────────────────────────────────────────────
// Perspective
// ──────────────────────────────────────────────

export type PerspectiveMode = 'character' | 'omniscient' | 'body' | 'aura' | 'apparent'

export interface PerspectiveQuery {
  observerId: string
  eventId: string
  spoilerLimit?: number
  mode?: PerspectiveMode
}

export interface PerspectiveDto {
  observerId: string
  eventId: string
  mode: PerspectiveMode
  visibleCharacters: Character[]
  believedPositions: Record<string, string>
  hiddenAbilities: string[]
  suspectedThreats: string[]
  falseInformation: Fact[]
  knownDeaths: string[]
  knowledgeItems: KnowledgeState[]
}

// ──────────────────────────────────────────────
// Presence / Entities
// ──────────────────────────────────────────────

export interface EntityPresenceDto {
  entityId: string
  entityType: string
  locationId: string
  locationName: string
  certainty: string
  sinceEventId: string
}

// ──────────────────────────────────────────────
// Nen Validation
// ──────────────────────────────────────────────

export interface NenValidateRequestDto {
  actorId: string
  interaction: string
  targets: string[]
  eventId: string
  actionId?: string
  parameters?: Record<string, unknown>
  anchors?: Array<{
    entityId?: string
    locationId?: string
    point?: { x: number; y: number; coordinateSpace: string }
  }>
}

export type NenPlanRequestDto = NenValidateRequestDto

export interface NenValidateResponseDto {
  allowed: boolean
  reason?: string
  generatedEvents?: Array<{
    type: string
    payload: Record<string, unknown>
  }>
  perspectiveTransition?: {
    fromBodyId: string
    toBodyId: string
  }
}

// ──────────────────────────────────────────────
// Simulation
// ──────────────────────────────────────────────

export interface CreateSimulationDto {
  parentEventId: string
  mode: 'strict-canon' | 'rule-compatible' | 'sandbox'
  ownerId?: string
}

export interface SimulationActionDto {
  branchId?: string
  actionType: string
  payload: Record<string, unknown>
}

// ──────────────────────────────────────────────
// Compare
// ──────────────────────────────────────────────

export interface PerspectiveCompareDto {
  left: PerspectiveDto
  right: PerspectiveDto
  divergingFacts: Fact[]
  divergingPositions: Record<string, { left?: string; right?: string }>
}

// ──────────────────────────────────────────────
// Chapter & Character
// ──────────────────────────────────────────────

export type CreateCharacterDto = Omit<Character, 'id'>
export type CreateChapterDto = { number: number; publicationOrder: number; title?: string }
export type CreateAbilityDto = Omit<NenAbility, 'id'>
