import { describe, expect, it } from 'vitest'
import { defineReconstructionScenario } from './scenario'
import {
  createReconstructionReplay,
  parseReconstructionReplay,
  serializeReconstructionReplay,
  verifyReconstructionReplay,
} from './replay'

const scenario = defineReconstructionScenario({
  id: 'branch',
  title: 'Branch',
  forkEventId: 'event-1',
  mode: 'rule-compatible',
  seed: 7,
  decisions: [
    {
      id: 'move',
      kind: 'MOVE_ENTITY',
      actorId: 'body-1',
      targetIds: ['room-b'],
      parameters: {},
      preconditions: [],
    },
  ],
})

function replay() {
  return createReconstructionReplay({
    scenario,
    initialState: { presences: { 'body-1': 'room-a' } },
    steps: [
      {
        decisionId: 'move',
        status: 'applied',
        reason: 'All preconditions satisfied',
        eventIds: ['branch:event:1'],
        stateChecksum: 'step-checksum',
      },
    ],
    finalState: { presences: { 'body-1': 'room-b' } },
  })
}

describe('Reconstruction V3 replay', () => {
  it('is deterministic and round-trips through JSON', () => {
    expect(replay()).toEqual(replay())
    expect(parseReconstructionReplay(serializeReconstructionReplay(replay()))).toEqual(replay())
  })

  it('detects edits to a recorded consequence', () => {
    const changed = { ...replay(), finalStateChecksum: 'tampered' }
    expect(verifyReconstructionReplay(changed)).toBe(false)
  })

  it('rejects reordered or duplicated decision steps', () => {
    const value = replay()
    expect(
      verifyReconstructionReplay({ ...value, steps: [{ ...value.steps[0], sequence: 1 }] }),
    ).toBe(false)
    expect(
      verifyReconstructionReplay({
        ...value,
        steps: [value.steps[0], { ...value.steps[0], sequence: 1 }],
      }),
    ).toBe(false)
  })

  it('refuses invalid serialized data', () => {
    expect(() => parseReconstructionReplay('{"version":1}')).toThrow(
      'Invalid Reconstruction replay',
    )
  })
})
