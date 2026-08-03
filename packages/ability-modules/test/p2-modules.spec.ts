import { describe, expect, it } from 'vitest'
import type { AbilityContext } from '@black-whale/nen-engine'
import { createEmptyWorld, InMemoryBranchEngine, type WorldState } from '@black-whale/canon-engine'
import {
  benjaminBaton,
  crossGame,
  loveDial6700,
  rihanPredator,
  silentMajority,
  sunAndMoon,
  tserriednichGuardianLieMarks,
  zhangleiGuardianCoins,
} from '../src/index.js'

const CURSOR = {
  branchId: 'canon',
  ordinal: 0,
  eventId: 'event-395',
  chapterNumber: 395,
  localSequence: 0,
}

function world(mutate: (state: WorldState) => void = () => {}): WorldState {
  const state = createEmptyWorld(CURSOR)
  for (const [id, label] of [
    ['prince-benjamin', 'Benjamin'],
    ['musse', 'Musse'],
    ['rihan', 'Rihan'],
    ['theta', 'Theta'],
    ['mizaistom-nana', 'Mizaistom'],
    ['chrollo-lucilfer', 'Chrollo'],
    ['prince-zhanglei', 'Zhang Lei'],
    ['silent-majority-user', 'Membre non identifié'],
    ['hisoka', 'Hisoka'],
  ] as const) {
    state.entities[id] = { id, kind: 'CHARACTER', label, metadata: { mentalState: 'ACTIVE' } }
  }
  for (const [owner, ability] of [
    ['prince-benjamin', 'benjamin-baton'],
    ['rihan', 'rihan-predator'],
    ['mizaistom-nana', 'cross-game'],
    ['chrollo-lucilfer', 'sun-and-moon'],
    ['chrollo-lucilfer', 'love-dial-6700'],
    ['prince-zhanglei', 'zhanglei-guardian-coins'],
    ['prince-tserriednich', 'tserriednich-guardian-lie-marks'],
    ['silent-majority-user', 'silent-majority'],
  ] as const) {
    state.abilitiesByOwner[owner] = [...(state.abilitiesByOwner[owner] ?? []), ability]
  }
  mutate(state)
  return state
}

function context(overrides: Partial<AbilityContext>): AbilityContext {
  return {
    abilityId: 'benjamin-baton',
    actorId: 'prince-benjamin',
    actor: { id: 'prince-benjamin', kind: 'CHARACTER' },
    targets: [],
    eventId: CURSOR.eventId,
    cursor: CURSOR,
    worldState: world(),
    ...overrides,
  }
}

describe('Benjamin Baton', () => {
  it('declares a roster the world engine inherits from without a further action', () => {
    const branches = new InMemoryBranchEngine()
    const base = world((state) => {
      state.entities['musse-body'] = {
        id: 'musse-body',
        kind: 'BODY',
        label: 'Corps de Musse',
        originalCharacterId: 'musse',
      }
      state.abilitiesByOwner['musse'] = ['secret-window']
    })
    branches.createBranch({
      id: 'attrition',
      name: 'Attrition',
      rulePolicy: 'STRICT_CANON',
      baseState: base,
    })

    const muster = benjaminBaton.execute(
      context({
        worldState: base,
        actionId: 'muster-army',
        parameters: { memberIds: ['musse'] },
      }),
    )
    let state = branches.append('attrition', muster.events ?? []).state

    // Nobody triggers the inheritance: the soldier simply dies.
    state = branches.append('attrition', [
      { type: 'BODY_STATE_CHANGED', payload: { bodyId: 'musse-body', state: 'DEAD' } },
    ]).state

    expect(state.abilitiesByOwner['prince-benjamin']).toContain('secret-window')
  })
})

