import type { BranchDifference } from './comparison'
import type { ReconstructionReplay } from './replay'

export interface ReconstructionReport {
  scenarioId: string
  title: string
  forkEventId: string
  mode: 'strict-canon' | 'rule-compatible'
  fidelity: 'canonical' | 'compatible-divergence' | 'speculative'
  divergenceDecisionId: string | null
  summary: string
  appliedDecisionIds: string[]
  blockedDecisions: Array<{ decisionId: string; reason: string }>
  invalidatedDecisions: Array<{ decisionId: string; reason: string }>
  decisiveHatsu: Array<{ decisionId: string; abilityId: string }>
  affectedSubjects: string[]
  differences: BranchDifference[]
  assumptions: string[]
}

export function buildReconstructionReport(
  replay: ReconstructionReplay,
  differences: readonly BranchDifference[],
): ReconstructionReport {
  const appliedDecisionIds = replay.steps
    .filter((step) => step.status === 'applied')
    .map((step) => step.decisionId)
  const differenceList = [...differences]
  const divergenceDecisionId = differenceList.length > 0 ? (appliedDecisionIds[0] ?? null) : null
  const blockedDecisions = replay.steps
    .filter((step) => step.status === 'blocked')
    .map(({ decisionId, reason }) => ({ decisionId, reason }))
  const invalidatedDecisions = replay.steps
    .filter((step) => step.status === 'invalidated')
    .map(({ decisionId, reason }) => ({ decisionId, reason }))
  const applied = new Set(appliedDecisionIds)
  const decisiveHatsu = replay.scenario.decisions.flatMap((decision) =>
    decision.kind === 'ACTIVATE_HATSU' && applied.has(decision.id)
      ? [{ decisionId: decision.id, abilityId: String(decision.parameters['abilityId'] ?? '') }]
      : [],
  )
  const affectedSubjects = [...new Set(differenceList.map((difference) => difference.subjectId))]
  const fidelity = reportFidelity(replay, differenceList)

  return {
    scenarioId: replay.scenario.id,
    title: replay.scenario.title,
    forkEventId: replay.scenario.forkEventId,
    mode: replay.scenario.mode,
    fidelity,
    divergenceDecisionId,
    summary:
      differenceList.length === 0
        ? 'La branche rejoint l’état canonique sur les axes comparés.'
        : `${affectedSubjects.length} sujet(s) divergent sur ${differenceList.length} axe(s).`,
    appliedDecisionIds,
    blockedDecisions,
    invalidatedDecisions,
    decisiveHatsu,
    affectedSubjects,
    differences: differenceList,
    assumptions: replay.scenario.decisions.flatMap((decision) =>
      decision.preconditions.map(
        (precondition) =>
          `${decision.id}: ${precondition.kind}(${precondition.subjectId}) = ${precondition.expected}`,
      ),
    ),
  }
}

function reportFidelity(
  replay: ReconstructionReplay,
  differences: readonly BranchDifference[],
): ReconstructionReport['fidelity'] {
  if (replay.steps.some((step) => step.status === 'invalidated')) return 'speculative'
  if (differences.length === 0) return 'canonical'
  return replay.scenario.mode === 'strict-canon' ? 'speculative' : 'compatible-divergence'
}
