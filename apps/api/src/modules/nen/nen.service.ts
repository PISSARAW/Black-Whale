import { Injectable, OnModuleInit } from '@nestjs/common'
import type { NenValidateRequestDto } from '@black-whale/contracts'
import { NenEngine } from '@black-whale/nen-engine'
import { bungeeGum } from '@black-whale/ability-modules'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

@Injectable()
export class NenService implements OnModuleInit {
  private readonly engine: NenEngine
  private abilitiesCache: any[] = []

  constructor() {
    this.engine = new NenEngine()
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
    return this.engine.validate({
      abilityId,
      actorId: dto.actorId,
      targets: dto.targets,
      eventId: dto.eventId
    })
  }
}
