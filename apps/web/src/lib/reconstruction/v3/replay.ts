import { reconstructionChecksum, type ReconstructionScenario } from './scenario'

export const RECONSTRUCTION_REPLAY_VERSION = 1 as const

export interface ReconstructionReplayStep {
  sequence: number
  decisionId: string
  status: 'applied' | 'blocked' | 'invalidated'
  reason: string
  eventIds: readonly string[]
  stateChecksum: string
}

export interface ReconstructionReplay {
  version: typeof RECONSTRUCTION_REPLAY_VERSION
  scenario: ReconstructionScenario
  initialStateChecksum: string
  steps: readonly ReconstructionReplayStep[]
  finalStateChecksum: string
  checksum: string
}

export function createReconstructionReplay(input: {
  scenario: ReconstructionScenario
  initialState: unknown
  steps: readonly Omit<ReconstructionReplayStep, 'sequence'>[]
  finalState: unknown
}): ReconstructionReplay {
  const steps = input.steps.map((step, sequence) => ({ ...step, sequence }))
  const payload = {
    scenario: input.scenario,
    initialStateChecksum: reconstructionChecksum(input.initialState),
    steps,
    finalStateChecksum: reconstructionChecksum(input.finalState),
  }
  return {
    version: RECONSTRUCTION_REPLAY_VERSION,
    ...payload,
    checksum: reconstructionChecksum(payload),
  }
}

export function verifyReconstructionReplay(replay: ReconstructionReplay): boolean {
  const { version: _version, checksum, ...payload } = replay
  if (replay.version !== RECONSTRUCTION_REPLAY_VERSION) return false
  if (replay.steps.some((step, index) => step.sequence !== index)) return false
  if (new Set(replay.steps.map((step) => step.decisionId)).size !== replay.steps.length)
    return false
  return reconstructionChecksum(payload) === checksum
}

export function serializeReconstructionReplay(replay: ReconstructionReplay): string {
  if (!verifyReconstructionReplay(replay)) throw new Error('Invalid Reconstruction replay')
  return JSON.stringify(replay)
}

export function parseReconstructionReplay(serialized: string): ReconstructionReplay {
  const value: unknown = JSON.parse(serialized)
  if (!isReplay(value) || !verifyReconstructionReplay(value)) {
    throw new Error('Invalid Reconstruction replay')
  }
  return value
}

function isReplay(value: unknown): value is ReconstructionReplay {
  if (!value || typeof value !== 'object') return false
  const replay = value as Partial<ReconstructionReplay>
  return (
    replay.version === RECONSTRUCTION_REPLAY_VERSION &&
    typeof replay.checksum === 'string' &&
    typeof replay.initialStateChecksum === 'string' &&
    typeof replay.finalStateChecksum === 'string' &&
    Array.isArray(replay.steps) &&
    replay.steps.every(
      (step) =>
        Number.isInteger(step.sequence) &&
        typeof step.decisionId === 'string' &&
        ['applied', 'blocked', 'invalidated'].includes(step.status) &&
        typeof step.reason === 'string' &&
        Array.isArray(step.eventIds) &&
        typeof step.stateChecksum === 'string',
    ) &&
    Boolean(replay.scenario)
  )
}
