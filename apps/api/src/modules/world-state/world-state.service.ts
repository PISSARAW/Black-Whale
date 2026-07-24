import { Injectable } from '@nestjs/common'
import type { WorldStateQuery } from '@black-whale/contracts'

@Injectable()
export class WorldStateService {
  async getWorldState(query: WorldStateQuery) {
    // TODO: delegate to TimelineEngine + IdentityEngine + NenEngine
    return {
      characters: [],
      bodies: [],
      consciousnesses: [],
      locations: [],
      activeAbilities: [],
      presences: [],
      knownFacts: [],
      worldVersion: 1,
      ...query,
    }
  }
}
