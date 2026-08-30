import { ScenarioInputError } from './errors'
import { buildCausalGraph, type CausalContext } from './causalGraph'
import {
  propagateKnowledge,
  type BranchKnowledgeState,
  type TransferReliability,
} from './knowledge'
import { createReconstructionReplay, type ReconstructionReplayStep } from './replay'
import {
  reconstructionChecksum,
  type ReconstructionDecision,
  type ReconstructionScenario,
} from './scenario'

export interface ReconstructionExecutionBranch {
  id: string
  state: unknown
}

export interface ReconstructionExecutorPorts {
  createBranch(
    forkEventId: string,
    mode: ReconstructionScenario['mode'],
  ): Promise<ReconstructionExecutionBranch>
  move(
    branchId: string,
    entityId: string,
    locationId: string,
  ): Promise<{ state: unknown; eventIds: string[] }>
  activateHatsu(
    branchId: string,
    input: {
      abilityId: string
      actionId: string
      actorId: string
      targetIds: readonly string[]
      parameters: ReconstructionDecision['parameters']
    },
  ): Promise<{ state: unknown; eventIds: string[] }>
  causalContext(
    state: unknown,
    knowledge: BranchKnowledgeState,
    occurredIds: readonly string[],
  ): CausalContext
}

export interface ReconstructionExecutionResult {
  branchId: string
  initialState: unknown
  finalState: unknown
  knowledge: BranchKnowledgeState
  replay: ReturnType<typeof createReconstructionReplay>
}

export async function executeReconstructionScenario(
  scenario: ReconstructionScenario,
  initialKnowledgeInput: BranchKnowledgeState | ((state: unknown) => BranchKnowledgeState),
  ports: ReconstructionExecutorPorts,
): Promise<ReconstructionExecutionResult> {
  const branch = await ports.createBranch(scenario.forkEventId, scenario.mode)
  const initialState = branch.state
  const initialKnowledge =
    typeof initialKnowledgeInput === 'function'
      ? initialKnowledgeInput(initialState)
      : initialKnowledgeInput
  let state = initialState
  let knowledge = initialKnowledge
  const occurredIds: string[] = [scenario.forkEventId]
  const steps: Array<Omit<ReconstructionReplayStep, 'sequence'>> = []

  for (const decision of scenario.decisions) {
    const graph = buildCausalGraph(scenario, ports.causalContext(state, knowledge, occurredIds))
    const node = graph.nodes.find(
      (candidate) => candidate.kind === 'decision' && candidate.id === decision.id,
    )
    if (!node || node.status !== 'ready') {
      steps.push({
        decisionId: decision.id,
        status: 'blocked',
        reason: node?.reason ?? 'Decision is absent from the causal graph',
        eventIds: [],
        stateChecksum: reconstructionChecksum(state),
      })
      continue
    }

    try {
      const applied = await applyDecision({
        branchId: branch.id,
        decision,
        state,
        knowledge,
        ports,
      })
      state = applied.state
      knowledge = applied.knowledge
      occurredIds.push(decision.id, ...applied.eventIds)
      steps.push({
        decisionId: decision.id,
        status: 'applied',
        reason: applied.reason,
        eventIds: applied.eventIds,
        stateChecksum: reconstructionChecksum({ state, knowledge }),
      })
    } catch (error) {
      steps.push({
        decisionId: decision.id,
        status: 'invalidated',
        reason: error instanceof Error ? error.message : String(error),
        eventIds: [],
        stateChecksum: reconstructionChecksum({ state, knowledge }),
      })
    }
  }

  return {
    branchId: branch.id,
    initialState,
    finalState: state,
    knowledge,
    replay: createReconstructionReplay({
      scenario,
      initialState: { state: initialState, knowledge: initialKnowledge },
      steps,
      finalState: { state, knowledge },
    }),
  }
}

interface DecisionExecution {
  branchId: string
  decision: ReconstructionDecision
  state: unknown
  knowledge: BranchKnowledgeState
  ports: ReconstructionExecutorPorts
}

async function applyDecision(input: DecisionExecution) {
  const { branchId, decision, state, knowledge, ports } = input
  if (decision.kind === 'MOVE_ENTITY') {
    const locationId = requiredTarget(decision)
    const applied = await ports.move(branchId, decision.actorId, locationId)
    return { ...applied, knowledge, reason: `${decision.actorId} moved to ${locationId}` }
  }
  if (decision.kind === 'ACTIVATE_HATSU') {
    const abilityId = requiredParameter(decision, 'abilityId')
    const actionId = requiredParameter(decision, 'actionId')
    const applied = await ports.activateHatsu(branchId, {
      abilityId,
      actionId,
      actorId: decision.actorId,
      targetIds: decision.targetIds,
      parameters: decision.parameters,
    })
    return { ...applied, knowledge, reason: `${abilityId} executed action ${actionId}` }
  }
  const factId = requiredParameter(decision, 'factId')
  const propagated = propagateKnowledge(knowledge, {
    id: decision.id,
    senderId: decision.actorId,
    receiverIds: decision.targetIds,
    factId,
    reliability: reliabilityParameter(decision),
    deceptive: decision.parameters['deceptive'] === true,
  })
  if (propagated.traces.some((trace) => trace.status === 'blocked')) {
    throw new ScenarioInputError(
      propagated.traces.find((trace) => trace.status === 'blocked')!.reason,
    )
  }
  return {
    state,
    knowledge: propagated.state,
    eventIds: [],
    reason: propagated.traces.map((trace) => trace.reason).join('; '),
  }
}

function reliabilityParameter(decision: ReconstructionDecision): TransferReliability {
  const value = String(decision.parameters['reliability'] ?? 'trusted')
  if (!['trusted', 'unverified', 'deceptive', 'unknown'].includes(value)) {
    throw new ScenarioInputError(`Decision ${decision.id} has invalid reliability ${value}`)
  }
  return value as TransferReliability
}

function requiredTarget(decision: ReconstructionDecision): string {
  const target = decision.targetIds[0]
  if (!target) throw new ScenarioInputError(`Decision ${decision.id} requires a target`)
  return target
}

function requiredParameter(decision: ReconstructionDecision, key: string): string {
  const value = decision.parameters[key]
  if (typeof value !== 'string' || !value)
    throw new ScenarioInputError(`Decision ${decision.id} requires ${key}`)
  return value
}
