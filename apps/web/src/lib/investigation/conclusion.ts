import type { InvestigationCase, Verdict } from './case'
import type { ConclusionDefinition } from './definition'
import { assessPlayableHypothesis } from './v3Runtime'

export interface ComposedConclusionAssessment {
  complete: boolean
  hypothesisId: string | null
  conflictingOptionIds: string[]
  verdict: Verdict | null
}

/** Resolves independently chosen conclusion facets without exposing a hypothesis selector. */
export function assessComposedConclusion(input: {
  investigation: InvestigationCase
  definition: ConclusionDefinition
  selections: Record<string, string>
  evidenceIds: Iterable<string>
}): ComposedConclusionAssessment {
  const options = input.definition.dimensions.map((dimension) =>
    dimension.options.find((option) => option.id === input.selections[dimension.id]),
  )
  if (options.some((option) => !option)) {
    return { complete: false, hypothesisId: null, conflictingOptionIds: [], verdict: null }
  }

  const selected = options.filter((option) => option !== undefined)
  const candidates = input.investigation.hypotheses.filter((hypothesis) =>
    selected.every((option) => option.hypothesisIds.includes(hypothesis.id)),
  )
  if (candidates.length !== 1) {
    return {
      complete: true,
      hypothesisId: null,
      conflictingOptionIds: selected.map((option) => option.id),
      verdict: null,
    }
  }

  const hypothesisId = candidates[0].id
  return {
    complete: true,
    hypothesisId,
    conflictingOptionIds: [],
    verdict: assessPlayableHypothesis(input.investigation, hypothesisId, input.evidenceIds),
  }
}
