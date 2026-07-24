import type { WorldSnapshot } from '@black-whale/timeline-engine'

export interface SimulationBranch {
  id: string
  name: string
  parentEventId: string
  createdAt: Date
}

export interface SimulationEvent {
  id: string
  branchId: string
  sequence: number
  type: string
  payload: any
}

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type SimulationMode = 'strict-canon' | 'rule-compatible' | 'sandbox'

export interface CreateBranchInput {
  parentEventId: string
  mode: SimulationMode
  ownerId?: string
}

export interface SimulationAction {
  type: string
  payload: Record<string, unknown>
}

export interface SimulationStepResult {
  snapshot: WorldSnapshot
  appliedEvents: SimulationEvent[]
  canonFidelity: number
  warnings: string[]
}

// ──────────────────────────────────────────────
// Interface
// ──────────────────────────────────────────────

export interface ISimulationEngine {
  /** Create a new simulation branch from a canonical event */
  createBranch(input: CreateBranchInput): Promise<SimulationBranch>

  /** Apply a user action to a branch and return the resulting state */
  applyAction(branchId: string, action: SimulationAction): Promise<SimulationStepResult>

  /** Get the current state of a simulation branch */
  getBranchState(branchId: string): Promise<WorldSnapshot>

  /** List all branches owned by a user */
  listBranches(ownerId: string): Promise<SimulationBranch[]>
}

// ──────────────────────────────────────────────
// Stub
// ──────────────────────────────────────────────

export class SimulationEngine implements ISimulationEngine {
  async createBranch(input: CreateBranchInput): Promise<SimulationBranch> {
    throw new Error(`SimulationEngine.createBranch not implemented — parentEventId: ${input.parentEventId}`)
  }

  async applyAction(branchId: string, action: SimulationAction): Promise<SimulationStepResult> {
    throw new Error(`SimulationEngine.applyAction not implemented — branchId: ${branchId}`)
  }

  async getBranchState(branchId: string): Promise<WorldSnapshot> {
    throw new Error(`SimulationEngine.getBranchState not implemented — branchId: ${branchId}`)
  }

  async listBranches(ownerId: string): Promise<SimulationBranch[]> {
    throw new Error(`SimulationEngine.listBranches not implemented — ownerId: ${ownerId}`)
  }
}
