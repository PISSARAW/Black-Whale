import type { PrismaClient } from '@black-whale/database'
import type { Fact, Belief, KnowledgeState } from '@black-whale/domain'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface KnowledgeQuery {
  observerId: string
  eventId: string
  subjectId?: string
}

// ──────────────────────────────────────────────
// Interface
// ──────────────────────────────────────────────

export interface IKnowledgeEngine {
  /**
   * Returns all facts an observer knows or believes at a given point in time,
   * including their belief status and confidence level.
   */
  getKnowledgeOf(query: KnowledgeQuery): Promise<KnowledgeState[]>

  /**
   * Returns the facts that are TRUE at a given event, regardless of who knows them.
   */
  getTrueFacts(eventId: string, subjectId?: string): Promise<Fact[]>

  /**
   * Returns beliefs that the observer holds that are not necessarily tied to a true fact.
   */
  getBeliefsOf(query: KnowledgeQuery): Promise<Belief[]>
}

// ──────────────────────────────────────────────
// Stub
// ──────────────────────────────────────────────

export class KnowledgeEngine implements IKnowledgeEngine {
  constructor(private readonly prisma: PrismaClient) {}

  async getKnowledgeOf(query: KnowledgeQuery): Promise<KnowledgeState[]> {
    const targetEvent = await this.prisma.narrativeEvent.findUnique({
      where: { id: query.eventId }
    })
    
    if (!targetEvent) throw new Error(`Event ${query.eventId} not found`)

    const subjectFilter = query.subjectId ? { fact: { subjectId: query.subjectId } } : {}

    const states = await this.prisma.knowledgeState.findMany({
      where: {
        observerCharacterId: query.observerId,
        fromEvent: {
          sequence: { lte: targetEvent.sequence }
        },
        OR: [
          { untilEventId: null },
          { untilEvent: { sequence: { gt: targetEvent.sequence } } }
        ],
        ...subjectFilter
      },
      include: {
        fact: true
      }
    })

    return states.map((k: any) => ({
      id: k.id,
      observerCharacterId: k.observerCharacterId,
      factId: k.factId,
      fromEventId: k.fromEventId,
      untilEventId: k.untilEventId ?? undefined,
      epistemicState: k.epistemicState as any,
      confidence: k.confidence ?? undefined,
      acquisitionMethod: k.acquisitionMethod as any,
      sourceCharacterId: k.sourceCharacterId ?? undefined,
      acquisitionEventId: k.acquisitionEventId
    }))
  }

  async getBeliefsOf(query: KnowledgeQuery): Promise<Belief[]> {
    const targetEvent = await this.prisma.narrativeEvent.findUnique({
      where: { id: query.eventId }
    })
    
    if (!targetEvent) throw new Error(`Event ${query.eventId} not found`)

    const subjectFilter = query.subjectId ? { subjectId: query.subjectId } : {}

    const beliefs = await this.prisma.belief.findMany({
      where: {
        observerCharacterId: query.observerId,
        fromEvent: {
          sequence: { lte: targetEvent.sequence }
        },
        OR: [
          { untilEventId: null },
          { untilEvent: { sequence: { gt: targetEvent.sequence } } }
        ],
        ...subjectFilter
      }
    })

    return beliefs.map((b: any) => ({
      id: b.id,
      observerCharacterId: b.observerCharacterId,
      subjectType: b.subjectType,
      subjectId: b.subjectId,
      predicate: b.predicate,
      believedValue: b.believedValue,
      fromEventId: b.fromEventId,
      untilEventId: b.untilEventId ?? undefined,
      confidence: b.confidence,
      sourceEventId: b.sourceEventId
    }))
  }

  async getTrueFacts(eventId: string, subjectId?: string): Promise<Fact[]> {
    const targetEvent = await this.prisma.narrativeEvent.findUnique({
      where: { id: eventId }
    })
    
    if (!targetEvent) throw new Error(`Event ${eventId} not found`)

    const subjectFilter = subjectId ? { subjectId } : {}

    const facts = await this.prisma.fact.findMany({
      where: {
        fromEvent: {
          sequence: { lte: targetEvent.sequence }
        },
        OR: [
          { validUntilEventId: null },
          { untilEvent: { sequence: { gt: targetEvent.sequence } } }
        ],
        ...subjectFilter
      }
    })

    return facts.map((f: any) => ({
      id: f.id,
      subjectType: f.subjectType as any,
      subjectId: f.subjectId,
      predicate: f.predicate,
      value: f.value,
      validFromEventId: f.validFromEventId,
      validUntilEventId: f.validUntilEventId ?? undefined,
      truthStatus: f.truthStatus as any,
      firstVisibleEventId: f.firstVisibleEventId
    }))
  }
}
