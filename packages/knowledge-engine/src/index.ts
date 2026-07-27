import type { PrismaClient } from '@black-whale/database'
import { isActiveAt, type Fact, type Belief, type KnowledgeState } from '@black-whale/domain'

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
      include: { chapter: true },
    })

    if (!targetEvent) throw new Error(`Event ${query.eventId} not found`)

    const subjectFilter = query.subjectId ? { fact: { subjectId: query.subjectId } } : {}

    const states = await this.prisma.knowledgeState.findMany({
      where: {
        observerCharacterId: query.observerId,
        ...subjectFilter,
      },
      include: {
        fact: true,
        fromEvent: { include: { chapter: true } },
        untilEvent: { include: { chapter: true } },
      },
    })

    return states
      .filter((state) => isActiveAt(state, targetEvent))
      .map((k) => ({
        id: k.id,
        observerCharacterId: k.observerCharacterId,
        factId: k.factId,
        fromEventId: k.fromEventId,
        untilEventId: k.untilEventId ?? undefined,
        epistemicState: k.epistemicState as KnowledgeState['epistemicState'],
        confidence: k.confidence ?? undefined,
        acquisitionMethod: k.acquisitionMethod as KnowledgeState['acquisitionMethod'],
        sourceCharacterId: k.sourceCharacterId ?? undefined,
        acquisitionEventId: k.acquisitionEventId,
      }))
  }

  async getBeliefsOf(query: KnowledgeQuery): Promise<Belief[]> {
    const targetEvent = await this.prisma.narrativeEvent.findUnique({
      where: { id: query.eventId },
      include: { chapter: true },
    })

    if (!targetEvent) throw new Error(`Event ${query.eventId} not found`)

    const subjectFilter = query.subjectId ? { subjectId: query.subjectId } : {}

    const beliefs = await this.prisma.belief.findMany({
      where: {
        observerCharacterId: query.observerId,
        ...subjectFilter,
      },
      include: {
        fromEvent: { include: { chapter: true } },
        untilEvent: { include: { chapter: true } },
      },
    })

    return beliefs
      .filter((belief) => isActiveAt(belief, targetEvent))
      .map((b) => ({
        id: b.id,
        observerCharacterId: b.observerCharacterId,
        subjectType: b.subjectType,
        subjectId: b.subjectId,
        predicate: b.predicate,
        believedValue: b.believedValue,
        fromEventId: b.fromEventId,
        untilEventId: b.untilEventId ?? undefined,
        confidence: b.confidence,
        sourceEventId: b.sourceEventId,
      }))
  }

  async getTrueFacts(eventId: string, subjectId?: string): Promise<Fact[]> {
    const targetEvent = await this.prisma.narrativeEvent.findUnique({
      where: { id: eventId },
      include: { chapter: true },
    })

    if (!targetEvent) throw new Error(`Event ${eventId} not found`)

    const subjectFilter = subjectId ? { subjectId } : {}

    const facts = await this.prisma.fact.findMany({
      where: {
        ...subjectFilter,
      },
      include: {
        fromEvent: { include: { chapter: true } },
        untilEvent: { include: { chapter: true } },
      },
    })

    return facts
      .filter((fact) => isActiveAt(fact, targetEvent))
      .map((f) => ({
        id: f.id,
        subjectType: f.subjectType as Fact['subjectType'],
        subjectId: f.subjectId,
        predicate: f.predicate,
        value: f.value,
        validFromEventId: f.validFromEventId,
        validUntilEventId: f.validUntilEventId ?? undefined,
        truthStatus: f.truthStatus as Fact['truthStatus'],
        firstVisibleEventId: f.firstVisibleEventId,
      }))
  }
}
