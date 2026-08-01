/**
 * Morena's game, played with the hands rather than with the panel.
 *
 * The route has always been able to play a whole hand: there is a button for
 * every move, and the table beside it draws what the buttons did. This file is
 * the other direction — the cards on the wood are the buttons. Point at one of
 * her seven and she answers it; point at what she took and buy it back with a
 * kiss; put your last card down by putting *it* down.
 *
 * Nothing here decides a rule. `@black-whale/ability-modules` holds all of them
 * and is the only thing that moves a game forward; this is the dictionary
 * between a mesh the visitor took hold of and a move that reducer already
 * publishes. Pure, and keyed on the same `id`s `tableauOf` lays out — the two
 * are one table, and a card that can be pointed at is a card that is drawn.
 */
import { askMorena, needsAChoice, refuseTheDeal, settle, takeTheDeal } from '@black-whale/ability-modules'
import type { AnswerCard, MorenaGame, QuestionCard } from '@black-whale/ability-modules'

/**
 * One thing a pair of hands can do at that table.
 *
 * Deliberately not the same list as the reducer's: `settle` is one function and
 * three gestures, because pointing a Joker at Yes, reaching into the graveyard
 * with a Back and simply laying a card down are three different things to do
 * with your arms and the room has to tell them apart.
 */
export type TableGesture =
  /** Spend one of her questions — the card in her fan you are pointing at. */
  | { kind: 'ask'; question: QuestionCard }
  /** Take the kiss, and take this card back out of the graveyard with it. */
  | { kind: 'kiss'; card: AnswerCard }
  /** Refuse it, by picking your own hand up and playing on. */
  | { kind: 'decline' }
  /** Point the Joker somewhere: the only card that is an answer to nothing. */
  | { kind: 'point'; side: 'yes' | 'no' }
  /** Reach into the graveyard with a Back, for the card behind it. */
  | { kind: 'reach'; card: AnswerCard }
  /** Put the last card down as it is. */
  | { kind: 'play'; card: AnswerCard }

/**
 * The two faces a Joker can be pointed at.
 *
 * They are not cards — the Yes and the No are wherever the deal left them —
 * they are the two directions the one card in your hand can mean. Laid on the
 * table anyway, because a direction you cannot point at is a menu, and this
 * table has a panel for those.
 */
export const AIM_AT: Record<'yes' | 'no', string> = { yes: 'aim-yes', no: 'aim-no' }

/**
 * What the visitor may take hold of, given a game.
 *
 * Keyed by apparition `id`, so the scene can answer "is this one pickable" in
 * a lookup and the route can answer "and what would it do" from the same map.
 * A phase with nothing to do — the hand is over, the panel is being read —
 * hands back an empty table, and the room stops offering anything.
 */
export function gesturesAt(game: MorenaGame): Record<string, TableGesture> {
  const hands: Record<string, TableGesture> = {}

  if (game.phase === 'asking') {
    // Her fan is face down and pointing at a card is the whole of asking: you
    // do not know what you are buying until she has answered it, which is the
    // shape of the negotiation and not a limitation of the room.
    for (const question of game.questions) hands[`question-${question}`] = { kind: 'ask', question }
    return hands
  }

  if (game.phase === 'deal') {
    // She is leaning in. The graveyard is what the kiss buys, and your own hand
    // is what refusing it leaves you with — so both sides of the trade are on
    // the table, and neither of them is a button.
    for (const card of game.graveyard) hands[`buried-${card}`] = { kind: 'kiss', card }
    for (const card of game.hand) hands[`hand-${card}`] = { kind: 'decline' }
    return hands
  }

  if (game.phase !== 'settling') return hands

  const settlement = needsAChoice(game)
  if (settlement === 'joker') {
    hands[AIM_AT.yes] = { kind: 'point', side: 'yes' }
    hands[AIM_AT.no] = { kind: 'point', side: 'no' }
    return hands
  }
  if (settlement === 'back') {
    for (const card of game.graveyard) hands[`buried-${card}`] = { kind: 'reach', card }
    return hands
  }
  // Everything else answers for itself: the card in your hand is the answer,
  // and laying it down is the game.
  for (const card of game.hand) hands[`hand-${card}`] = { kind: 'play', card }
  return hands
}

/** The same table, as the set the scene wants: what may be taken hold of. */
export const withinReach = (game: MorenaGame): Set<string> =>
  new Set(Object.keys(gesturesAt(game)))

/**
 * Play a gesture, which is to say: hand it to the rules.
 *
 * Every branch is one call into the reducer and nothing else. A gesture that
 * does not fit the phase it arrived in is not guarded here — the reducer
 * refuses every move it does not recognise and hands the game back unchanged,
 * which is the same answer and only written once.
 */
export function playGesture(game: MorenaGame, gesture: TableGesture): MorenaGame {
  switch (gesture.kind) {
    case 'ask':
      return askMorena(game, gesture.question)
    case 'kiss':
      return takeTheDeal(game, gesture.card)
    case 'decline':
      return refuseTheDeal(game)
    case 'point':
      return settle(game, gesture.side)
    case 'reach':
      return settle(game, gesture.card)
    case 'play':
      return settle(game)
  }
}
