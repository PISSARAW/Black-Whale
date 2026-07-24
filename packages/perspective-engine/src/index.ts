import type { Character, Fact, KnowledgeState, Belief, PerspectiveState, PerspectiveRequest, PerspectiveDifference, Body } from '@black-whale/domain'
import type { PrismaClient } from '@black-whale/database'
import type { IIdentityEngine } from '@black-whale/identity-engine'
import type { IKnowledgeEngine, KnowledgeQuery } from '@black-whale/knowledge-engine'

// ──────────────────────────────────────────────
// Interface
// ──────────────────────────────────────────────

export interface IPerspectiveEngine {
  buildPerspective(request: PerspectiveRequest): Promise<PerspectiveState>
  
  comparePerspectives(
    leftRequest: PerspectiveRequest,
    rightRequest: PerspectiveRequest
  ): Promise<PerspectiveDifference[]>
}

// ──────────────────────────────────────────────
// Implementation
// ──────────────────────────────────────────────

export class PerspectiveEngine implements IPerspectiveEngine {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly identityEngine: IIdentityEngine,
    private readonly knowledgeEngine: IKnowledgeEngine
  ) {}

  async buildPerspective(request: PerspectiveRequest): Promise<PerspectiveState> {
    const targetEvent = await this.prisma.narrativeEvent.findUnique({
      where: { id: request.eventId },
      include: { chapter: true }
    })
    
    if (!targetEvent) throw new Error(`Event ${request.eventId} not found`)
    
    // SPOILER FILTER:
    // If the targetEvent happens after the spoilerLimit, we must throw or clamp the event.
    // In this basic implementation, we just throw if the user is requesting an event past their spoiler limit.
    if (targetEvent.chapter.number > request.spoilerLimit) {
      throw new Error(`Spoiler limit exceeded: Event ${request.eventId} is from chapter ${targetEvent.chapter.number}, but limit is ${request.spoilerLimit}`)
    }

    // 1. Identify the Observer's location and identity
    const query: KnowledgeQuery = {
      observerId: request.observerCharacterId,
      eventId: request.eventId
    }
    
    let currentBody: Body | null = null
    let currentConsciousnessId: string | undefined = undefined

    try {
      // Assuming observerId maps to a consciousness, let's find the body
      const consciousness = await this.prisma.consciousness.findUnique({
        where: { originCharacterId: request.observerCharacterId }
      })
      if (consciousness) {
        currentBody = await this.identityEngine.findBodyOf(consciousness.id, request.eventId)
        currentConsciousnessId = consciousness.id
      }
    } catch (e) {
      console.warn(`Could not resolve observer body: ${e}`)
    }

    // 2. Fetch objective true facts
    const trueFacts = await this.knowledgeEngine.getTrueFacts(request.eventId)

    // 3. Fetch knowledge and beliefs
    const knowledge = await this.knowledgeEngine.getKnowledgeOf(query)
    const beliefs = await this.knowledgeEngine.getBeliefsOf(query)

    // 4. Construct subjective facts 
    // This involves replacing objective truths with subjective beliefs
    const subjectiveFacts = trueFacts.map(fact => {
      // Is there a known knowledge state for this fact?
      const kState = knowledge.find(k => k.factId === fact.id)
      
      // Is there a direct false belief overriding this?
      const overridingBelief = beliefs.find(b => 
        b.subjectId === fact.subjectId && b.predicate === fact.predicate
      )

      if (overridingBelief) {
        return {
          ...fact,
          value: overridingBelief.believedValue,
          truthStatus: 'CONTESTED' // Indicates subjective mismatch
        }
      }

      if (kState && (kState.epistemicState === 'KNOWN' || kState.epistemicState === 'BELIEVED')) {
        return fact
      }

      // If the character doesn't know it, we might want to hide it
      // For now, return a hidden/unknown fact marker or just filter it out
      return null
    }).filter(f => f !== null)

    return {
      observer: {
        characterId: request.observerCharacterId,
        consciousnessId: currentConsciousnessId ?? '',
        currentBodyId: currentBody?.id ?? ''
      },
      visibleBodies: [], // Would map physical proximity using Presence
      knownCharacters: [], // Filtered by knowledge
      knownLocations: [],
      knownEvents: [],
      knownFacts: subjectiveFacts,
      beliefs: beliefs,
      unknownElements: [],
      currentBodyId: currentBody?.id,
      currentConsciousnessId
    }
  }

  async comparePerspectives(leftRequest: PerspectiveRequest, rightRequest: PerspectiveRequest): Promise<PerspectiveDifference[]> {
    if (leftRequest.eventId !== rightRequest.eventId) {
      throw new Error("Cannot compare perspectives at different events")
    }

    const leftState = await this.buildPerspective(leftRequest)
    const rightState = await this.buildPerspective(rightRequest)

    const differences: PerspectiveDifference[] = []

    // 1. Compare Facts
    const allSubjectIds = new Set([
      ...leftState.knownFacts.map(f => f.subjectId),
      ...rightState.knownFacts.map(f => f.subjectId)
    ])

    for (const subjectId of allSubjectIds) {
      const leftFacts = leftState.knownFacts.filter(f => f.subjectId === subjectId)
      const rightFacts = rightState.knownFacts.filter(f => f.subjectId === subjectId)
      
      // Compare predicates
      const allPredicates = new Set([
        ...leftFacts.map(f => f.predicate),
        ...rightFacts.map(f => f.predicate)
      ])

      for (const predicate of allPredicates) {
        const leftFact = leftFacts.find(f => f.predicate === predicate)
        const rightFact = rightFacts.find(f => f.predicate === predicate)

        if (leftFact && !rightFact) {
          differences.push({
            subjectId,
            subjectType: leftFact.subjectType,
            dimension: 'BELIEF',
            leftValue: leftFact.value,
            rightValue: null,
            differenceType: 'LEFT_ONLY'
          })
        } else if (!leftFact && rightFact) {
          differences.push({
            subjectId,
            subjectType: rightFact.subjectType,
            dimension: 'BELIEF',
            leftValue: null,
            rightValue: rightFact.value,
            differenceType: 'RIGHT_ONLY'
          })
        } else if (leftFact && rightFact) {
          if (JSON.stringify(leftFact.value) !== JSON.stringify(rightFact.value)) {
            differences.push({
              subjectId,
              subjectType: leftFact.subjectType,
              dimension: 'BELIEF',
              leftValue: leftFact.value,
              rightValue: rightFact.value,
              differenceType: 'CONTRADICTION'
            })
          }
        }
      }
    }

    return differences
  }
}
