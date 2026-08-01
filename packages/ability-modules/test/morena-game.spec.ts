import { describe, expect, it } from 'vitest'
import type { AbilityContext } from '@black-whale/nen-engine'
import { createEmptyWorld, InMemoryBranchEngine, type WorldState } from '@black-whale/world-engine'
import {
  contagion,
  CONTAGION_LIMITS,
  dealTheGame,
  sheWillNotPlay,
  theEyesTakeYou,
  infectionStepsFrom,
  settle,
  summariseGame,
  type MorenaGame,
} from '../src/index.js'

const CURSOR = {
  branchId: 'canon',
  ordinal: 0,
  eventId: 'event-410',
  chapterNumber: 410,
  localSequence: 0,
}

function world(mutate: (state: WorldState) => void = () => {}): WorldState {
  const state = createEmptyWorld(CURSOR)
  for (const [id, label] of [
    ['morena-prudo', 'Morena'],
    ['borksen', 'Borksen'],
  ] as const) {
    state.entities[id] = { id, kind: 'CHARACTER', label, metadata: { mentalState: 'ACTIVE' } }
  }
  state.abilitiesByOwner['morena-prudo'] = ['contagion']
  mutate(state)
  return state
}

function context(overrides: Partial<AbilityContext>): AbilityContext {
  return {
    abilityId: 'contagion',
    actorId: 'morena-prudo',
    actor: { id: 'morena-prudo', kind: 'CHARACTER' },
    targets: ['borksen'],
    eventId: CURSOR.eventId,
    cursor: CURSOR,
    worldState: world(),
    ...overrides,
  }
}

/** A world with a negotiation already on the table, at whatever hand you name. */
function withGame(game: MorenaGame, effectId = 'game-1'): WorldState {
  return world((state) => {
    state.effects[effectId] = {
      id: effectId,
      kind: 'CUSTOM',
      abilityId: 'contagion',
      source: { id: 'morena-prudo', kind: 'CHARACTER' },
      targets: [{ id: 'borksen', kind: 'CHARACTER' }],
      state: 'ACTIVE',
      attributes: { cohortId: CONTAGION_LIMITS.cohortId, ...summariseGame(game) },
      startedAt: CURSOR,
    }
  })
}

const run = (actionId: string, parameters: Record<string, unknown>, state: WorldState) =>
  contagion.execute(context({ actionId, worldState: state, parameters }))

describe('opening the negotiation', () => {
  it('puts twelve cards on the table and says what the rules are', () => {
    const result = run('open-game', {}, world())
    expect(result.allowed).toBe(true)
    const created = result.events?.[0]
    expect(created?.type).toBe('EFFECT_CREATED')

    const effect = (created as { payload: { effect: { attributes: Record<string, unknown> } } })
      .payload.effect
    expect(effect.attributes['questionsLeft']).toBe(7)
    expect(effect.attributes['answersLeft']).toBe(5)
    expect(effect.attributes['candidateId']).toBe('borksen')
    expect(effect.attributes['rules']).toContain(
      'Tricher ou abandonner limite la réponse à Oui ou Non.',
    )
  })

  it('marks the Back card unless the caller asks for a clean deal', () => {
    const marked = run('open-game', {}, world()).events?.[0] as {
      payload: { effect: { attributes: { game: MorenaGame } } }
    }
    expect(marked.payload.effect.attributes.game.marked).toBe('back')

    const clean = run('open-game', { clean: 'true' }, world()).events?.[0] as {
      payload: { effect: { attributes: { game: MorenaGame } } }
    }
    expect(clean.payload.effect.attributes.game.marked).toBeNull()
  })

  it('stamps every game event with the chapter that shows the game', () => {
    const result = run('open-game', {}, world())
    expect(result.events?.[0]?.revealedAtChapter).toBe(CONTAGION_LIMITS.gameRevealedAtChapter)
  })

  it('refuses to open on nobody', () => {
    const plan = contagion.plan(context({ actionId: 'open-game', targets: [] }))
    expect(plan.status).toBe('LOCKED')
  })
})

