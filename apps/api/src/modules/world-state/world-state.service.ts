import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { TimelineEngine } from '@black-whale/timeline-engine'
import type { WorldStateQuery } from '@black-whale/contracts'
import { buildCanonicalCursors } from '@black-whale/world-engine'

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

  async listEvents(spoilerLimit?: number) {
    const events = await this.prisma.narrativeEvent.findMany({
      where: Number.isFinite(spoilerLimit) ? { chapter: { number: { lte: spoilerLimit } } } : undefined,
      include: { chapter: true },
      orderBy: [{ chapter: { number: 'asc' } }, { sequence: 'asc' }],
    })
    const cursorByEvent = new Map(buildCanonicalCursors(events).map((cursor) => [cursor.eventId, cursor]))
    return events.map((event) => ({ ...event, cursor: cursorByEvent.get(event.id) }))
  }
}
