import { describe, expect, it, vi } from 'vitest'
import { createEmptyWorld, type StoryCursor, type WorldState } from '@black-whale/canon-engine'
import {
  NenActionInputError,
  NenRuntime,
  parseNenActionRequest,
  type NenAbilityModule,
  type NenCatalogEntry,
} from '../src/index.js'

const CURSOR: StoryCursor = {
  branchId: 'canon',
  eventId: 'event-1',
  chapterNumber: 401,
  localSequence: 1,
  ordinal: 1,
}

const CATALOG: NenCatalogEntry[] = [
  { id: 'bungee-gum', name: 'Bungee Gum', ownerId: 'hisoka', category: 'transmuter' },
  { id: 'emperor-time', name: 'Emperor Time', ownerId: 'kurapika', category: 'specialist' },
  { id: 'unowned', name: 'Unowned technique', ownerId: null },
]

function world(): WorldState {
  const state = createEmptyWorld(CURSOR)
  state.entities['hisoka'] = { id: 'hisoka', kind: 'CHARACTER', label: 'Hisoka' }
  state.entities['door-3101'] = { id: 'door-3101', kind: 'OBJECT', label: 'Door 3101' }
  return state
}

/** Captures the context the pure engine would receive. */
function spyModule(id: string) {
  const execute = vi.fn(() => ({ allowed: true, events: [] }))
  const module = {
    manifest: { id, name: id, ownerId: 'hisoka', category: 'transmuter', version: '1' },
    plan: () => ({
      abilityId: id,
      actionId: 'attach',
      status: 'AVAILABLE' as const,
      conditions: [],
      targetSchema: { allowedTargets: [], minimum: 0 },
      projectedEffects: [],
    }),
    validateActivation: () => ({ allowed: true }),
    execute,
    getAvailableInteractions: () => [],
    getPerspectiveEffects: () => [],
    getUIComponent: () => ({ componentKey: id }),
    getInteractionManifest: () => null,
    getActionWheel: () => [],
    explainAction: () => ({ actionId: 'attach', available: true, conditions: [] }),
  } as unknown as NenAbilityModule
  return { module, execute }
}

function runtime(options: { resolveCharacterId?: (slug: string) => Promise<string | null> } = {}) {
  const { module, execute } = spyModule('bungee-gum')
  const loadWorldState = vi.fn(async () => world())
  const engine = new NenRuntime(
    {
      loadWorldState,
      resolveCharacterId: options.resolveCharacterId ?? (async () => null),
    },
    CATALOG,
    [module],
  )
  return { engine, execute, loadWorldState }
}

const request = (overrides: Record<string, unknown> = {}) => ({
  actorId: 'hisoka',
  interaction: 'attach',
  targets: ['door-3101'],
  eventId: 'event-1',
  ...overrides,
})

describe('parseNenActionRequest', () => {
  it('accepts a well-formed action', () => {
    expect(parseNenActionRequest(request())).toMatchObject({
      actorId: 'hisoka',
      interaction: 'attach',
    })
  })

  it('rejects a missing actor', () => {
    expect(() => parseNenActionRequest(request({ actorId: undefined }))).toThrow(
      NenActionInputError,
    )
  })

  it('rejects an over-long identifier', () => {
    expect(() => parseNenActionRequest(request({ actorId: 'x'.repeat(129) }))).toThrow(
      /at most 128/,
    )
  })

  it('rejects more than sixteen targets', () => {
    const targets = Array.from({ length: 17 }, (_, index) => `target-${index}`)
    expect(() => parseNenActionRequest(request({ targets }))).toThrow(/at most 16/)
  })

  it('rejects an anchor point without numeric coordinates', () => {
    const anchors = [{ point: { x: 'left', y: 2, coordinateSpace: 'tier-1' } }]
    expect(() => parseNenActionRequest(request({ anchors }))).toThrow(/numeric x and y/)
  })

  it('rejects parameters that are not a plain object', () => {
    expect(() => parseNenActionRequest(request({ parameters: ['a'] }))).toThrow(/plain object/)
  })

  it('defaults targets to an empty list', () => {
    expect(parseNenActionRequest(request({ targets: undefined })).targets).toEqual([])
  })
})

