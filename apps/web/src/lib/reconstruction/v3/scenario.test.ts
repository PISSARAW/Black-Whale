import { describe, expect, it } from 'vitest'
import {
  defineReconstructionScenario,
  parseReconstructionScenarioDraft,
  verifyReconstructionScenario,
} from './scenario'

const draft = () => ({
  id: 'kurapika-leaves-1014',
  title: 'Kurapika leaves room 1014',
  forkEventId: 'event-401-2',
  mode: 'rule-compatible' as const,
  seed: 401,
  decisions: [
    {
      id: 'leave-room',
      kind: 'MOVE_ENTITY' as const,
      actorId: 'kurapika',
      targetIds: ['tier-1-corridor'],
      parameters: {},
      preconditions: [
        {
          id: 'kurapika-in-1014',
          kind: 'entity-at' as const,
          subjectId: 'body-kurapika',
          expected: 'room-1014',
        },
      ],
    },
  ],
})

describe('Reconstruction V3 scenario', () => {
  it('creates a versioned deterministic scenario', () => {
    const first = defineReconstructionScenario(draft())
    const second = defineReconstructionScenario(draft())
    expect(first).toEqual(second)
    expect(first.version).toBe(3)
    expect(verifyReconstructionScenario(first)).toBe(true)
  })

  it('detects a modified decision', () => {
    const scenario = defineReconstructionScenario(draft())
    const changed = { ...scenario, seed: 402 }
    expect(verifyReconstructionScenario(changed)).toBe(false)
  })

  it('rejects duplicate decisions and preconditions', () => {
    const duplicateDecision = draft()
    duplicateDecision.decisions.push({ ...duplicateDecision.decisions[0] })
    expect(() => defineReconstructionScenario(duplicateDecision)).toThrow('Duplicate decision id')

    const duplicateCondition = draft()
    duplicateCondition.decisions[0].preconditions.push({
      ...duplicateCondition.decisions[0].preconditions[0],
    })
    expect(() => defineReconstructionScenario(duplicateCondition)).toThrow(
      'Duplicate precondition id',
    )
  })

  it('rejects an invalid seed before simulation', () => {
    expect(() => defineReconstructionScenario({ ...draft(), seed: -1 })).toThrow('seed')
  })

  it('parses a scenario received from an untrusted client', () => {
    expect(parseReconstructionScenarioDraft(draft())).toEqual(draft())
  })

  it('rejects malformed, oversized and non-scalar client input', () => {
    expect(() => parseReconstructionScenarioDraft({ ...draft(), mode: 'anything' })).toThrow('mode')
    expect(() =>
      parseReconstructionScenarioDraft({
        ...draft(),
        decisions: Array.from({ length: 51 }, (_, index) => ({
          ...draft().decisions[0],
          id: `decision-${index}`,
        })),
      }),
    ).toThrow('at most 50')
    expect(() =>
      parseReconstructionScenarioDraft({
        ...draft(),
        decisions: [{ ...draft().decisions[0], parameters: { nested: {} } }],
      }),
    ).toThrow('must be scalar')
  })
})
