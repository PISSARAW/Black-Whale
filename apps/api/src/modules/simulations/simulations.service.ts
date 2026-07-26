import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { CreateSimulationDto, NenValidateRequestDto, SimulationActionDto } from '@black-whale/contracts'
import { SimulationEngine } from '@black-whale/simulation-engine'
import { TimelineEngine } from '@black-whale/timeline-engine'
import { projectMapScene, type EntityRef, type ProposedWorldEvent } from '@black-whale/world-engine'
import { randomUUID } from 'node:crypto'
import { PrismaService } from '../prisma/prisma.service.js'
import { NenService } from '../nen/nen.service.js'

@Injectable()
export class SimulationsService {
  private readonly engine = new SimulationEngine()
  private readonly timeline: TimelineEngine

  constructor(
    private readonly prisma: PrismaService,
    private readonly nenService: NenService,
  ) {
    this.timeline = new TimelineEngine(prisma)
  }

  async createBranch(dto: CreateSimulationDto) {
    const baseState = await this.timeline.getKernelState({ eventId: dto.parentEventId })
    const id = randomUUID()
    const branch = this.engine.createBranch({
      id,
      parentEventId: dto.parentEventId,
      mode: dto.mode,
      ownerId: dto.ownerId,
    }, baseState)

    await this.prisma.$transaction(async (transaction) => {
      await transaction.worldBranch.upsert({
        where: { id: 'canon' },
        update: {},
        create: {
          id: 'canon',
          name: 'Canonical timeline',
          kind: 'CANON',
          rulePolicy: 'STRICT_CANON',
          forkEventId: dto.parentEventId,
        },
      })
      await transaction.worldBranch.create({
        data: {
          id: branch.id,
          name: branch.name,
          kind: branch.kind,
          rulePolicy: branch.rulePolicy,
          parentBranchId: 'canon',
          forkEventId: dto.parentEventId,
          ownerId: branch.ownerId,
          createdAt: new Date(branch.createdAt),
        },
      })
      await transaction.worldProjectionSnapshot.create({
        data: {
          branchId: branch.id,
          projectionKind: 'WORLD_STATE',
          cursorOrdinal: 0,
          payload: this.engine.getBranchState(branch.id) as any,
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

  async applyAction(branchId: string, dto: SimulationActionDto) {
    const state = await this.getState(branchId)
    let events: ProposedWorldEvent[]

    if (dto.actionType === 'ACTIVATE_ABILITY') {
      const abilityId = this.requiredString(dto.payload, 'abilityId')
      const request: NenValidateRequestDto = {
        actorId: this.requiredString(dto.payload, 'actorId'),
        interaction: this.requiredString(dto.payload, 'interaction'),
        actionId: typeof dto.payload.actionId === 'string' ? dto.payload.actionId : undefined,
        targets: Array.isArray(dto.payload.targets) ? dto.payload.targets.map(String) : [],
        eventId: state.cursor.eventId,
        parameters: typeof dto.payload.parameters === 'object' && dto.payload.parameters ? dto.payload.parameters as Record<string, unknown> : undefined,
      }
      const result = await this.nenService.executeInState(abilityId, request, state)
      if (!result.allowed) throw new BadRequestException(result.reason ?? 'Ability activation rejected')
      events = result.events ?? []
    } else if (dto.actionType === 'MOVE_ENTITY') {
      const entityId = this.requiredString(dto.payload, 'entityId')
      const entity = state.entities[entityId]
      if (!entity) throw new BadRequestException(`Unknown entity ${entityId}`)
      const ref: EntityRef = { id: entity.id, kind: entity.kind }
      events = [{
        type: 'ENTITY_MOVED',
        payload: {
          presence: {
            entity: ref,
            locationId: this.requiredString(dto.payload, 'locationId'),
            precision: 'EXACT_ROOM',
            certainty: 'CONFIRMED',
          },
        },
      }]
    } else {
      throw new BadRequestException(`Unsupported simulation action: ${dto.actionType}`)
    }

    const result = this.engine.applyEvents(branchId, events)
    await this.persistStep(branchId, result.appliedEvents, result.snapshot)
    return result
  }

  private async getState(branchId: string) {
    await this.ensureLoaded(branchId)
    return this.engine.getBranchState(branchId)
  }

  private async ensureLoaded(branchId: string): Promise<void> {
    try {
      this.engine.getBranchState(branchId)
      return
    } catch {
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
      if (!stored || !projection) throw new NotFoundException(`Simulation branch ${branchId} not found`)
      this.engine.restoreBranch({
        id: stored.id,
        name: stored.name,
        kind: stored.kind,
        parentBranchId: stored.parentBranchId ?? undefined,
        forkCursor: (projection.payload as any).cursor,
        rulePolicy: stored.rulePolicy,
        ownerId: stored.ownerId ?? undefined,
        createdAt: stored.createdAt.toISOString(),
      }, projection.payload as any)
    }
  }

  private async persistStep(branchId: string, events: any[], snapshot: any): Promise<void> {
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
            payload: event.payload,
          },
        })
        if (event.type === 'EFFECT_CREATED') {
          const effect = event.payload.effect
          await transaction.worldEffectRecord.create({
            data: {
              id: effect.id,
              branchId,
              abilityId: effect.abilityId,
              kind: effect.kind,
              sourceEntityId: effect.source.id,
              targetEntityIds: effect.targets.map((target: EntityRef) => target.id),
              state: effect.state,
              startedOrdinal: event.cursor.ordinal,
              attributes: effect.attributes,
              anchors: effect.anchors,
            },
          })
        }
      }
      await transaction.worldProjectionSnapshot.create({
        data: {
          branchId,
          projectionKind: 'WORLD_STATE',
          cursorOrdinal: snapshot.cursor.ordinal,
          payload: snapshot,
        },
      })
    })
  }

  private requiredString(payload: Record<string, unknown>, key: string): string {
    const value = payload[key]
    if (typeof value !== 'string' || !value) throw new BadRequestException(`${key} is required`)
    return value
  }
}
