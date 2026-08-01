import { describe, expect, it } from 'vitest'
import { buildShip } from './blueprint'
import { floorOf } from './blueprint'
import {
  ANSWER_CARDS,
  DEALER_AT,
  EYE_HOLD,
  EYE_RANGE,
  GUEST_AT,
  HIDEOUT_OFFICE,
  HIDEOUT_TIER,
  QUESTION_CARDS,
  TABLE_AT,
  TABLE_HEIGHT,
  TABLE_KINDS,
  TABLE_PAGES,
  TABLE_TECHNIQUES,
  askMorena,
  dealerStage,
  eyeFeed,
  exposureNow,
  moveFor,
  dealTheGame,
  infectionAfter,
  lastCard,
  leaveTheTable,
  narrowTheAnswer,
  livePages,
  needsAChoice,
  openTheBookHere,
  owlFilm,
  owlSaw,
  playTechnique,
  refuseTheDeal,
  settle,
  sitsAtTheTable,
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

  it('stands the foreseen card off the wood, and puts nothing else on it', () => {
    const dealt = dealTheGame()
    const flat = tableauOf(dealt, floor).find((thing) => thing.id === 'hand-joker')!
    expect(flat.stage).toBe(1)

    const told: MorenaGame = { ...dealt, foreseen: 'joker' }
    const seen = tableauOf(told, floor)
    const lifted = seen.find((thing) => thing.id === 'hand-joker')!
    expect(lifted.stage).toBe(4)
    expect(lifted.y).toBeGreaterThan(flat.y)
    // One card is picked out, and it is the one she is reaching for.
    expect(seen.filter((thing) => thing.stage === 4)).toHaveLength(1)
  })

  it('gives the forged card the aura that made it, until a touch finds it', () => {
    const forged = playTechnique(withTechnique('disguise'), { random: clean })
    const made = tableauOf(forged, floor).find((thing) => thing.id === `hand-${forged.forged}`)!
    expect(made.stage).toBe(5)
    // The aura is on the forged face and on nothing else: a hand can hold two
    // of the same card once a copy has been made of one, and both of those are
    // the forgery as far as this table is concerned.
    for (const thing of tableauOf(forged, floor)) {
      if (thing.stage !== 5) continue
      expect(thing.id).toBe(`hand-${forged.forged}`)
    }

    // Once the kiss has given it away it is a card somebody has read, which is
    // the nick — the same one Morena's marked card wears.
    const exposed: MorenaGame = { ...forged, manipulated: true }
    const seen = tableauOf(exposed, floor).find((thing) => thing.id === `hand-${forged.forged}`)!
    expect(seen.stage).toBe(3)
  })

  it('flies the insect in the room from the moment somebody sits down with it', () => {
    expect(tableauOf(dealTheGame(), floor).some((thing) => thing.kind === 'insect')).toBe(false)

    const carried = tableauOf(withTechnique('scout'), floor).find(
      (thing) => thing.kind === 'insect',
    )!
    // Up out of the way, and working the room rather than anything on the table.
    expect(carried.y).toBeGreaterThan(floor + 2)
    expect(carried.spread).toBe(EYE_RANGE)
  })

  it('sends a picture back, from wherever the insect is holding', () => {
    // No eye, no feed: every other technique at this table is held rather than
    // sent, and there is nothing in the room to look through.
    expect(eyeFeed(dealTheGame(), floor)).toBeNull()
    expect(eyeFeed(withTechnique('dowsing'), floor)).toBeNull()

    // Perched, it is watching the room — which means watching her.
    const perched = eyeFeed(withTechnique('scout'), floor)!
    expect(perched.y).toBeGreaterThan(floor + 2)
    expect(perched.look).toEqual(DEALER_AT)

    // Filming, it is over the fan and looking down at it: the descent is the
    // read, and the picture has to be of what was read.
    const filming = eyeFeed(playTechnique(withTechnique('scout'), { random: clean }), floor)!
    expect(filming.y).toBeGreaterThan(floor + TABLE_HEIGHT)
    expect(filming.y).toBeLessThan(floor + TABLE_HEIGHT + 0.4)
    expect(filming.lookY).toBeLessThan(filming.y)
    // Her side of the table, and pointed further into it: a camera looking
    // straight down has no upright, and the cards would come out on their side.
    expect(filming.look[1]).toBeLessThan(filming.at[1])
    expect(filming.at[1]).toBeLessThan(TABLE_AT[1])
  })

  it('brings it down onto her fan once it has been told to film', () => {
    const filming = playTechnique(withTechnique('scout'), { random: clean })
    const seen = tableauOf(filming, floor).find((thing) => thing.kind === 'insect')!
    // Over her cards, close enough to read one and clear of the wood.
    expect(seen.y).toBeGreaterThan(floor + TABLE_HEIGHT)
    expect(seen.y).toBeLessThan(floor + TABLE_HEIGHT + 0.4)
    expect(seen.at[1]).toBeLessThan(TABLE_AT[1])
    expect(seen.spread).toBe(EYE_HOLD)
    // And it is one insect flown down, not a second one built beside the first.
    expect(tableauOf(filming, floor).filter((thing) => thing.kind === 'insect')).toHaveLength(1)
  })

  it('leaves the owl on the bulkhead, before the cast and after it', () => {
    expect(tableauOf(dealTheGame(), floor).some((thing) => thing.kind === 'owl')).toBe(false)

    const bird = (game: MorenaGame) => tableauOf(game, floor).find((thing) => thing.kind === 'owl')!
    const attached = bird(withTechnique('surveillance'))
    // High, behind her, and — the whole of the technique — perfectly still.
    expect(attached.y).toBeGreaterThan(floor + 2)
    expect(attached.at[1]).toBeLessThan(DEALER_AT[1])
    expect(attached.spread).toBe(0)

    // Nothing about it moves when the tape is reviewed: what a camera bolted to
    // a wall does when somebody watches its footage is nothing.
    const reviewed = bird(playTechnique(withTechnique('surveillance'), { random: clean }))
    expect(reviewed.at).toEqual(attached.at)
    expect(reviewed.y).toBe(attached.y)
  })

  it('hands over a recording rather than a feed, and only once it is asked for', () => {
    // Attached and not yet reviewed: the bird is filming, and nobody is
    // watching it. That is the difference between this and the insect.
    expect(owlFilm(dealTheGame(), floor)).toBeNull()
    expect(owlFilm(withTechnique('scout'), floor)).toBeNull()
    expect(owlFilm(withTechnique('surveillance'), floor)).toBeNull()

    const film = owlFilm(playTechnique(withTechnique('surveillance'), { random: clean }), floor)!
    // From the bulkhead, over her shoulder, pointed down at her fan.
    expect(film.y).toBeGreaterThan(floor + 2)
    expect(film.at[1]).toBeLessThan(DEALER_AT[1])
    expect(film.look[1]).toBeLessThan(TABLE_AT[1])
    expect(film.lookY).toBeLessThan(film.y)
  })

  it('keeps in the record the questions she has spent since it was taken', () => {
    expect(owlSaw(withTechnique('surveillance'))).toBeNull()
    expect(owlSaw(playTechnique(withTechnique('scout'), { random: clean }))).toBeNull()

    const filmed = playTechnique(withTechnique('surveillance'), { random: clean })
    expect(owlSaw(filmed)).toEqual([...QUESTION_CARDS])

    // Two questions spent afterwards. Her fan is down to five and the footage
    // is still seven: a recording does not update, which is the one thing it
    // has over the live picture at the other end of the table.
    const later = askMorena(askMorena(filmed, QUESTION_CARDS[0]), QUESTION_CARDS[3])
    expect(later.questions).toHaveLength(5)
    expect(owlSaw(later)).toEqual([...QUESTION_CARDS])
  })

  it('leaves the nick showing rather than the foresight when a card is both', () => {
    const over: MorenaGame = {
      ...dealTheGame(),
      phase: 'over',
      hand: ['back'],
      foreseen: 'back',
      verdict: 'forced',
    }
    expect(tableauOf(over, floor).find((thing) => thing.id === 'hand-back')!.stage).toBe(3)
  })
})

