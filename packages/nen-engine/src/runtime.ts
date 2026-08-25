import { cloneWorld, type WorldState, type EntityRef } from '@black-whale/canon-engine'
import {
  NenEngine,
  type AbilityActionPlan,
  type AbilityContext,
  type AbilityResult,
  type NenAbilityModule,
  type ValidationResult,
} from './engine.js'

/**
 * A Nen action as it arrives from an untrusted caller (a public form, a script).
 * Identifiers are length-capped and collections bounded by `parseNenActionRequest`.
 */
export interface NenActionRequest {
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

/** The subset of the ability catalogue the runtime needs to resolve ownership. */
export interface NenCatalogEntry {
  id: string
  name: string
  ownerId?: string | null
  category?: string
  description?: string
  canonStatus?: string
}

/**
 * Ports the runtime needs from the outside world. Keeping them as functions is
 * what allows this package to stay free of Prisma and of the timeline engine,
 * so the context-building rules below can be tested without a database.
 */
export interface NenRuntimePorts {
  /** Reconstruct the kernel world state at a canonical event. */
  loadWorldState(eventId: string): Promise<WorldState>
  /** Resolve a character slug to its entity id, or null when unknown. */
  resolveCharacterId(slug: string): Promise<string | null>
}

export class NenActionInputError extends Error {}

const MAX_ID_LENGTH = 128
const MAX_INTERACTION_LENGTH = 64
const MAX_TARGETS = 16
const MAX_ANCHORS = 16

function boundedString(value: unknown, field: string, maxLength = MAX_ID_LENGTH): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new NenActionInputError(`${field} is required`)
  }
  if (value.length > maxLength) {
    throw new NenActionInputError(`${field} must be at most ${maxLength} characters`)
  }
  return value
}

function optionalBoundedString(
  value: unknown,
  field: string,
  maxLength = MAX_ID_LENGTH,
): string | undefined {
  if (value === undefined || value === null) return undefined
  return boundedString(value, field, maxLength)
}

/**
 * Validates an untrusted action payload. This used to live in a class-validator
 * DTO on the HTTP layer; the bounds are preserved here so they apply to every
 * caller rather than to one transport.
 */
export function parseNenActionRequest(raw: unknown): NenActionRequest {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new NenActionInputError('A Nen action payload object is required')
  }
  const input = raw as Record<string, unknown>

  const targets = input['targets'] ?? []
  if (!Array.isArray(targets)) throw new NenActionInputError('targets must be an array')
  if (targets.length > MAX_TARGETS) {
    throw new NenActionInputError(`targets must contain at most ${MAX_TARGETS} entries`)
  }

  const anchorsInput = input['anchors']
  let anchors: NenActionRequest['anchors']
  if (anchorsInput !== undefined) {
    if (!Array.isArray(anchorsInput)) throw new NenActionInputError('anchors must be an array')
    if (anchorsInput.length > MAX_ANCHORS) {
      throw new NenActionInputError(`anchors must contain at most ${MAX_ANCHORS} entries`)
    }
    anchors = anchorsInput.map((entry, index) => {
      if (typeof entry !== 'object' || entry === null) {
        throw new NenActionInputError(`anchors[${index}] must be an object`)
      }
      const anchor = entry as Record<string, unknown>
      const point = anchor['point']
      return {
        entityId: optionalBoundedString(anchor['entityId'], `anchors[${index}].entityId`),
        locationId: optionalBoundedString(anchor['locationId'], `anchors[${index}].locationId`),
        point: point === undefined || point === null ? undefined : parseAnchorPoint(point, index),
      }
    })
  }

  const parameters = input['parameters']
  if (
    parameters !== undefined &&
    (typeof parameters !== 'object' || parameters === null || Array.isArray(parameters))
  ) {
    throw new NenActionInputError('parameters must be a plain object')
  }

  return {
    actorId: boundedString(input['actorId'], 'actorId'),
    interaction: boundedString(input['interaction'], 'interaction', MAX_INTERACTION_LENGTH),
    targets: targets.map((target, index) => boundedString(target, `targets[${index}]`)),
    eventId: boundedString(input['eventId'], 'eventId'),
    actionId: optionalBoundedString(input['actionId'], 'actionId', MAX_INTERACTION_LENGTH),
    parameters: parameters as Record<string, unknown> | undefined,
    anchors,
  }
}

function parseAnchorPoint(
  raw: unknown,
  index: number,
): { x: number; y: number; coordinateSpace: string } {
  if (typeof raw !== 'object' || raw === null) {
    throw new NenActionInputError(`anchors[${index}].point must be an object`)
  }
  const point = raw as Record<string, unknown>
  if (typeof point['x'] !== 'number' || typeof point['y'] !== 'number') {
    throw new NenActionInputError(`anchors[${index}].point requires numeric x and y`)
  }
  return {
    x: point['x'],
    y: point['y'],
    coordinateSpace: boundedString(
      point['coordinateSpace'],
      `anchors[${index}].point.coordinateSpace`,
      MAX_INTERACTION_LENGTH,
    ),
  }
}

/**
 * Turns an action request into the `AbilityContext` the pure `NenEngine` expects:
 * resolves entity references against the world state, and grants the actor the
 * ability it canonically owns so ownership does not have to be seeded elsewhere.
 */
