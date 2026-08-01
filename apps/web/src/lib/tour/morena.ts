/**
 * Morena's negotiation game, as the walk draws it.
 *
 * The rules are not here. They live in `@black-whale/ability-modules`, next to
 * the ability whose first condition the game *is* — `docs/jeu-de-morena.md`
 * §4.1 argues that at length, and the short of it is that the same reducer has
 * to serve the walk and the Heil-Ly dashboard or the two will drift. This file
 * is the other half: where the table stands on the ship, what colour each card
 * is, and how a hand becomes a list of things to build.
 *
 * It also carries the one thing the package deliberately cannot: proof that
 * every seat at that table names an interaction kind the Hatsu registry
 * actually publishes. A package under `packages/` must not reach into the web
 * app for a type, so the check is made here, where both are in scope.
 */
import type { HatsuInteractionKind } from '$lib/nen/hatsuRegistry'
import { TABLE_KINDS } from '@black-whale/ability-modules'
import type { MorenaGame, AnswerCard } from '@black-whale/ability-modules'
import type { Apparition } from './apparitions'
import type { Vec2 } from './types'

// The rules, re-exported so the route and its tests have one import to make.
export {
  ANSWER_CARDS,
  INFECTION_STEPS,
  QUESTION_CARDS,
  TABLE_KINDS,
  TABLE_TECHNIQUES,
  askMorena,
  dealTheGame,
  exposureNow,
  infectionAfter,
  infectionStepsFrom,
  lastCard,
  leaveTheTable,
  moveFor,
  narrowTheAnswer,
  needsAChoice,
  playTechnique,
  refuseTheDeal,
  settle,
  summariseGame,
  takeTheDeal,
  worksAtTheTable,
} from '@black-whale/ability-modules'
export type {
  Aftermath,
  AnswerCard,
  Beat,
  DealOptions,
  GameEnding,
  GamePhase,
  InfectionStep,
  MorenaGame,
  QuestionCard,
  Rider,
  TableEffect,
  TableKind,
  TableMove,
  Verdict,
} from '@black-whale/ability-modules'

/**
 * A compile-time proof, and nothing at runtime.
 *
 * If a seat at the table is ever keyed on something the registry does not
 * publish as an interaction kind — a typo, or an ability that has since been
 * refiled — this assignment stops compiling. That is the whole point of it:
 * the package holds the rules and cannot see the registry, so the check has to
 * be made on this side of the wall rather than trusted on that one.
 */
const _everySeatIsARegisteredKind: readonly HatsuInteractionKind[] = TABLE_KINDS
void _everySeatIsARegisteredKind

// ── The table, as the walk draws it ────────────────────────────────

/** Where the game is played, and where the two chairs are. */
export const HIDEOUT_TIER = 'interior-heilly-hideout'
export const HIDEOUT_OFFICE = 'tier-2-heilly-secret-hideout-office'
/** The middle of the card table, in the coordinates of that deck. */
export const TABLE_AT: Vec2 = [12.08, 2.65]
/** How high its top stands above the deck, matching the solid in the blueprint. */
export const TABLE_HEIGHT = 0.78
/**
 * Where the guest sits, and where Morena does — just clear of the two chairs
 * the blueprint stands there, because a camera inside a solid sees its inside.
 */
export const GUEST_AT: Vec2 = [12.08, 3.62]
export const DEALER_AT: Vec2 = [12.08, 1.65]
/** The guest is sitting, so the eye is a good deal lower than a standing 1.7 m. */
export const SEATED_EYE = 1.25

/** The colours the five answers are laid in, and the back of a question card. */
export const CARD_COLOURS: Record<AnswerCard, number> = {
  yes: 0xe5484d,
  no: 0x4d8ff0,
  back: 0x7fc8a0,
  joker: 0xf0c94d,
  x: 0x9d65d0,
}
/** Morena's own red, the one the registry publishes Contagion in. */
export const DEALER_COLOUR = 0xd94f68
/** The back of a question card: nothing on it until it is spent. */
export const QUESTION_COLOUR = 0x3a2b33
/** And a spent one, face up on the table between them. */
export const ASKED_COLOUR = 0xb0a0a8
/** A card in the graveyard, which is a card with the colour gone out of it. */
export const BURIED_COLOUR = 0x4a4a52
/** The Sun and Moon's cold half, in the colour the walk already draws it. */
export const MOON_MARK = 0xbcd2f5
/** Judgment Chain's own gold, for the one mark worn by the guest. */
export const VOW_MARK = 0xd8b85e

/**
 * What stands on and around the table, given a game.
 *
 * The same shape `apparitionsOn` produces, and for the same reason: the scene
 * builds a mesh per entry and moves it by `id`, so a hand losing a card is one
 * card removed rather than five rebuilt. Pure, so the layout is testable
 * without a canvas.
 *
 * `floor` is the deck's own elevation in metres above the keel, because every
 * `y` in the walk is absolute.
 */
