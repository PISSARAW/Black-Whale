import { describe, expect, it } from 'vitest'
import { createEmptyWorld } from '../src/world/state.js'
import { reduceWorld } from '../src/world/reducer.js'
import type { WorldEvent } from '../src/world/events.js'
import type { StoryCursor } from '../src/world/cursor.js'
import { projectMapScene } from '../src/world/projections.js'

const BRANCH = 'canon'

function cursor(ordinal: number): StoryCursor {
  return {
    branchId: BRANCH,
    ordinal,
    eventId: `event-${ordinal}`,
    chapterNumber: 357,
    localSequence: ordinal,
  }
}

function event<TEvent extends WorldEvent>(
  ordinal: number,
  partial: Pick<TEvent, 'type' | 'payload'>,
): WorldEvent {
  return {
    id: `e-${ordinal}`,
    schemaVersion: 1,
    branchId: BRANCH,
    cursor: cursor(ordinal),
    ...partial,
  } as WorldEvent
}

/** A world with Hisoka, his body, and a wall to stick things to. */
function seeded() {
  let state = createEmptyWorld(cursor(0))
  const registrations: WorldEvent[] = [
    event(1, {
      type: 'ENTITY_REGISTERED',
      payload: { entity: { id: 'hisoka', kind: 'CHARACTER', label: 'Hisoka' } },
    }),
    event(2, {
      type: 'ENTITY_REGISTERED',
      payload: {
        entity: {
          id: 'hisoka-body',
          kind: 'BODY',
          label: 'Corps de Hisoka',
          originalCharacterId: 'hisoka',
        },
      },
    }),
    event(3, {
      type: 'ENTITY_REGISTERED',
      payload: { entity: { id: 'wall', kind: 'OBJECT', label: 'Mur' } },
    }),
  ]
  for (const registration of registrations) state = reduceWorld(state, registration)
  return state
}

function effectCreated(ordinal: number, id: string, attributes: Record<string, unknown>) {
  return event(ordinal, {
    type: 'EFFECT_CREATED',
    payload: {
      effect: {
        id,
        kind: 'ELASTIC_BINDING' as const,
        abilityId: 'bungee-gum',
        source: { id: 'hisoka', kind: 'CHARACTER' as const },
        targets: [{ id: 'wall', kind: 'OBJECT' as const }],
        anchors: [
          { entity: { id: 'hisoka', kind: 'CHARACTER' as const } },
          { entity: { id: 'wall', kind: 'OBJECT' as const } },
        ],
        state: 'ACTIVE' as const,
        attributes,
        startedAt: cursor(ordinal),
      },
    },
  })
}

describe('post-mortem invariant', () => {
  it('ends the effects a dead source was sustaining', () => {
    let state = seeded()
    state = reduceWorld(state, effectCreated(4, 'trap', {}))
    state = reduceWorld(
      state,
      event(5, { type: 'BODY_STATE_CHANGED', payload: { bodyId: 'hisoka-body', state: 'DEAD' } }),
    )
    expect(state.effects['trap']?.state).toBe('ENDED')
    expect(state.effects['trap']?.endedAt?.ordinal).toBe(5)
  })

  it('keeps the effects that were programmed to outlive their source', () => {
    let state = seeded()
    state = reduceWorld(state, effectCreated(4, 'heart', { postMortem: true }))
    state = reduceWorld(
      state,
      event(5, { type: 'BODY_STATE_CHANGED', payload: { bodyId: 'hisoka-body', state: 'DEAD' } }),
    )
    expect(state.effects['heart']?.state).toBe('ACTIVE')
  })
})

describe('effect state and counters', () => {
  it('moves an effect from dormant to triggered and records the end', () => {
    let state = seeded()
    state = reduceWorld(state, effectCreated(4, 'curse', {}))
    state = reduceWorld(
      state,
      event(5, {
        type: 'EFFECT_STATE_CHANGED',
        payload: { effectId: 'curse', state: 'TRIGGERED', attributes: { violated: true } },
      }),
    )
    expect(state.effects['curse']?.state).toBe('TRIGGERED')
    expect(state.effects['curse']?.attributes['violated']).toBe(true)

    state = reduceWorld(
      state,
      event(6, { type: 'EFFECT_STATE_CHANGED', payload: { effectId: 'curse', state: 'ENDED' } }),
    )
    expect(state.effects['curse']?.endedAt?.ordinal).toBe(6)
  })

  it('refuses to resurrect an ended effect', () => {
    let state = seeded()
    state = reduceWorld(state, effectCreated(4, 'curse', {}))
    state = reduceWorld(state, event(5, { type: 'EFFECT_ENDED', payload: { effectId: 'curse' } }))
    expect(() =>
      reduceWorld(
        state,
        event(6, { type: 'EFFECT_STATE_CHANGED', payload: { effectId: 'curse', state: 'ACTIVE' } }),
      ),
    ).toThrow(/has ended/)
  })

  it('accumulates counters and cohort members', () => {
    let state = seeded()
    state = reduceWorld(state, effectCreated(4, 'network', { level: 0, memberIds: ['a'] }))
    state = reduceWorld(
      state,
      event(5, {
        type: 'EFFECT_ATTRIBUTE_CHANGED',
        payload: {
          effectId: 'network',
          increments: { level: 50 },
          append: { memberIds: ['a', 'b'] },
        },
      }),
    )
    expect(state.effects['network']?.attributes['level']).toBe(50)
    expect(state.effects['network']?.attributes['memberIds']).toEqual(['a', 'b'])
  })

  it('starts a counter that did not exist yet from zero', () => {
    let state = seeded()
    state = reduceWorld(state, effectCreated(4, 'emperor', {}))
    state = reduceWorld(
      state,
      event(5, {
        type: 'EFFECT_ATTRIBUTE_CHANGED',
        payload: { effectId: 'emperor', increments: { lifespanSpentHours: 12 } },
      }),
    )
    expect(state.effects['emperor']?.attributes['lifespanSpentHours']).toBe(12)
  })
})

