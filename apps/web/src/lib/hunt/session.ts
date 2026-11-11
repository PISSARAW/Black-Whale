import type { HuntContractV3 } from './contracts/types'
import { contractProgress } from './contracts/progress'
import type { HuntState } from './state'
import type { HuntTerrainId } from './arena'
import { record } from './telemetry'

/** A stable but different seed for each attempt; the replay stores this exact value. */
export function seedForAttempt(base: number, completedAttempts: number): number {
  return (base ^ Math.imul(completedAttempts + 1, 0x9e3779b1)) >>> 0
}

export function contractIsComplete(
  contract: HuntContractV3,
  terrain: HuntTerrainId,
  state: HuntState,
): boolean {
  return contractProgress(contract, {
    terrain,
    spaceId: state.player.spaceId,
    clock: state.clock,
    outcome: state.outcome,
    hunterAura: state.hunter.pool.available,
    log: state.log,
  }).complete
}

/** Ends a compound objective cleanly even when its survival clock matures in a duel. */
export function completeContract(state: HuntState): HuntState {
  if (!state.duel) return { ...state, outcome: 'reached' }
  return {
    ...state,
    outcome: 'reached',
    duel: null,
    ledger: { ...state.ledger, pool: state.duel.player.pool },
    hunter: { ...state.hunter, pool: state.duel.hunter.pool, held: state.duel.hunter.held },
    log: record(state.log, state.clock, {
      actor: 'player',
      kind: 'duelClosed',
      where: state.duel.spaceId,
    }),
  }
}

/** Non-reach contracts are won by their objective evaluator, not by a marked room. */
export function targetForStage(
  contract: HuntContractV3,
  terrain: HuntTerrainId,
  fallback: string,
): string | null {
  const reachesHere = contract.objectives.find(
    (objective) => objective.kind === 'reach' && objective.terrain === terrain,
  )
  const hasLaterStage =
    contract.terrainSequence.indexOf(terrain) < contract.terrainSequence.length - 1
  return reachesHere?.kind === 'reach'
    ? (reachesHere.spaceId ?? fallback)
    : hasLaterStage
      ? fallback
      : null
}
