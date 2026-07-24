import { Injectable } from '@nestjs/common'
import type { PerspectiveQuery } from '@black-whale/contracts'

@Injectable()
export class PerspectivesService {
  async buildPerspective(query: PerspectiveQuery) {
    // TODO: delegate to PerspectiveEngine
    return {
      observerId: query.observerId,
      eventId: query.eventId,
      mode: query.mode ?? 'character',
      visibleCharacters: [],
      believedPositions: {},
      hiddenAbilities: [],
      suspectedThreats: [],
      falseInformation: [],
      knownDeaths: [],
      knowledgeItems: [],
    }
  }

  async compare(leftId: string, rightId: string, eventId: string) {
    const [left, right] = await Promise.all([
      this.buildPerspective({ observerId: leftId, eventId }),
      this.buildPerspective({ observerId: rightId, eventId }),
    ])
    return { left, right, divergingFacts: [], divergingPositions: {} }
  }
}
