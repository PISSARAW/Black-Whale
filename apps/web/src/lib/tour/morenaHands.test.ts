import { describe, expect, it } from 'vitest'
import { floorOf, buildShip } from './blueprint'
import {
  HIDEOUT_OFFICE,
  HIDEOUT_TIER,
  askMorena,
  dealTheGame,
  refuseTheDeal,
  settle,
  tableauOf,
  type MorenaGame,
} from './morena'
import { AIM_AT, gesturesAt, playGesture, withinReach } from './morenaHands'

const ship = buildShip()
const floor = floorOf(ship.spaces.get(HIDEOUT_OFFICE)!, ship.plans.get(HIDEOUT_TIER)!.tier)

/** A shuffle that always reaches for the near end of the hand. */
const first = () => 0

/** Spends questions until something interrupts: the kiss, or the last card. */
function playOut(game: MorenaGame): MorenaGame {
  let played = game
  while (played.phase === 'asking' && played.questions.length) {
    played = askMorena(played, played.questions[0], { random: first })
  }
  return played
}

/** The same, refusing the kiss on the way: a hand played down to its last card. */
function playDown(game: MorenaGame): MorenaGame {
  let played = playOut(game)
  while (played.phase === 'deal') played = playOut(refuseTheDeal(played))
  return played
}

/** What the table says may be taken hold of, read off the layout itself. */
const pickableOn = (game: MorenaGame) =>
  tableauOf(game, floor)
    .filter((thing) => thing.pick)
    .map((thing) => thing.id)
    .sort()

describe('what the hands can reach', () => {
  it('offers her seven questions while there are questions to spend', () => {
    const game = dealTheGame()
    expect(Object.keys(gesturesAt(game)).sort()).toEqual(
      game.questions.map((question) => `question-${question}`).sort(),
    )
  })

  it('offers the graveyard and the hand at the kiss', () => {
    const game = playOut(dealTheGame())
    expect(game.phase).toBe('deal')
    const hands = gesturesAt(game)
    for (const card of game.graveyard)
      expect(hands[`buried-${card}`]).toEqual({ kind: 'kiss', card })
    for (const card of game.hand) expect(hands[`hand-${card}`]).toEqual({ kind: 'decline' })
  })

  it('offers the two directions a Joker can be pointed', () => {
    // Everything but the Joker taken, which leaves the one card that answers
    // nothing until it is aimed.
    const game = playDown({ ...dealTheGame({ marked: null }), hand: ['yes', 'no', 'joker'] })
    expect(game.phase).toBe('settling')
    expect(Object.keys(gesturesAt(game)).sort()).toEqual([AIM_AT.no, AIM_AT.yes].sort())
  })

  it('offers the graveyard to a Back, and the hand to anything else', () => {
    const back = playDown({ ...dealTheGame({ marked: null }), hand: ['yes', 'no', 'back'] })
    expect(gesturesAt(back)['buried-yes']).toEqual({ kind: 'reach', card: 'yes' })
    const plain = playDown({ ...dealTheGame({ marked: null }), hand: ['yes', 'no', 'x'] })
    expect(gesturesAt(plain)['hand-x']).toEqual({ kind: 'play', card: 'x' })
  })

  it('offers nothing once the hand is over', () => {
    const over = settle(playDown({ ...dealTheGame({ marked: null }), hand: ['yes', 'x'] }))
    expect(over.phase).toBe('over')
    expect(withinReach(over).size).toBe(0)
  })
})

describe('playing by hand', () => {
  it('spends the question the card in her fan is', () => {
    const asked = playGesture(dealTheGame(), { kind: 'ask', question: 'goal' })
    expect(asked.asked).toEqual(['goal'])
  })

  it('buys a card back with the kiss, and refuses it without one', () => {
    const offered = playOut(dealTheGame())
    const card = offered.graveyard[0]
    const kissed = playGesture(offered, { kind: 'kiss', card })
    expect(kissed.kissed).toBe(true)
    expect(kissed.hand).toContain(card)
    const refused = playGesture(offered, { kind: 'decline' })
    expect(refused.kissed).toBe(false)
    expect(refused.phase).not.toBe('deal')
  })

  it('points a Joker, and it is the direction that is the answer', () => {
    const joker = playDown({ ...dealTheGame({ marked: null }), hand: ['yes', 'no', 'joker'] })
    expect(playGesture(joker, { kind: 'point', side: 'yes' }).verdict).toBe('infected')
    expect(playGesture(joker, { kind: 'point', side: 'no' }).verdict).toBe('refused')
  })

  it('reaches into the graveyard with a Back, and puts a plain card down as it is', () => {
    const back = playDown({ ...dealTheGame({ marked: null }), hand: ['yes', 'no', 'back'] })
    expect(playGesture(back, { kind: 'reach', card: 'yes' }).finalCard).toBe('yes')
    const plain = playDown({ ...dealTheGame({ marked: null }), hand: ['yes', 'no', 'x'] })
    expect(playGesture(plain, { kind: 'play', card: 'x' }).verdict).toBe('cancelled')
  })
})

describe('the table, marked for a pair of hands', () => {
  it('marks exactly the cards the rules say are moves', () => {
    const game = playOut(dealTheGame())
    expect(pickableOn(game)).toEqual([...withinReach(game)].sort())
  })

  it('spreads the graveyard face up when it is something to choose from', () => {
    const buried = (game: MorenaGame) =>
      tableauOf(game, floor).filter((thing) => thing.id.startsWith('buried-'))

    const asked = askMorena(askMorena(dealTheGame(), 'goal', { random: first }), 'power', {
      random: first,
    })
    // Stacked while it is only a record: one place on the table, no faces.
    expect(new Set(buried(asked).map((card) => card.at[1])).size).toBe(1)
    expect(buried(asked).every((card) => card.face === undefined)).toBe(true)

    const offered = playOut(dealTheGame())
    expect(offered.phase).toBe('deal')
    expect(new Set(buried(offered).map((card) => card.at[1])).size).toBe(offered.graveyard.length)
    expect(buried(offered).every((card) => card.face !== undefined)).toBe(true)
  })

  it('lays the two directions of a Joker down only while it is being pointed', () => {
    const aims = (game: MorenaGame) =>
      tableauOf(game, floor).filter((thing) => thing.id.startsWith('aim-'))
    expect(aims(dealTheGame())).toHaveLength(0)
    const joker = playDown({ ...dealTheGame({ marked: null }), hand: ['yes', 'no', 'joker'] })
    expect(
      aims(joker)
        .map((card) => card.id)
        .sort(),
    ).toEqual([AIM_AT.no, AIM_AT.yes].sort())
    expect(aims(joker).every((card) => card.pick)).toBe(true)
  })

  it('marks nothing at all once the hand is played out', () => {
    const over = settle(playDown({ ...dealTheGame({ marked: null }), hand: ['yes', 'x'] }))
    expect(pickableOn(over)).toEqual([])
  })
})
