import { SimulationStore } from '@black-whale/simulation-engine'
import { prisma } from './db'
import { nenRuntime, timeline } from './nen'

/**
 * Branch persistence is process-local until it is rehydrated from a snapshot,
 * so the store is a module singleton rather than a per-request instance.
 */
export const simulationStore = new SimulationStore(prisma, {
  loadKernelState: (eventId) => timeline.getKernelState({ eventId }),
  executeAbility: (abilityId, request, state) =>
    nenRuntime.executeInState(abilityId, request, state),
})
