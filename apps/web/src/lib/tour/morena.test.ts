import { describe, expect, it } from 'vitest'
import { buildShip } from './blueprint'
import { floorOf } from './blueprint'
import {
  ANSWER_CARDS,
  DEALER_AT,
  GUEST_AT,
  HIDEOUT_OFFICE,
  HIDEOUT_TIER,
  QUESTION_CARDS,
  TABLE_AT,
  TABLE_HEIGHT,
  TABLE_KINDS,
  TABLE_TECHNIQUES,
  askMorena,
  dealTheGame,
  infectionAfter,
  lastCard,
  leaveTheTable,
  narrowTheAnswer,
  needsAChoice,
  playTechnique,
  refuseTheDeal,
  settle,
  tableauOf,
  takeTheDeal,
  worksAtTheTable,
  type AnswerCard,
  type MorenaGame,
  type QuestionCard,
  type TableKind,
} from './morena'
import { HATSU_PROFILES } from '$lib/nen/hatsuRegistry'
import { pointInPolygon } from './geometry'

const ship = buildShip()

/** A deal that always reaches for the same end of the hand, so a test can plan. */
const first = () => 0
const last = () => 0.999

/**
 * A shuffle written out in advance.
 *
 * Each value is read as a fraction of the hand it is reaching into, so what a
 * test writes is *which card goes* at every round rather than a number that
 * happens to land on it.
 */
const scripted = (...values: number[]) => {
  let spent = 0
  return () => values[Math.min(spent++, values.length - 1)]
}

/** Spends questions until the hand is down to one, or the deal interrupts. */
function playOut(game: MorenaGame, random: () => number): MorenaGame {
  let played = game
  while (played.phase === 'asking' && played.questions.length) {
    played = askMorena(played, played.questions[0], { random })
  }
  return played
}

describe('the deal', () => {
  it('puts seven questions on her side and five answers on yours', () => {
    const game = dealTheGame()
    expect(game.questions).toEqual([...QUESTION_CARDS])
    expect(game.hand).toEqual([...ANSWER_CARDS])
    expect(game.graveyard).toEqual([])
    expect(game.phase).toBe('asking')
    expect(game.round).toBe(1)
  })

  it('marks the Back card, because that is the one she marks', () => {
    expect(dealTheGame().marked).toBe('back')
  })

  it('can be dealt clean, which is a hand she has never played', () => {
    const clean = dealTheGame({ marked: null })
    expect(clean.marked).toBeNull()
    expect(clean.log).toEqual([])
  })

  it('records the marking where only a finished hand can read it', () => {
    expect(dealTheGame().log).toEqual([{ kind: 'marked', round: 0, card: 'back' }])
  })
})

describe('spending a question', () => {
  it('answers it first and takes a card afterwards', () => {
    const game = askMorena(dealTheGame(), 'goal', { random: first })
    expect(game.asked).toEqual(['goal'])
    expect(game.questions).toHaveLength(6)
    expect(game.graveyard).toEqual(['yes'])
    expect(game.hand).toEqual(['no', 'back', 'joker', 'x'])
    expect(game.round).toBe(2)
  })

  it('takes from the far end of the hand when the shuffle says so', () => {
    const game = askMorena(dealTheGame(), 'goal', { random: last })
    expect(game.graveyard).toEqual(['x'])
  })

  it('refuses a question that is not in her hand', () => {
    const game = askMorena(dealTheGame(), 'goal', { random: first })
    expect(askMorena(game, 'goal', { random: first })).toBe(game)
  })

  it('leaves one answer standing and stops asking', () => {
    // Three rounds, then the kiss interrupts, then the fourth settles it.
    let game = askMorena(dealTheGame({ marked: null }), 'goal', { random: first })
    game = askMorena(game, 'power', { random: first })
    game = askMorena(game, 'if-yes', { random: first })
    game = refuseTheDeal(game)
    game = askMorena(game, 'if-no', { random: first })
    expect(game.phase).toBe('settling')
    expect(game.hand).toHaveLength(1)
    expect(game.questions).toHaveLength(3)
  })

  it('cannot be asked once the hand is down to its last card', () => {
    let game = playOut(dealTheGame({ marked: null }), first)
    game = refuseTheDeal(game)
    game = playOut(game, first)
    expect(game.phase).toBe('settling')
    expect(askMorena(game, game.questions[0], { random: first })).toBe(game)
  })
})