describe('one move, one event', () => {
  it('spends a question and writes the whole hand back', () => {
    const state = withGame(dealTheGame({ marked: null }))
    const result = run('ask', { effectId: 'game-1', question: 'goal' }, state)

    expect(result.events).toHaveLength(1)
    const [event] = result.events!
    expect(event?.type).toBe('EFFECT_ATTRIBUTE_CHANGED')
    const payload = (event as { payload: { attributes: Record<string, unknown> } }).payload
    expect(payload.attributes['asked']).toEqual(['goal'])
    expect(payload.attributes['answersLeft']).toBe(4)
    expect(payload.attributes['questionsLeft']).toBe(6)
  })

  it('says nothing at all when the move is one the rules refuse', () => {
    // The question has already been asked, so there is no move to make and no
    // event to write. A refused move is silence, not an error.
    const asked = { ...dealTheGame({ marked: null }), questions: [], asked: ['goal' as const] }
    const result = run('ask', { effectId: 'game-1', question: 'goal' }, withGame(asked))
    expect(result.events ?? []).toEqual([])
  })

  it('says nothing when no game has been named', () => {
    const result = run('ask', { question: 'goal' }, world())
    expect(result.events ?? []).toEqual([])
  })

  it('replays to the same hand, because the shuffle comes off the event', () => {
    const state = withGame(dealTheGame({ marked: null }))
    const once = run('ask', { effectId: 'game-1', question: 'goal' }, state)
    const twice = run('ask', { effectId: 'game-1', question: 'goal' }, state)
    expect(once.events).toEqual(twice.events)
  })
})

describe('the Manipulation, recorded where a reader can see it', () => {
  /**
   * A hand one seen fraud away from the sanction.
   *
   * Body and Soul rather than the Dowsing Chain: a punch thrown at the table is
   * priced at certain detection, so the catch is a fact rather than a coin
   * toss, and the test does not have to go looking for a seed that loses.
   */
  const cheating = () =>
    withGame({ ...dealTheGame({ marked: null, technique: 'truth-punch' }), watch: 1 })

  it('triggers the effect and constrains the candidate to two words', () => {
    const caught = run('play-technique', { effectId: 'game-1' }, cheating())

    expect(caught.events!.map((event) => event.type)).toEqual([
      'EFFECT_ATTRIBUTE_CHANGED',
      'EFFECT_STATE_CHANGED',
      'EFFECT_CREATED',
    ])

    const triggered = caught.events![1] as {
      payload: { state: string; attributes: Record<string, unknown> }
    }
    expect(triggered.payload.state).toBe('TRIGGERED')
    expect(triggered.payload.attributes['allowedAnswers']).toEqual(['yes', 'no'])

    const restriction = caught.events![2] as {
      payload: { effect: { kind: string; attributes: Record<string, unknown> } }
    }
    expect(restriction.payload.effect.kind).toBe('CONSTRAINT')
    expect(restriction.payload.effect.attributes['allowedAnswers']).toEqual(['yes', 'no'])
    expect(restriction.payload.effect.attributes['rules']).toContain(
      'La réponse est limitée à Oui ou Non.',
    )
  })

  it('leaves a legal move alone, however openly it is played', () => {
    // Enchanting Music is not a fraud, so being watched costs it nothing: one
    // event, no sanction, and a round that cost no answer.
    const legal = withGame({ ...dealTheGame({ marked: null, technique: 'melody' }), watch: 1 })
    const result = run('play-technique', { effectId: 'game-1' }, legal)
    expect(result.events?.map((event) => event.type)).toEqual(['EFFECT_ATTRIBUTE_CHANGED'])
    const payload = (result.events![0] as { payload: { attributes: Record<string, unknown> } })
      .payload
    expect(payload.attributes['manipulated']).toBe(false)
    expect(payload.attributes['answersLeft']).toBe(5)
  })

  it('punishes walking out with the same three events', () => {
    const result = run('leave-table', { effectId: 'game-1' }, withGame(dealTheGame()))
    expect(result.events?.map((event) => event.type)).toEqual([
      'EFFECT_ATTRIBUTE_CHANGED',
      'EFFECT_STATE_CHANGED',
      'EFFECT_CREATED',
    ])
    const restriction = result.events![2] as {
      payload: { effect: { attributes: { rules: string[] } } }
    }
    expect(restriction.payload.effect.attributes.rules).toContain(
      'Déclenchée par l’abandon, que le canon punit comme la triche.',
    )
  })

  it('does not fire twice on a hand that is already narrowed', () => {
    const narrowed = {
      ...dealTheGame({ marked: null }),
      manipulated: true,
      hand: ['yes' as const, 'no' as const],
      graveyard: [],
    }
    const result = run('leave-table', { effectId: 'game-1' }, withGame(narrowed))
    expect(result.events?.map((event) => event.type)).toEqual(['EFFECT_ATTRIBUTE_CHANGED'])
  })
})

