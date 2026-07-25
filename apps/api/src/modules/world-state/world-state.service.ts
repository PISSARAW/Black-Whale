import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { TimelineEngine } from '@black-whale/timeline-engine'
import type { WorldStateQuery } from '@black-whale/contracts'

@Injectable()
export class WorldStateService {
  private readonly timelineEngine: TimelineEngine

  constructor(private readonly prisma: PrismaService) {
    this.timelineEngine = new TimelineEngine(this.prisma)
  }

  async getWorldState(query: WorldStateQuery) {
    // Delegate to TimelineEngine
    const point = {
      eventId: query.eventId,
      chapterId: query.chapterId,
      sequence: undefined as number | undefined
    }
    
    const worldState = await this.timelineEngine.getWorldState(point)
    
    return {
      ...worldState,
      worldVersion: 1,
      ...query,
    }
  }
}