describe('NenRuntime.listAbilities', () => {
  it('exposes the catalogue with owner renamed for the UI', () => {
    const { engine } = runtime()
    expect(engine.listAbilities()).toContainEqual(
      expect.objectContaining({ id: 'bungee-gum', owner: 'hisoka' }),
    )
  })
})

describe('NenRuntime context building', () => {
  it('grants the actor the ability it canonically owns', async () => {
    const { engine, execute } = runtime()
    await engine.executeInState('bungee-gum', parseNenActionRequest(request()), world())

    const context = execute.mock.calls[0]?.[0] as unknown as {
      worldState: WorldState
      actorId: string
    }
    expect(context.worldState.abilitiesByOwner['hisoka']).toContain('bungee-gum')
  })

  it('does not grant an ability the actor does not own', async () => {
    const { engine, execute } = runtime()
    await engine.executeInState('emperor-time', parseNenActionRequest(request()), world())
    // The module registered is bungee-gum, so emperor-time never reaches it.
    expect(execute).not.toHaveBeenCalled()
  })

  it('resolves entity references that already exist in the world', async () => {
    const { engine, execute } = runtime()
    await engine.executeInState('bungee-gum', parseNenActionRequest(request()), world())

    const context = execute.mock.calls[0]?.[0] as unknown as {
      targetRefs: Array<{ id: string; kind: string }>
    }
    expect(context.targetRefs[0]).toEqual({ id: 'door-3101', kind: 'OBJECT' })
  })

  it('falls back to a slug lookup when the reference is not an entity id', async () => {
    const resolveCharacterId = vi.fn(async (slug: string) =>
      slug === 'hisoka-morow' ? 'hisoka' : null,
    )
    const { engine, execute } = runtime({ resolveCharacterId })
    await engine.executeInState(
      'bungee-gum',
      parseNenActionRequest(request({ actorId: 'hisoka-morow' })),
      world(),
    )

    expect(resolveCharacterId).toHaveBeenCalledWith('hisoka-morow')
    const context = execute.mock.calls[0]?.[0] as unknown as { actorId: string }
    expect(context.actorId).toBe('hisoka')
  })

  it('keeps an unresolvable target as an opaque object reference', async () => {
    const { engine, execute } = runtime()
    await engine.executeInState(
      'bungee-gum',
      parseNenActionRequest(request({ targets: ['something-unmodelled'] })),
      world(),
    )

    const context = execute.mock.calls[0]?.[0] as unknown as {
      targetRefs: Array<{ id: string; kind: string }>
    }
    expect(context.targetRefs[0]).toEqual({ id: 'something-unmodelled', kind: 'OBJECT' })
  })

  it('falls back to the interaction when no explicit action is given', async () => {
    const { engine, execute } = runtime()
    await engine.executeInState('bungee-gum', parseNenActionRequest(request()), world())

    const context = execute.mock.calls[0]?.[0] as unknown as { actionId: string }
    expect(context.actionId).toBe('attach')
  })

  it('loads the canonical state only when validating against an event', async () => {
    const { engine, loadWorldState } = runtime()
    await engine.executeInState('bungee-gum', parseNenActionRequest(request()), world())
    expect(loadWorldState).not.toHaveBeenCalled()

    await engine.validate('bungee-gum', parseNenActionRequest(request()))
    expect(loadWorldState).toHaveBeenCalledWith('event-1')
  })
})

describe('NenRuntime.execute', () => {
  it('refuses an ability with no registered module', async () => {
    const { engine } = runtime()
    const result = await engine.executeInState(
      'emperor-time',
      parseNenActionRequest(request()),
      world(),
    )

    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/module not found/i)
  })
})
