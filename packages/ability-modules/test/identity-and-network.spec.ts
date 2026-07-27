import { describe, expect, it } from 'vitest'
import type { AbilityContext } from '@black-whale/nen-engine'
import { createEmptyWorld, InMemoryBranchEngine, type WorldState } from '@black-whale/world-engine'
import { catsName, contagion, grimmelTheDissonance } from '../src/index.js'

const CURSOR = {
  branchId: 'canon',
  ordinal: 0,
  eventId: 'event-411',
  chapterNumber: 411,
  localSequence: 0,
}

function world(mutate: (state: WorldState) => void = () => {}): WorldState {
  const state = createEmptyWorld(CURSOR)
  const characters = [
    ['prince-halkenburg', 'Halkenburg'],
    ['morena-prudo', 'Morena'],
    ['prince-camilla', 'Camilla'],
    ['guard-1', 'Garde'],
  ] as const
  for (const [id, label] of characters) {
    state.entities[id] = { id, kind: 'CHARACTER', label, metadata: { mentalState: 'ACTIVE' } }
  }
  state.abilitiesByOwner['prince-halkenburg'] = ['grimmel-the-dissonance']
  state.abilitiesByOwner['morena-prudo'] = ['contagion']
  state.abilitiesByOwner['prince-camilla'] = ['cats-name']
  mutate(state)
  return state
}

function context(overrides: Partial<AbilityContext>): AbilityContext {
  return {
    abilityId: 'grimmel-the-dissonance',
    actorId: 'prince-halkenburg',
    actor: { id: 'prince-halkenburg', kind: 'CHARACTER' },
    targets: [],
    eventId: CURSOR.eventId,
    cursor: CURSOR,
    worldState: world(),
    ...overrides,
  }
}

describe('Grimmel the Dissonance', () => {
  it('swaps two consciousnesses in a single indivisible activation', () => {
    const result = grimmelTheDissonance.execute(
      context({
        actionId: 'shoot',
        targets: ['guard-1'],
        targetRefs: [{ id: 'guard-1', kind: 'CHARACTER' }],
        parameters: {
          consciousnessId: 'mind-guard-1',
          fromBodyId: 'body-guard-1',
          otherConsciousnessId: 'mind-bearer',
          toBodyId: 'body-bearer',
        },
      }),
    )

    expect(result.allowed).toBe(true)
    const transfers = (result.events ?? []).filter(
      (event) => event.type === 'CONSCIOUSNESS_TRANSFERRED',
    )
    expect(transfers).toHaveLength(2)
    expect(transfers[0]).toMatchObject({
      payload: {
        consciousnessId: 'mind-guard-1',
        fromBodyId: 'body-guard-1',
        toBodyId: 'body-bearer',
      },
    })
    expect(transfers[1]).toMatchObject({
      payload: {
        consciousnessId: 'mind-bearer',
        fromBodyId: 'body-bearer',
        toBodyId: 'body-guard-1',
      },
    })

    // The displaced consciousness sleeps rather than disappearing.
    const suppressed = (result.events ?? []).find(
      (event) => event.type === 'EFFECT_CREATED' && event.payload.effect.kind === 'CONSTRAINT',
    )
    expect(suppressed).toBeDefined()
  })

  it('never claims to pick the swapped bearer: the draw is random in canon', () => {
    const plan = grimmelTheDissonance.plan(
      context({
        actionId: 'shoot',
        targets: ['guard-1'],
        parameters: {
          consciousnessId: 'mind-guard-1',
          otherConsciousnessId: 'mind-bearer',
        },
      }),
    )
    // The shot happens in canon, so an unrevealed selection rule must not block
    // it — it is listed as unknown and the plan stays available.
    expect(plan.status).toBe('AVAILABLE')
    expect(plan.conditions.find((c) => c.id === 'unknown-grimmel-selection')?.status).toBe(
      'UNKNOWN',
    )
  })
})

