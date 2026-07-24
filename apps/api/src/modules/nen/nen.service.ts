import { Injectable, OnModuleInit } from '@nestjs/common'
import type { NenValidateRequestDto } from '@black-whale/contracts'
import { NenEngine } from '@black-whale/nen-engine'
import { bungeeGum } from '@black-whale/ability-modules'

@Injectable()
export class NenService implements OnModuleInit {
  private readonly engine: NenEngine

  constructor() {
    this.engine = new NenEngine()
  }

  onModuleInit() {
    this.engine.registerModule(bungeeGum)
  }

  async listAbilities() {
    return [
      { id: 'bungee-gum', name: 'Bungee Gum', owner: 'hisoka' }
    ]
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
