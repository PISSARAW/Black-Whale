import type { Fact, FactKnowledge, BeliefStatus } from '@black-whale/domain'

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
  getKnowledgeOf(query: KnowledgeQuery): Promise<FactKnowledge[]>

  /**
   * Returns the facts that are TRUE at a given event, regardless of who knows them.
   */
  getTrueFacts(eventId: string, subjectId?: string): Promise<Fact[]>

  /**
   * Record that an observer has learned a fact at a given event.
   */
  recordLearned(
    observerId: string,
    factId: string,
    atEventId: string,
    belief: BeliefStatus,
    confidence: number,
  ): Promise<FactKnowledge>

  /**
   * Record that an observer no longer believes / has forgotten a fact.
   */
  recordForgotten(observerId: string, factId: string, atEventId: string): Promise<void>
}

// ──────────────────────────────────────────────
// Stub
// ──────────────────────────────────────────────

export class KnowledgeEngine implements IKnowledgeEngine {
  async getKnowledgeOf(query: KnowledgeQuery): Promise<FactKnowledge[]> {
    throw new Error(`KnowledgeEngine.getKnowledgeOf not implemented — ${JSON.stringify(query)}`)
  }

  async getTrueFacts(eventId: string, subjectId?: string): Promise<Fact[]> {
    throw new Error(`KnowledgeEngine.getTrueFacts not implemented — eventId: ${eventId}, subjectId: ${subjectId}`)
  }

  async recordLearned(
    observerId: string,
    factId: string,
    atEventId: string,
    belief: BeliefStatus,
    confidence: number,
  ): Promise<FactKnowledge> {
    throw new Error(`KnowledgeEngine.recordLearned not implemented`)
  }

  async recordForgotten(observerId: string, factId: string, atEventId: string): Promise<void> {
    throw new Error(`KnowledgeEngine.recordForgotten not implemented`)
  }
}
