import type {
  ReconstructionDecision,
  ReconstructionPrecondition,
  ReconstructionScenario,
} from './scenario'

export interface CausalContext {
  locations: Readonly<Record<string, string | null>>
  factsByObserver: Readonly<Record<string, readonly string[]>>
  abilitiesByOwner: Readonly<Record<string, readonly string[]>>
  occurredEventIds: readonly string[]
}

export interface CausalNode {
  id: string
  kind: 'precondition' | 'decision'
  status: 'satisfied' | 'blocked' | 'ready' | 'dependent'
  reason: string
}

export interface CausalEdge {
  from: string
  to: string
  relation: 'requires' | 'follows'
}

export interface CausalGraph {
  nodes: CausalNode[]
  edges: CausalEdge[]
  executableDecisionIds: string[]
  blockedDecisionIds: string[]
}

export function buildCausalGraph(
  scenario: ReconstructionScenario,
  context: CausalContext,
): CausalGraph {
  const nodes: CausalNode[] = []
  const edges: CausalEdge[] = []
  const executableDecisionIds: string[] = []
  const blockedDecisionIds: string[] = []
  const decisionIds = new Set(scenario.decisions.map((decision) => decision.id))

  for (const decision of scenario.decisions) {
    const results = decision.preconditions.map((precondition) => ({
      precondition,
      result: evaluatePrecondition(precondition, context, decisionIds),
    }))
    for (const { precondition, result } of results) {
      nodes.push({ id: precondition.id, kind: 'precondition', ...result })
      edges.push({ from: precondition.id, to: decision.id, relation: 'requires' })
      if (precondition.kind === 'event-occurred' && decisionIds.has(precondition.expected)) {
        edges.push({ from: precondition.expected, to: decision.id, relation: 'follows' })
      }
    }
    const blocked = results.some(({ result }) => result.status === 'blocked')
    const dependent = results.some(({ result }) => result.status === 'dependent')
    const status = blocked ? 'blocked' : dependent ? 'dependent' : 'ready'
    nodes.push({
      id: decision.id,
      kind: 'decision',
      status,
      reason: decisionReason(decision, status),
    })
    if (status === 'ready') executableDecisionIds.push(decision.id)
    else blockedDecisionIds.push(decision.id)
  }

  assertAcyclic(scenario.decisions, edges)
  return { nodes, edges, executableDecisionIds, blockedDecisionIds }
}

function evaluatePrecondition(
  condition: ReconstructionPrecondition,
  context: CausalContext,
  decisionIds: ReadonlySet<string>,
): Pick<CausalNode, 'status' | 'reason'> {
  if (condition.kind === 'entity-at') {
    const actual = context.locations[condition.subjectId]
    return actual === condition.expected
      ? { status: 'satisfied', reason: `${condition.subjectId} is at ${condition.expected}` }
      : {
          status: 'blocked',
          reason: `${condition.subjectId} is at ${actual ?? 'unknown'}, not ${condition.expected}`,
        }
  }
  if (condition.kind === 'knows-fact') {
    const knows =
      context.factsByObserver[condition.subjectId]?.includes(condition.expected) ?? false
    return knows
      ? { status: 'satisfied', reason: `${condition.subjectId} knows ${condition.expected}` }
      : { status: 'blocked', reason: `${condition.subjectId} does not know ${condition.expected}` }
  }
  if (condition.kind === 'ability-available') {
    const owns =
      context.abilitiesByOwner[condition.subjectId]?.includes(condition.expected) ?? false
    return owns
      ? { status: 'satisfied', reason: `${condition.expected} is available` }
      : {
          status: 'blocked',
          reason: `${condition.expected} is unavailable to ${condition.subjectId}`,
        }
  }
  if (decisionIds.has(condition.expected)) {
    return { status: 'dependent', reason: `Waits for decision ${condition.expected}` }
  }
  const occurred = context.occurredEventIds.includes(condition.expected)
  return occurred
    ? { status: 'satisfied', reason: `Event ${condition.expected} occurred` }
    : { status: 'blocked', reason: `Event ${condition.expected} did not occur` }
}

function decisionReason(decision: ReconstructionDecision, status: CausalNode['status']): string {
  if (status === 'ready') return `${decision.kind} can execute`
  if (status === 'dependent') return `${decision.kind} waits for an earlier decision`
  return `${decision.kind} has an unsatisfied precondition`
}

function assertAcyclic(decisions: readonly ReconstructionDecision[], edges: readonly CausalEdge[]) {
  const decisionIds = new Set(decisions.map((decision) => decision.id))
  const dependencies = new Map<string, string[]>()
  for (const edge of edges) {
    if (edge.relation !== 'follows' || !decisionIds.has(edge.from)) continue
    const list = dependencies.get(edge.to) ?? []
    list.push(edge.from)
    dependencies.set(edge.to, list)
  }
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (id: string) => {
    if (visiting.has(id)) throw new Error(`Causal cycle detected at decision ${id}`)
    if (visited.has(id)) return
    visiting.add(id)
    for (const dependency of dependencies.get(id) ?? []) visit(dependency)
    visiting.delete(id)
    visited.add(id)
  }
  for (const decision of decisions) visit(decision.id)
}
