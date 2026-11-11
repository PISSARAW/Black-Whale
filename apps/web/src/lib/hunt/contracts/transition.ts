import type { HuntTerrainId } from '../arena'
import type { HuntState } from '../state'
import type { HuntContractV3 } from './types'
import { forfeit } from '../aura'

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
  // A new terrain has no floor on which old placements can still exist. Their
  // aura is spent in the abandoned scene, so it no longer lowers the ceiling.
  const pool = previous.ledger.placements.reduce(
    (current, placement) =>
      placement.state === 'set' ? forfeit(current, placement.cost) : current,
    previous.ledger.pool,
  )
  return {
    ...fresh,
    hatsu: previous.hatsu,
    advancedNen: previous.advancedNen,
    ledger: { ...fresh.ledger, pool, placements: [] },
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
