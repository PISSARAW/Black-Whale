import { describe, expect, it, vi } from 'vitest'
import { executeReconstructionScenario, type ReconstructionExecutorPorts } from './executor'
import { defineReconstructionScenario } from './scenario'

function scenario() {
  return defineReconstructionScenario({
    id: 'run',
    title: 'Run',
    forkEventId: 'fork',
    mode: 'rule-compatible',
    seed: 1,
    decisions: [
      {
        id: 'move',
        kind: 'MOVE_ENTITY',
        actorId: 'body-1',
        targetIds: ['room-b'],
        parameters: {},
        preconditions: [
          { id: 'starts-a', kind: 'entity-at', subjectId: 'body-1', expected: 'room-a' },
        ],
      },
      {
        id: 'tell',
        kind: 'SHARE_KNOWLEDGE',
        actorId: 'kurapika',
        targetIds: ['oito'],
        parameters: { factId: 'threat', reliability: 'trusted' },
        preconditions: [
          { id: 'after-move', kind: 'event-occurred', subjectId: 'kurapika', expected: 'move' },
        ],
      },
      {
        id: 'cast',
        kind: 'ACTIVATE_HATSU',
        actorId: 'kurapika',
        targetIds: ['body-1'],
        parameters: { abilityId: 'dowsing-chain', actionId: 'dowse' },
        preconditions: [
          {
            id: 'has-chain',
            kind: 'ability-available',
            subjectId: 'kurapika',
            expected: 'dowsing-chain',
          },
        ],
      },
    ],
  })
}

function ports(): ReconstructionExecutorPorts {
  return {
    createBranch: vi.fn(async () => ({ id: 'branch-1', state: { location: 'room-a' } })),
    move: vi.fn(async () => ({ state: { location: 'room-b' }, eventIds: ['move-event'] })),
    activateHatsu: vi.fn(async () => ({
      state: { location: 'room-b', effect: 'dowsing' },
      eventIds: ['hatsu-event'],
    })),
    causalContext: (state, knowledge, occurredEventIds) => ({
      locations: { 'body-1': (state as { location: string }).location },
      factsByObserver: Object.fromEntries(
        Object.entries(knowledge.byObserver).map(([id, facts]) => [id, Object.keys(facts)]),
      ),
      abilitiesByOwner: { kurapika: ['dowsing-chain'] },
      occurredEventIds,
    }),
  }
}

const knowledge = {
  byObserver: {
    kurapika: {
      threat: {
        factId: 'threat',
        state: 'KNOWN' as const,
        confidence: 1,
        acquiredAtDecisionId: 'canon',
        sourceCharacterId: null,
        transmissionPath: ['kurapika'],
      },
    },
  },
}

describe('V3 scenario executor', () => {
  it('executes movement, knowledge and real Hatsu ports in causal order', async () => {
    const adapter = ports()
    const result = await executeReconstructionScenario(scenario(), knowledge, adapter)
    expect(result.replay.steps.map((step) => step.status)).toEqual([
      'applied',
      'applied',
      'applied',
    ])
    expect(result.knowledge.byObserver.oito.threat.state).toBe('KNOWN')
    expect(adapter.activateHatsu).toHaveBeenCalledWith(
      'branch-1',
      expect.objectContaining({ abilityId: 'dowsing-chain', actionId: 'dowse' }),
    )
  })

  it('records a rejected engine action without mutating later state', async () => {
    const adapter = ports()
    vi.mocked(adapter.move).mockRejectedValue(new Error('Destination is sealed'))
    const result = await executeReconstructionScenario(scenario(), knowledge, adapter)
    expect(result.replay.steps[0]).toMatchObject({
      status: 'invalidated',
      reason: 'Destination is sealed',
    })
    expect(result.replay.steps[1].status).toBe('blocked')
  })

  it('can derive canonical knowledge from the branch snapshot', async () => {
    const initializer = vi.fn(() => knowledge)
    const result = await executeReconstructionScenario(scenario(), initializer, ports())
    expect(initializer).toHaveBeenCalledWith({ location: 'room-a' })
    expect(result.initialState).toEqual({ location: 'room-a' })
  })
})
