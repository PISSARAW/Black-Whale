import type {
  CareerMatch,
  CareerProfile,
  OpponentKnowledgeEntry,
  OpponentKnowledgeFact,
} from './types'

/** Folds visible match discoveries into a persistent, descriptive dossier. */
function observedFacts(intel: NonNullable<CareerMatch['intel']>): OpponentKnowledgeFact[] {
  const facts: OpponentKnowledgeFact[] = []
  if (intel.auraObserved) facts.push('aura')
  if (intel.kameoRevealed) facts.push('kameo')
  for (const condition of intel.revealedConditions) facts.push(`condition:${condition}`)
  return facts
}

export function rememberOpponentIntel(
  knowledge: CareerProfile['opponentKnowledge'],
  match: CareerMatch,
): CareerProfile['opponentKnowledge'] {
  if (!match.intel) return knowledge
  const facts = observedFacts(match.intel)
  if (facts.length === 0) return knowledge

  const previous = knowledge[match.opponent]?.entries ?? []
  const entries = new Map(previous.map((entry) => [entry.fact, entry]))
  for (const fact of facts) {
    const old = entries.get(fact)
    const observations = (old?.observations ?? 0) + 1
    entries.set(fact, {
      fact,
      observations,
      confidence: confidenceFor(observations),
      lastMatchId: match.id,
      lastSeenAt: match.at,
    })
  }
  return {
    ...knowledge,
    [match.opponent]: {
      opponent: match.opponent,
      entries: [...entries.values()].sort(compareKnowledge).slice(0, 32),
    },
  }
}

function confidenceFor(observations: number): OpponentKnowledgeEntry['confidence'] {
  return observations >= 3 ? 'established' : observations >= 2 ? 'confirmed' : 'suspected'
}

function compareKnowledge(left: OpponentKnowledgeEntry, right: OpponentKnowledgeEntry): number {
  return right.lastSeenAt - left.lastSeenAt || left.fact.localeCompare(right.fact)
}