export class NenRuntime {
  private readonly engine = new NenEngine()

  constructor(
    private readonly ports: NenRuntimePorts,
    private readonly catalog: NenCatalogEntry[],
    modules: NenAbilityModule[] = [],
  ) {
    for (const module of modules) this.engine.registerModule(module)
  }

  listAbilities() {
    return this.catalog.map((ability) => ({
      id: ability.id,
      name: ability.name,
      owner: ability.ownerId,
      category: ability.category,
      description: ability.description,
      canonStatus: ability.canonStatus,
    }))
  }

  /**
   * The abilities a caller can actually run: a catalogue entry is not enough,
   * a registered module has to back it. A simulation lab that offers the whole
   * catalogue offers hundreds of abilities that would all answer FORBIDDEN.
   */
  listRunnableAbilities() {
    return this.listAbilities().filter((ability) => this.engine.hasModule(ability.id))
  }

  /**
   * The actions one ability offers inside a state the caller already holds, with
   * the visibility the module gives each of them. The state is cloned: listing
   * actions must not grant the actor anything.
   */
  async actionsInState(abilityId: string, request: NenActionRequest, worldState: WorldState) {
    return this.engine.abilityActionWheel(
      await this.buildContext(abilityId, request, cloneWorld(worldState)),
    )
  }

  async getActiveState(abilityId: string, eventId: string) {
    return this.getActiveStateIn(abilityId, eventId, await this.ports.loadWorldState(eventId))
  }

  /** The same answer for a branch, whose state is already in hand. */
  async getActiveStateIn(abilityId: string, eventId: string, worldState: WorldState) {
    const active = await this.engine.getActiveAbilities(worldState)
    const ability = active.find((entry) => entry.abilityId === abilityId)
    return { abilityId, eventId, state: ability ? ability.state : 'inactive' }
  }

  /** Every ability still running in a state, canon or branch. */
  async getActiveAbilities(worldState: WorldState) {
    return this.engine.getActiveAbilities(worldState)
  }

  async validate(abilityId: string, request: NenActionRequest): Promise<ValidationResult> {
    return this.engine.validate(await this.contextFromEvent(abilityId, request))
  }

  async plan(abilityId: string, request: NenActionRequest): Promise<AbilityActionPlan> {
    return this.engine.plan(await this.contextFromEvent(abilityId, request))
  }

  /**
   * The plan an action would follow inside a state the caller already holds —
   * a simulation branch. The state is cloned first: planning must never grant
   * the actor the ability the way executing does.
   */
  async planInState(
    abilityId: string,
    request: NenActionRequest,
    worldState: WorldState,
  ): Promise<AbilityActionPlan> {
    return this.engine.plan(await this.buildContext(abilityId, request, cloneWorld(worldState)))
  }

  async executeInState(
    abilityId: string,
    request: NenActionRequest,
    worldState: WorldState,
  ): Promise<AbilityResult> {
    // Cloned like `planInState`: building the context grants a catalogued owner
    // their ability in place, and a refused activation must not leave that
    // grant — nor any other mutation — behind in the caller's state.
    return this.engine.execute(
      await this.buildContext(abilityId, request, cloneWorld(worldState)),
    )
  }

  private async contextFromEvent(
    abilityId: string,
    request: NenActionRequest,
  ): Promise<AbilityContext> {
    return this.buildContext(abilityId, request, await this.ports.loadWorldState(request.eventId))
  }

  private async buildContext(
    abilityId: string,
    request: NenActionRequest,
    worldState: WorldState,
  ): Promise<AbilityContext> {
    const actor = await this.resolveEntity(request.actorId, worldState, 'CHARACTER')
    const targetRefs = await Promise.all(
      request.targets.map((target) => this.resolveEntity(target, worldState, 'OBJECT')),
    )

    const catalogAbility = this.catalog.find((ability) => ability.id === abilityId)
    if (catalogAbility?.ownerId === request.actorId || catalogAbility?.ownerId === actor.id) {
      const owned = worldState.abilitiesByOwner[actor.id] ?? []
      if (!owned.includes(abilityId)) owned.push(abilityId)
      worldState.abilitiesByOwner[actor.id] = owned
    }

    return {
      abilityId,
      actorId: actor.id,
      actor,
      targets: targetRefs.map((target) => target.id),
      targetRefs,
      eventId: request.eventId,
      actionId: request.actionId ?? request.interaction,
      parameters: request.parameters,
      anchors: request.anchors?.map((anchor) => ({
        entity: anchor.entityId
          ? targetRefs.find((target) => target.id === anchor.entityId)
          : undefined,
        locationId: anchor.locationId,
        point: anchor.point,
      })),
      cursor: worldState.cursor,
      worldState,
    }
  }

  private async resolveEntity(
    reference: string,
    state: WorldState,
    fallbackKind: EntityRef['kind'],
  ): Promise<EntityRef> {
    const direct = state.entities[reference]
    if (direct) return { id: direct.id, kind: direct.kind }

    const characterId = await this.ports.resolveCharacterId(reference)
    if (characterId && state.entities[characterId]) return { id: characterId, kind: 'CHARACTER' }

    return { id: reference, kind: fallbackKind }
  }
}
