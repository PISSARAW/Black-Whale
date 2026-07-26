import type { StoryCursor } from './cursor.js'
import type { EffectInstance, EntityRef, KnowledgeRecord, SpatialEstimate, WorldEntity } from './state.js'

interface EventEnvelope<TType extends string, TPayload> {
  id: string
  type: TType
  schemaVersion: 1
  branchId: string
  cursor: StoryCursor
  payload: TPayload
  sourceIds?: string[]
  revealedAtChapter?: number
}

export type EntityRegisteredEvent = EventEnvelope<'ENTITY_REGISTERED', { entity: WorldEntity }>
export type EntityMovedEvent = EventEnvelope<'ENTITY_MOVED', { presence: SpatialEstimate }>
export type BodyStateChangedEvent = EventEnvelope<'BODY_STATE_CHANGED', { bodyId: string; state: string }>
export type ConsciousnessTransferredEvent = EventEnvelope<
  'CONSCIOUSNESS_TRANSFERRED',
  { consciousnessId: string; fromBodyId?: string; toBodyId: string }
>
export type EffectCreatedEvent = EventEnvelope<'EFFECT_CREATED', { effect: EffectInstance }>
export type EffectEndedEvent = EventEnvelope<'EFFECT_ENDED', { effectId: string }>
export type KnowledgeGrantedEvent = EventEnvelope<
  'KNOWLEDGE_GRANTED',
  { observerId: string; record: KnowledgeRecord }
>
export type AbilityGrantedEvent = EventEnvelope<'ABILITY_GRANTED', { ownerId: string; abilityId: string }>

export type WorldEvent =
  | EntityRegisteredEvent
  | EntityMovedEvent
  | BodyStateChangedEvent
  | ConsciousnessTransferredEvent
  | EffectCreatedEvent
  | EffectEndedEvent
  | KnowledgeGrantedEvent
  | AbilityGrantedEvent

export type WorldEventType = WorldEvent['type']

export type ProposedWorldEvent = WorldEvent extends infer TEvent
  ? TEvent extends WorldEvent
    ? Omit<TEvent, 'id' | 'schemaVersion' | 'branchId' | 'cursor'>
    : never
  : never

export interface ActivateAbilityCommand {
  type: 'ACTIVATE_ABILITY'
  abilityId: string
  actor: EntityRef
  actionId: string
  targets: EntityRef[]
  anchors?: Array<{ entity?: EntityRef; locationId?: string; point?: { x: number; y: number; coordinateSpace: string } }>
  parameters?: Record<string, unknown>
}

export interface MoveEntityCommand {
  type: 'MOVE_ENTITY'
  entity: EntityRef
  locationId: string
}

export type WorldCommand = ActivateAbilityCommand | MoveEntityCommand
