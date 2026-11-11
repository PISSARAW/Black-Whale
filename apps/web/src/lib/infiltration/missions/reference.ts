import { MISSIONS } from './definitions'
import type { MissionDefinition } from './types'

export const REFERENCE_MISSION_ID = 'missing-report' as const

/** Acceptance contract for the one mission that must exercise the complete core loop. */
export function referenceMissionIssues(
  mission: MissionDefinition = MISSIONS[REFERENCE_MISSION_ID],
) {
  const issues: string[] = []
  const requiredKinds = new Set(
    mission.objectives.filter((objective) => objective.required).map((objective) => objective.kind),
  )
  if (!requiredKinds.has('copy')) issues.push('missing-information-objective')
  if (!requiredKinds.has('extract')) issues.push('missing-extraction-objective')
  if (!mission.objectives.some((objective) => objective.kind === 'identify')) {
    issues.push('missing-verification-objective')
  }
  for (const lesson of [
    'movement',
    'vision',
    'sound',
    'social',
    'nen',
    'traces',
    'hatsu',
  ] as const) {
    if (!mission.teaching.includes(lesson)) issues.push(`missing-${lesson}-lesson`)
  }
  if (mission.variants.length < 3) issues.push('insufficient-routes')
  return issues
}

export function referenceMissionReady(): boolean {
  return referenceMissionIssues().length === 0
}