describe('the woman opposite', () => {
  it('deals, leans in for the kiss, and sits back when it is played out', () => {
    expect(dealerStage(dealTheGame())).toBe(0)
    expect(dealerStage({ ...dealTheGame(), phase: 'deal' })).toBe(1)
    expect(dealerStage({ ...dealTheGame(), phase: 'over' })).toBe(2)
  })

  it('reacts to the one thing the table never showed: being seen', () => {
    const caught = playTechnique(withTechnique('dowsing'), { random: caught_ })
    expect(caught.log.at(-1)).toMatchObject({ kind: 'narrowed' })
    // The narrowing is the last beat, so the reaction has to survive it: what
    // she answers to is having been told, not the sanction that followed.
    expect(dealerStage({ ...caught, log: caught.log.slice(0, -1) })).toBe(3)

    const unseen = playTechnique(withTechnique('dowsing'), { random: clean })
    expect(dealerStage(unseen)).toBe(0)
  })

  it('reacts to a forged card given away by the kiss', () => {
    const forged = playTechnique(withTechnique('disguise'), { random: clean })
    // Put the hand at the offer rather than playing to it: what is under test
    // is the touch, and three rounds of shuffling are three chances for her to
    // take the forged card back off the table before anybody touches anything.
    const offered: MorenaGame = {
      ...forged,
      phase: 'deal',
      hand: ['yes', forged.forged!],
      graveyard: ['joker'],
    }
    const exposed = takeTheDeal(offered, 'joker')
    expect(exposed.log.some((beat) => beat.kind === 'exposed')).toBe(true)
    const told = exposed.log.slice(0, exposed.log.findIndex((beat) => beat.kind === 'exposed') + 1)
    expect(dealerStage({ ...exposed, log: told })).toBe(3)
  })

  it('stops finding whoever sat down once her senses are taken', () => {
    const blinded = playTechnique(withTechnique('senses'), { random: clean })
    expect(blinded.phase).toBe('over')
    // Over, and still not sat back: the loss outlasts the hand it ended.
    expect(dealerStage(blinded)).toBe(4)
  })
})