describe('Predator', () => {
  it('refuses to devour when somebody else shares the analysis', () => {
    const shared = world((state) => {
      state.knowledgeByObserver['rihan'] = {
        'ability-analysis:guardian': {
          factId: 'ability-analysis:guardian',
          state: 'KNOWN',
          acquiredAt: CURSOR,
        },
      }
      state.knowledgeByObserver['theta'] = {
        'ability-analysis:guardian': {
          factId: 'ability-analysis:guardian',
          state: 'KNOWN',
          acquiredAt: CURSOR,
        },
      }
      state.effects['analysis'] = {
        id: 'analysis',
        kind: 'CUSTOM',
        abilityId: 'rihan-predator',
        source: { id: 'rihan', kind: 'CHARACTER' },
        targets: [],
        state: 'ACTIVE',
        attributes: { progress: 100 },
        startedAt: CURSOR,
      }
    })

    const plan = rihanPredator.plan(
      context({
        abilityId: 'rihan-predator',
        actorId: 'rihan',
        actor: { id: 'rihan', kind: 'CHARACTER' },
        worldState: shared,
        actionId: 'devour',
        parameters: { effectId: 'analysis', targetAbilityId: 'guardian' },
      }),
    )
    expect(plan.status).toBe('LOCKED')
    expect(plan.conditions.find((c) => c.id === 'sole-observer-ability-analysis:')?.status).toBe(
      'UNMET',
    )
  })

  it('allows it once Rihan alone holds what he found out', () => {
    const alone = world((state) => {
      state.knowledgeByObserver['rihan'] = {
        'ability-analysis:guardian': {
          factId: 'ability-analysis:guardian',
          state: 'KNOWN',
          acquiredAt: CURSOR,
        },
      }
      state.effects['analysis'] = {
        id: 'analysis',
        kind: 'CUSTOM',
        abilityId: 'rihan-predator',
        source: { id: 'rihan', kind: 'CHARACTER' },
        targets: [],
        state: 'ACTIVE',
        attributes: { progress: 100 },
        startedAt: CURSOR,
      }
    })

    const plan = rihanPredator.plan(
      context({
        abilityId: 'rihan-predator',
        actorId: 'rihan',
        actor: { id: 'rihan', kind: 'CHARACTER' },
        worldState: alone,
        actionId: 'devour',
        parameters: { effectId: 'analysis', targetAbilityId: 'guardian' },
      }),
    )
    expect(plan.status).toBe('AVAILABLE')
    expect(plan.cost).toMatchObject({ amount: 48, unit: 'heures' })
  })
})

describe('Cross Game', () => {
  it('will not restrain somebody who was never warned', () => {
    const plan = crossGame.plan(
      context({
        abilityId: 'cross-game',
        actorId: 'mizaistom-nana',
        actor: { id: 'mizaistom-nana', kind: 'CHARACTER' },
        actionId: 'restraint',
        targets: ['hisoka'],
        parameters: { warned: false },
      }),
    )
    expect(plan.status).toBe('LOCKED')
  })
})

describe("Tserriednich's lie marks", () => {
  it('only transforms on the third lie', () => {
    const marked = (lieCount: number) =>
      world((state) => {
        state.entities['prince-tserriednich'] = {
          id: 'prince-tserriednich',
          kind: 'CHARACTER',
          label: 'Tserriednich',
          metadata: { mentalState: 'ACTIVE' },
        }
        state.effects['marks'] = {
          id: 'marks',
          kind: 'CURSE',
          abilityId: 'tserriednich-guardian-lie-marks',
          source: { id: 'prince-tserriednich', kind: 'CHARACTER' },
          targets: [{ id: 'theta', kind: 'CHARACTER' }],
          state: 'DORMANT',
          attributes: { lieCount },
          startedAt: CURSOR,
        }
      })

    const planFor = (lieCount: number) =>
      tserriednichGuardianLieMarks.plan(
        context({
          abilityId: 'tserriednich-guardian-lie-marks',
          actorId: 'prince-tserriednich',
          actor: { id: 'prince-tserriednich', kind: 'CHARACTER' },
          worldState: marked(lieCount),
          actionId: 'transform',
          targets: ['theta'],
          parameters: { effectId: 'marks' },
        }),
      )

    expect(planFor(2).status).toBe('LOCKED')
    expect(planFor(3).status).toBe('AVAILABLE')
  })
})

