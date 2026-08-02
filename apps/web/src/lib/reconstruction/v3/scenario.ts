export const RECONSTRUCTION_SCENARIO_VERSION = 3 as const

export type ReconstructionScenarioMode = 'strict-canon' | 'rule-compatible'
export type ReconstructionDecisionKind = 'MOVE_ENTITY' | 'SHARE_KNOWLEDGE' | 'ACTIVATE_HATSU'

export interface ReconstructionPrecondition {
  id: string
  kind: 'entity-at' | 'knows-fact' | 'ability-available' | 'event-occurred'
  subjectId: string
  expected: string
}

export interface ReconstructionDecision {
  id: string
  kind: ReconstructionDecisionKind
  actorId: string
  targetIds: readonly string[]
  parameters: Readonly<Record<string, string | number | boolean>>
  preconditions: readonly ReconstructionPrecondition[]
}

export interface ReconstructionScenario {
  version: typeof RECONSTRUCTION_SCENARIO_VERSION
  id: string
  title: string
  forkEventId: string
  mode: ReconstructionScenarioMode
  seed: number
  decisions: readonly ReconstructionDecision[]
  checksum: string
}

export type ReconstructionScenarioDraft = Omit<ReconstructionScenario, 'version' | 'checksum'>

export function defineReconstructionScenario(
  draft: ReconstructionScenarioDraft,
): ReconstructionScenario {
  requireId(draft.id, 'scenario id')
  requireId(draft.forkEventId, 'fork event')
  if (!draft.title.trim()) throw new Error('A reconstruction scenario requires a title')
  if (!Number.isSafeInteger(draft.seed) || draft.seed < 0) {
    throw new Error('Scenario seed must be a non-negative safe integer')
  }
  const decisionIds = new Set<string>()
  const preconditionIds = new Set<string>()
  for (const decision of draft.decisions) {
    requireId(decision.id, 'decision id')
    requireId(decision.actorId, `actor of ${decision.id}`)
    if (decisionIds.has(decision.id)) throw new Error(`Duplicate decision id: ${decision.id}`)
    decisionIds.add(decision.id)
    for (const precondition of decision.preconditions) {
      requireId(precondition.id, `precondition of ${decision.id}`)
      if (preconditionIds.has(precondition.id)) {
        throw new Error(`Duplicate precondition id: ${precondition.id}`)
      }
      preconditionIds.add(precondition.id)
    }
  }
  const payload = {
    ...draft,
    id: draft.id.trim(),
    title: draft.title.trim(),
    forkEventId: draft.forkEventId.trim(),
  }
  return {
    version: RECONSTRUCTION_SCENARIO_VERSION,
    ...payload,
    checksum: reconstructionChecksum(payload),
  }
}

export function verifyReconstructionScenario(scenario: ReconstructionScenario): boolean {
  const { version: _version, checksum, ...payload } = scenario
  return (
    scenario.version === RECONSTRUCTION_SCENARIO_VERSION &&
    reconstructionChecksum(payload) === checksum
  )
}

export function reconstructionChecksum(value: unknown): string {
  const input = canonicalJson(value)
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right),
    )
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function requireId(value: string, field: string): void {
  if (!value.trim()) throw new Error(`A reconstruction scenario requires ${field}`)
  if (value.length > 128) throw new Error(`${field} must be at most 128 characters`)
}
