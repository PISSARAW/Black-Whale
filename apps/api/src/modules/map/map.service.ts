import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { MapEngine } from '@black-whale/map-engine'

@Injectable()
export class MapService {
  private readonly mapEngine: MapEngine

  constructor(private readonly prisma: PrismaService) {
    this.mapEngine = new MapEngine(this.prisma)
  }

  async getMapState(eventId: string) {
    return this.mapEngine.getMapState(eventId)
  }

  async getEntityPresence(entityId: string, eventId: string) {
    const location = await this.mapEngine.getEntityLocation(entityId, eventId)
    return {
      entityId,
      eventId,
      locationId: location?.id || null,
      locationName: location?.name || null,
      certainty: location ? 'confirmed' : 'unknown'
    }
  }
}