describe("Cross Game's card, on a table rather than over a room", () => {
  const office = ship.spaces.get(HIDEOUT_OFFICE)!
  const floor = floorOf(office, ship.plans.get(HIDEOUT_TIER)!.tier)
  const cardIn = (game: MorenaGame) =>
    tableauOf(game, floor).find((thing) => thing.id === 'tribunal-card')

  it('is shown to nobody who did not sit down with it', () => {
    expect(cardIn(dealTheGame())).toBeUndefined()
    expect(cardIn(withTechnique('dowsing'))).toBeUndefined()
  })

  it('turns blue, then yellow, then red', () => {
    const seated = withTechnique('tribunal')
    expect(cardIn(seated)!.stage).toBe(1)

    let warned = askMorena(seated, 'goal', { random: first })
    expect(cardIn(warned)!.stage).toBe(1)
    warned = askMorena(warned, 'power', { random: first })
    expect(cardIn(warned)!.stage).toBe(2)

    const expelled = playTechnique(warned, { random: clean })
    expect(expelled.aftermath).toContain('evicted')
    expect(cardIn(expelled)!.stage).toBe(3)
  })
})

// ── What a Hatsu does to twelve cards ─────────────────────────────

/** Always caught, and never caught, so detection is never the thing under test. */
const caught_ = () => 0
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