describe('Contagion', () => {
  it('refuses an infection until the three canonical conditions are met', () => {
    const partial = contagion.plan(
      context({
        abilityId: 'contagion',
        actorId: 'morena-prudo',
        actor: { id: 'morena-prudo', kind: 'CHARACTER' },
        actionId: 'infect',
        targets: ['guard-1'],
        parameters: { completedSteps: ['kiss'], memberCount: 3, effectId: 'network' },
      }),
    )
    expect(partial.status).toBe('LOCKED')
    expect(partial.conditions.find((c) => c.id === 'checklist-infection')?.status).toBe('UNMET')
  })

  it('locks the network once twenty-two members are infected', () => {
    const full = contagion.plan(
      context({
        abilityId: 'contagion',
        actorId: 'morena-prudo',
        actor: { id: 'morena-prudo', kind: 'CHARACTER' },
        actionId: 'infect',
        targets: ['guard-1'],
        parameters: {
          completedSteps: ['game-won-yes', 'kiss', 'witnessed-murder'],
          memberCount: 22,
          effectId: 'network',
        },
      }),
    )
    expect(full.conditions.find((c) => c.id === 'capacity-memberCount')?.status).toBe('UNMET')
  })

  it('scores a prince fifty times an ordinary victim', () => {
    const state = world()
    state.effects['member-1'] = {
      id: 'member-1',
      kind: 'CUSTOM',
      abilityId: 'contagion',
      source: { id: 'morena-prudo', kind: 'CHARACTER' },
      targets: [{ id: 'guard-1', kind: 'CHARACTER' }],
      state: 'ACTIVE',
      attributes: { level: 0, kills: 0 },
      startedAt: CURSOR,
    }

    const result = contagion.execute(
      context({
        abilityId: 'contagion',
        actorId: 'morena-prudo',
        actor: { id: 'morena-prudo', kind: 'CHARACTER' },
        worldState: state,
        actionId: 'record-kill',
        parameters: { effectId: 'member-1', victimStatus: 'prince', victimId: 'prince-tubeppa' },
      }),
    )
    expect(result.events?.[0]).toMatchObject({
      type: 'EFFECT_ATTRIBUTE_CHANGED',
      payload: { increments: { kills: 1, level: 50 } },
    })
  })
})

describe("Cat's Name", () => {
  it('kills the killer and brings Camilla back, and survives her own death', () => {
    const branches = new InMemoryBranchEngine()
    const state = world((draft) => {
      draft.entities['camilla-body'] = {
        id: 'camilla-body',
        kind: 'BODY',
        label: 'Corps de Camilla',
        originalCharacterId: 'prince-camilla',
      }
      draft.entities['benjamin-body'] = {
        id: 'benjamin-body',
        kind: 'BODY',
        label: 'Corps de Benjamin',
        originalCharacterId: 'prince-benjamin',
      }
      draft.bodyStates['camilla-body'] = 'ALIVE'
      draft.bodyStates['benjamin-body'] = 'ALIVE'
    })
    branches.createBranch({
      id: 'what-if-387',
      name: 'Et si Benjamin tuait Camilla ?',
      rulePolicy: 'RULE_COMPATIBLE',
      baseState: state,
    })

    const armed = catsName.execute(
      context({
        abilityId: 'cats-name',
        actorId: 'prince-camilla',
        actor: { id: 'prince-camilla', kind: 'CHARACTER' },
        worldState: state,
        actionId: 'arm',
      }),
    )
    let branchState = branches.append('what-if-387', armed.events ?? []).state
    const curseId = Object.keys(branchState.effects)[0]!
    expect(branchState.effects[curseId]?.state).toBe('DORMANT')
    expect(branchState.effects[curseId]?.attributes['masked']).toBe(true)

    // Camilla dies — the curse must not be swept away by the post-mortem rule.
    branchState = branches.append('what-if-387', [
      { type: 'BODY_STATE_CHANGED', payload: { bodyId: 'camilla-body', state: 'DEAD' } },
    ]).state
    expect(branchState.effects[curseId]?.state).toBe('DORMANT')

    const backlash = catsName.execute(
      context({
        abilityId: 'cats-name',
        actorId: 'prince-camilla',
        actor: { id: 'prince-camilla', kind: 'CHARACTER' },
        worldState: branchState,
        cursor: branchState.cursor,
        eventId: branchState.cursor.eventId,
        actionId: 'trigger',
        parameters: { effectId: curseId, killerId: 'benjamin-body', bodyId: 'camilla-body' },
      }),
    )
    branchState = branches.append('what-if-387', backlash.events ?? []).state

    expect(branchState.bodyStates['benjamin-body']).toBe('DEAD')
    expect(branchState.bodyStates['camilla-body']).toBe('ALIVE')
    expect(branchState.effects[curseId]?.state).toBe('TRIGGERED')
  })
})
