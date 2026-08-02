import type { HuntTerrainId } from '../arena'
import type { HuntState } from '../state'
import type { HuntContractV3 } from './types'

export interface ContractStage {
  index: number
  terrain: HuntTerrainId
  final: boolean
}

export function stageOf(contract: HuntContractV3, index: number): ContractStage {
  const safeIndex = Math.max(0, Math.min(index, contract.terrainSequence.length - 1))
  return {
    index: safeIndex,
    terrain: contract.terrainSequence[safeIndex],
    final: safeIndex === contract.terrainSequence.length - 1,
  }
}

export function nextStage(contract: HuntContractV3, current: number): ContractStage | null {
  return current + 1 < contract.terrainSequence.length ? stageOf(contract, current + 1) : null
}

/** Carries decisions across a scene transition; positions come from the new stage. */
export function carryIntoStage(previous: HuntState, fresh: HuntState): HuntState {
  return {
    ...fresh,
    hatsu: previous.hatsu,
    advancedNen: previous.advancedNen,
    ledger: { ...fresh.ledger, pool: previous.ledger.pool, placements: previous.ledger.placements },
    hunter: {
      ...fresh.hunter,
      pool: previous.hunter.pool,
      belief: previous.hunter.belief,
      rng: previous.hunter.rng,
    },
    clock: previous.clock,
    log: previous.log,
    nextId: previous.nextId,
  }
}
