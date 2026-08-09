// Domain event types used for event sourcing
export type DomainEventType =
  | 'BODY_MOVED'
  | 'CHARACTER_DIED'
  | 'CHARACTER_REVIVED'
  | 'CONSCIOUSNESS_TRANSFERRED'
  | 'ABILITY_ACTIVATED'
  | 'ABILITY_DEACTIVATED'
  | 'FACT_LEARNED'
  | 'FACT_FORGOTTEN'
  | 'AURA_DETECTED'
  | 'RELATION_CHANGED'
  | 'BODY_REVIVED'
  | 'ABILITY_INHERITED'
  | 'ENVIRONMENT_ALTERED'

export interface DomainEvent<T = Record<string, unknown>> {
  type: DomainEventType
  eventId: string
  chapterId?: string
  sequence?: number
  occurredAt: string
  payload: T
}

export interface BodyMovedPayload {
  bodyId: string
  fromLocationId?: string
  toLocationId: string
}

export interface ConsciousnessTransferredPayload {
  consciousnessId: string
  fromBodyId: string
  toBodyId: string
}

export interface AbilityActivatedPayload {
  abilityId: string
  actorId: string
  targetIds: string[]
  activationId: string
}

export interface FactLearnedPayload {
  factId: string
  observerId: string
  knowledgeId: string
}

export type VestigeType = 'wall-breach' | 'broken-door' | 'blood-stain'

export interface EnvironmentAlteredPayload {
  locationId: string
  vestigeType: VestigeType
  /** 
   * Additional context for the renderer, e.g. which specific door is broken.
   */
  metadata?: Record<string, string | number | boolean>
}

export type BodyMovedEvent = DomainEvent<BodyMovedPayload>
export type ConsciousnessTransferredEvent = DomainEvent<ConsciousnessTransferredPayload>
export type AbilityActivatedEvent = DomainEvent<AbilityActivatedPayload>
export type FactLearnedEvent = DomainEvent<FactLearnedPayload>
export type EnvironmentAlteredEvent = DomainEvent<EnvironmentAlteredPayload>
