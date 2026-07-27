import { assertCursorProgression } from './cursor.js'
import type { WorldEvent } from './events.js'
import { cloneWorld, type EffectInstance, type WorldState } from './state.js'

function requireEntity(state: WorldState, entityId: string, expectedKind?: string): void {
  const entity = state.entities[entityId]
  if (!entity) throw new Error(`Unknown world entity: ${entityId}`)
  if (expectedKind && entity.kind !== expectedKind) {
    throw new Error(`Entity ${entityId} must be ${expectedKind}, got ${entity.kind}`)
  }
}

/**
 * What a consciousness can inhabit. A body, normally — but Hanzo's astral double
 * and other projections are aura, and they hold a mind while the body sleeps.
 */
const VESSEL_KINDS = new Set(['BODY', 'AURA_ENTITY', 'NEN_ENTITY', 'CONSTRUCT'])

function requireVessel(state: WorldState, entityId: string): void {
  const entity = state.entities[entityId]
  if (!entity) throw new Error(`Unknown world entity: ${entityId}`)
  if (!VESSEL_KINDS.has(entity.kind)) {
    throw new Error(`Entity ${entityId} cannot hold a consciousness (kind ${entity.kind})`)
  }
}

/** The body states after which a Nen user can no longer sustain an effect. */
const DEAD_BODY_STATES = new Set(['DEAD', 'DESTROYED'])

/**
 * Whether `bodyId` is the body the effect's source acts through: the source itself,
 * the character that body belongs to, or the body declared on the source's metadata.
 */
function isSourcedBy(state: WorldState, effect: EffectInstance, bodyId: string): boolean {
  if (effect.source.id === bodyId) return true
  const body = state.entities[bodyId]
  if (body?.originalCharacterId && body.originalCharacterId === effect.source.id) return true
  const source = state.entities[effect.source.id]
  return source?.metadata?.['bodyId'] === bodyId
}

/**
 * "Nen grows stronger after death" as a reducer invariant rather than a footnote:
 * a source's death ends the effects it was sustaining, and only those it programmed
 * to outlive it (`attributes.postMortem`) survive — Sun and Moon, Without You,
 * Cat's Name, Yomotsu Hegui, Bungee Gum on Hisoka's own heart.
 */
function applyPostMortemInvariant(state: WorldState, bodyId: string): void {
  for (const effect of Object.values(state.effects)) {
    if (effect.state === 'ENDED') continue
    if (effect.attributes['postMortem'] === true) continue
    if (!isSourcedBy(state, effect, bodyId)) continue
    effect.state = 'ENDED'
    effect.endedAt = state.cursor
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
      if (DEAD_BODY_STATES.has(event.payload.state)) {
        applyPostMortemInvariant(next, event.payload.bodyId)
      }
      return next
    }
    case 'CONSCIOUSNESS_TRANSFERRED': {
      requireEntity(next, event.payload.consciousnessId, 'CONSCIOUSNESS')
      requireVessel(next, event.payload.toBodyId)
      if (event.payload.fromBodyId) {
        requireVessel(next, event.payload.fromBodyId)
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
    case 'EFFECT_STATE_CHANGED': {
      const effect = next.effects[event.payload.effectId]
      if (!effect) throw new Error(`Unknown effect: ${event.payload.effectId}`)
      if (effect.state === 'ENDED') {
        throw new Error(`Effect ${effect.id} has ended and cannot change state`)
      }
      effect.state = event.payload.state
      if (event.payload.attributes) {
        Object.assign(effect.attributes, event.payload.attributes)
      }
      if (event.payload.state === 'ENDED') effect.endedAt = event.cursor
      return next
    }
    case 'EFFECT_ATTRIBUTE_CHANGED': {
      const effect = next.effects[event.payload.effectId]
      if (!effect) throw new Error(`Unknown effect: ${event.payload.effectId}`)
      if (effect.state === 'ENDED') {
        throw new Error(`Effect ${effect.id} has ended and cannot change attributes`)
      }
      if (event.payload.attributes) Object.assign(effect.attributes, event.payload.attributes)
      for (const [key, amount] of Object.entries(event.payload.increments ?? {})) {
        const current = effect.attributes[key]
        if (current !== undefined && typeof current !== 'number') {
          throw new Error(`Attribute ${key} of effect ${effect.id} is not a counter`)
        }
        effect.attributes[key] = (current ?? 0) + amount
      }
      for (const [key, values] of Object.entries(event.payload.append ?? {})) {
        const current = effect.attributes[key]
        if (current !== undefined && !Array.isArray(current)) {
          throw new Error(`Attribute ${key} of effect ${effect.id} is not a list`)
        }
        const list = [...((current as unknown[]) ?? [])]
        for (const value of values) if (!list.includes(value)) list.push(value)
        effect.attributes[key] = list
      }
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
    case 'ABILITY_REVOKED': {
      const abilities = next.abilitiesByOwner[event.payload.ownerId] ?? []
      next.abilitiesByOwner[event.payload.ownerId] = abilities.filter(
        (abilityId) => abilityId !== event.payload.abilityId,
      )
      return next
    }
  }
}

export function replayWorld(initial: WorldState, events: WorldEvent[]): WorldState {
  return events.reduce(reduceWorld, initial)
}
