import type { MissionObjective, ObjectiveState } from './types'

export type MissionObjectiveAction =
  'COPY' | 'VERIFY' | 'FOLLOW' | 'PLANT' | 'ESCORT' | 'PERFORM_DUTY'

const ACTION_BY_KIND: Partial<Record<MissionObjective['kind'], MissionObjectiveAction>> = {
  copy: 'COPY',
  identify: 'VERIFY',
  follow: 'FOLLOW',
  plant: 'PLANT',
  escort: 'ESCORT',
  duty: 'PERFORM_DUTY',
}

export function nextObjectiveAction(objectives: MissionObjective[]): MissionObjectiveAction | null {
  const required = objectives.find(
    (objective) =>
      objective.required && objective.kind !== 'extract' && objective.state === 'unknown',
  )
  const optional = objectives.find(
    (objective) =>
      !objective.required && objective.kind !== 'extract' && objective.state === 'unknown',
  )
  return ACTION_BY_KIND[(required ?? optional)?.kind ?? 'extract'] ?? null
}

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

/**
 * Settles the objective an action stands for. `kinds` is in order of
 * preference, but an open required objective always wins over an optional
 * one: a mission whose optional duty shares the action's kind (the
 * compromised shift's `perform-duty`) cannot swallow the required one.
 */
export function completeObjective(
  objectives: MissionObjective[],
  kinds: MissionObjective['kind'][],
  result: ObjectiveState,
): MissionObjective[] {
  const open = objectives.filter((objective) => objective.state === 'unknown')
  const pick = (required: boolean) =>
    kinds
      .map((kind) => open.find((item) => item.kind === kind && item.required === required))
      .find(Boolean)
  const objective =
    pick(true) ?? pick(false) ?? objectives.find((item) => kinds.includes(item.kind))
  return objective ? setObjective(objectives, objective.id, result) : objectives
}
