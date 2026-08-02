import type { Certainty, KnowledgeLedger } from './knowledge'
import { propositionState } from './knowledge'

export interface ReasoningPath {
  id: string
  allOf?: string[]
  anyOf?: string[]
  noneOf?: string[]
  weight: number
}

export interface InvestigationConclusion {
  id: string
  paths: ReasoningPath[]
  refutedBy: string[]
  canonical: boolean
}

export interface ConclusionAssessment {
  conclusionId: string
  status: 'unexplored' | 'partial' | 'supported' | 'established' | 'refuted'
  score: number
  satisfiedPathIds: string[]
  missingPropositionIds: string[]
  conflictingPropositionIds: string[]
}

export function assessConclusion(
  ledger: KnowledgeLedger,
  conclusion: InvestigationConclusion,
  viewerId?: string,
): ConclusionAssessment {
  const states = new Map<string, Certainty>()
  const stateOf = (id: string) => {
    const cached = states.get(id)
    if (cached) return cached
    const certainty = propositionState(ledger, id, viewerId).certainty
    states.set(id, certainty)
    return certainty
  }
  const refutations = conclusion.refutedBy.filter((id) => isSupported(stateOf(id)))
  if (refutations.length > 0) {
    return {
      conclusionId: conclusion.id,
      status: 'refuted',
      score: 0,
      satisfiedPathIds: [],
      missingPropositionIds: [],
      conflictingPropositionIds: refutations,
    }
  }

  const paths = conclusion.paths.map((path) => evaluatePath(path, stateOf))
  const satisfied = paths.filter((path) => path.satisfied)
  const best = [...paths].sort((a, b) => b.ratio * b.weight - a.ratio * a.weight)[0]
  const score = Math.round(Math.min(1, Math.max(0, best?.ratio ?? 0)) * 100)
  const established = satisfied.some((path) => path.weight >= 1)
  const supported = satisfied.length > 0

  return {
    conclusionId: conclusion.id,
    status: established
      ? 'established'
      : supported
        ? 'supported'
        : score > 0
          ? 'partial'
          : 'unexplored',
    score,
    satisfiedPathIds: satisfied.map((path) => path.id),
    missingPropositionIds: best?.missing ?? [],
    conflictingPropositionIds: best?.conflicting ?? [],
  }
}

function evaluatePath(path: ReasoningPath, stateOf: (id: string) => Certainty) {
  const allOf = path.allOf ?? []
  const anyOf = path.anyOf ?? []
  const noneOf = path.noneOf ?? []
  const missing = allOf.filter((id) => !isSupported(stateOf(id)))
  const anySatisfied = anyOf.length === 0 || anyOf.some((id) => isSupported(stateOf(id)))
  if (!anySatisfied) missing.push(...anyOf)
  const conflicting = noneOf.filter((id) => isSupported(stateOf(id)))
  const requiredGroups = allOf.length + (anyOf.length > 0 ? 1 : 0) + noneOf.length
  const metGroups =
    allOf.length -
    missing.filter((id) => allOf.includes(id)).length +
    (anyOf.length > 0 && anySatisfied ? 1 : 0) +
    noneOf.length -
    conflicting.length

  return {
    id: path.id,
    weight: path.weight,
    satisfied: missing.length === 0 && conflicting.length === 0,
    ratio: requiredGroups === 0 ? 1 : metGroups / requiredGroups,
    missing: [...new Set(missing)],
    conflicting,
  }
}

function isSupported(certainty: Certainty) {
  return certainty === 'probable' || certainty === 'established'
}
