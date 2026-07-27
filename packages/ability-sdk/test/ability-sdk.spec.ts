import { describe, expect, it } from 'vitest'
import type { AbilityContext } from '@black-whale/nen-engine'
import { createEmptyWorld, type StoryCursor, type WorldState } from '@black-whale/world-engine'
import {
  attach,
  canUseNen,
  defineAbility,
  elasticConnection,
  isAlive,
  isConscious,
  maxDistance,
  teleport,
  transferConsciousness,
  wheelEntry,
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

function context(overrides: Partial<AbilityContext> = {}): AbilityContext {
  return {
    abilityId: 'bungee-gum',
    actorId: 'hisoka',
    targets: ['door-3101'],
    eventId: 'event-1',
    cursor: CURSOR,
    worldState: world(),
    ...overrides,
  }
}

describe('condition builders', () => {
  it('reports UNKNOWN rather than guessing when there is no world state', () => {
    const ctx = context({ worldState: undefined })
    expect(canUseNen()(ctx).status).toBe('UNKNOWN')
    expect(isConscious()(ctx).status).toBe('UNKNOWN')
    expect(isAlive()(ctx).status).toBe('UNKNOWN')
  })

  it('requires the actor to actually own the ability', () => {
    expect(canUseNen()(context()).status).toBe('UNMET')

    const owned = world((state) => {
      state.abilitiesByOwner['hisoka'] = ['bungee-gum']
    })
    expect(canUseNen()(context({ worldState: owned })).status).toBe('MET')
  })

  it('distinguishes an unknown mental state from an inactive one', () => {
    const unknown = world()
    expect(isConscious()(context({ worldState: unknown })).status).toBe('UNKNOWN')

    const unconscious = world((state) => {
      state.entities['hisoka']!.metadata = { mentalState: 'UNCONSCIOUS' }
    })
    expect(isConscious()(context({ worldState: unconscious })).status).toBe('UNMET')

    const active = world((state) => {
      state.entities['hisoka']!.metadata = { mentalState: 'ACTIVE' }
    })
    expect(isConscious()(context({ worldState: active })).status).toBe('MET')
  })

  it('treats an injured body as still able to act', () => {
    const injured = world((state) => {
      state.bodyStates['hisoka'] = 'INJURED'
    })
    expect(isAlive()(context({ worldState: injured })).status).toBe('MET')

    const dead = world((state) => {
      state.bodyStates['hisoka'] = 'DEAD'
    })
    expect(isAlive()(context({ worldState: dead })).status).toBe('UNMET')
  })

  it('leaves distance unknown when it was never measured', () => {
    expect(maxDistance(10)(context()).status).toBe('UNKNOWN')
    expect(maxDistance(10)(context({ parameters: { distanceMeters: 4 } })).status).toBe('MET')
    expect(maxDistance(10)(context({ parameters: { distanceMeters: 40 } })).status).toBe('UNMET')
  })
})

describe('effect builders', () => {
  it('anchors an elastic connection to both ends', () => {
    const [event] = elasticConnection()(context())
    const effect = (event as { payload: { effect: Record<string, any> } }).payload.effect

    expect(effect.kind).toBe('ELASTIC_BINDING')
    expect(effect.attributes).toEqual({ retractable: true, adhesive: true })
    expect(effect.source.id).toBe('hisoka')
    expect(effect.targets[0].id).toBe('door-3101')
    expect(effect.anchors).toHaveLength(2)
  })

  it('derives a deterministic effect id, so a replay does not duplicate it', () => {
    const first = elasticConnection()(context())
    const second = elasticConnection()(context())
    expect((first[0] as any).payload.effect.id).toBe((second[0] as any).payload.effect.id)
  })

  it('emits nothing when a transfer has no destination body', () => {
    expect(transferConsciousness()(context({ targets: [] }))).toEqual([])
  })

  it('moves a consciousness to the first target', () => {
    const [event] = transferConsciousness()(
      context({ parameters: { consciousnessId: 'mind-hisoka', fromBodyId: 'body-hisoka' } }),
    )
    expect(event).toMatchObject({
      type: 'CONSCIOUSNESS_TRANSFERRED',
      payload: { consciousnessId: 'mind-hisoka', fromBodyId: 'body-hisoka', toBodyId: 'door-3101' },
    })
  })

  it('emits nothing for a teleport with no destination', () => {
    expect(teleport()(context())).toEqual([])
  })

  it('moves an entity when a location is supplied', () => {
    const [event] = teleport()(context({ parameters: { locationId: 'tier-4' } }))
    expect(event).toMatchObject({
      type: 'ENTITY_MOVED',
      payload: { presence: { locationId: 'tier-4', certainty: 'CONFIRMED' } },
    })
  })
})

describe('defineAbility', () => {
  const ability = defineAbility({
    id: 'bungee-gum',
    owner: 'hisoka',
    conditions: [canUseNen()],
    interactions: [attach()],
    effects: [elasticConnection()],
    actionWheel: [wheelEntry({ id: 'attach', label: 'Attach', abilityId: 'bungee-gum' })],
  })

  const owned = () =>
    context({
      worldState: world((state) => {
        state.abilitiesByOwner['hisoka'] = ['bungee-gum']
      }),
    })

  it('locks the plan when a condition is unmet', () => {
    const plan = ability.plan(context())
    expect(plan.status).toBe('LOCKED')
  })

  it('reports UNKNOWN rather than LOCKED when a condition cannot be evaluated', () => {
    expect(ability.plan(context({ worldState: undefined })).status).toBe('UNKNOWN')
  })

  it('unlocks the plan once every condition is met', () => {
    expect(ability.plan(owned()).status).toBe('AVAILABLE')
  })

  it('refuses to execute a locked ability and names the violated rule', () => {
    const result = ability.execute(context())
    expect(result.allowed).toBe(false)
    expect(ability.validateActivation(context()).violatedRules).toEqual(['can-use-nen'])
  })

  it('emits its effects once allowed', () => {
    const result = ability.execute(owned())
    expect(result.allowed).toBe(true)
    expect(result.events?.[0]?.type).toBe('EFFECT_CREATED')
    expect(result.generatedEvents).toHaveLength(1)
  })

  it('explains an action it does not know about', () => {
    expect(ability.explainAction('detach', context())).toMatchObject({ available: false })
    expect(ability.explainAction('attach', context())).toMatchObject({ available: true })
  })

  it('falls back to a derived UI component key', () => {
    expect(ability.getUIComponent()).toEqual({ componentKey: 'bungee-gum-ui' })
  })
})
