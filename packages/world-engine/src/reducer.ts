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

/** The character a body belongs to, for the rules that reason about people. */
function characterOfBody(state: WorldState, bodyId: string): string {
  return state.entities[bodyId]?.originalCharacterId ?? bodyId
}

/**
 * Benjamin Baton, as a rule of the world rather than a page of the wiki: an
 * ABILITY_GRANT effect declaring `inheritTo` over a list of members hands the
 * abilities of any member who dies to the heir. The timeline then tells the
 * attrition of Benjamin's army through the powers he collects.
 */
function applyInheritanceInvariant(state: WorldState, bodyId: string): void {
  const deceased = characterOfBody(state, bodyId)
  for (const effect of Object.values(state.effects)) {
    if (effect.state === 'ENDED') continue
    const heir = effect.attributes['inheritTo']
    const members = effect.attributes['memberIds']
    if (typeof heir !== 'string' || !Array.isArray(members)) continue
    if (!members.includes(deceased) && !members.includes(bodyId)) continue

    const inherited = state.abilitiesByOwner[deceased] ?? []
    const owned = state.abilitiesByOwner[heir] ?? []
    for (const abilityId of inherited) if (!owned.includes(abilityId)) owned.push(abilityId)
    state.abilitiesByOwner[heir] = owned
  }
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

/** The payload of one member of the event union, named for the handlers below. */
type PayloadOf<T extends WorldEvent['type']> = Extract<WorldEvent, { type: T }>['payload']

/** The effect an event names, refusing anything that has already ended. */
function liveEffect(state: WorldState, effectId: string, what: string): EffectInstance {
  const effect = state.effects[effectId]
  if (!effect) throw new Error(`Unknown effect: ${effectId}`)
  if (effect.state === 'ENDED') throw new Error(`Effect ${effect.id} has ended and cannot ${what}`)
  return effect
}

/**
 * A consciousness leaves one vessel and takes another.
 *
 * The vessel it left is only emptied if it still held *this* mind: a transfer
 * recorded out of order must not blank a body someone else has since moved into.
 */
function transferConsciousness(state: WorldState, payload: PayloadOf<'CONSCIOUSNESS_TRANSFERRED'>) {
  requireEntity(state, payload.consciousnessId, 'CONSCIOUSNESS')
  requireVessel(state, payload.toBodyId)
  if (payload.fromBodyId) {
    requireVessel(state, payload.fromBodyId)
    if (state.consciousnessByBody[payload.fromBodyId] === payload.consciousnessId) {
      state.consciousnessByBody[payload.fromBodyId] = null
    }
  }
  state.consciousnessByBody[payload.toBodyId] = payload.consciousnessId
}

/**
 * The three ways an attribute changes: set outright, counted up, or appended to.
 *
 * A counter that is not a number and a list that is not a list are refused
 * rather than coerced — an ability whose bookkeeping has drifted is a bug in the
 * timeline, not a value to be rounded off.
 */
function changeEffectAttributes(state: WorldState, payload: PayloadOf<'EFFECT_ATTRIBUTE_CHANGED'>) {
  const effect = liveEffect(state, payload.effectId, 'change attributes')
  if (payload.attributes) Object.assign(effect.attributes, payload.attributes)

  for (const [key, amount] of Object.entries(payload.increments ?? {})) {
    const current = effect.attributes[key]
    if (current !== undefined && typeof current !== 'number') {
      throw new Error(`Attribute ${key} of effect ${effect.id} is not a counter`)
    }
    effect.attributes[key] = (current ?? 0) + amount
  }

  for (const [key, values] of Object.entries(payload.append ?? {})) {
    const current = effect.attributes[key]
    if (current !== undefined && !Array.isArray(current)) {
      throw new Error(`Attribute ${key} of effect ${effect.id} is not a list`)
    }
    const list = [...((current as unknown[]) ?? [])]
    for (const value of values) if (!list.includes(value)) list.push(value)
    effect.attributes[key] = list
  }
}

/** A body reaching a state it does not come back from tears down what it held. */
function applyDeathInvariants(state: WorldState, bodyId: string): void {
  // Inheritance first: the heir collects what the dead owned before the
  // effects that owner was sustaining are torn down.
  applyInheritanceInvariant(state, bodyId)
  applyPostMortemInvariant(state, bodyId)
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
        applyDeathInvariants(next, event.payload.bodyId)
      }
      return next
    }
    case 'CONSCIOUSNESS_TRANSFERRED': {
      transferConsciousness(next, event.payload)
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
      const effect = liveEffect(next, event.payload.effectId, 'change state')
      effect.state = event.payload.state
      if (event.payload.attributes) {
        Object.assign(effect.attributes, event.payload.attributes)
      }
      if (event.payload.state === 'ENDED') effect.endedAt = event.cursor
      return next
    }
    case 'EFFECT_ATTRIBUTE_CHANGED': {
      changeEffectAttributes(next, event.payload)
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