describe('the kiss', () => {
  const offered = () => {
    let game = askMorena(dealTheGame({ marked: null }), 'goal', { random: first })
    game = askMorena(game, 'power', { random: first })
    return askMorena(game, 'if-yes', { random: first })
  }

  it('is offered exactly once, when refusing it starts to cost something', () => {
    const game = offered()
    expect(game.phase).toBe('deal')
    expect(game.hand).toHaveLength(2)
    expect(game.log.at(-1)).toEqual({ kind: 'offered', round: game.round })
  })

  it('buys a card back out of the graveyard, and the game moves on', () => {
    const game = takeTheDeal(offered(), 'yes')
    expect(game.kissed).toBe(true)
    expect(game.hand).toContain('yes')
    expect(game.graveyard).not.toContain('yes')
    expect(game.phase).toBe('asking')
  })

  it('cannot buy a card that is not in the graveyard', () => {
    const game = offered()
    expect(takeTheDeal(game, 'joker')).toBe(game)
  })

  it('is never offered twice', () => {
    let game = refuseTheDeal(offered())
    game = playOut(game, first)
    expect(game.log.filter((beat) => beat.kind === 'offered')).toHaveLength(1)
  })

  it('costs a condition of Contagion even when the answer ends up No', () => {
    // Bought back the Yes, and then lost it again two rounds later: kissed,
    // and out of the room with nothing to show for it.
    let game = takeTheDeal(offered(), 'yes')
    expect(game.hand).toEqual(['joker', 'x', 'yes'])
    game = askMorena(game, 'if-no', { random: last })
    game = askMorena(game, 'contract', { random: last })
    expect(game.phase).toBe('settling')
    expect(lastCard(game)).toBe('joker')

    const over = settle(game, 'no')
    expect(over.verdict).toBe('refused')
    expect(infectionAfter(over)).toMatchObject({
      said: false,
      kissed: true,
      witnessed: false,
      level: null,
    })
  })
})

describe('the last card', () => {
  /** Sits a chosen card in a hand of one, with the rest buried. */
  const holding = (card: AnswerCard, marked: AnswerCard | null = null): MorenaGame => ({
    ...dealTheGame({ marked }),
    phase: 'settling',
    round: 5,
    questions: ['origin', 'price', 'contract'] as QuestionCard[],
    asked: ['goal', 'power', 'if-yes', 'if-no'] as QuestionCard[],
    hand: [card],
    graveyard: ANSWER_CARDS.filter((other) => other !== card),
  })

  it('is a Yes, given freely', () => {
    const over = settle(holding('yes'))
    expect(over.verdict).toBe('infected')
    expect(over.phase).toBe('over')
    expect(infectionAfter(over).level).toBe(0)
  })

  it('leaves the card that was played lying on the table', () => {
    const over = settle(holding('yes'))
    expect(over.hand).toEqual(['yes'])
    expect(over.graveyard).not.toContain('yes')
  })

  it('buries the Back it spent and lays out what came up instead', () => {
    const over = settle(holding('back'), 'yes')
    expect(over.hand).toEqual(['yes'])
    expect(over.graveyard).toContain('back')
    expect(over.graveyard).not.toContain('yes')
  })

  it('is a No, and she honours it', () => {
    expect(settle(holding('no')).verdict).toBe('refused')
    expect(infectionAfter(settle(holding('no'))).level).toBeNull()
  })

  it('is an X, and nobody gets anything', () => {
    expect(settle(holding('x')).verdict).toBe('cancelled')
  })

  it('is a Joker, which has to be pointed before it means anything', () => {
    const game = holding('joker')
    expect(needsAChoice(game)).toBe('joker')
    expect(settle(game)).toBe(game)
    expect(settle(game, 'yes').verdict).toBe('infected')
    expect(settle(game, 'no').verdict).toBe('refused')
    expect(settle(game, 'yes').finalCard).toBe('yes')
  })

  it('is a Back, which reaches into the graveyard for the real answer', () => {
    const game = holding('back')
    expect(needsAChoice(game)).toBe('back')
    const over = settle(game, 'yes')
    expect(over.verdict).toBe('infected')
    expect(over.finalCard).toBe('yes')
    expect(over.log.some((beat) => beat.kind === 'recovered')).toBe(true)
  })

  it('is a Back with nothing behind it, which is a refusal', () => {
    const empty: MorenaGame = { ...holding('back'), graveyard: [] }
    expect(needsAChoice(empty)).toBeNull()
    expect(settle(empty).verdict).toBe('refused')
  })

  it('pulls a Joker out of the graveyard with nothing left to point it', () => {
    const over = settle(holding('back'), 'joker')
    expect(over.verdict).toBe('refused')
    expect(over.finalCard).toBe('joker')
  })
})

