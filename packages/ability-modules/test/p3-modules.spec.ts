import { describe, expect, it } from 'vitest'
import type { AbilityContext } from '@black-whale/nen-engine'
import { createEmptyWorld, type WorldState } from '@black-whale/world-engine'
import {
  abilityModules,
  bodyAndSoul,
  camillaGuardianCoercion,
  culdcept,
  doubleMachineGun,
  galleryFake,
  saiyuThreeMonkeys,
} from '../src/index.js'

const CURSOR = {
  branchId: 'canon',
  ordinal: 0,
  eventId: 'event-411',
  chapterNumber: 411,
  localSequence: 0,
}

function world(): WorldState {
  const state = createEmptyWorld(CURSOR)
  for (const [id, label] of [
    ['franklin-bordeau', 'Franklin'],
    ['chrollo-lucilfer', 'Chrollo'],
    ['lynch-fullbokko', 'Lynch'],
    ['saiyu', 'Saiyu'],
    ['prince-benjamin', 'Benjamin'],
    ['prince-camilla', 'Camilla'],
    ['soldier-1', 'Soldat'],
    ['vase', 'Vase'],
  ] as const) {
    state.entities[id] = { id, kind: 'CHARACTER', label, metadata: { mentalState: 'ACTIVE' } }
  }
  for (const [owner, ability] of [
    ['franklin-bordeau', 'double-machine-gun'],
    ['chrollo-lucilfer', 'gallery-fake'],
    ['lynch-fullbokko', 'body-and-soul'],
    ['saiyu', 'saiyu-three-monkeys'],
    ['prince-benjamin', 'culdcept'],
    ['prince-camilla', 'camilla-guardian-coercion'],
  ] as const) {
    state.abilitiesByOwner[owner] = [...(state.abilitiesByOwner[owner] ?? []), ability]
  }
  return state
}

function context(overrides: Partial<AbilityContext>): AbilityContext {
  return {
    abilityId: 'double-machine-gun',
    actorId: 'franklin-bordeau',
    actor: { id: 'franklin-bordeau', kind: 'CHARACTER' },
    targets: [],
    eventId: CURSOR.eventId,
    cursor: CURSOR,
    worldState: world(),
    ...overrides,
  }
}

describe('catalogue coverage', () => {
  it('gives every module a manifest, a UI key and an interaction contract', () => {
    const incomplete = abilityModules.filter(
      (module) =>
        !module.manifest.ownerId ||
        !module.getUIComponent().componentKey ||
        module.getInteractionManifest() === null,
    )
    expect(incomplete.map((module) => module.manifest.id)).toEqual([])
  })

  it('gives every module at least one action on its wheel', () => {
    const ctx = context({})
    const bare = abilityModules.filter((module) => module.getActionWheel(ctx).length === 0)
    expect(bare.map((module) => module.manifest.id)).toEqual([])
  })
})

describe('Double Machine Gun', () => {
  it('states the mutilation as a condition and a price', () => {
    const plan = doubleMachineGun.plan(context({ actionId: 'fire', targets: ['soldier-1'] }))
    expect(plan.status).toBe('AVAILABLE')
    expect(plan.conditions.find((c) => c.id === 'vow-severed-fingertips')?.status).toBe('MET')
    expect(plan.cost).toMatchObject({ amount: 10, unit: 'phalanges' })
  })
})

describe('Gallery Fake', () => {
  it('creates a copy that dies with the day and with its creator', () => {
    const result = galleryFake.execute(
      context({
        abilityId: 'gallery-fake',
        actorId: 'chrollo-lucilfer',
        actor: { id: 'chrollo-lucilfer', kind: 'CHARACTER' },
        actionId: 'copy',
        targets: ['vase'],
        targetRefs: [{ id: 'vase', kind: 'OBJECT' }],
      }),
    )
    const registered = (result.events ?? []).find((event) => event.type === 'ENTITY_REGISTERED')
    expect(registered).toMatchObject({
      payload: { entity: { metadata: { lifespanHours: 24, diesWithCreator: 'kortopi' } } },
    })
  })
})

describe('Body and Soul', () => {
  it('separates what the body answers from what the mouth claimed', () => {
    const result = bodyAndSoul.execute(
      context({
        abilityId: 'body-and-soul',
        actorId: 'lynch-fullbokko',
        actor: { id: 'lynch-fullbokko', kind: 'CHARACTER' },
        actionId: 'interrogate',
        targets: ['soldier-1'],
        targetRefs: [{ id: 'soldier-1', kind: 'CHARACTER' }],
        parameters: { question: 'who-sent-you', bodyId: 'soldier-1' },
      }),
    )
    const knowledge = (result.events ?? []).filter((event) => event.type === 'KNOWLEDGE_GRANTED')
    expect(knowledge).toHaveLength(2)
    expect(knowledge.map((event) => event.payload.record.state)).toEqual(['KNOWN', 'BELIEVED'])
  })
})

describe('Saiyu — three monkeys', () => {
  it('cuts one perception channel per monkey', () => {
    const senses = ['mizaru', 'kikazaru', 'iwazaru'].map((monkey) => {
      const result = saiyuThreeMonkeys.execute(
        context({
          abilityId: 'saiyu-three-monkeys',
          actorId: 'saiyu',
          actor: { id: 'saiyu', kind: 'CHARACTER' },
          actionId: `send-${monkey}`,
          targets: ['soldier-1'],
          targetRefs: [{ id: 'soldier-1', kind: 'CHARACTER' }],
        }),
      )
      const created = (result.events ?? []).find((event) => event.type === 'EFFECT_CREATED')
      if (created?.type !== 'EFFECT_CREATED') throw new Error('expected an effect')
      return created.payload.effect.attributes['sense']
    })
    expect(senses).toEqual(['sight', 'hearing', 'speech'])
  })
})

describe('canon gaps', () => {
  it("refuses to run Camilla's guardian while its conditions are unrevealed", () => {
    const plan = camillaGuardianCoercion.plan(
      context({
        abilityId: 'camilla-guardian-coercion',
        actorId: 'prince-camilla',
        actor: { id: 'prince-camilla', kind: 'CHARACTER' },
        actionId: 'arm',
      }),
    )
    expect(plan.status).toBe('UNKNOWN')
    expect(plan.conditions.find((c) => c.id === 'unknown-camilla-coercion')?.status).toBe('UNKNOWN')
  })

  it('records a failed Culdcept capture instead of pretending it worked', () => {
    const result = culdcept.execute(
      context({
        abilityId: 'culdcept',
        actorId: 'prince-benjamin',
        actor: { id: 'prince-benjamin', kind: 'CHARACTER' },
        actionId: 'capture-failed',
        parameters: {
          targetAbilityId: 'grimmel-the-dissonance',
          reason: 'la flèche échappe à la capture',
        },
      }),
    )
    const created = (result.events ?? []).find((event) => event.type === 'EFFECT_CREATED')
    if (created?.type !== 'EFFECT_CREATED') throw new Error('expected an effect')
    expect(created.payload.effect.state).toBe('TRIGGERED')
    expect(created.payload.effect.attributes['outcome']).toBe('failed')
  })
})