describe('Double Face, which is two seats rather than one', () => {
  const floor = floorOf(ship.spaces.get(HIDEOUT_OFFICE)!, ship.plans.get(HIDEOUT_TIER)!.tier)

  /** A book open at Little Eye with Love Dial under the ribbon. */
  const book = (over: Partial<MorenaGame> = {}): MorenaGame => ({
    ...dealTheGame({ marked: null, technique: 'scout', bookmark: 'divination' }),
    ...over,
  })

  it('draws its two pages from what Chrollo is carrying, and never twice', () => {
    for (const page of TABLE_PAGES) expect(worksAtTheTable(page)).toBe(true)
    // A ribbon marking the open page is a bookmark doing nothing.
    for (const roll of [0, 0.3, 0.6, 0.999]) {
      const [open, second] = openTheBookHere(() => roll)
      expect(open).not.toBe(second)
    }
  })

  it('lets the ribbon in at the table, where a technique-only door would not', () => {
    expect(worksAtTheTable('bookmark')).toBe(false)
    expect(sitsAtTheTable('bookmark')).toBe(true)
    expect(sitsAtTheTable('scout')).toBe(true)
    expect(sitsAtTheTable('blast')).toBe(false)
  })

  it('holds both pages live, each on its own key', () => {
    expect(livePages(book()).map((seat) => seat.kind)).toEqual(['scout', 'divination'])
    expect(livePages(dealTheGame()).map((seat) => seat.kind)).toEqual([])
  })

  it('spends each page out of its own purse', () => {
    const played = playTechnique(book(), { random: clean, page: 'second' })
    // Love Dial is the one that went; the open page has spent nothing.
    expect(played.spent).toBe(0)
    expect(played.bookmark).toEqual({ kind: 'divination', spent: 1 })
    expect(played.log.at(-1)).toMatchObject({ kind: 'played', technique: 'divination' })

    // And a page with nothing left refuses, without touching the other one.
    const twice = playTechnique(played, { random: clean, page: 'second' })
    const spentOut = playTechnique(twice, { random: clean, page: 'second' })
    expect(spentOut).toBe(twice)
    expect(playTechnique(played, { random: clean }).spent).toBe(1)
  })

  it('puts a bookmarked technique in the room like any other', () => {
    // The insect is Little Eye's whether Little Eye is the open page or the one
    // under the ribbon: a table that drew the roster rather than the room would
    // leave a cast technique with nothing standing anywhere.
    const ribboned = dealTheGame({ marked: null, technique: 'tribunal', bookmark: 'scout' })
    expect(tableauOf(ribboned, floor).some((thing) => thing.kind === 'insect')).toBe(true)
    expect(eyeFeed(ribboned, floor)).not.toBeNull()

    const filming = playTechnique(ribboned, { random: clean, page: 'second' })
    expect(tableauOf(filming, floor).find((thing) => thing.kind === 'insect')!.spread).toBe(
      EYE_HOLD,
    )
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
  const office = ship.spaces.get(HIDEOUT_OFFICE)!
  const floor = floorOf(office, ship.plans.get(HIDEOUT_TIER)!.tier)

  it('turns the fan face up, and the table draws it face up', () => {
    const played = playTechnique(withTechnique('scout'), { random: clean })
    expect(played.read).toBe(true)
    const fan = tableauOf(played, floor).filter((thing) => thing.id.startsWith('question-'))
    expect(fan.every((card) => card.stage === 1)).toBe(true)
  })

  it('puts the question itself on the card, and only once it has been read', () => {
    // Face down is a card with nothing on it: a table that prints the question
    // on a card the guest has not paid for has given the game away.
    const blind = tableauOf(withTechnique('scout'), floor)
    expect(blind.filter((thing) => thing.id.startsWith('question-'))).not.toHaveLength(0)
    for (const card of blind.filter((thing) => thing.id.startsWith('question-'))) {
      expect(card.face).toBeUndefined()
    }

    const read = tableauOf(playTechnique(withTechnique('scout'), { random: clean }), floor)
    for (const card of read.filter((thing) => thing.id.startsWith('question-'))) {
      expect(card.face).toBe(card.id.slice('question-'.length))
    }
  })

  it('draws the guest their own cards, whatever the technique in hand', () => {
    // They are their own cards and always have been, so a hand is legible
    // before anything has been spent on anything.
    for (const card of tableauOf(dealTheGame(), floor).filter((thing) =>
      thing.id.startsWith('hand-'),
    )) {
      expect(card.face).toBe(card.id.slice('hand-'.length))
    }
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
    const seen = playTechnique(withTechnique('dowsing'), { random: caught_ })
    expect(seen.manipulated).toBe(true)
    expect(seen.hand).toEqual(['yes', 'no'])
    expect(seen.log.some((beat) => beat.kind === 'played' && beat.seen)).toBe(true)
  })

  it('cannot be seen at all when it is lived under Zetsu', () => {
    // Parallel Future is priced at zero exposure, so the roll is irrelevant.
    const seen = playTechnique(withTechnique('future'), { random: caught_ })
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
    const passed = playTechnique(before, { random: caught_ })
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
    const minted = playTechnique(spent, { random: caught_ })
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
    const bound = playTechnique(withTechnique('contract'), { random: caught_ })
    expect(bound.hand).toEqual([...ANSWER_CARDS])
    const over = settle({ ...bound, hand: ['yes'], phase: 'settling' })
    expect(over.verdict).toBe('infected')
    expect(over.aftermath).toContain('bound')
  })

  it('makes the vow the one thing the Manipulation cannot narrow', () => {
    const sworn = playTechnique(withTechnique('heart-vow'), { random: caught_ })
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
    const proxied = playTechnique(withTechnique('puppet'), { random: caught_ })
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
    expect(playTechnique(unwatched, { random: caught_ }).manipulated).toBe(false)
  })

  it('leaves an honest hand exactly as it was', () => {
    const honest = dealTheGame({ marked: null })
    expect(playTechnique(honest, { random: caught_ })).toBe(honest)
    expect(honest.technique).toBeNull()
  })
})

describe('the five seats the table opened last', () => {
  it('empties her chair rather than yours, and does not narrow you for it', () => {
    // The one exit that is not through the Manipulation: she is the one who
    // left, so the sanction has nobody to fall on.
    const evicted = playTechnique(withTechnique('teleport'), { random: clean })
    expect(evicted.phase).toBe('over')
    expect(evicted.verdict).toBe('cancelled')
    expect(evicted.ending).toBe('abandoned')
    expect(evicted.manipulated).toBe(false)
    expect(evicted.aftermath).toContain('evicted')
    expect(infectionAfter(evicted).said).toBe(false)
  })

  it('leaves you at the table, narrowed, when the theft is seen', () => {
    const seen = playTechnique(withTechnique('teleport'), { random: caught_ })
    expect(seen.phase).not.toBe('over')
    expect(seen.manipulated).toBe(true)
    expect(seen.aftermath).toEqual([])
  })

  it('will not play the red card before there is anything to expel her over', () => {
    // Mizaistom does not expel anybody he has not already cautioned, and two
    // questions asked is the caution.
    const early = withTechnique('tribunal')
    expect(playTechnique(early, { random: clean })).toBe(early)

    const warned = { ...early, asked: ['goal' as const, 'power' as const] }
    const shown = playTechnique(warned, { random: caught_ })
    expect(shown.phase).toBe('over')
    expect(shown.aftermath).toContain('evicted')
    // Legal, so being watched costs it nothing.
    expect(shown.manipulated).toBe(false)
  })

  it('seats a beast wearing a dead woman, and drops it the moment it is seen', () => {
    const held = playTechnique(withTechnique('guardian'), { random: clean })
    expect(held.proxied).toBe(true)

    const seen = playTechnique(withTechnique('guardian'), { random: caught_ })
    expect(seen.proxied).toBe(false)
    expect(seen.manipulated).toBe(true)
  })

  it('wears the borrowed face thinner every round', () => {
    const fresh = withTechnique('mimicry')
    const late = { ...fresh, round: 5 }
    expect(exposureNow(moveFor('mimicry'), late)).toBeGreaterThan(
      exposureNow(moveFor('mimicry'), fresh),
    )
    // And an unwatched room costs it nothing, however long it has been on.
    expect(exposureNow(moveFor('mimicry'), { ...late, watch: 0 })).toBe(0)
  })

  it('never prices a move outside the unit interval, however long the hand runs', () => {
    for (const kind of TABLE_KINDS) {
      const late = { ...withTechnique(kind), round: 40 }
      const now = exposureNow(moveFor(kind), late)
      expect(now, `${kind} is priced at ${now}`).toBeGreaterThanOrEqual(0)
      expect(now).toBeLessThanOrEqual(1)
    }
  })

  it('sits a sleeping body in the chair, and the kiss reaches nothing', () => {
    const projected = playTechnique(withTechnique('projection'), { random: clean })
    expect(projected.proxied).toBe(true)
    const over = settle({ ...projected, hand: ['yes'], phase: 'settling', kissed: true })
    expect(infectionAfter(over)).toMatchObject({ said: true, kissed: false, level: null })
  })
})
