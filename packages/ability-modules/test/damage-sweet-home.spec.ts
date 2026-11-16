import { describe, expect, it } from 'vitest'
import { createEmptyWorld } from '@black-whale/canon-engine'
import type { AbilityContext } from '@black-whale/nen-engine'
import { damageSweetHome } from '../src/index.js'

const cursor = {
  branchId: 'canon',
  ordinal: 0,
  eventId: 'event-399',
  chapterNumber: 399,
  localSequence: 0,
}

function context(actionId: string, parameters: Record<string, unknown>): AbilityContext {
  const worldState = createEmptyWorld(cursor)
  worldState.entities.terebellum = {
    id: 'terebellum',
    kind: 'CHARACTER',
    label: 'Terebellum',
    metadata: { mentalState: 'ACTIVE' },
  }
  worldState.entities.crate = { id: 'crate', kind: 'OBJECT', label: 'Caisse' }
  worldState.entities.target = {
    id: 'target',
    kind: 'CHARACTER',
    label: 'Cible',
    metadata: { mentalState: 'ACTIVE' },
  }
  worldState.abilitiesByOwner.terebellum = ['damage-sweet-home']

  return {
    abilityId: 'damage-sweet-home',
    actorId: 'terebellum',
    actor: { id: 'terebellum', kind: 'CHARACTER' },
    targets: ['crate', 'target'],
    targetRefs: [
      { id: 'crate', kind: 'OBJECT' },
      { id: 'target', kind: 'CHARACTER' },
    ],
    eventId: cursor.eventId,
    actionId,
    cursor,
    worldState,
    parameters,
  }
}

function createdEffect(actionId: string, parameters: Record<string, unknown>) {
  const result = damageSweetHome.execute(context(actionId, parameters))
  expect(result.allowed).toBe(true)
  const event = result.events?.find((candidate) => candidate.type === 'EFFECT_CREATED')
  if (event?.type !== 'EFFECT_CREATED') throw new Error('expected an effect')
  return event.payload.effect
}

describe('Damage: Sweet Home', () => {
  it('uses both hands at the moment of impact for damage dealt to another target', () => {
    const effect = createdEffect('link', { sourceId: 'crate', sinkId: 'target' })

    expect(effect.kind).toBe('CONSTRAINT')
    expect(effect.attributes).toMatchObject({
      damageSourceId: 'crate',
      damageSinkId: 'target',
      rightHandContactRequiredOnImpact: true,
      leftHandContactRequiredOnImpact: true,
    })
  })

  it('needs only the left hand when Terebellum himself receives the damage', () => {
    const effect = createdEffect('self-transfer', { sinkId: 'target' })

    expect(effect.attributes).toMatchObject({
      damageSourceId: 'terebellum',
      damageSinkId: 'target',
      rightHandContactRequiredOnImpact: false,
      leftHandContactRequiredOnImpact: true,
    })
  })

  it('sends untransferred right-hand damage into his left hand', () => {
    const effect = createdEffect('absorb-without-left-contact', { sourceId: 'crate' })

    expect(effect.kind).toBe('CUSTOM')
    expect(effect.attributes).toMatchObject({
      from: 'crate',
      to: 'terebellum-left-hand',
    })
  })

  it('attributes every demonstrated use to chapter 399', () => {
    const wheel = damageSweetHome.getActionWheel(context('link', {}))
    const demonstrated = wheel.filter((action) => action.source?.kind === 'chapter')

    expect(demonstrated).not.toHaveLength(0)
    expect(demonstrated.every((action) => action.source?.chapter === 399)).toBe(true)
  })
})
