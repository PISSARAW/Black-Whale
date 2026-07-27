import {
  InMemoryBranchEngine,
  type BranchRulePolicy,
  type ProposedWorldEvent,
  type WorldBranch,
  type WorldEvent,
  type WorldState,
} from '@black-whale/world-engine'

export type SimulationMode = 'strict-canon' | 'rule-compatible' | 'sandbox'

export interface CreateBranchInput {
  id: string
  parentEventId: string
  mode: SimulationMode
  name?: string
  ownerId?: string
}

export interface SimulationStepResult {
  snapshot: WorldState
  appliedEvents: WorldEvent[]
  canonFidelity: number
  warnings: string[]
}

function toPolicy(mode: SimulationMode): BranchRulePolicy {
  if (mode === 'strict-canon') return 'STRICT_CANON'
  if (mode === 'sandbox') return 'SANDBOX'
  return 'RULE_COMPATIBLE'
}

/**
 * Branching is deliberately persistence-agnostic. Canon and simulations share
 * the same WorldState and reducers; `SimulationStore` decides how branch events
 * are stored.
 */
export class SimulationEngine {
  private readonly branches = new InMemoryBranchEngine()

  createBranch(input: CreateBranchInput, baseState: WorldState): WorldBranch {
    if (baseState.cursor.eventId !== input.parentEventId) {
      throw new Error(
        `Base state ${baseState.cursor.eventId} does not match fork ${input.parentEventId}`,
      )
    }
    return this.branches.createBranch({
      id: input.id,
      name: input.name ?? `Simulation from ${input.parentEventId}`,
      kind: 'SIMULATION',
      rulePolicy: toPolicy(input.mode),
      ownerId: input.ownerId,
      baseState,
    })
  }

  restoreBranch(branch: WorldBranch, snapshot: WorldState, events: WorldEvent[] = []): void {
    this.branches.restoreBranch(branch, snapshot, events)
  }

  applyEvents(branchId: string, events: ProposedWorldEvent[]): SimulationStepResult {
    const result = this.branches.append(branchId, events)
    const policy = this.branches.getBranch(branchId).rulePolicy
    return {
      snapshot: result.state,
      appliedEvents: result.events,
      canonFidelity: policy === 'STRICT_CANON' ? 1 : policy === 'RULE_COMPATIBLE' ? 0.75 : 0,
      warnings:
        policy === 'SANDBOX' ? ['Sandbox branch: canonical constraints may be bypassed.'] : [],
    }
  }

  /**
   * Fold a predicted branch back into its parent, leaving the listed subjects
   * free to act otherwise (Parallel Future, ch. 401+).
   */
  mergeBranch(input: {
    targetBranchId: string
    sourceBranchId: string
    excludeSubjectIds?: string[]
    fromOrdinal?: number
  }): SimulationStepResult & { skippedEvents: WorldEvent[] } {
    const merged = this.branches.mergeInto(input)
    const policy = this.branches.getBranch(input.targetBranchId).rulePolicy
    return {
      snapshot: merged.state,
      appliedEvents: merged.events,
      skippedEvents: merged.skipped,
      canonFidelity: policy === 'STRICT_CANON' ? 1 : policy === 'RULE_COMPATIBLE' ? 0.75 : 0,
      warnings: merged.skipped.length
        ? [`${merged.skipped.length} predicted events were overridden by a diverging actor.`]
        : [],
    }
  }

  getBranchState(branchId: string): WorldState {
    return this.branches.getState(branchId)
  }

  getBranch(branchId: string): WorldBranch {
    return this.branches.getBranch(branchId)
  }

  listBranches(ownerId?: string): WorldBranch[] {
    return this.branches.listBranches(ownerId)
  }
}
