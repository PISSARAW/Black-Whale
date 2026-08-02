import { describe, expect, it } from 'vitest'
import { defineReconstructionScenario } from './scenario'
import { createReconstructionReplay } from './replay'
import { buildReconstructionReport } from './report'
import { decodeSharedScenario, encodeSharedScenario } from './share'

const scenario = defineReconstructionScenario({
  id: 'v3-share',
  title: 'Évasion de la suite 1014',
  forkEventId: 'event-1',
  mode: 'rule-compatible',
  seed: 14,
  decisions: [
    {
      id: 'chain-jail',
      kind: 'ACTIVATE_HATSU',
      actorId: 'kurapika',
      targetIds: ['target'],
      parameters: { abilityId: 'chain-jail', actionId: 'bind' },
      preconditions: [
        {
          id: 'ability-ready',
          kind: 'ability-available',
          subjectId: 'kurapika',
          expected: 'chain-jail',
        },
      ],
    },
  ],
})

describe('Reconstruction V3 explainable report', () => {
  it('explains a causal divergence and its decisive Hatsu', () => {
    const replay = createReconstructionReplay({
      scenario,
      initialState: {},
      steps: [
        {
          decisionId: 'chain-jail',
          status: 'applied',
          reason: 'bound',
          eventIds: ['effect-1'],
          stateChecksum: 'state-1',
        },
      ],
      finalState: {},
    })
    const report = buildReconstructionReport(replay, [
      {
        subjectId: 'target',
        axis: 'body-state',
        status: 'changed',
        canonical: 'FREE',
        branch: 'BOUND',
      },
    ])
    expect(report.divergenceDecisionId).toBe('chain-jail')
    expect(report.fidelity).toBe('compatible-divergence')
    expect(report.decisiveHatsu).toEqual([{ decisionId: 'chain-jail', abilityId: 'chain-jail' }])
    expect(report.assumptions[0]).toContain('ability-available')
  })

  it('round-trips Unicode scenarios and rejects tampering', () => {
    const encoded = encodeSharedScenario(scenario)
    expect(decodeSharedScenario(encoded)).toEqual(scenario)
    expect(() => decodeSharedScenario(`${encoded.slice(0, -1)}A`)).toThrow('Invalid shared')
  })
})
