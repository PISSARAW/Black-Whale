import { Injectable, OnModuleInit } from '@nestjs/common'
import type { NenValidateRequestDto } from '@black-whale/contracts'
import { NenEngine, type AbilityContext, type AbilityResult } from '@black-whale/nen-engine'
import { bungeeGum } from '@black-whale/ability-modules'
import { TimelineEngine } from '@black-whale/timeline-engine'
import type { EntityRef, WorldState } from '@black-whale/world-engine'
import { PrismaService } from '../prisma/prisma.service.js'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

@Injectable()
export class NenService implements OnModuleInit {
  private readonly engine: NenEngine
  private readonly timeline: TimelineEngine
  private abilitiesCache: any[] = []

  constructor(private readonly prisma: PrismaService) {
    this.engine = new NenEngine()
    this.timeline = new TimelineEngine(prisma)
  }

  async onModuleInit() {
    this.engine.registerModule(bungeeGum)
    await this.loadAbilities()
  }

  private async loadAbilities() {
    try {
      // __dirname is available at runtime in CommonJS
      // From dist/modules/nen, go up to project root: ../../../../../
      const dataPath = join(__dirname, '../../../../../data/abilities/abilities.json')
      const file = await readFile(dataPath, 'utf-8')
      this.abilitiesCache = JSON.parse(file)
    } catch (e) {
      console.error('Could not load abilities.json, using fallback:', e)
      this.abilitiesCache = [
        { id: 'bungee-gum', name: 'Bungee Gum', ownerId: 'hisoka', category: 'transmuter', description: "Hisoka's Nen has properties of both rubber and gum.", canonStatus: 'canon', moduleKey: 'bungee-gum' }
      ]
    }
  }

  async listAbilities() {
    return this.abilitiesCache.map(a => ({
      id: a.id,
      name: a.name,
      owner: a.ownerId,
      category: a.category,
      description: a.description,
      canonStatus: a.canonStatus
    }))
  }

  async getActiveState(abilityId: string, eventId: string) {
    const active = await this.engine.getActiveAbilities(eventId)
    const ability = active.find(a => a.abilityId === abilityId)
    return { abilityId, eventId, state: ability ? ability.state : 'inactive' }
  }

  async validate(abilityId: string, dto: NenValidateRequestDto) {
    return this.engine.validate(await this.contextFromEvent(abilityId, dto))
  }

  async plan(abilityId: string, dto: NenValidateRequestDto) {
    return this.engine.plan(await this.contextFromEvent(abilityId, dto))
  }

  async executeInState(abilityId: string, dto: NenValidateRequestDto, worldState: WorldState): Promise<AbilityResult> {
    return this.engine.execute(await this.buildContext(abilityId, dto, worldState))
  }

  private async contextFromEvent(abilityId: string, dto: NenValidateRequestDto): Promise<AbilityContext> {
    const worldState = await this.timeline.getKernelState({ eventId: dto.eventId })
    return this.buildContext(abilityId, dto, worldState)
  }

  private async buildContext(abilityId: string, dto: NenValidateRequestDto, worldState: WorldState): Promise<AbilityContext> {
    const actor = await this.resolveEntity(dto.actorId, worldState, 'CHARACTER')
    const targetRefs = await Promise.all(dto.targets.map((target) => this.resolveEntity(target, worldState, 'OBJECT')))
    const catalogAbility = this.abilitiesCache.find((ability) => ability.id === abilityId)
    if (catalogAbility?.ownerId === dto.actorId || catalogAbility?.ownerId === actor.id) {
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
      eventId: dto.eventId,
      actionId: dto.actionId ?? dto.interaction,
      parameters: dto.parameters,
      anchors: dto.anchors?.map((anchor) => ({
        entity: anchor.entityId ? targetRefs.find((target) => target.id === anchor.entityId) : undefined,
        locationId: anchor.locationId,
        point: anchor.point,
      })),
      cursor: worldState.cursor,
      worldState,
    }
  }

  private async resolveEntity(reference: string, state: WorldState, fallbackKind: EntityRef['kind']): Promise<EntityRef> {
    const direct = state.entities[reference]
    if (direct) return { id: direct.id, kind: direct.kind }
    const character = await this.prisma.character.findUnique({ where: { slug: reference } })
    if (character && state.entities[character.id]) return { id: character.id, kind: 'CHARACTER' }
    return { id: reference, kind: fallbackKind }
  }
}
