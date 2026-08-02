import type { MissionObjective, ObjectiveState } from './types'

export function initialObjectives(
  definitions: Omit<MissionObjective, 'state'>[],
): MissionObjective[] {
  return definitions.map((objective) => ({ ...objective, state: 'unknown' }))
}

export function setObjective(
  objectives: MissionObjective[],
  id: string,
  state: ObjectiveState,
): MissionObjective[] {
  return objectives.map((objective) => (objective.id === id ? { ...objective, state } : objective))
}

export function objectivesPermitExtraction(objectives: MissionObjective[]): boolean {
  return objectives
    .filter((objective) => objective.required && objective.kind !== 'extract')
    .every((objective) => objective.state === 'confirmed' || objective.state === 'believed')
}

export function objectiveTruth(objectives: MissionObjective[]) {
  const acquired = objectives.filter((objective) => objective.kind !== 'extract')
  return {
    acquired: acquired.filter((objective) => objective.state !== 'unknown').length,
    confirmed: acquired.filter((objective) => objective.state === 'confirmed').length,
    false: acquired.filter((objective) => objective.state === 'invalidated').length,
  }
}