describe('the card she marked', () => {
  it('hands her the answer the moment you reach for it', () => {
    const game: MorenaGame = {
      ...dealTheGame({ marked: 'back' }),
      phase: 'settling',
      hand: ['back'],
      graveyard: ['yes', 'no', 'joker', 'x'],
    }
    const over = settle(game, 'no')
    expect(over.verdict).toBe('forced')
    expect(over.finalCard).toBe('back')
    expect(infectionAfter(over).said).toBe(true)
  })

  it('does nothing at all to a card she did not mark', () => {
    const game: MorenaGame = {
      ...dealTheGame({ marked: 'x' }),
      phase: 'settling',
      hand: ['back'],
      graveyard: ['yes', 'no', 'joker', 'x'],
    }
    expect(settle(game, 'no').verdict).toBe('refused')
  })

  it('is not in play at all on a clean deal', () => {
    const game: MorenaGame = {
      ...dealTheGame({ marked: null }),
      phase: 'settling',
      hand: ['back'],
      graveyard: ['yes'],
    }
    expect(settle(game, 'yes').verdict).toBe('infected')
  })
})

describe('a whole hand, played the way ch. 410 plays it', () => {
  it('ends on the card she marked, with a Yes that was not given', () => {
    // Yes, No, Joker and X go, in that order, and Back is what is left — which
    // is the card Morena marked before she dealt.
    const shuffle = scripted(0, 0, 0.4, 0.6)
    let game = dealTheGame()
    game = askMorena(game, 'goal', { random: shuffle })
    game = askMorena(game, 'power', { random: shuffle })
    game = askMorena(game, 'if-yes', { random: shuffle })
    expect(game.phase).toBe('deal')
    game = refuseTheDeal(game)
    game = askMorena(game, 'if-no', { random: shuffle })
    expect(game.phase).toBe('settling')
    expect(lastCard(game)).toBe('back')

    const over = settle(game, 'yes')
    expect(over.verdict).toBe('forced')
    expect(over.phase).toBe('over')
    expect(infectionAfter(over)).toMatchObject({
      said: true,
      kissed: false,
      witnessed: false,
      level: 0,
    })
  })

  it('leaves a transcript of everything that happened, in order', () => {
    let game = dealTheGame({ marked: null })
    game = askMorena(game, 'goal', { random: first })
    game = askMorena(game, 'power', { random: first })
    game = askMorena(game, 'if-yes', { random: first })
    game = takeTheDeal(game, 'yes')
    game = askMorena(game, 'if-no', { random: first })
    game = askMorena(game, 'contract', { random: first })
    const over = settle(game)
    expect(over.verdict).toBe('infected')
    expect(over.log.map((beat) => beat.kind)).toEqual([
      'asked',
      'taken',
      'asked',
      'taken',
      'asked',
      'taken',
      'offered',
      'kissed',
      'recovered',
      'asked',
      'taken',
      'asked',
      'taken',
      'settled',
    ])
  })
})

