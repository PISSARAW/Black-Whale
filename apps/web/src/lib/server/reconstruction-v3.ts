import type { WorldState } from '@black-whale/world-engine'
import type { SimulationActionInput } from '@black-whale/simulation-engine'
import type { BranchKnowledgeState } from '$lib/reconstruction/v3/knowledge'
import type { ReconstructionExecutorPorts } from '$lib/reconstruction/v3/executor'
import { simulationStore } from './simulations'

type StoredBranch = Awaited<ReturnType<typeof simulationStore.getBranchState>>
type Step = Awaited<ReturnType<typeof simulationStore.applyAction>>

interface ReconstructionSimulationStore {
  createBranch(input: {
    parentEventId: string
    mode: 'strict-canon' | 'rule-compatible'
  }): Promise<{ id: string }>
  getBranchState(branchId: string): Promise<StoredBranch>
  applyAction(branchId: string, input: SimulationActionInput): Promise<Step>
}

export function reconstructionExecutorPorts(
  store: ReconstructionSimulationStore = simulationStore,
): ReconstructionExecutorPorts {
  return {
    async createBranch(forkEventId, mode) {
      const branch = await store.createBranch({ parentEventId: forkEventId, mode })
      const loaded = await store.getBranchState(branch.id)
      return { id: branch.id, state: loaded.snapshot }
    },
    async move(branchId, entityId, locationId) {
      return apply(store, branchId, {
        actionType: 'MOVE_ENTITY',
        payload: { entityId, locationId },
      })
    },
    async activateHatsu(branchId, input) {
      return apply(store, branchId, {
        actionType: 'ACTIVATE_ABILITY',
        payload: {
          abilityId: input.abilityId,
          actorId: input.actorId,
          interaction: input.actionId,
          actionId: input.actionId,
          targets: [...input.targetIds],
          parameters: input.parameters,
        },
      })
    },
    causalContext(state, knowledge, occurredEventIds) {
      const world = state as WorldState
      return {
        locations: Object.fromEntries(
          Object.entries(world.presences).map(([id, presence]) => [
            id,
            presence.locationId ?? null,
          ]),
        ),
        factsByObserver: factsByObserver(knowledge),
        abilitiesByOwner: world.abilitiesByOwner,
        occurredEventIds,
      }
    },
  }
}

async function apply(
  store: ReconstructionSimulationStore,
  branchId: string,
  input: SimulationActionInput,
) {
  const result = await store.applyAction(branchId, input)
  return {
    state: result.snapshot,
    eventIds: result.appliedEvents.map((event) => event.id),
  }
}

function factsByObserver(knowledge: BranchKnowledgeState): Record<string, readonly string[]> {
  return Object.fromEntries(
    Object.entries(knowledge.byObserver).map(([observerId, records]) => [
      observerId,
      Object.values(records)
        .filter((record) => record.state === 'KNOWN' || record.state === 'BELIEVED')
        .map((record) => record.factId),
    ]),
  )
}