describe('ability revocation', () => {
  it('takes an ability away from its owner', () => {
    let state = seeded()
    state = reduceWorld(
      state,
      event(4, {
        type: 'ABILITY_GRANTED',
        payload: { ownerId: 'sayird', abilityId: 'little-eye' },
      }),
    )
    state = reduceWorld(
      state,
      event(5, {
        type: 'ABILITY_REVOKED',
        payload: { ownerId: 'sayird', abilityId: 'little-eye' },
      }),
    )
    expect(state.abilitiesByOwner['sayird']).toEqual([])
  })
})

describe('inheritance invariant', () => {
  /** Benjamin, his roster effect, and a soldier who owns an ability. */
  function army() {
    let state = seeded()
    for (const [ordinal, entity] of [
      [4, { id: 'benjamin', kind: 'CHARACTER' as const, label: 'Benjamin' }],
      [5, { id: 'musse', kind: 'CHARACTER' as const, label: 'Musse' }],
      [
        6,
        {
          id: 'musse-body',
          kind: 'BODY' as const,
          label: 'Corps de Musse',
          originalCharacterId: 'musse',
        },
      ],
    ] as const) {
      state = reduceWorld(state, event(ordinal, { type: 'ENTITY_REGISTERED', payload: { entity } }))
    }
    state = reduceWorld(
      state,
      event(7, {
        type: 'ABILITY_GRANTED',
        payload: { ownerId: 'musse', abilityId: 'secret-window' },
      }),
    )
    state = reduceWorld(
      state,
      event(8, {
        type: 'EFFECT_CREATED',
        payload: {
          effect: {
            id: 'baton',
            kind: 'ABILITY_GRANT',
            abilityId: 'benjamin-baton',
            source: { id: 'benjamin', kind: 'CHARACTER' },
            targets: [],
            state: 'ACTIVE',
            attributes: { inheritTo: 'benjamin', memberIds: ['musse'] },
            startedAt: cursor(8),
          },
        },
      }),
    )
    return state
  }

  it('hands a dead soldier’s abilities to the heir', () => {
    const state = reduceWorld(
      army(),
      event(9, { type: 'BODY_STATE_CHANGED', payload: { bodyId: 'musse-body', state: 'DEAD' } }),
    )
    expect(state.abilitiesByOwner['benjamin']).toEqual(['secret-window'])
  })

  it('ignores the death of somebody who is not on the roster', () => {
    let state = army()
    state = reduceWorld(
      state,
      event(9, { type: 'BODY_STATE_CHANGED', payload: { bodyId: 'hisoka-body', state: 'DEAD' } }),
    )
    expect(state.abilitiesByOwner['benjamin']).toBeUndefined()
  })
})

describe('Gyo and apparent identity', () => {
  it('hides a masked effect from a character and shows it under Gyo', () => {
    let state = seeded()
    state = reduceWorld(state, effectCreated(4, 'in-trap', { masked: true }))

    const naive = projectMapScene(state, {
      assetKey: 'tier-3',
      perception: { observerId: 'gon' },
    })
    expect(naive.effectLinks).toHaveLength(0)

    const gyo = projectMapScene(state, {
      assetKey: 'tier-3',
      perception: { observerId: 'gon', gyo: true },
    })
    expect(gyo.effectLinks.map((link) => link.effectId)).toEqual(['in-trap'])
  })

  it('shows a masked entity as who it pretends to be, except to the omniscient view', () => {
    let state = seeded()
    state = reduceWorld(
      state,
      event(4, {
        type: 'ENTITY_REGISTERED',
        payload: { entity: { id: 'bonolenov', kind: 'CHARACTER', label: 'Bonolenov' } },
      }),
    )
    state = reduceWorld(
      state,
      event(5, {
        type: 'EFFECT_CREATED',
        payload: {
          effect: {
            id: 'metamorphosen',
            kind: 'PERCEPTION_MASK',
            abilityId: 'battle-cantabile-metamorphosen',
            source: { id: 'bonolenov', kind: 'CHARACTER' },
            targets: [{ id: 'bonolenov', kind: 'CHARACTER' }],
            state: 'ACTIVE',
            attributes: { appearsAs: 'hisoka' },
            startedAt: cursor(5),
          },
        },
      }),
    )
    state = reduceWorld(
      state,
      event(6, {
        type: 'ENTITY_MOVED',
        payload: {
          presence: {
            entity: { id: 'bonolenov', kind: 'CHARACTER' },
            locationId: 'tier-5',
            precision: 'EXACT_ROOM',
            certainty: 'CONFIRMED',
          },
        },
      }),
    )

    const apparent = projectMapScene(state, {
      assetKey: 'tier-5',
      perception: { observerId: 'machi' },
    })
    expect(apparent.markers[0]).toMatchObject({ label: 'Hisoka', appearsAs: 'hisoka' })

    const omniscient = projectMapScene(state, {
      assetKey: 'tier-5',
      perception: { omniscient: true },
    })
    expect(omniscient.markers[0]).toMatchObject({ label: 'Bonolenov', appearsAs: undefined })
  })
})
