import type { StoryCursor } from './cursor.js'
import type { ProposedWorldEvent, WorldEvent } from './events.js'
import { reduceWorld } from './reducer.js'
import { cloneValue, cloneWorld, type WorldState } from './state.js'

export type BranchKind = 'CANON' | 'THEORY' | 'SIMULATION'
export type BranchRulePolicy = 'STRICT_CANON' | 'RULE_COMPATIBLE' | 'SANDBOX'

export interface WorldBranch {
  id: string
  name: string
  kind: BranchKind
  parentBranchId?: string
  forkCursor: StoryCursor
  rulePolicy: BranchRulePolicy
  ownerId?: string
  createdAt: string
}

interface BranchRecord {
  branch: WorldBranch
  state: WorldState
  events: WorldEvent[]
}

export interface CreateBranchInput {
  id: string
  name: string
  kind?: BranchKind
  rulePolicy: BranchRulePolicy
  ownerId?: string
  baseState: WorldState
}

export class InMemoryBranchEngine {
  private readonly records = new Map<string, BranchRecord>()

  createBranch(input: CreateBranchInput): WorldBranch {
    if (this.records.has(input.id)) throw new Error(`Branch already exists: ${input.id}`)
    const branch: WorldBranch = {
      id: input.id,
      name: input.name,
      kind: input.kind ?? 'SIMULATION',
      parentBranchId: input.baseState.cursor.branchId,
      forkCursor: input.baseState.cursor,
      rulePolicy: input.rulePolicy,
      ownerId: input.ownerId,
      createdAt: new Date().toISOString(),
    }
    const state = cloneWorld(input.baseState)
    state.cursor = { ...state.cursor, branchId: branch.id, ordinal: 0 }
    this.records.set(branch.id, { branch, state, events: [] })
    return branch
  }

  restoreBranch(branch: WorldBranch, state: WorldState, events: WorldEvent[] = []): void {
    if (this.records.has(branch.id)) return
    if (state.cursor.branchId !== branch.id) {
      throw new Error(`Snapshot branch ${state.cursor.branchId} does not match ${branch.id}`)
    }
    this.records.set(branch.id, {
      branch: { ...branch },
      state: cloneWorld(state),
      events: cloneValue(events),
    })
  }

  append(branchId: string, proposed: ProposedWorldEvent[]): { state: WorldState; events: WorldEvent[] } {
    const record = this.requireRecord(branchId)
    const applied: WorldEvent[] = []
    for (const event of proposed) {
      const ordinal = record.state.cursor.ordinal + 1
      const cursor: StoryCursor = {
        ...record.state.cursor,
        branchId,
        ordinal,
        eventId: `${branchId}:${ordinal}`,
        localSequence: record.state.cursor.localSequence + 1,
      }
      const worldEvent = {
        ...event,
        id: `${branchId}:event:${ordinal}`,
        schemaVersion: 1,
        branchId,
        cursor,
      } as WorldEvent
      record.state = reduceWorld(record.state, worldEvent)
      record.events.push(worldEvent)
      applied.push(worldEvent)
    }
    return { state: cloneWorld(record.state), events: cloneValue(applied) }
  }

  getState(branchId: string): WorldState {
    return cloneWorld(this.requireRecord(branchId).state)
  }

  getEvents(branchId: string): WorldEvent[] {
    return cloneValue(this.requireRecord(branchId).events)
  }

  getBranch(branchId: string): WorldBranch {
    return { ...this.requireRecord(branchId).branch }
  }

  listBranches(ownerId?: string): WorldBranch[] {
    return [...this.records.values()]
      .map(({ branch }) => branch)
      .filter((branch) => !ownerId || branch.ownerId === ownerId)
      .map((branch) => ({ ...branch }))
  }

  private requireRecord(branchId: string): BranchRecord {
    const record = this.records.get(branchId)
    if (!record) throw new Error(`Unknown branch: ${branchId}`)
    return record
  }
}
