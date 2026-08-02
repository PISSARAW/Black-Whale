import type { PrismaClient } from '@black-whale/database'
import {
  projectMapScene,
  type EntityRef,
  type ProposedWorldEvent,
  type WorldEvent,
  type WorldState,
} from '@black-whale/world-engine'
import { SimulationEngine, type SimulationMode, type SimulationStepResult } from './engine.js'

export class SimulationInputError extends Error {}
export class SimulationNotFoundError extends Error {}

/** The result of a Nen activation, as the store needs to consume it. */
export interface AbilityExecutionResult {
  allowed: boolean
  reason?: string
  events?: ProposedWorldEvent[]
}

/** Request shape handed to the ability executor for an ACTIVATE_ABILITY action. */
export interface AbilityExecutionRequest {
  actorId: string
  interaction: string
  targets: string[]
  eventId: string
  actionId?: string
  parameters?: Record<string, unknown>
}

/**
 * Ports the store needs beyond persistence. Injecting them keeps this package
 * independent of the timeline and Nen engines, and makes the branch lifecycle
 * testable with stubs.
 */
export interface SimulationStorePorts {
  /** Reconstruct the canonical kernel state at the fork event. */
  loadKernelState(eventId: string): Promise<WorldState>
  /** Run an ability against a branch state and return the events it proposes. */
  executeAbility(
    abilityId: string,
    request: AbilityExecutionRequest,
    state: WorldState,
  ): Promise<AbilityExecutionResult>
}

export const SIMULATION_MODES: readonly SimulationMode[] = [
  'strict-canon',
  'rule-compatible',
  'sandbox',
]
export const SIMULATION_ACTION_TYPES = ['ACTIVATE_ABILITY', 'MOVE_ENTITY'] as const

export type SimulationActionType = (typeof SIMULATION_ACTION_TYPES)[number]

export interface CreateSimulationInput {
  parentEventId: string
  mode: SimulationMode
  ownerId?: string
}

export interface SimulationActionInput {
  actionType: SimulationActionType
  payload: Record<string, unknown>
}

// Branches are created and mutated by unauthenticated visitors of the public
// site, so every identifier is length-capped and the free-form action payload is
// bounded in both key count and serialised size.
const MAX_ID_LENGTH = 128
const MAX_PAYLOAD_KEYS = 32
const MAX_PAYLOAD_BYTES = 8 * 1024

function boundedId(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new SimulationInputError(`${field} is required`)
  }
  if (value.length > MAX_ID_LENGTH) {
    throw new SimulationInputError(`${field} must be at most ${MAX_ID_LENGTH} characters`)
  }
  return value
}

export function parseCreateSimulationInput(raw: unknown): CreateSimulationInput {
  if (typeof raw !== 'object' || raw === null) {
    throw new SimulationInputError('A simulation payload object is required')
  }
  const input = raw as Record<string, unknown>
  const mode = input['mode']
  if (!SIMULATION_MODES.includes(mode as SimulationMode)) {
    throw new SimulationInputError(`mode must be one of ${SIMULATION_MODES.join(', ')}`)
  }
  const ownerId = input['ownerId']
  return {
    parentEventId: boundedId(input['parentEventId'], 'parentEventId'),
    mode: mode as SimulationMode,
    ownerId: ownerId === undefined || ownerId === null ? undefined : boundedId(ownerId, 'ownerId'),
  }
}

export function parseSimulationActionInput(raw: unknown): SimulationActionInput {
  if (typeof raw !== 'object' || raw === null) {
    throw new SimulationInputError('A simulation action object is required')
  }
  const input = raw as Record<string, unknown>
  const actionType = input['actionType']
  if (!SIMULATION_ACTION_TYPES.includes(actionType as SimulationActionType)) {
    throw new SimulationInputError(`Unsupported simulation action: ${String(actionType)}`)
  }

  const payload = input['payload']
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new SimulationInputError('payload must be a plain object')
  }
  if (Object.keys(payload).length > MAX_PAYLOAD_KEYS) {
    throw new SimulationInputError(`payload must contain at most ${MAX_PAYLOAD_KEYS} keys`)
  }
  let serialised: string
  try {
    serialised = JSON.stringify(payload)
  } catch {
    throw new SimulationInputError('payload must be serialisable')
  }
  if (Buffer.byteLength(serialised) > MAX_PAYLOAD_BYTES) {
    throw new SimulationInputError(`payload must be at most ${MAX_PAYLOAD_BYTES} bytes`)
  }

  return {
    actionType: actionType as SimulationActionType,
    payload: payload as Record<string, unknown>,
  }
}

