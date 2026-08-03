import { describe, expect, it } from 'vitest'
import type { AbilityContext } from '@black-whale/nen-engine'
import { createEmptyWorld, InMemoryBranchEngine, type WorldState } from '@black-whale/canon-engine'
import { emperorTime, stealChain, stealthDolphin } from '../src/index.js'

const CURSOR = {
  branchId: 'canon',
  ordinal: 0,
  eventId: 'event-369',
  chapterNumber: 369,
  localSequence: 0,
}

/** Kurapika, Sayird and Oito, on the eve of the theft. */
function world(): WorldState {
  const state = createEmptyWorld(CURSOR)
  for (const [id, label] of [
    ['kurapika', 'Kurapika'],
    ['sayird', 'Sayird'],
    ['oito', 'Oito'],
  ] as const) {
    state.entities[id] = { id, kind: 'CHARACTER', label, metadata: { mentalState: 'ACTIVE' } }
  }
  state.abilitiesByOwner['kurapika'] = ['steal-chain', 'stealth-dolphin', 'emperor-time']
  state.abilitiesByOwner['sayird'] = ['little-eye']
  return state
}

function context(overrides: Partial<AbilityContext>): AbilityContext {
  return {
    abilityId: 'steal-chain',
    actorId: 'kurapika',
    actor: { id: 'kurapika', kind: 'CHARACTER' },
    targets: [],
    eventId: CURSOR.eventId,
    cursor: CURSOR,
    worldState: world(),
    ...overrides,
  }
}

describe('the Little Eye sequence (ch. 369)', () => {
  it('moves the ability from the victim to Kurapika and then to Oito', () => {
    const branches = new InMemoryBranchEngine()
    const base = world()
    branches.createBranch({
      id: 'chain-369',
      name: 'ch. 369',
      rulePolicy: 'STRICT_CANON',
      baseState: base,
    })

    const theft = stealChain.execute(
      context({
        targets: ['sayird'],
        targetRefs: [{ id: 'sayird', kind: 'CHARACTER' }],
        actionId: 'activate',
        parameters: { targetAbilityId: 'little-eye' },
      }),
    )
    expect(theft.allowed).toBe(true)
    let state = branches.append('chain-369', theft.events ?? []).state

    // The victim lost it; Kurapika holds it, and an effect records where it sits.
    expect(state.abilitiesByOwner['sayird']).toEqual([])
    expect(state.abilitiesByOwner['kurapika']).toContain('little-eye')
    const stored = Object.values(state.effects).find((effect) => effect.kind === 'ABILITY_GRANT')
    expect(stored?.attributes).toMatchObject({ storedAbilityId: 'little-eye', victimId: 'sayird' })

    const loan = stealthDolphin.execute(
      context({
        abilityId: 'stealth-dolphin',
        worldState: state,
        cursor: state.cursor,
        eventId: state.cursor.eventId,
        targets: ['oito'],
        targetRefs: [{ id: 'oito', kind: 'CHARACTER' }],
        actionId: 'lend',
        parameters: { targetAbilityId: 'little-eye' },
      }),
    )
    expect(loan.allowed).toBe(true)
    state = branches.append('chain-369', loan.events ?? []).state

    // Oito is now a Nen user in the world state, not merely in the prose.
    expect(state.abilitiesByOwner['oito']).toContain('little-eye')
    const opened = Object.values(state.effects).find(
      (effect) => effect.kind === 'AURA_MODIFIER' && effect.attributes['nenNodesOpened'] === true,
    )
    expect(opened).toBeDefined()

    const consumed = stealthDolphin.execute(
      context({
        abilityId: 'stealth-dolphin',
        worldState: state,
        cursor: state.cursor,
        eventId: state.cursor.eventId,
        targets: ['oito'],
        targetRefs: [{ id: 'oito', kind: 'CHARACTER' }],
        actionId: 'consume',
        parameters: {
          effectId: Object.values(state.effects).find(
            (effect) => effect.attributes['loan'] === true,
          )?.id,
          borrowerId: 'oito',
        },
      }),
    )
    expect(consumed.allowed).toBe(true)
    state = branches.append('chain-369', consumed.events ?? []).state
    expect(state.abilitiesByOwner['oito']).toEqual([])
  })

  it('refuses the theft until the ability to steal is named', () => {
    const plan = stealChain.plan(
      context({ targets: ['sayird'], targetRefs: [{ id: 'sayird', kind: 'CHARACTER' }] }),
    )
    expect(plan.status).toBe('UNKNOWN')
    expect(plan.conditions.find((c) => c.id === 'parameter-targetAbilityId')?.status).toBe(
      'UNKNOWN',
    )
  })
})

describe('Emperor Time', () => {
  it('prices an activation in hours of life and accumulates them', () => {
    const activation = context({
      abilityId: 'emperor-time',
      actionId: 'maintain',
      parameters: { effectId: 'emperor-time:kurapika:event-369:aura_modifier', secondsElapsed: 30 },
    })
    // The world state must carry the effect for the "still live" condition.
    activation.worldState!.effects['emperor-time:kurapika:event-369:aura_modifier'] = {
      id: 'emperor-time:kurapika:event-369:aura_modifier',
      kind: 'AURA_MODIFIER',
      abilityId: 'emperor-time',
      source: { id: 'kurapika', kind: 'CHARACTER' },
      targets: [],
      state: 'ACTIVE',
      attributes: { lifespanSpentHours: 0 },
      startedAt: CURSOR,
    }

    const plan = emperorTime.plan(activation)
    expect(plan.status).toBe('AVAILABLE')
    expect(plan.cost).toEqual({
      label: 'Espérance de vie consommée par cette période',
      amount: 30,
      unit: 'heures',
    })

    const result = emperorTime.execute(activation)
    expect(result.events?.[0]).toMatchObject({
      type: 'EFFECT_ATTRIBUTE_CHANGED',
      payload: { increments: { activeSeconds: 30, lifespanSpentHours: 30 } },
    })
  })
})