describe('what the walk lays on the table', () => {
  const office = ship.spaces.get(HIDEOUT_OFFICE)!
  const floor = floorOf(office, ship.plans.get(HIDEOUT_TIER)!.tier)

  it('stands the room, the table and both chairs where the game needs them', () => {
    const structures = ship.structures.filter((solid) => solid.spaceId === HIDEOUT_OFFICE)
    const table = structures.find((solid) => solid.id.endsWith('-card-table'))!
    expect(table.kind).toBe('table')
    expect(table.at).toEqual([...TABLE_AT])
    expect(table.height).toBe(TABLE_HEIGHT)
    expect(structures.filter((solid) => solid.kind === 'seat')).toHaveLength(2)
  })

  it('seats both players inside the room they are playing in', () => {
    expect(pointInPolygon(GUEST_AT, office.footprint!)).toBe(true)
    expect(pointInPolygon(DEALER_AT, office.footprint!)).toBe(true)
  })

  it('draws one dealer and one card for every card in the game', () => {
    const game = dealTheGame()
    const seen = tableauOf(game, floor)
    expect(seen.filter((thing) => thing.kind === 'dealer')).toHaveLength(1)
    expect(seen.filter((thing) => thing.kind === 'game-card')).toHaveLength(12)
    expect(new Set(seen.map((thing) => thing.id)).size).toBe(seen.length)
  })

  it('keeps the count at twelve as cards move between the piles', () => {
    let game = askMorena(dealTheGame(), 'goal', { random: first })
    game = askMorena(game, 'power', { random: first })
    const seen = tableauOf(game, floor)
    expect(seen.filter((thing) => thing.kind === 'game-card')).toHaveLength(12)
  })

  it('lays every card on the table top rather than through it', () => {
    const seen = tableauOf(dealTheGame(), floor)
    for (const thing of seen) {
      if (thing.kind !== 'game-card') continue
      expect(thing.y).toBeGreaterThan(floor + TABLE_HEIGHT)
      expect(thing.y).toBeLessThan(floor + TABLE_HEIGHT + 0.2)
    }
  })

  it('does not show the nick in the marked card until the hand is over', () => {
    const dealt = dealTheGame()
    const marked = tableauOf(dealt, floor).find((thing) => thing.id === 'hand-back')!
    expect(marked.stage).toBe(1)

    const over: MorenaGame = { ...dealt, phase: 'over', hand: ['back'], verdict: 'forced' }
    const shown = tableauOf(over, floor).find((thing) => thing.id === 'hand-back')!
    expect(shown.stage).toBe(3)
  })

  it('puts everything it draws in the room the game is played in', () => {
    for (const thing of tableauOf(dealTheGame(), floor)) {
      expect(thing.spaceId).toBe(HIDEOUT_OFFICE)
      expect(thing.tierId).toBe(HIDEOUT_TIER)
    }
  })
})

// ── What a Hatsu does to twelve cards ─────────────────────────────

/** Always caught, and never caught, so detection is never the thing under test. */
const caught = () => 0
const clean = () => 0.999

/** A game with a technique in hand and the room as watchful as it really is. */
const withTechnique = (kind: TableKind, over: Partial<MorenaGame> = {}): MorenaGame => ({
  ...dealTheGame({ marked: null, technique: kind }),
  ...over,
})