/** The effect an event acts upon, when it acts upon one. */
function touchedEffectId(event: WorldEvent): string | undefined {
  switch (event.type) {
    case 'EFFECT_CREATED':
      return event.payload.effect.id
    case 'EFFECT_ENDED':
    case 'EFFECT_STATE_CHANGED':
    case 'EFFECT_ATTRIBUTE_CHANGED':
      return event.payload.effectId
    default:
      return undefined
  }
}

/**
 * Persists simulation branches: the in-memory `SimulationEngine` owns the rules,
 * this owns the rows. A branch that is not resident in memory is rehydrated from
 * its most recent world-state projection.
 */
export class SimulationStore {
  private readonly engine = new SimulationEngine()

  constructor(
    private readonly prisma: PrismaClient,
    private readonly ports: SimulationStorePorts,
  ) {}

  async createBranch(input: CreateSimulationInput) {
    const baseState = await this.ports.loadKernelState(input.parentEventId)
    const branch = this.engine.createBranch(
      {
        id: globalThis.crypto.randomUUID(),
        parentEventId: input.parentEventId,
        mode: input.mode,
        ownerId: input.ownerId,
      },
      baseState,
    )

    await this.prisma.$transaction(async (transaction) => {
      await transaction.worldBranch.upsert({
        where: { id: 'canon' },
        update: {},
        create: {
          id: 'canon',
          name: 'Canonical timeline',
          kind: 'CANON',
          rulePolicy: 'STRICT_CANON',
          forkEventId: input.parentEventId,
        },
      })
      await transaction.worldBranch.create({
        data: {
          id: branch.id,
          name: branch.name,
          kind: branch.kind,
          rulePolicy: branch.rulePolicy,
          parentBranchId: 'canon',
          forkEventId: input.parentEventId,
          ownerId: branch.ownerId,
          createdAt: new Date(branch.createdAt),
        },
      })
      await transaction.worldProjectionSnapshot.create({
        data: {
          branchId: branch.id,
          projectionKind: 'WORLD_STATE',
          cursorOrdinal: 0,
          payload: this.engine.getBranchState(branch.id) as unknown as object,
        },
      })
    })

    return branch
  }

  async getBranchState(branchId: string) {
    await this.ensureLoaded(branchId)
    return {
      branch: this.engine.getBranch(branchId),
      snapshot: this.engine.getBranchState(branchId),
    }
  }

  async getMapScene(branchId: string, assetKey: string) {
    return projectMapScene(await this.getState(branchId), { assetKey })
  }

  async applyAction(branchId: string, input: SimulationActionInput): Promise<SimulationStepResult> {
    const state = await this.getState(branchId)
    const events =
      input.actionType === 'ACTIVATE_ABILITY'
        ? await this.activateAbility(state, input.payload)
        : this.moveEntity(state, input.payload)

    const result = this.engine.applyEvents(branchId, events)
    await this.persistStep(branchId, result.appliedEvents, result.snapshot)
    return result
  }

  private async activateAbility(
    state: WorldState,
    payload: Record<string, unknown>,
  ): Promise<ProposedWorldEvent[]> {
    const targets = payload['targets']
    const parameters = payload['parameters']
    const result = await this.ports.executeAbility(
      boundedId(payload['abilityId'], 'abilityId'),
      {
        actorId: boundedId(payload['actorId'], 'actorId'),
        interaction: boundedId(payload['interaction'], 'interaction'),
        actionId: typeof payload['actionId'] === 'string' ? payload['actionId'] : undefined,
        targets: Array.isArray(targets) ? targets.map(String) : [],
        eventId: state.cursor.eventId,
        parameters:
          typeof parameters === 'object' && parameters !== null && !Array.isArray(parameters)
            ? (parameters as Record<string, unknown>)
            : undefined,
      },
      state,
    )
    if (!result.allowed)
      throw new SimulationInputError(result.reason ?? 'Ability activation rejected')
    return result.events ?? []
  }

