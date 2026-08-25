import { ScenarioInputError } from './errors'

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

const DECISION_KINDS: readonly ReconstructionDecisionKind[] = [
  'MOVE_ENTITY',
  'SHARE_KNOWLEDGE',
  'ACTIVATE_HATSU',
]
const PRECONDITION_KINDS: readonly ReconstructionPrecondition['kind'][] = [
  'entity-at',
  'knows-fact',
  'ability-available',
  'event-occurred',
]
const SCENARIO_MODES: readonly ReconstructionScenarioMode[] = ['strict-canon', 'rule-compatible']

export function defineReconstructionScenario(
  draft: ReconstructionScenarioDraft,
): ReconstructionScenario {
  requireId(draft.id, 'scenario id')
  requireId(draft.forkEventId, 'fork event')
  if (!draft.title.trim()) throw new ScenarioInputError('A reconstruction scenario requires a title')
  if (!Number.isSafeInteger(draft.seed) || draft.seed < 0) {
    throw new ScenarioInputError('Scenario seed must be a non-negative safe integer')
  }
  const decisionIds = new Set<string>()
  const preconditionIds = new Set<string>()
  for (const decision of draft.decisions) {
    requireId(decision.id, 'decision id')
    requireId(decision.actorId, `actor of ${decision.id}`)
    if (decisionIds.has(decision.id)) throw new ScenarioInputError(`Duplicate decision id: ${decision.id}`)
    decisionIds.add(decision.id)
    for (const precondition of decision.preconditions) {
      requireId(precondition.id, `precondition of ${decision.id}`)
      if (preconditionIds.has(precondition.id)) {
        throw new ScenarioInputError(`Duplicate precondition id: ${precondition.id}`)
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

/** Parse untrusted JSON into the small, bounded V3 scenario contract. */
export function parseReconstructionScenarioDraft(value: unknown): ReconstructionScenarioDraft {
  const draft = record(value, 'scenario')
  const decisions = array(draft.decisions, 'decisions')
  if (decisions.length > 50) throw new ScenarioInputError('A scenario may contain at most 50 decisions')

  return {
    id: string(draft.id, 'scenario id'),
    title: string(draft.title, 'scenario title', 160),
    forkEventId: string(draft.forkEventId, 'fork event'),
    mode: member(draft.mode, SCENARIO_MODES, 'scenario mode'),
    seed: safeInteger(draft.seed, 'scenario seed'),
    decisions: decisions.map((rawDecision, index) => {
      const decision = record(rawDecision, `decision ${index}`)
      const targets = array(decision.targetIds, `targets of decision ${index}`)
      if (targets.length > 20) throw new ScenarioInputError('A decision may contain at most 20 targets')
      const parameters = record(decision.parameters, `parameters of decision ${index}`)
      for (const [key, parameter] of Object.entries(parameters)) {
        if (!['string', 'number', 'boolean'].includes(typeof parameter)) {
          throw new ScenarioInputError(`Parameter ${key} of decision ${index} must be scalar`)
        }
      }
      const preconditions = array(decision.preconditions, `preconditions of decision ${index}`)
      if (preconditions.length > 20) {
        throw new ScenarioInputError('A decision may contain at most 20 preconditions')
      }
      return {
        id: string(decision.id, `decision ${index} id`),
        kind: member(decision.kind, DECISION_KINDS, `decision ${index} kind`),
        actorId: string(decision.actorId, `decision ${index} actor`),
        targetIds: targets.map((target, targetIndex) =>
          string(target, `target ${targetIndex} of decision ${index}`),
        ),
        parameters: parameters as Record<string, string | number | boolean>,
        preconditions: preconditions.map((rawPrecondition, preconditionIndex) => {
          const precondition = record(
            rawPrecondition,
            `precondition ${preconditionIndex} of decision ${index}`,
          )
          return {
            id: string(precondition.id, 'precondition id'),
            kind: member(precondition.kind, PRECONDITION_KINDS, 'precondition kind'),
            subjectId: string(precondition.subjectId, 'precondition subject'),
            expected: string(precondition.expected, 'precondition expectation'),
          }
        }),
      }
    }),
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
  if (!value.trim()) throw new ScenarioInputError(`A reconstruction scenario requires ${field}`)
  if (value.length > 128) throw new ScenarioInputError(`${field} must be at most 128 characters`)
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ScenarioInputError(`${field} must be an object`)
  }
  return value as Record<string, unknown>
}

function array(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) throw new ScenarioInputError(`${field} must be an array`)
  return value
}

function string(value: unknown, field: string, max = 128): string {
  if (typeof value !== 'string' || !value.trim()) throw new ScenarioInputError(`${field} must be a string`)
  if (value.length > max) throw new ScenarioInputError(`${field} must be at most ${max} characters`)
  return value.trim()
}

function safeInteger(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new ScenarioInputError(`${field} must be a non-negative safe integer`)
  }
  return Number(value)
}

function member<T extends string>(value: unknown, values: readonly T[], field: string): T {
  if (typeof value !== 'string' || !values.includes(value as T)) {
    throw new ScenarioInputError(`${field} is invalid`)
  }
  return value as T
}
