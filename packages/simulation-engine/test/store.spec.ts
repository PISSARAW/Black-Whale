import { describe, expect, it, vi } from 'vitest'
import { createEmptyWorld, type StoryCursor, type WorldState } from '@black-whale/canon-engine'
import {
  SimulationInputError,
  SimulationStore,
  parseCreateSimulationInput,
  parseSimulationActionInput,
  type SimulationStorePorts,
} from '../src/store.js'

const CURSOR: StoryCursor = {
  branchId: 'canon',
  eventId: 'event-1',
  chapterNumber: 401,
  localSequence: 1,
  ordinal: 1,
}

function worldWithEntity(): WorldState {
  const state = createEmptyWorld(CURSOR)
  state.entities['hisoka'] = { id: 'hisoka', kind: 'CHARACTER', label: 'Hisoka' }
  return state
}

/** Enough of PrismaClient for the paths exercised here. */
function fakePrisma() {
  const transaction = {
    worldBranch: {
      upsert: vi.fn(),
      create: vi.fn((input: { data: { id: string } }) => {
        branchIdOfLastCreate = input.data.id
      }),
    },
    worldProjectionSnapshot: {
      create: vi.fn((input: { data: { payload: unknown } }) =>
        snapshots.set(branchIdOfLastCreate, input.data.payload),
      ),
    },
    worldEventRecord: { create: vi.fn() },
    worldEffectRecord: { create: vi.fn() },
  }
  const client = {
    $transaction: vi.fn(async (run: (tx: typeof transaction) => Promise<void>) => run(transaction)),
    worldBranch: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        snapshots.has(where.id)
          ? {
              id: where.id,
              name: 'restored',
              kind: 'SIMULATION',
              rulePolicy: 'SANDBOX',
              parentBranchId: null,
              ownerId: null,
              createdAt: new Date(),
              projections: [{ payload: snapshots.get(where.id) }],
            }
          : null,
      ),
      findMany: vi.fn(async () => []),
      deleteMany: vi.fn(),
    },
  }
  return client
}

const snapshots = new Map<string, unknown>()
let branchIdOfLastCreate = ''

function ports(overrides: Partial<SimulationStorePorts> = {}): SimulationStorePorts {
  return {
    loadKernelState: async () => worldWithEntity(),
    executeAbility: async () => ({ allowed: true, events: [] }),
    ...overrides,
  }
}

describe('parseCreateSimulationInput', () => {
  it('accepts a canonical fork request', () => {
    expect(parseCreateSimulationInput({ parentEventId: 'event-1', mode: 'sandbox' })).toEqual({
      parentEventId: 'event-1',
      mode: 'sandbox',
      ownerId: undefined,
    })
  })

  it('rejects an unknown rule policy', () => {
    expect(() =>
      parseCreateSimulationInput({ parentEventId: 'event-1', mode: 'anything-goes' }),
    ).toThrow(SimulationInputError)
  })

  it('rejects an over-long identifier', () => {
    expect(() =>
      parseCreateSimulationInput({ parentEventId: 'x'.repeat(129), mode: 'sandbox' }),
    ).toThrow(SimulationInputError)
  })
})

describe('parseSimulationActionInput', () => {
  it('rejects an unsupported action type', () => {
    expect(() => parseSimulationActionInput({ actionType: 'DELETE_CANON', payload: {} })).toThrow(
      SimulationInputError,
    )
  })

  it('rejects a payload with too many keys', () => {
    const payload = Object.fromEntries(Array.from({ length: 33 }, (_, index) => [`k${index}`, 1]))
    expect(() => parseSimulationActionInput({ actionType: 'MOVE_ENTITY', payload })).toThrow(
      SimulationInputError,
    )
  })

  it('rejects a payload over the byte budget', () => {
    const payload = { blob: 'x'.repeat(9 * 1024) }
    expect(() => parseSimulationActionInput({ actionType: 'MOVE_ENTITY', payload })).toThrow(
      SimulationInputError,
    )
  })
})

describe('SimulationStore.applyAction', () => {
  it('rejects a move targeting an entity absent from the branch', async () => {
    const store = new SimulationStore(fakePrisma() as never, ports())
    const branch = await store.createBranch({ parentEventId: 'event-1', mode: 'sandbox' })

    await expect(
      store.applyAction(branch.id, {
        actionType: 'MOVE_ENTITY',
        payload: { entityId: 'ghost', locationId: 'tier-1' },
      }),
    ).rejects.toThrow(/Unknown entity ghost/)
  })

  it('surfaces the reason when an ability activation is refused', async () => {
    const store = new SimulationStore(
      fakePrisma(),
      ports({ executeAbility: async () => ({ allowed: false, reason: 'Target is out of reach' }) }),
    )
    const branch = await store.createBranch({ parentEventId: 'event-1', mode: 'rule-compatible' })

    await expect(
      store.applyAction(branch.id, {
        actionType: 'ACTIVATE_ABILITY',
        payload: {
          abilityId: 'bungee-gum',
          actorId: 'hisoka',
          interaction: 'attach',
          targets: ['gon'],
        },
      }),
    ).rejects.toThrow(/Target is out of reach/)
  })

  it('activates an ability against the branch state, not the canonical timeline', async () => {
    const executeAbility = vi.fn(async () => ({ allowed: true, events: [] }))
    const store = new SimulationStore(fakePrisma() as never, ports({ executeAbility }))
    const branch = await store.createBranch({ parentEventId: 'event-1', mode: 'rule-compatible' })

    await store.applyAction(branch.id, {
      actionType: 'ACTIVATE_ABILITY',
      payload: {
        abilityId: 'bungee-gum',
        actorId: 'hisoka',
        interaction: 'attach',
        targets: ['gon'],
      },
    })

    const [, request, state] = executeAbility.mock.calls[0] as unknown as [
      string,
      { eventId: string },
      WorldState,
    ]
    expect(request.eventId).toBe('event-1')
    expect(state.cursor.branchId).toBe(branch.id)
  })
})

describe('SimulationStore bounds', () => {
  it('deletes simulation branches past the TTL when a new one is created', async () => {
    const prisma = fakePrisma()
    prisma.worldBranch.findMany.mockResolvedValue([{ id: 'stale' }])

    await new SimulationStore(prisma as never, ports()).createBranch({
      parentEventId: 'event-1',
      mode: 'sandbox',
    })

    expect(prisma.worldBranch.deleteMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ kind: 'SIMULATION' }),
    })
  })

  it('keeps only the most recent branches resident, rehydrating evicted ones on demand', async () => {
    const store = new SimulationStore(fakePrisma() as never, ports())
    const created = []
    for (let index = 0; index < 26; index += 1) {
      created.push((await store.createBranch({ parentEventId: 'event-1', mode: 'sandbox' })).id)
    }

    // The oldest branch was dropped from memory; its state survives in the
    // latest projection and is rehydrated from there.
    await expect(store.getBranchState(created[0])).resolves.toMatchObject({
      branch: { id: created[0] },
    })
    await expect(store.getBranchState(created[25])).resolves.toMatchObject({
      branch: { id: created[25] },
    })
  })
})