  private moveEntity(state: WorldState, payload: Record<string, unknown>): ProposedWorldEvent[] {
    const entityId = boundedId(payload['entityId'], 'entityId')
    const entity = state.entities[entityId]
    if (!entity) throw new SimulationInputError(`Unknown entity ${entityId}`)
    return [
      {
        type: 'ENTITY_MOVED',
        payload: {
          presence: {
            entity: { id: entity.id, kind: entity.kind } satisfies EntityRef,
            locationId: boundedId(payload['locationId'], 'locationId'),
            precision: 'EXACT_ROOM',
            certainty: 'CONFIRMED',
          },
        },
      },
    ]
  }

  private async getState(branchId: string): Promise<WorldState> {
    await this.ensureLoaded(branchId)
    return this.engine.getBranchState(branchId)
  }

  private async ensureLoaded(branchId: string): Promise<void> {
    try {
      this.engine.getBranchState(branchId)
      return
    } catch {
      // Not resident in this process: rehydrate from the latest projection.
    }

    const stored = await this.prisma.worldBranch.findUnique({
      where: { id: branchId },
      include: {
        projections: {
          where: { projectionKind: 'WORLD_STATE' },
          orderBy: { cursorOrdinal: 'desc' },
          take: 1,
        },
      },
    })
    const projection = stored?.projections[0]
    if (!stored || !projection)
      throw new SimulationNotFoundError(`Simulation branch ${branchId} not found`)

    const snapshot = projection.payload as unknown as WorldState
    this.engine.restoreBranch(
      {
        id: stored.id,
        name: stored.name,
        kind: stored.kind,
        parentBranchId: stored.parentBranchId ?? undefined,
        forkCursor: snapshot.cursor,
        rulePolicy: stored.rulePolicy,
        ownerId: stored.ownerId ?? undefined,
        createdAt: stored.createdAt.toISOString(),
      },
      snapshot,
    )
  }

  private async persistStep(
    branchId: string,
    events: WorldEvent[],
    snapshot: WorldState,
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      for (const event of events) {
        await transaction.worldEventRecord.create({
          data: {
            id: event.id,
            branchId,
            ordinal: event.cursor.ordinal,
            type: event.type,
            schemaVersion: event.schemaVersion,
            chapterNumber: event.cursor.chapterNumber,
            localSequence: event.cursor.localSequence,
            sourceIds: event.sourceIds ?? [],
            revealedAtChapter: event.revealedAtChapter,
            payload: event.payload as unknown as object,
          },
        })
        const effectId = touchedEffectId(event)
        // Read the effect back from the snapshot rather than from the event: a
        // state or attribute change carries a delta, and the post-mortem
        // invariant may have ended effects no event mentions.
        const effect = effectId ? snapshot.effects[effectId] : undefined
        if (effect) {
          const row = {
            branchId,
            abilityId: effect.abilityId,
            kind: effect.kind,
            sourceEntityId: effect.source.id,
            targetEntityIds: effect.targets.map((target) => target.id),
            state: effect.state,
            startedOrdinal: effect.startedAt.ordinal,
            endedOrdinal: effect.endedAt?.ordinal,
            attributes: effect.attributes as unknown as object,
            anchors: effect.anchors as unknown as object,
          }
          await transaction.worldEffectRecord.upsert({
            where: { id: effect.id },
            create: { id: effect.id, ...row },
            update: row,
          })
        }
      }
      await transaction.worldProjectionSnapshot.create({
        data: {
          branchId,
          projectionKind: 'WORLD_STATE',
          cursorOrdinal: snapshot.cursor.ordinal,
          payload: snapshot as unknown as object,
        },
      })
    })
  }
}
