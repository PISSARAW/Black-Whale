import type { StrategyDoctrine, StrategyObjective } from './rules'
import type { StrategyObjectiveKind } from './scenario/types'

export type AIIntentKind = 'EXPAND' | 'INVESTIGATE' | 'CONSOLIDATE' | 'HOLD'

export interface FactionAIMemory {
  observedOpponentLocations: Record<string, number>
  lastIntent: AIIntentKind | null
}

export interface FactionAIIntent {
  kind: AIIntentKind
  preferredDestinationIds: string[]
  rationale: 'OBJECTIVE' | 'KNOWN_HOSTILE' | 'OBJECTIVE_COMPLETE'
}

export function initialFactionAIMemory(): FactionAIMemory {
  return { observedOpponentLocations: {}, lastIntent: null }
}

/** Remember sightings briefly without granting knowledge the faction never acquired. */
export function rememberAIObservations(
  current: FactionAIMemory,
  observedLocations: readonly string[],
  turn: number,
): FactionAIMemory {
  const recent = Object.fromEntries(
    Object.entries(current.observedOpponentLocations).filter(([, seenTurn]) => seenTurn >= turn - 2),
  )
  for (const locationId of observedLocations) recent[locationId] = turn
  return { ...current, observedOpponentLocations: recent }
}

export function planFactionAIIntent(input: {
  doctrine: StrategyDoctrine
  objectiveKind: StrategyObjectiveKind
  objective: StrategyObjective
  ownLocationIds: readonly string[]
  destinationIds: readonly string[]
  memory: FactionAIMemory
}): FactionAIIntent {
  if (input.objective.complete) {
    return {
      kind: 'HOLD',
      preferredDestinationIds: [...new Set(input.ownLocationIds)],
      rationale: 'OBJECTIVE_COMPLETE',
    }
  }

  const knownHostiles = Object.keys(input.memory.observedOpponentLocations).filter((id) =>
    input.destinationIds.includes(id),
  )
  if (input.objectiveKind === 'CONFIRM_HOSTILES' && knownHostiles.length) {
    return {
      kind: 'INVESTIGATE',
      preferredDestinationIds: knownHostiles,
      rationale: 'KNOWN_HOSTILE',
    }
  }
  if (input.objectiveKind === 'FORM_BASTION' || input.doctrine === 'CONSOLIDATION') {
    const counts = new Map<string, number>()
    for (const id of input.ownLocationIds) counts.set(id, (counts.get(id) ?? 0) + 1)
    const stronghold = [...counts].sort((left, right) => right[1] - left[1])[0]?.[0]
    return {
      kind: 'CONSOLIDATE',
      preferredDestinationIds: stronghold ? [stronghold] : [...input.destinationIds],
      rationale: 'OBJECTIVE',
    }
  }
  const unoccupied = input.destinationIds.filter((id) => !input.ownLocationIds.includes(id))
  return {
    kind: input.objectiveKind === 'CONFIRM_HOSTILES' ? 'INVESTIGATE' : 'EXPAND',
    preferredDestinationIds: unoccupied.length ? unoccupied : [...input.destinationIds],
    rationale: 'OBJECTIVE',
  }
}
