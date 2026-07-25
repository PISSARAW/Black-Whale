import type { PrismaClient } from '@black-whale/database'
import type { Fact, Belief, KnowledgeState } from '@black-whale/domain'

type OrderedEvent = {
  sequence: number
  chapter: { number: number }
}

function compareEventOrder(left: OrderedEvent, right: OrderedEvent) {
  return left.chapter.number - right.chapter.number || left.sequence - right.sequence
}

function isActiveAt(
  record: { fromEvent: OrderedEvent; untilEvent?: OrderedEvent | null },
  targetEvent: OrderedEvent
) {
  return compareEventOrder(record.fromEvent, targetEvent) <= 0
    && (!record.untilEvent || compareEventOrder(targetEvent, record.untilEvent) < 0)
}

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
      where: { id: query.eventId },
      include: { chapter: true }
    })
    
    if (!targetEvent) throw new Error(`Event ${query.eventId} not found`)

    const subjectFilter = query.subjectId ? { fact: { subjectId: query.subjectId } } : {}

    const states = await this.prisma.knowledgeState.findMany({
      where: {
        observerCharacterId: query.observerId,
        ...subjectFilter
      },
      include: {
        fact: true,
        fromEvent: { include: { chapter: true } },
        untilEvent: { include: { chapter: true } }
      }
    })

    return states.filter((state: any) => isActiveAt(state, targetEvent as any)).map((k: any) => ({
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
      where: { id: query.eventId },
      include: { chapter: true }
    })
    
    if (!targetEvent) throw new Error(`Event ${query.eventId} not found`)

    const subjectFilter = query.subjectId ? { subjectId: query.subjectId } : {}

    const beliefs = await this.prisma.belief.findMany({
      where: {
        observerCharacterId: query.observerId,
        ...subjectFilter
      },
      include: {
        fromEvent: { include: { chapter: true } },
        untilEvent: { include: { chapter: true } }
      }
    })

    return beliefs.filter((belief: any) => isActiveAt(belief, targetEvent as any)).map((b: any) => ({
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
      where: { id: eventId },
      include: { chapter: true }
    })
    
    if (!targetEvent) throw new Error(`Event ${eventId} not found`)

    const subjectFilter = subjectId ? { subjectId } : {}

    const facts = await this.prisma.fact.findMany({
      where: {
        ...subjectFilter
      },
      include: {
        fromEvent: { include: { chapter: true } },
        untilEvent: { include: { chapter: true } }
      }
    })

    return facts.filter((fact: any) => isActiveAt(fact, targetEvent as any)).map((f: any) => ({
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