describe('the roster of what can be played across the table', () => {
  it('names an ability that exists for every one of them', () => {
    const known = new Set(HATSU_PROFILES.map((profile) => profile.id))
    for (const kind of TABLE_KINDS) {
      expect(known.has(TABLE_TECHNIQUES[kind].hatsuId), `${kind} names no ability`).toBe(true)
    }
  })

  it('gives every one of them the kind the registry gives it', () => {
    for (const kind of TABLE_KINDS) {
      const profile = HATSU_PROFILES.find(
        (candidate) => candidate.id === TABLE_TECHNIQUES[kind].hatsuId,
      )!
      expect(profile.kind, `${kind} is filed under the wrong ability`).toBe(kind)
    }
  })

  it('knows that most of the catalogue has nothing to say to a card table', () => {
    expect(worksAtTheTable('blast')).toBe(false)
    expect(worksAtTheTable('barrage')).toBe(false)
    expect(worksAtTheTable(null)).toBe(false)
    expect(worksAtTheTable('dowsing')).toBe(true)
  })

  it('prices a fraud with an exposure and a legal move without one', () => {
    for (const kind of TABLE_KINDS) {
      const move = TABLE_TECHNIQUES[kind]
      expect(move.exposure, `${kind} is priced outside 0 to 1`).toBeGreaterThanOrEqual(0)
      expect(move.exposure).toBeLessThanOrEqual(1)
      expect(move.uses, `${kind} can be played no times at all`).toBeGreaterThan(0)
      if (!move.fraud) expect(move.exposure, `${kind} is legal and still priced`).toBe(0)
    }
  })
})

describe('the Manipulation, which is the only sanction the game has', () => {
  it('takes Back, Joker and X off the table and leaves Yes and No', () => {
    const narrowed = narrowTheAnswer(dealTheGame({ marked: null }), 'cheating')
    expect(narrowed.manipulated).toBe(true)
    expect(narrowed.hand).toEqual(['yes', 'no'])
    expect(narrowed.graveyard).toEqual([])
  })

  it('hands the two words back when narrowing would leave nothing to say', () => {
    // Everything wide is in the hand and everything narrow is buried: the
    // sanction limits the answer to Yes or No, so there has to be one.
    const cornered: MorenaGame = {
      ...dealTheGame({ marked: null }),
      hand: ['back', 'joker'],
      graveyard: ['yes', 'no', 'x'],
    }
    const narrowed = narrowTheAnswer(cornered, 'cheating')
    expect(narrowed.hand.sort()).toEqual(['no', 'yes'])
  })

  it('drops the hand straight to settling when one word is all that is left', () => {
    const cornered: MorenaGame = {
      ...dealTheGame({ marked: null }),
      hand: ['yes', 'back', 'x'],
      graveyard: ['no', 'joker'],
    }
    const narrowed = narrowTheAnswer(cornered, 'cheating')
    expect(narrowed.hand).toEqual(['yes'])
    expect(narrowed.phase).toBe('settling')
  })

  it('never lands twice, and never lands on a game that is over', () => {
    const once = narrowTheAnswer(dealTheGame({ marked: null }), 'cheating')
    expect(narrowTheAnswer(once, 'cheating')).toBe(once)
    const done: MorenaGame = { ...dealTheGame({ marked: null }), phase: 'over' }
    expect(narrowTheAnswer(done, 'cheating')).toBe(done)
  })

  it('punishes walking out exactly as it punishes cheating', () => {
    const left = leaveTheTable(dealTheGame({ marked: null }))
    expect(left.manipulated).toBe(true)
    expect(left.ending).toBe('abandoned')
    expect(left.hand).toEqual(['yes', 'no'])
    expect(left.log.at(-1)).toMatchObject({ kind: 'narrowed', because: 'leaving' })
  })
})

