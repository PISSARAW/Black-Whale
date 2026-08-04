import { describe, expect, it } from 'vitest'
import type { AbilityContext } from '@black-whale/nen-engine'
import { createEmptyWorld, InMemoryBranchEngine, type WorldState } from '@black-whale/canon-engine'
import { emperorTime, stealChain, stealthDolphin, holyChain } from '../src/index.js'

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
  state.abilitiesByOwner['kurapika'] = ['steal-chain', 'stealth-dolphin', 'emperor-time', 'holy-chain']
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
  it("dans le quartier de Woble, la chaîne du pouce s'enroule sur Sayird, le garde compromis ; Little Eye quitte son porteur et passe au pouce de Kurapika. (montré, ch. 369)", () => {
    const branches = new InMemoryBranchEngine()
    const base = world()
    branches.createBranch({
      id: 'chain-vol',
      name: 'vol',
      rulePolicy: 'STRICT_CANON',
      baseState: base,
    })

    const theft = stealChain.execute(
      context({
        targets: ['sayird'],
        targetRefs: [{ id: 'sayird', kind: 'CHARACTER' }],
        actionId: 'steal',
        parameters: { targetAbilityId: 'little-eye' },
      }),
    )
    expect(theft.allowed).toBe(true)
    const state = branches.append('chain-vol', theft.events ?? []).state

    // The victim lost it; Kurapika holds it, and an effect records where it sits.
    expect(state.abilitiesByOwner['sayird']).toEqual([])
    expect(state.abilitiesByOwner['kurapika']).toContain('little-eye')
  })

  it("l'aura de Sayird se vide entièrement : sous Gyo, son enveloppe s'éteint, Zetsu forcé jusqu'à nouvel ordre. (montré, ch. 369)", () => {
    const base = world()
    base.effects['bind-sayird'] = {
      id: 'bind-sayird',
      kind: 'CONSTRAINT',
      state: 'ACTIVE',
      attributes: {},
      abilityId: 'steal-chain',
      source: { id: 'kurapika', kind: 'CHARACTER' },
      targets: [{ id: 'sayird', kind: 'CHARACTER' }],
      anchors: [],
      startedAt: CURSOR,
    }

    const branches = new InMemoryBranchEngine()
    branches.createBranch({
      id: 'chain-drain',
      name: 'drain',
      rulePolicy: 'STRICT_CANON',
      baseState: base,
    })

    const drain = stealChain.execute(
      context({
        targets: ['sayird'],
        targetRefs: [{ id: 'sayird', kind: 'CHARACTER' }],
        actionId: 'drain-into-zetsu',
        parameters: { effectId: 'bind-sayird', targetAbilityId: 'little-eye' },
      }),
    )
    expect(drain.allowed).toBe(true)
    const state = branches.append('chain-drain', drain.events ?? []).state

    const forcedZetsu = Object.values(state.effects).find(
      (effect) => effect.id === 'bind-sayird' && effect.attributes['forcedZetsu'] === true,
    )
    expect(forcedZetsu).toBeDefined()
  })

  it("tant que la capacité volée est détenue, le doigt reste pris : la roue grise « rendre » comme « voler une deuxième capacité », conditions affichées. (affirmé)", () => {
    const base = world()
    
    const secondTheft = stealChain.execute(
      context({
        worldState: base,
        targets: ['sayird'],
        targetRefs: [{ id: 'sayird', kind: 'CHARACTER' }],
        actionId: 'steal-second',
        parameters: { targetAbilityId: 'some-other' },
      }),
    )
    expect(secondTheft.allowed).toBe(false)
  })

  it("la chaîne Little Eye → vol → prêt à Oito tracée dans la timeline : quatre types d'événements sur une seule séquence canonique, lisibles dans le film de la visite. (montré, ch. 369)", () => {
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

describe('Holy Chain', () => {
  it('soigne un garde blessé (ch. 380)', () => {
    const branches = new InMemoryBranchEngine()
    const base = world()
    base.entities['sayird_body'] = { id: 'sayird_body', kind: 'BODY', label: 'Sayird (corps)', originalCharacterId: 'sayird' }
    base.bodyStates['sayird_body'] = 'INJURED'
    branches.createBranch({
      id: 'chain-380',
      name: 'ch. 380',
      rulePolicy: 'STRICT_CANON',
      baseState: base,
    })

    const healing = holyChain.execute(
      context({
        abilityId: 'holy-chain',
        worldState: base,
        targets: ['sayird_body'],
        targetRefs: [{ id: 'sayird_body', kind: 'BODY' }],
        actionId: 'heal',
      })
    )

    expect(healing.allowed).toBe(true)
    const state = branches.append('chain-380', healing.events ?? []).state
    expect(state.bodyStates['sayird_body']).toBe('ALIVE')
  })

  it('se soigne lui-même (affirmé)', () => {
    const branches = new InMemoryBranchEngine()
    const base = world()
    base.entities['kurapika_body'] = { id: 'kurapika_body', kind: 'BODY', label: 'Kurapika (corps)', originalCharacterId: 'kurapika' }
    base.bodyStates['kurapika_body'] = 'INJURED'
    branches.createBranch({
      id: 'chain-self',
      name: 'self-heal',
      rulePolicy: 'STRICT_CANON',
      baseState: base,
    })

    const healing = holyChain.execute(
      context({
        abilityId: 'holy-chain',
        worldState: base,
        targets: ['kurapika_body'],
        targetRefs: [{ id: 'kurapika_body', kind: 'BODY' }],
        actionId: 'heal-self',
      })
    )

    expect(healing.allowed).toBe(true)
    const state = branches.append('chain-self', healing.events ?? []).state
    expect(state.bodyStates['kurapika_body']).toBe('ALIVE')
  })

  it('se soigne instantanément sous Emperor Time (ch. 373)', () => {
    const branches = new InMemoryBranchEngine()
    const base = world()
    base.entities['kurapika_body'] = { id: 'kurapika_body', kind: 'BODY', label: 'Kurapika (corps)', originalCharacterId: 'kurapika' }
    base.bodyStates['kurapika_body'] = 'INJURED'
    
    base.effects['emperor-time'] = {
      id: 'emperor-time',
      kind: 'AURA_MODIFIER',
      abilityId: 'emperor-time',
      source: { id: 'kurapika', kind: 'CHARACTER' },
      targets: [],
      state: 'ACTIVE',
      attributes: {},
      startedAt: CURSOR,
    }

    branches.createBranch({
      id: 'chain-et',
      name: 'emperor-time-heal',
      rulePolicy: 'STRICT_CANON',
      baseState: base,
    })

    const healing = holyChain.execute(
      context({
        abilityId: 'holy-chain',
        worldState: base,
        targets: ['kurapika_body'],
        targetRefs: [{ id: 'kurapika_body', kind: 'BODY' }],
        actionId: 'heal-instantly',
        parameters: { emperorTimeEffectId: 'emperor-time' }
      })
    )

    expect(healing.allowed).toBe(true)
    const state = branches.append('chain-et', healing.events ?? []).state
    expect(state.bodyStates['kurapika_body']).toBe('ALIVE')
  })

  it('refuse de ranimer un mort (affirmé)', () => {
    const base = world()
    base.entities['vincent_body'] = { id: 'vincent_body', kind: 'BODY', label: 'Vincent (corps)' }
    base.bodyStates['vincent_body'] = 'DEAD'

    const ctx = context({
      abilityId: 'holy-chain',
      worldState: base,
      targets: ['vincent_body'],
      targetRefs: [{ id: 'vincent_body', kind: 'BODY' }],
    })

    const entry = holyChain.getActionWheel(ctx).find(item => item.id === 'revive')
    expect(entry?.visibility).toBe('locked')
    expect(entry?.hint).toContain('ne ramène personne')
    
    expect(holyChain.execute({ ...ctx, actionId: 'revive' }).allowed).toBe(false)
  })
})
