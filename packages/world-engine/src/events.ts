import type { StoryCursor } from './cursor.js'
import type {
  EffectInstance,
  EntityRef,
  KnowledgeRecord,
  SpatialEstimate,
  WorldEntity,
} from './state.js'

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
export type BodyStateChangedEvent = EventEnvelope<
  'BODY_STATE_CHANGED',
  { bodyId: string; state: string }
>
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
export type AbilityGrantedEvent = EventEnvelope<
  'ABILITY_GRANTED',
  { ownerId: string; abilityId: string }
>
/**
 * Symmetric of ABILITY_GRANTED: the owner loses the ability (Skill Hunter's victim,
 * Steal Chain, a Stealth Dolphin loan being consumed, a creator's death).
 */
export type AbilityRevokedEvent = EventEnvelope<
  'ABILITY_REVOKED',
  { ownerId: string; abilityId: string; reason?: string }
>
/**
 * Moves an effect along ACTIVE ⇄ DORMANT → TRIGGERED → ENDED. Conditional traps and
 * curses are created DORMANT and only transition when their canonical trigger fires.
 */
export type EffectStateChangedEvent = EventEnvelope<
  'EFFECT_STATE_CHANGED',
  { effectId: string; state: EffectInstance['state']; attributes?: Record<string, unknown> }
>
/**
 * Counters carried by an effect: lifespan spent (Emperor Time), levels and kills
 * (Contagion), daily value (Guardian Coins), charge (Ripper Cyclotron), cohort members.
 */
export type EffectAttributeChangedEvent = EventEnvelope<
  'EFFECT_ATTRIBUTE_CHANGED',
  {
    effectId: string
    /** Replaces the listed attributes. */
    attributes?: Record<string, unknown>
    /** Adds to numeric attributes, starting from 0 when absent. */
    increments?: Record<string, number>
    /** Appends to array attributes, ignoring values already present. */
    append?: Record<string, unknown[]>
  }
>

export type WorldEvent =
  | EntityRegisteredEvent
  | EntityMovedEvent
  | BodyStateChangedEvent
  | ConsciousnessTransferredEvent
  | EffectCreatedEvent
  | EffectEndedEvent
  | EffectStateChangedEvent
  | EffectAttributeChangedEvent
  | KnowledgeGrantedEvent
  | AbilityGrantedEvent
  | AbilityRevokedEvent

export type WorldEventType = WorldEvent['type']

export type ProposedWorldEvent = WorldEvent extends infer TEvent
  ? TEvent extends WorldEvent
    ? Omit<TEvent, 'id' | 'schemaVersion' | 'branchId' | 'cursor'>
    : never
  : never

/**
 * The entities an event is about. Used to merge a branch selectively: Parallel
 * Future replays its predicted window for everyone but the seer, whose own
 * actions diverge because he knows what was coming.
 */
export function eventSubjectIds(event: WorldEvent): string[] {
  switch (event.type) {
    case 'ENTITY_REGISTERED':
      return [event.payload.entity.id]
    case 'ENTITY_MOVED':
      return [event.payload.presence.entity.id]
    case 'BODY_STATE_CHANGED':
      return [event.payload.bodyId]
    case 'CONSCIOUSNESS_TRANSFERRED':
      return [
        event.payload.consciousnessId,
        event.payload.toBodyId,
        ...(event.payload.fromBodyId ? [event.payload.fromBodyId] : []),
      ]
    case 'EFFECT_CREATED':
      return [
        event.payload.effect.source.id,
        ...event.payload.effect.targets.map((target) => target.id),
      ]
    case 'EFFECT_ENDED':
    case 'EFFECT_STATE_CHANGED':
    case 'EFFECT_ATTRIBUTE_CHANGED':
      return [event.payload.effectId]
    case 'KNOWLEDGE_GRANTED':
      return [event.payload.observerId]
    case 'ABILITY_GRANTED':
    case 'ABILITY_REVOKED':
      return [event.payload.ownerId]
  }
}

export interface ActivateAbilityCommand {
  type: 'ACTIVATE_ABILITY'
  abilityId: string
  actor: EntityRef
  actionId: string
  targets: EntityRef[]
  anchors?: Array<{
    entity?: EntityRef
    locationId?: string
    point?: { x: number; y: number; coordinateSpace: string }
  }>
  parameters?: Record<string, unknown>
}

export interface MoveEntityCommand {
  type: 'MOVE_ENTITY'
  entity: EntityRef
  locationId: string
}

export type WorldCommand = ActivateAbilityCommand | MoveEntityCommand