describe('Sun and Moon', () => {
  it('keeps its marks alive after their creator dies', () => {
    const result = sunAndMoon.execute(
      context({
        abilityId: 'sun-and-moon',
        actorId: 'chrollo-lucilfer',
        actor: { id: 'chrollo-lucilfer', kind: 'CHARACTER' },
        actionId: 'mark-sun',
        targets: ['hisoka'],
        targetRefs: [{ id: 'hisoka', kind: 'CHARACTER' }],
      }),
    )
    const [event] = result.events ?? []
    expect(event?.type).toBe('EFFECT_CREATED')
    if (event?.type !== 'EFFECT_CREATED') throw new Error('expected an effect')
    expect(event.payload.effect.state).toBe('DORMANT')
    expect(event.payload.effect.attributes['postMortem']).toBe(true)
    expect(event.payload.effect.attributes['mark']).toBe('sun')
  })
})

describe('Guardian coins', () => {
  it('resets the accrued value when the coin changes hands', () => {
    const state = world((draft) => {
      draft.effects['coin'] = {
        id: 'coin',
        kind: 'CUSTOM',
        abilityId: 'zhanglei-guardian-coins',
        source: { id: 'prince-zhanglei', kind: 'CHARACTER' },
        targets: [],
        state: 'ACTIVE',
        attributes: { value: 12 },
        startedAt: CURSOR,
      }
    })

    const result = zhangleiGuardianCoins.execute(
      context({
        abilityId: 'zhanglei-guardian-coins',
        actorId: 'prince-zhanglei',
        actor: { id: 'prince-zhanglei', kind: 'CHARACTER' },
        worldState: state,
        actionId: 'transfer',
        parameters: { effectId: 'coin', serial: '7', holderId: 'hisoka', locationId: 'tier-1' },
      }),
    )
    expect(result.events?.[0]).toMatchObject({
      type: 'EFFECT_ATTRIBUTE_CHANGED',
      payload: { attributes: { value: 0, holderId: 'hisoka' } },
    })
  })
})

describe('Love Dial 6700', () => {
  it('answers with a probable tier, never a confirmed room', () => {
    const result = loveDial6700.execute(
      context({
        abilityId: 'love-dial-6700',
        actorId: 'chrollo-lucilfer',
        actor: { id: 'chrollo-lucilfer', kind: 'CHARACTER' },
        actionId: 'dial',
        targets: ['hisoka'],
        targetRefs: [{ id: 'hisoka', kind: 'CHARACTER' }],
        parameters: { criteria: 'grand et musclé', callsToday: 1, locationId: 'tier-3' },
      }),
    )
    const moved = (result.events ?? []).find((event) => event.type === 'ENTITY_MOVED')
    expect(moved).toMatchObject({
      payload: { presence: { precision: 'TIER', certainty: 'PROBABLE', probability: 0.5 } },
    })
  })

  it('runs out of calls for the day', () => {
    const plan = loveDial6700.plan(
      context({
        abilityId: 'love-dial-6700',
        actorId: 'chrollo-lucilfer',
        actor: { id: 'chrollo-lucilfer', kind: 'CHARACTER' },
        actionId: 'dial',
        targets: ['hisoka'],
        parameters: { criteria: 'grand et musclé', callsToday: 4 },
      }),
    )
    expect(plan.status).toBe('LOCKED')
  })
})

describe('Silent Majority', () => {
  it('says its user is unknown without blocking the ability', () => {
    const plan = silentMajority.plan(
      context({
        abilityId: 'silent-majority',
        actorId: 'silent-majority-user',
        actor: { id: 'silent-majority-user', kind: 'CHARACTER' },
        actionId: 'summon',
      }),
    )
    expect(plan.status).toBe('AVAILABLE')
    expect(plan.conditions.find((c) => c.id === 'unknown-silent-majority-owner')?.status).toBe(
      'UNKNOWN',
    )
  })
})
