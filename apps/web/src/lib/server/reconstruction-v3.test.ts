import { describe, expect, it, vi } from 'vitest'

vi.mock('./simulations', () => ({ simulationStore: {} }))

import { reconstructionExecutorPorts } from './reconstruction-v3'

function store() {
  return {
    createBranch: vi.fn(async () => ({ id: 'branch-1' })),
    getBranchState: vi.fn(async () => ({
      branch: {},
      snapshot: {
        presences: {},
        abilitiesByOwner: {},
      },
    })),
    applyAction: vi.fn(async (_branchId: string, input: { actionType: string }) => ({
      snapshot: { lastAction: input.actionType },
      appliedEvents: [{ id: `event-${input.actionType}` }],
      canonFidelity: 0.75,
      warnings: [],
    })),
  }
}

describe('Reconstruction V3 SimulationStore adapter', () => {
  it('creates a real rule-compatible branch at the fork', async () => {
    const fake = store()
    const branch = await reconstructionExecutorPorts(fake as never).createBranch(
      'event-401',
      'rule-compatible',
    )
    expect(fake.createBranch).toHaveBeenCalledWith({
      parentEventId: 'event-401',
      mode: 'rule-compatible',
    })
    expect(branch.id).toBe('branch-1')
  })

  it('maps movement and Hatsu to SimulationStore actions', async () => {
    const fake = store()
    const ports = reconstructionExecutorPorts(fake as never)
    await ports.move('branch-1', 'body-1', 'room-b')
    await ports.activateHatsu('branch-1', {
      abilityId: 'dowsing-chain',
      actionId: 'dowse',
      actorId: 'kurapika',
      targetIds: ['body-1'],
      parameters: {},
    })
    expect(fake.applyAction.mock.calls.map((call) => call[1].actionType)).toEqual([
      'MOVE_ENTITY',
      'ACTIVATE_ABILITY',
    ])
  })

  it('derives causal knowledge without exposing rejected or outdated records', () => {
    const context = reconstructionExecutorPorts(store() as never).causalContext(
      {
        presences: { body: { locationId: 'room-a' } },
        abilitiesByOwner: { kurapika: ['dowsing-chain'] },
      },
      {
        byObserver: {
          kurapika: {
            known: {
              factId: 'known',
              state: 'KNOWN',
              confidence: 1,
              acquiredAtDecisionId: 'canon',
              sourceCharacterId: null,
              transmissionPath: [],
            },
            old: {
              factId: 'old',
              state: 'OUTDATED',
              confidence: 1,
              acquiredAtDecisionId: 'canon',
              sourceCharacterId: null,
              transmissionPath: [],
            },
          },
        },
      },
      ['fork'],
    )
    expect(context).toMatchObject({
      locations: { body: 'room-a' },
      factsByObserver: { kurapika: ['known'] },
    })
  })
})