describe('reading her hand', () => {
  it('turns the fan face up, and the table draws it face up', () => {
    const played = playTechnique(withTechnique('scout'), { random: clean })
    expect(played.read).toBe(true)
    const office = ship.spaces.get(HIDEOUT_OFFICE)!
    const floor = floorOf(office, ship.plans.get(HIDEOUT_TIER)!.tier)
    const fan = tableauOf(played, floor).filter((thing) => thing.id.startsWith('question-'))
    expect(fan.every((card) => card.stage === 1)).toBe(true)
  })

  it('makes foresight true rather than likely', () => {
    // Told that the X goes, the X goes — whatever the shuffle would have said.
    const foretold = playTechnique(withTechnique('dowsing'), { random: last })
    expect(foretold.foreseen).toBe('x')
    const asked = askMorena(foretold, 'goal', { random: first })
    expect(asked.graveyard).toEqual(['x'])
  })

  it('spends the foresight on the round it was bought for', () => {
    const foretold = playTechnique(withTechnique('dowsing'), { random: last })
    expect(askMorena(foretold, 'goal', { random: first }).foreseen).toBeNull()
  })

  it('costs the wider words when the chain is seen, which it usually is', () => {
    const seen = playTechnique(withTechnique('dowsing'), { random: caught })
    expect(seen.manipulated).toBe(true)
    expect(seen.hand).toEqual(['yes', 'no'])
    expect(seen.log.some((beat) => beat.kind === 'played' && beat.seen)).toBe(true)
  })

  it('cannot be seen at all when it is lived under Zetsu', () => {
    // Parallel Future is priced at zero exposure, so the roll is irrelevant.
    const seen = playTechnique(withTechnique('future'), { random: caught })
    expect(seen.manipulated).toBe(false)
    expect(seen.foreseen).not.toBeNull()
  })

  it('runs out: a one-shot is a one-shot', () => {
    const game = playTechnique(withTechnique('future'), { random: clean })
    const again = playTechnique(game, { random: clean })
    expect(again).toBe(game)
    expect(game.spent).toBe(1)
  })
})

describe('hiding your own', () => {
  it('suspends an exchange without it counting as walking out', () => {
    const before = withTechnique('melody')
    const passed = playTechnique(before, { random: caught })
    expect(passed.manipulated).toBe(false)
    expect(passed.ending).toBeNull()
    expect(passed.round).toBe(before.round + 1)
    // And it costs no answer, which is the whole of it.
    expect(passed.hand).toEqual(before.hand)
  })

  it('forges a card the table cannot read, and the kiss reads it', () => {
    let game = playTechnique(withTechnique('disguise'), { random: clean })
    expect(game.forged).toBe('no')
    expect(game.manipulated).toBe(false)

    // Down to the deal, with the forgery still in hand.
    game = { ...game, phase: 'deal', graveyard: ['x'] }
    const kissed = takeTheDeal(game, 'x')
    expect(kissed.manipulated).toBe(true)
    expect(kissed.log.some((beat) => beat.kind === 'exposed')).toBe(true)
  })

  it('has nothing left to expose once she has taken the forgery herself', () => {
    const game = playTechnique(withTechnique('disguise'), { random: clean })
    // She reaches for the forged card, which puts it out of reach of the kiss.
    const taken = askMorena(game, 'goal', { random: () => 0.999 })
    expect(taken.graveyard.at(-1)).toBe('no')
    expect(taken.forged).toBeNull()
  })

  it('buys a draw with her senses, and pays the abandonment for it', () => {
    const blinded = playTechnique(withTechnique('senses'), { random: clean })
    expect(blinded.phase).toBe('over')
    expect(blinded.verdict).toBe('cancelled')
    expect(blinded.ending).toBe('abandoned')
    expect(blinded.manipulated).toBe(true)
    expect(infectionAfter(blinded).said).toBe(false)
  })
})

describe('making stakes', () => {
  it('takes a card back out of the graveyard without the kiss', () => {
    const spent = {
      ...withTechnique('coin-growth'),
      hand: ['no'] as AnswerCard[],
      graveyard: ['yes'] as AnswerCard[],
    }
    const minted = playTechnique(spent, { random: caught })
    expect(minted.hand).toContain('yes')
    expect(minted.graveyard).toEqual([])
    expect(minted.kissed).toBe(false)
    // Honest money: being seen costs nothing.
    expect(minted.manipulated).toBe(false)
  })

  it('pays her in a copy that is gone by morning', () => {
    const spent = {
      ...withTechnique('clone'),
      hand: ['no'] as AnswerCard[],
      graveyard: ['yes'] as AnswerCard[],
    }
    const forged = playTechnique(spent, { random: clean })
    expect(forged.riders).toContain('smoke')
    const over = settle({ ...forged, hand: ['yes'], phase: 'settling' })
    expect(over.aftermath).toContain('smoke')
  })
})

