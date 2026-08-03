import { describe, expect, it } from 'vitest'
import { createEmptyWorld } from '@black-whale/canon-engine'
import { bungeeGum } from '../src/index.js'

const cursor = {
  branchId: 'simulation',
  ordinal: 4,
  eventId: 'event-4',
  chapterNumber: 357,
  localSequence: 2,
}

describe('Bungee Gum ability contract', () => {
  it('uses the same conditions to plan and execute an activation', () => {
    const worldState = createEmptyWorld(cursor)
    worldState.entities.hisoka = {
      id: 'hisoka',
      kind: 'CHARACTER',
      label: 'Hisoka',
      metadata: { mentalState: 'ACTIVE' },
    }
    worldState.entities.wall = { id: 'wall', kind: 'OBJECT', label: 'Wall' }
    worldState.abilitiesByOwner.hisoka = ['bungee-gum']

    const context = {
      abilityId: 'bungee-gum',
      actorId: 'hisoka',
      actor: { id: 'hisoka', kind: 'CHARACTER' as const },
      targets: ['wall'],
      targetRefs: [{ id: 'wall', kind: 'OBJECT' as const }],
      anchors: [
        { entity: { id: 'hisoka', kind: 'CHARACTER' as const } },
        { entity: { id: 'wall', kind: 'OBJECT' as const } },
      ],
      eventId: cursor.eventId,
      actionId: 'attach',
      cursor,
      worldState,
    }

    expect(bungeeGum.plan(context).status).toBe('AVAILABLE')
    const result = bungeeGum.execute(context)
    expect(result.allowed).toBe(true)
    expect(result.events?.map((event) => event.type)).toEqual(['EFFECT_CREATED'])
    expect(result.events?.[0]?.payload.effect.kind).toBe('ELASTIC_BINDING')
  })

  it('reports unknown conditions instead of throwing without a world snapshot', () => {
    const plan = bungeeGum.plan({
      abilityId: 'bungee-gum',
      actorId: 'hisoka',
      targets: [],
      eventId: 'preview',
    })
    expect(plan.status).toBe('UNKNOWN')
    expect(plan.conditions.every((condition) => condition.status === 'UNKNOWN')).toBe(true)
  })
})