export function tableauOf(game: MorenaGame, floor: number): Apparition[] {
  const top = floor + TABLE_HEIGHT
  const seen: Apparition[] = []
  const common = { spaceId: HIDEOUT_OFFICE, tierId: HIDEOUT_TIER, hidden: false, stage: 0 }

  // Morena herself, seated behind her fan.
  seen.push({
    ...common,
    id: 'morena-dealer',
    kind: 'dealer',
    at: DEALER_AT,
    y: floor + 0.72,
    size: 0.42,
    colour: DEALER_COLOUR,
    stage: game.phase === 'over' ? 2 : game.phase === 'deal' ? 1 : 0,
  })

  /** One card, laid flat and fanned about the middle of one side of the table. */
  interface Laid {
    id: string
    /** Its place in the fan, and how wide the fan is. */
    index: number
    count: number
    /** Which side of the middle the fan sits on, in metres. */
    depth: number
    colour: number
    stage: number
    /** Off the wood, for the one card that is about to be played. */
    lift?: number
  }

  const lay = (card: Laid) => {
    const spread = 0.13
    const offset = (card.index - (card.count - 1) / 2) * spread
    seen.push({
      ...common,
      id: card.id,
      kind: 'game-card',
      at: [TABLE_AT[0] + offset, TABLE_AT[1] + card.depth],
      y: top + 0.01 + (card.lift ?? 0),
      size: 0.11,
      colour: card.colour,
      stage: card.stage,
    })
  }

  // Morena's fan, face down on her side of the table — until something has read
  // it, and then it is simply lying there face up, which is what reading a hand
  // looks like from the chair opposite.
  game.questions.forEach((question, index) => {
    lay({
      id: `question-${question}`,
      index,
      count: game.questions.length,
      depth: -0.3,
      colour: game.read ? ASKED_COLOUR : QUESTION_COLOUR,
      stage: game.read ? 1 : 0,
    })
  })
  // The questions already spent, face up in the middle where both can read them.
  game.asked.forEach((question, index) => {
    lay({
      id: `asked-${question}`,
      index,
      count: game.asked.length,
      depth: -0.06,
      colour: ASKED_COLOUR,
      stage: 1,
    })
  })
  // The guest's hand, face up: they are their own cards and always have been.
  // The nick in the marked one is not drawn until the hand is over — the whole
  // point of a marked card is that the person holding it cannot see the mark.
  game.hand.forEach((card, index) => {
    // A forged card is nicked as soon as it is exposed, and Morena's marked one
    // only when the hand is over. Both are the same nick, because from across
    // the table they are the same thing: a card somebody had already read.
    const nicked =
      (game.phase === 'over' && game.marked === card) || (game.manipulated && game.forged === card)
    lay({
      id: `hand-${card}`,
      index,
      count: game.hand.length,
      depth: 0.3,
      colour: CARD_COLOURS[card],
      stage: nicked ? 3 : 1,
      lift: game.phase === 'settling' || game.phase === 'over' ? 0.02 : 0,
    })
  })
  // And what Morena has taken, stacked off to the guest's left.
  game.graveyard.forEach((card, index) => {
    seen.push({
      ...common,
      id: `buried-${card}`,
      kind: 'game-card',
      at: [TABLE_AT[0] - 0.62, TABLE_AT[1] + 0.14],
      y: top + 0.01 + index * 0.012,
      size: 0.11,
      colour: BURIED_COLOUR,
      stage: 2,
    })
  })

  // What a technique has put in the room, drawn in the kinds the walk already
  // has rather than in new ones: the walk is where these were first published,
  // and a mark should look the same wherever it is worn.

  // The moon, over the woman who is about to collect her second condition. It
  // goes up when the rider is taken and it is *paid* at the kiss — so it hangs
  // there through the rest of the hand as a thing she has not noticed yet.
  if (game.riders.includes('moon')) {
    seen.push({
      ...common,
      id: 'morena-moon',
      kind: 'moon-mark',
      at: DEALER_AT,
      y: floor + 1.75,
      size: 0.24,
      colour: MOON_MARK,
      stage: game.kissed ? 1 : 0,
    })
  }

  // And the vow, over the guest: the one thing at this table that cannot be
  // narrowed, and the only one drawn on the person rather than on the cards.
  if (game.shielded) {
    seen.push({
      ...common,
      id: 'guest-vow',
      kind: 'mark',
      at: [GUEST_AT[0], GUEST_AT[1] - 0.35],
      y: floor + 1.55,
      size: 0.16,
      colour: VOW_MARK,
      stage: 0,
    })
  }

  return seen
}
