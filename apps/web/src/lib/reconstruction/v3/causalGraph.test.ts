import { describe, expect, it } from 'vitest'
import { buildCausalGraph, type CausalContext } from './causalGraph'
import { defineReconstructionScenario } from './scenario'

const context: CausalContext = {
  locations: { 'body-kurapika': 'room-1014' },
  factsByObserver: { kurapika: ['fact-threat'] },
  abilitiesByOwner: { kurapika: ['dowsing-chain'] },
  occurredEventIds: ['event-fork'],
}

function scenario(expectedLocation = 'room-1014') {
  return defineReconstructionScenario({
    id: 'scenario',
    title: 'Scenario',
    forkEventId: 'event-fork',
    mode: 'rule-compatible',
    seed: 1,
    decisions: [
      {
        id: 'leave',
        kind: 'MOVE_ENTITY',
        actorId: 'kurapika',
        targetIds: ['corridor'],
        parameters: {},
        preconditions: [
          {
            id: 'at-room',
            kind: 'entity-at',
            subjectId: 'body-kurapika',
            expected: expectedLocation,
          },
          {
            id: 'knows-threat',
            kind: 'knows-fact',
            subjectId: 'kurapika',
            expected: 'fact-threat',
          },
        ],
      },
    ],
  })
}

describe('Reconstruction V3 causal graph', () => {
  it('marks a decision executable only when every condition holds', () => {
    const graph = buildCausalGraph(scenario(), context)
    expect(graph.executableDecisionIds).toEqual(['leave'])
    expect(graph.edges).toHaveLength(2)
  })

  it('explains the exact condition blocking a decision', () => {
    const graph = buildCausalGraph(scenario('room-1001'), context)
    expect(graph.blockedDecisionIds).toEqual(['leave'])
    expect(graph.nodes.find((node) => node.id === 'at-room')?.reason).toContain('room-1014')
  })

  it('links decisions that causally follow earlier decisions', () => {
    const value = scenario()
    const chained = defineReconstructionScenario({
      ...value,
      decisions: [
        ...value.decisions,
        {
          id: 'warn-oito',
          kind: 'SHARE_KNOWLEDGE',
          actorId: 'kurapika',
          targetIds: ['oito'],
          parameters: {},
          preconditions: [
            { id: 'after-leave', kind: 'event-occurred', subjectId: 'kurapika', expected: 'leave' },
          ],
        },
      ],
    })
    const graph = buildCausalGraph(chained, context)
    expect(graph.edges).toContainEqual({ from: 'leave', to: 'warn-oito', relation: 'follows' })
    expect(graph.blockedDecisionIds).toContain('warn-oito')
  })

  it('rejects causal cycles', () => {
    const value = scenario()
    const cyclic = defineReconstructionScenario({
      ...value,
      decisions: [
        {
          ...value.decisions[0],
          preconditions: [{ id: 'after-b', kind: 'event-occurred', subjectId: 'a', expected: 'b' }],
        },
        {
          id: 'b',
          kind: 'MOVE_ENTITY',
          actorId: 'b',
          targetIds: [],
          parameters: {},
          preconditions: [
            { id: 'after-leave', kind: 'event-occurred', subjectId: 'b', expected: 'leave' },
          ],
        },
      ],
    })
    expect(() => buildCausalGraph(cyclic, context)).toThrow('Causal cycle')
  })
})
