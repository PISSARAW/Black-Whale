import { assertCursorProgression } from './cursor.js'
import type { WorldEvent } from './events.js'
import { cloneWorld, type WorldState } from './state.js'

function requireEntity(state: WorldState, entityId: string, expectedKind?: string): void {
  const entity = state.entities[entityId]
  if (!entity) throw new Error(`Unknown world entity: ${entityId}`)
  if (expectedKind && entity.kind !== expectedKind) {
    throw new Error(`Entity ${entityId} must be ${expectedKind}, got ${entity.kind}`)
  }
}

export function reduceWorld(previous: WorldState, event: WorldEvent): WorldState {
  assertCursorProgression(previous.cursor, event.cursor)
  if (event.branchId !== event.cursor.branchId) {
    throw new Error(
      `Event branch ${event.branchId} does not match cursor branch ${event.cursor.branchId}`,
    )
  }

  const next = cloneWorld(previous)
  next.cursor = event.cursor

  switch (event.type) {
    case 'ENTITY_REGISTERED': {
      const entity = event.payload.entity
      if (next.entities[entity.id]) throw new Error(`Entity already registered: ${entity.id}`)
      next.entities[entity.id] = entity
      return next
    }
    case 'ENTITY_MOVED': {
      requireEntity(next, event.payload.presence.entity.id)
      next.presences[event.payload.presence.entity.id] = event.payload.presence
      return next
    }
    case 'BODY_STATE_CHANGED': {
      requireEntity(next, event.payload.bodyId, 'BODY')
      next.bodyStates[event.payload.bodyId] = event.payload.state
      return next
    }
    case 'CONSCIOUSNESS_TRANSFERRED': {
      requireEntity(next, event.payload.consciousnessId, 'CONSCIOUSNESS')
      requireEntity(next, event.payload.toBodyId, 'BODY')
      if (event.payload.fromBodyId) {
        requireEntity(next, event.payload.fromBodyId, 'BODY')
        if (next.consciousnessByBody[event.payload.fromBodyId] === event.payload.consciousnessId) {
          next.consciousnessByBody[event.payload.fromBodyId] = null
        }
      }
      next.consciousnessByBody[event.payload.toBodyId] = event.payload.consciousnessId
      return next
    }
    case 'EFFECT_CREATED': {
      const effect = event.payload.effect
      requireEntity(next, effect.source.id)
      for (const target of effect.targets) requireEntity(next, target.id)
      if (next.effects[effect.id]) throw new Error(`Effect already exists: ${effect.id}`)
      next.effects[effect.id] = effect
      return next
    }
    case 'EFFECT_ENDED': {
      const effect = next.effects[event.payload.effectId]
      if (!effect) throw new Error(`Unknown effect: ${event.payload.effectId}`)
      effect.state = 'ENDED'
      effect.endedAt = event.cursor
      return next
    }
    case 'KNOWLEDGE_GRANTED': {
      const observer = next.knowledgeByObserver[event.payload.observerId] ?? {}
      observer[event.payload.record.factId] = event.payload.record
      next.knowledgeByObserver[event.payload.observerId] = observer
      return next
    }
    case 'ABILITY_GRANTED': {
      const abilities = next.abilitiesByOwner[event.payload.ownerId] ?? []
      if (!abilities.includes(event.payload.abilityId)) abilities.push(event.payload.abilityId)
      next.abilitiesByOwner[event.payload.ownerId] = abilities
      return next
    }
  }
}

export function replayWorld(initial: WorldState, events: WorldEvent[]): WorldState {
  return events.reduce(reduceWorld, initial)
}
