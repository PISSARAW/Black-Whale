import { Injectable } from '@nestjs/common'

@Injectable()
export class MapService {
  async getMapState(eventId: string) {
    // TODO: delegate to MapEngine
    return { atEventId: eventId, layers: [], entityPositions: {} }
  }

  async getEntityPresence(entityId: string, eventId: string) {
    // TODO: delegate to MapEngine
    return { entityId, eventId, locationId: null, certainty: 'unknown' }
  }
}