describe('the branch, replayed', () => {
  it('reduces a whole negotiation and leaves the hand readable in world state', () => {
    const branches = new InMemoryBranchEngine()
    const branchId = 'canon'
    branches.createBranch({
      id: branchId,
      name: 'Canon',
      kind: 'CANON',
      rulePolicy: 'STRICT_CANON',
      baseState: world(),
    })

    // Open the game.
    const opened = contagion.execute(context({ actionId: 'open-game' }))
    branches.append(branchId, opened.events ?? [])
    const gameId = (opened.events![0] as { payload: { effect: { id: string } } }).payload.effect.id

    // Then four questions, each one its own event on the timeline.
    let state = branches.getState(branchId)
    for (const question of ['goal', 'power', 'if-yes', 'if-no'] as const) {
      const move = contagion.execute(
        context({
          actionId: 'ask',
          worldState: state,
          parameters: { effectId: gameId, question },
          eventId: `event-${question}`,
        }),
      )
      branches.append(branchId, move.events ?? [])
      state = branches.getState(branchId)
    }

    const held = state.effects[gameId]!
    expect(held.state).toBe('ACTIVE')
    // Four asked, four buried — unless the kiss interrupted, which is its own
    // move and not one of these four.
    expect((held.attributes['asked'] as string[]).length).toBeGreaterThanOrEqual(3)
    expect(held.attributes['questionsLeft']).toBeLessThan(7)
  })

  it('closes on one of the three endings the canon allows, and only those', () => {
    const won = settle({ ...dealTheGame({ marked: null }), phase: 'settling', hand: ['yes'] })
    const result = run('close-game', { effectId: 'game-1', reason: 'morena-dead' }, withGame(won))
    const closed = result.events![0] as {
      payload: { state: string; attributes: Record<string, unknown> }
    }
    expect(closed.payload.state).toBe('ENDED')
    expect(closed.payload.attributes['reason']).toBe('morena-dead')
  })

  it('defaults to the ending that means the hand was played out', () => {
    const won = settle({ ...dealTheGame({ marked: null }), phase: 'settling', hand: ['yes'] })
    const result = run('close-game', { effectId: 'game-1' }, withGame(won))
    const closed = result.events![0] as { payload: { attributes: Record<string, unknown> } }
    expect(closed.payload.attributes['reason']).toBe('game-completed')
  })
})

