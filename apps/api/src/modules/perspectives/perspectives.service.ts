import { Injectable } from '@nestjs/common'
import type { PerspectiveQuery } from '@black-whale/contracts'
import { PrismaService } from '../prisma/prisma.service.js'
import { PerspectiveEngine } from '@black-whale/perspective-engine'
import { IdentityEngine } from '@black-whale/identity-engine'
import { KnowledgeEngine } from '@black-whale/knowledge-engine'
import type { PerspectiveRequest } from '@black-whale/domain'

@Injectable()
export class PerspectivesService {
  private readonly perspectiveEngine: PerspectiveEngine

  constructor(private readonly prisma: PrismaService) {
    const identityEngine = new IdentityEngine(this.prisma)
    const knowledgeEngine = new KnowledgeEngine(this.prisma)
    this.perspectiveEngine = new PerspectiveEngine(this.prisma, identityEngine, knowledgeEngine)
  }

  async buildPerspective(query: PerspectiveQuery) {
    const request: PerspectiveRequest = {
      observerCharacterId: query.observerId,
      eventId: query.eventId,
      spoilerLimit: query.spoilerLimit ?? Number.POSITIVE_INFINITY
    }

    const perspective = await this.perspectiveEngine.buildPerspective(request)

    return {
      observerId: query.observerId,
      eventId: query.eventId,
      mode: query.mode ?? 'character',
      ...perspective
    }
  }

  async compare(leftId: string, rightId: string, eventId: string) {
    return this.perspectiveEngine.comparePerspectives(
      {
        observerCharacterId: leftId,
        eventId,
        spoilerLimit: Number.POSITIVE_INFINITY
      },
      {
        observerCharacterId: rightId,
        eventId,
        spoilerLimit: Number.POSITIVE_INFINITY
      }
    )
  }
}
