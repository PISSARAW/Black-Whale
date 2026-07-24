import { Injectable } from '@nestjs/common'
import type { NenValidateRequestDto } from '@black-whale/contracts'

@Injectable()
export class NenService {
  async listAbilities() {
    // TODO: query DB
    return []
  }

  async getActiveState(abilityId: string, eventId: string) {
    // TODO: delegate to NenEngine
    return { abilityId, eventId, state: 'inactive' }
  }

  async validate(abilityId: string, dto: NenValidateRequestDto) {
    // TODO: delegate to NenEngine
    return { allowed: false, reason: 'NenEngine not yet implemented' }
  }
}