describe('what the game hands back to the infection', () => {
  it('ticks the first condition when the hand was won, and only then', () => {
    const won = settle({ ...dealTheGame({ marked: null }), phase: 'settling', hand: ['yes'] })
    expect(infectionStepsFrom(won)).toEqual(['game-won-yes'])

    const refused = settle({ ...dealTheGame({ marked: null }), phase: 'settling', hand: ['no'] })
    expect(infectionStepsFrom(refused)).toEqual([])
  })

  it('counts the kiss as a condition even when the answer was No', () => {
    const kissed = settle({
      ...dealTheGame({ marked: null }),
      phase: 'settling',
      hand: ['no'],
      kissed: true,
    })
    expect(infectionStepsFrom(kissed)).toEqual(['kiss'])
  })

  it('gives back nothing at all on a hand that is still being played', () => {
    expect(infectionStepsFrom(dealTheGame())).toEqual([])
  })

  it('gives back nothing when it was a puppet in the chair', () => {
    const proxied = settle({
      ...dealTheGame({ marked: null }),
      phase: 'settling',
      hand: ['yes'],
      kissed: true,
      proxied: true,
    })
    expect(proxied.verdict).toBe('infected')
    expect(infectionStepsFrom(proxied)).toEqual([])
  })

  it('unlocks the infection that used to be a checklist somebody ticked by hand', () => {
    const won = settle({
      ...dealTheGame({ marked: null }),
      phase: 'settling',
      hand: ['yes'],
      kissed: true,
    })
    const plan = contagion.plan(
      context({
        actionId: 'infect',
        parameters: {
          // Two of the three come off the table itself; the murder does not.
          completedSteps: [...infectionStepsFrom(won), 'witnessed-murder'],
          memberCount: 3,
          effectId: 'network',
        },
      }),
    )
    expect(plan.conditions.find((c) => c.id === 'checklist-infection')?.status).toBe('MET')
  })
})

describe('the game on the action wheel', () => {
  it('offers every move the negotiation has', () => {
    const wheel = contagion.getActionWheel(context({}))
    const ids = wheel.map((entry) => entry.id)
    for (const move of [
      'open-game',
      'ask',
      'stake',
      'refuse-stake',
      'play-technique',
      'leave-table',
      'settle',
      'close-game',
    ]) {
      expect(ids, `${move} is not on the wheel`).toContain(move)
    }
  })
})

describe('the seats that pay out after the last card', () => {
  /** A hand one card from the end, with whatever is being tested seated at it. */
  const settling = (game: Partial<MorenaGame>): MorenaGame => ({
    ...dealTheGame({ marked: null }),
    phase: 'settling',
    hand: ['yes'],
    ...game,
  })

  it('kills Morena when the vow kills the guest and the cat is in the corner', () => {
    const struck = settle(settling({ riders: ['sworn'], technique: 'resurrection' }))
    expect(struck.aftermath).toContain('sworn-struck')
    expect(struck.aftermath).toContain('avenged')
  })

  it('leaves the cat nothing to do where nobody died', () => {
    const alive = settle(settling({ technique: 'resurrection' }))
    expect(alive.aftermath).not.toContain('avenged')
    // And a death with no cat at the table is a death and nothing else.
    const unavenged = settle(settling({ riders: ['sworn'] }))
    expect(unavenged.aftermath).toContain('sworn-struck')
    expect(unavenged.aftermath).not.toContain('avenged')
  })

  it('lets her stand up rather than recruit somebody who is spending their life', () => {
    const standing = sheWillNotPlay(dealTheGame())
    expect(standing.phase).toBe('over')
    expect(standing.verdict).toBe('cancelled')
    expect(standing.ending).toBe('abandoned')
    expect(standing.aftermath).toEqual(['unaffordable'])
    // Nothing was narrowed and nobody said anything: she is the one who left.
    expect(standing.manipulated).toBe(false)
    // And a hand that is already over is not stood up from twice.
    const over = settle(settling({}))
    expect(sheWillNotPlay(over)).toBe(over)
  })

  it('collects the year, and pays whatever the guest brought that answers a death', () => {
    const burnt = theEyesTakeYou(dealTheGame())
    expect(burnt.aftermath).toEqual(['burnt-out'])

    const covered = theEyesTakeYou(
      dealTheGame({ marked: null, technique: 'resurrection', bookmark: 'guardian' }),
    )
    expect(covered.aftermath).toEqual(['burnt-out', 'avenged', 'stood-in'])
  })

  it('sits the double in the chair when the vow is what killed the guest', () => {
    const struck = settle(settling({ riders: ['sworn'], technique: 'guardian' }))
    expect(struck.aftermath).toContain('sworn-struck')
    expect(struck.aftermath).toContain('stood-in')
  })

  it('pays the pestering beast whatever this table did with its own Yes', () => {
    for (const hand of [['yes'], ['no'], ['x']] as const) {
      const played = settle(settling({ hand: [...hand], riders: ['solicited'] }))
      expect(played.aftermath).toContain('solicited')
    }
  })
})
