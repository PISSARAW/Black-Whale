import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { MapEngine } from '@black-whale/map-engine'
import { TimelineEngine } from '@black-whale/timeline-engine'
import { projectMapScene } from '@black-whale/world-engine'

@Injectable()
export class MapService {
  private readonly mapEngine: MapEngine
  private readonly timelineEngine: TimelineEngine

  constructor(private readonly prisma: PrismaService) {
    this.mapEngine = new MapEngine(this.prisma)
    this.timelineEngine = new TimelineEngine(this.prisma)
  }

  async getMapState(eventId: string) {
    return this.mapEngine.getMapState(eventId)
  }

  async getMapScene(eventId: string, assetKey: string) {
    const state = await this.timelineEngine.getKernelState({ eventId })
    return projectMapScene(state, { assetKey })
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
