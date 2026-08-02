import type { HuntOutcome } from '../outcome'
import { countOf, type TelemetryEvent } from '../telemetry'
import type { HuntTerrainId } from '../arena'
import type { ContractObjective, HuntContractV3 } from './types'

export interface ContractStanding {
  terrain: HuntTerrainId
  spaceId: string | null
  clock: number
  outcome: HuntOutcome
  hunterAura: number
  log: readonly TelemetryEvent[]
}

export interface ObjectiveProgress {
  objective: ContractObjective
  complete: boolean
  current: number
  target: number
}

export interface ContractProgress {
  objectives: ObjectiveProgress[]
  complete: boolean
  failed: boolean
}

export function contractProgress(
  contract: HuntContractV3,
  standing: ContractStanding,
): ContractProgress {
  const objectives = contract.objectives.map((objective) => progressOf(objective, standing))
  const terminalLoss = standing.outcome === 'caught' || standing.outcome === 'timeUp'
  return {
    objectives,
    complete: objectives.every((objective) => objective.complete),
    failed: terminalLoss && objectives.some((objective) => !objective.complete),
  }
}

function progressOf(
  objective: ContractObjective,
  standing: ContractStanding,
): ObjectiveProgress {
  switch (objective.kind) {
    case 'reach': {
      const terrainReached = standing.terrain === objective.terrain
      const roomReached = !objective.spaceId || standing.spaceId === objective.spaceId
      return { objective, complete: terrainReached && roomReached, current: terrainReached && roomReached ? 1 : 0, target: 1 }
    }
    case 'survive': {
      const current = Math.min(objective.seconds, standing.clock)
      return { objective, complete: current >= objective.seconds, current, target: objective.seconds }
    }
    case 'misdirect': {
      const current = countOf(standing.log, 'lostTheTrail')
      return { objective, complete: current >= objective.falseTrails, current, target: objective.falseTrails }
    }
    case 'exhaust-hunter': {
      const complete = standing.hunterAura <= 0
      return { objective, complete, current: complete ? 1 : 0, target: 1 }
    }
  }
}