describe('changing what the answer is worth', () => {
  it('binds the verdict rather than changing it', () => {
    const bound = playTechnique(withTechnique('contract'), { random: caught })
    expect(bound.hand).toEqual([...ANSWER_CARDS])
    const over = settle({ ...bound, hand: ['yes'], phase: 'settling' })
    expect(over.verdict).toBe('infected')
    expect(over.aftermath).toContain('bound')
  })

  it('makes the vow the one thing the Manipulation cannot narrow', () => {
    const sworn = playTechnique(withTechnique('heart-vow'), { random: caught })
    expect(sworn.shielded).toBe(true)
    const pressed = narrowTheAnswer(sworn, 'cheating')
    expect(pressed).toBe(sworn)
    expect(leaveTheTable(sworn).manipulated).toBe(false)
  })

  it('charges the vow a life when the Yes is given anyway', () => {
    const sworn = playTechnique(withTechnique('heart-vow'), { random: clean })
    const over = settle({ ...sworn, hand: ['yes'], phase: 'settling' })
    expect(over.verdict).toBe('infected')
    expect(over.aftermath).toContain('sworn-struck')
  })

  it('pays the moon out of her own second condition and not before', () => {
    const marked = playTechnique(withTechnique('polarity'), { random: clean })
    const unkissed = settle({ ...marked, hand: ['no'], phase: 'settling' })
    expect(unkissed.aftermath).not.toContain('moon')

    const kissed = settle({ ...marked, hand: ['yes'], phase: 'settling', kissed: true })
    expect(kissed.aftermath).toContain('moon')
  })

  it('draws the moon over her the moment the clause is laid', () => {
    const marked = playTechnique(withTechnique('polarity'), { random: clean })
    const office = ship.spaces.get(HIDEOUT_OFFICE)!
    const floor = floorOf(office, ship.plans.get(HIDEOUT_TIER)!.tier)
    const moon = tableauOf(marked, floor).find((thing) => thing.kind === 'moon-mark')
    expect(moon).toBeDefined()
    expect(moon!.at).toEqual([...DEALER_AT])
  })
})

describe('not being the person sitting', () => {
  it('caps the game at a draw and keeps the answer off you', () => {
    const proxied = playTechnique(withTechnique('puppet'), { random: caught })
    expect(proxied.proxied).toBe(true)
    const over = settle({ ...proxied, hand: ['yes'], phase: 'settling', kissed: true })
    expect(over.verdict).toBe('infected')
    expect(over.aftermath).toContain('proxied')
    expect(infectionAfter(over)).toMatchObject({ said: true, level: null, proxied: true })
  })

  it('takes Contagion when the hand is played to its end and the kiss is taken', () => {
    let game = playTechnique(withTechnique('theft'), { random: clean })
    game = askMorena(game, 'power', { random: first })
    const over = settle({ ...game, hand: ['no'], phase: 'settling', kissed: true })
    expect(over.aftermath).toContain('stolen')
    expect(infectionAfter(over).stolen).toBe(true)
  })

  it('takes nothing at all from a hand that was never played out', () => {
    const game = playTechnique(withTechnique('theft'), { random: clean })
    const over = settle({ ...game, hand: ['no'], phase: 'settling' })
    expect(over.aftermath).not.toContain('stolen')
  })
})

describe('the room, which is the thing that catches you', () => {
  it('watches by default, because LSDF is standing in it', () => {
    expect(dealTheGame().watch).toBe(1)
  })

  it('stops watching once the room is taken out of the ship', () => {
    const sealed = playTechnique(withTechnique('room-isolation'), { random: clean })
    expect(sealed.watch).toBe(0)
  })

  it('cannot catch what an unwatched room cannot see', () => {
    const unwatched: MorenaGame = { ...withTechnique('dowsing'), watch: 0 }
    expect(playTechnique(unwatched, { random: caught }).manipulated).toBe(false)
  })

  it('leaves an honest hand exactly as it was', () => {
    const honest = dealTheGame({ marked: null })
    expect(playTechnique(honest, { random: caught })).toBe(honest)
    expect(honest.technique).toBeNull()
  })
})
