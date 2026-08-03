import { describe, expect, it } from 'vitest'
import {
  createEmptyWorld,
  type EffectInstance,
  type StoryCursor,
  type WorldState,
} from '@black-whale/canon-engine'
import {
  NenEngine,
  type AbilityContext,
  type NenAbilityModule,
  type NenActionWheelEntry,
} from '../src/index.js'

const CURSOR: StoryCursor = {
  branchId: 'canon',
  eventId: 'event-1',
  chapterNumber: 401,
  localSequence: 1,
  ordinal: 1,
}

function world(mutate: (state: WorldState) => void = () => {}): WorldState {
  const state = createEmptyWorld(CURSOR)
  state.entities['hisoka'] = { id: 'hisoka', kind: 'CHARACTER', label: 'Hisoka' }
  mutate(state)
  return state
}

function effect(overrides: Partial<EffectInstance> = {}): EffectInstance {
  return {
    id: 'effect-1',
    kind: 'ELASTIC_BINDING',
    abilityId: 'bungee-gum',
    source: { id: 'hisoka', kind: 'CHARACTER' },
    targets: [],
    state: 'ACTIVE',
    attributes: {},
    startedAt: CURSOR,
    ...overrides,
  }
}

function context(overrides: Partial<AbilityContext> = {}): AbilityContext {
  return {
    abilityId: 'bungee-gum',
    actorId: 'hisoka',
    targets: [],
    eventId: 'event-1',
    cursor: CURSOR,
    worldState: world(),
    ...overrides,
  }
}

/** A module that only exists to put its own entries on the wheel. */
function wheelModule(abilityId: string, entries: NenActionWheelEntry[]): NenAbilityModule {
  return {
    manifest: { id: abilityId, name: abilityId, ownerId: 'hisoka', category: 'x', version: '1' },
    getActionWheel: (ctx: AbilityContext) =>
      entries.map((entry) => ({ ...entry, abilityId: ctx.abilityId })),
  } as unknown as NenAbilityModule
}

describe('NenEngine.getActiveAbilities', () => {
  it('derives one activation per ability still standing', async () => {
    const engine = new NenEngine()
    const state = world((draft) => {
      draft.effects['a'] = effect({ id: 'a' })
      draft.effects['b'] = effect({ id: 'b', kind: 'ADHESIVE_BINDING' })
      draft.effects['c'] = effect({ id: 'c', abilityId: 'texture-surprise' })
    })

    const active = await engine.getActiveAbilities(state)
    expect(active.map((entry) => entry.abilityId).sort()).toEqual([
      'bungee-gum',
      'texture-surprise',
    ])
    expect(active[0]).toMatchObject({ actorId: 'hisoka', startedAtEventId: 'event-1' })
  })

  it('ignores effects that have ended', async () => {
    const engine = new NenEngine()
    const state = world((draft) => {
      draft.effects['a'] = effect({ state: 'ENDED' })
    })
    expect(await engine.getActiveAbilities(state)).toEqual([])
  })

  it('counts a dormant trap as running', async () => {
    const engine = new NenEngine()
    const state = world((draft) => {
      draft.effects['a'] = effect({ state: 'DORMANT' })
    })
    expect((await engine.getActiveAbilities(state))[0]?.state).toBe('active')
  })

  it('marks an ability that outlived its user as post-mortem', async () => {
    const engine = new NenEngine()
    const state = world((draft) => {
      draft.effects['a'] = effect({ id: 'a' })
      draft.effects['b'] = effect({ id: 'b', attributes: { postMortem: true } })
    })
    expect((await engine.getActiveAbilities(state))[0]?.state).toBe('post_mortem')
  })
})

describe('NenEngine.buildActionWheel', () => {
  it('merges every ability the actor owns, not only the one in context', async () => {
    const engine = new NenEngine()
    engine.registerModule(
      wheelModule('bungee-gum', [
        { id: 'attach', label: 'Attacher', abilityId: 'bungee-gum', visibility: 'available' },
      ]),
    )
    engine.registerModule(
      wheelModule('texture-surprise', [
        { id: 'apply', label: 'Appliquer', abilityId: 'texture-surprise', visibility: 'available' },
      ]),
    )

    const state = world((draft) => {
      draft.abilitiesByOwner['hisoka'] = ['bungee-gum', 'texture-surprise']
    })
    const wheel = await engine.buildActionWheel(context({ worldState: state }))

    expect(wheel.filter((entry) => entry.abilityId !== null).map((entry) => entry.id)).toEqual([
      'attach',
      'apply',
    ])
  })

  it('locks a base action whose requirement is unmet and says which', async () => {
    const engine = new NenEngine()
    const state = world((draft) => {
      draft.entities['hisoka']!.metadata = { mentalState: 'UNCONSCIOUS' }
    })

    const wheel = await engine.buildActionWheel(context({ worldState: state }))
    const observe = wheel.find((entry) => entry.id === 'observe-aura')
    expect(observe).toMatchObject({ visibility: 'locked' })
    expect(observe?.hint).toMatch(/conscient/)
  })

  it('reports a base action as unknown rather than available when nothing is modelled', async () => {
    const engine = new NenEngine()
    const wheel = await engine.buildActionWheel(context())
    expect(wheel.find((entry) => entry.id === 'observe-aura')?.visibility).toBe('unknown')
    // Cancelling never depends on the world.
    expect(wheel.find((entry) => entry.id === 'cancel')?.visibility).toBe('available')
  })

  it('offers maintenance only while an effect of the actor is live', async () => {
    const engine = new NenEngine()
    expect(
      (await engine.buildActionWheel(context())).find((entry) => entry.id === 'maintain-effect')
        ?.visibility,
    ).toBe('locked')

    const running = world((draft) => {
      draft.effects['a'] = effect()
    })
    expect(
      (await engine.buildActionWheel(context({ worldState: running }))).find(
        (entry) => entry.id === 'maintain-effect',
      )?.visibility,
    ).toBe('available')
  })
})

describe('NenEngine.explainAction', () => {
  it('explains a base action with the predicate that gates it', async () => {
    const engine = new NenEngine()
    const state = world((draft) => {
      draft.entities['hisoka']!.metadata = { mentalState: 'UNCONSCIOUS' }
    })

    const availability = await engine.explainAction(
      'release-aura',
      context({ abilityId: '', worldState: state }),
    )
    expect(availability.available).toBe(false)
    expect(availability.conditions[0]).toMatchObject({ status: 'unmet' })
    expect(availability.conditions[0]?.label).toMatch(/conscient/)
  })

  it('refuses an action no module and no base rule claims', async () => {
    const engine = new NenEngine()
    const availability = await engine.explainAction('teleport', context({ abilityId: '' }))
    expect(availability.available).toBe(false)
    expect(availability.conditions[0]?.label).toMatch(/inconnue/)
  })
})
