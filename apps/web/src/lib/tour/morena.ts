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
import {
  QUESTION_CARDS,
  TABLE_KINDS,
  needsAChoice,
  spentOn,
  worksAtTheTable,
} from '@black-whale/ability-modules'
import type { MorenaGame, AnswerCard, QuestionCard, TableKind } from '@black-whale/ability-modules'
import { INSECT, OWL } from './apparitions'
import type { Apparition } from './apparitions'
import { DOUBLE_FACE_PAGES } from './hatsu'
import { AIM_AT, withinReach } from './morenaHands'
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
  livePages,
  moveFor,
  narrowTheAnswer,
  needsAChoice,
  playTechnique,
  refuseTheDeal,
  settle,
  spentOn,
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
  TablePage,
  TableSeat,
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
/**
 * Every face the table can show: her seven questions, and your five answers.
 *
 * The panel draws cards and the scene lays them on the wood, and both need to
 * name a face without either owning the list — so it is named here, where the
 * colours already are.
 */
export type CardFace = AnswerCard | QuestionCard

/**
 * A table colour as CSS rather than as a number.
 *
 * The scene wants `0xe5484d` because that is what a material takes; a border
 * wants `#e5484d`. One conversion, so the two can never be separately edited
 * into disagreeing about what colour a Yes is.
 */
export const cssInk = (colour: number): string => `#${colour.toString(16).padStart(6, '0')}`

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
 * Cross Game's three, in the order it plays them.
 *
 * The walk already fans and already colours this card — `apparitions.ts` has
 * held the same three since Mizaistom was first drawn into a room — so the
 * table borrows the fan rather than inventing a second one. A red card is a red
 * card wherever it is shown.
 */
export const TRIBUNAL_CARDS = [0x4d8ff0, 0xf0c94d, 0xe5484d]
/**
 * Texture Surprise's pink, the one the registry publishes Hisoka's layer in.
 *
 * What the technique makes is a surface and nothing else — the card underneath
 * is whatever it was — so the forged card wears the aura that made it rather
 * than a mark cut into it. It is drawn for the person who forged it, which is
 * the truth of the technique too: the layer is yours, and the only thing that
 * takes it off you is a touch.
 */
export const FORGED_AURA = 0xd98fc4

// ── Double Face, opened at the table ───────────────────────────────
/**
 * The pages in Chrollo's book that have anything to say to twelve cards.
 *
 * Filtered rather than listed: the walk already publishes what he is carrying
 * when the visitor picks the bookmark up, and a second roster written out here
 * would be a second thing to keep true. What the table adds is the filter —
 * a stolen ability that does nothing at a card table is not worth a page here,
 * and `worksAtTheTable` is the same question every other seat is asked.
 */
export const TABLE_PAGES: readonly TableKind[] = DOUBLE_FACE_PAGES.filter(worksAtTheTable)

/**
 * The registry's own name for the ribbon.
 *
 * Double Face is filed under the thing it does rather than under the book it
 * does it in, and this is that filing. Named here so the one place the table
 * treats a technique as something other than a seat says which one out loud.
 */
export const BOOKMARK_KIND = 'bookmark'

/**
 * Whether an aura may sit down at all.
 *
 * `worksAtTheTable` answers for the thirty-odd seats, and it answers no to the
 * bookmark — correctly, because the bookmark is not a move. It is still a thing
 * that belongs at this table: what it brings is two of the seats that do. So
 * the door asks this rather than that, and the difference between the two
 * questions is exactly one technique.
 */
export function sitsAtTheTable(kind: string | null | undefined): boolean {
  return worksAtTheTable(kind) || kind === BOOKMARK_KIND
}

/**
 * Two of them, drawn when the cards are.
 *
 * Which two he has to hand at any given moment is exactly the sort of thing no
 * record of the Black Whale settles — the book held over a hundred — so it is a
 * roll, the same roll the walk makes, and it is made again every deal. Never
 * the same page twice: a ribbon marking the page the book is already open at is
 * not a second technique, it is a bookmark doing nothing.
 */
export function openTheBookHere(random: () => number = Math.random): [TableKind, TableKind] {
  const open = TABLE_PAGES[Math.floor(random() * TABLE_PAGES.length)]
  const rest = TABLE_PAGES.filter((page) => page !== open)
  return [open, rest[Math.floor(random() * rest.length)]]
}

// ── Little Eye, over the table ─────────────────────────────────────
/**
 * How high the insect holds while it has nothing to film, in metres above the
 * deck. The office's deckhead is four metres up, so this is the top of the
 * room without being inside it: a thing in the ceiling corner, which is where
 * a fly nobody is looking for stays.
 */
export const EYE_PERCH = 3.4
/** How much of the room it works from up there, and how tight it holds once
 *  it is filming: the sphere is piloted, and a camera does not wander. */
export const EYE_RANGE = 1.6
export const EYE_HOLD = 0.09
/** How far over her fan it films from: close enough to read a card, and just
 *  clear of the wood once the drift's own bob is taken off it. */
export const EYE_FILMING = 0.3

/**
 * Where the eye is, and what it is pointed at.
 *
 * The walk has had this since Sayird's sphere was first sent into a room: a
 * second camera, inset in the corner, showing the room the insect is in rather
 * than the one the visitor is standing in. The table had the insect and not the
 * inset, which is the whole of the technique missing — Little Eye is not a fly,
 * it is a *feed*, and an insect that comes down onto her fan while the picture
 * stays on the guest's side of the table is a camera nobody is watching.
 *
 * Two positions, and they are the two the insect itself has: up in the ceiling
 * corner working the office over, and down over her fan reading it. The second
 * is the one that matters, and it is aimed a hair past the cards rather than
 * straight down at them — a camera pointing at the floor has no up, and the
 * cards would come out of it lying on their side.
 */
export interface EyeFeed {
  /** Where the camera is, in the coordinates of the deck. */
  at: Vec2
  /** And how high, in metres above the keel, like every other Y in the walk. */
  y: number
  /** What it is looking at, and how high that is. */
  look: Vec2
  lookY: number
}

/**
 * How wide the picture is, in degrees.
 *
 * A fly's eye, and the number is doing work rather than decorating: the fan is
 * three quarters of a metre across and the camera is a hand's width above it,
 * so anything narrower films two of her seven cards.
 */
export const EYE_FOV = 96

export function eyeFeed(game: MorenaGame, floor: number): EyeFeed | null {
  const flown = spentOn(game, 'scout')
  if (flown === null) return null
  const top = floor + TABLE_HEIGHT
  const fan: Vec2 = [TABLE_AT[0], TABLE_AT[1] - 0.3]
  // Perched: the whole office from the ceiling corner, which is a picture with
  // nothing in it yet — and that is the point. The read is the descent, and a
  // descent is only legible if there was somewhere to descend *from*.
  if (flown === 0) {
    return { at: TABLE_AT, y: floor + EYE_PERCH, look: DEALER_AT, lookY: floor + 1.1 }
  }
  // Filming: over the fan and a hand's width guest-side of it, looking down
  // across the cards rather than straight at the top of them. Two reasons, and
  // both are about the picture rather than about the fly: a lens pointing
  // exactly at the floor has no up, so the cards would come out of it at
  // whatever roll the maths happened to settle on — and a card seen edge-on
  // from directly above is a rectangle, where the same card seen across is a
  // card lying on a table with a woman behind it. The insect's own drift is
  // wider than the offset, so this is still where it is.
  return {
    at: [TABLE_AT[0], fan[1] + 0.09],
    y: top + EYE_FILMING,
    look: fan,
    lookY: top,
  }
}

// ── Secret Window, at the bulkhead ─────────────────────────────────
/**
 * Where the owl is stuck, and how high.
 *
 * Musse's bird is not sent anywhere and is not piloted: it is *attached*, and
 * then it stays attached and films. So it is on the bulkhead behind Morena,
 * over her shoulder and above her head — the one seat in this room from which
 * a fan held face down to the guest is face up. Off to her left rather than
 * straight behind, because straight behind is a picture of the back of her
 * head with seven cards somewhere underneath it.
 */
export const OWL_AT: Vec2 = [TABLE_AT[0] + 1.52, -0.15]
export const OWL_PERCH = 3.3
/**
 * How big, and how still.
 *
 * The walk draws this bird at half a metre because it is looked at down a
 * promenade; here it is two metres away, and a real owl on a beam is a
 * forearm. `spread` is zero and stays zero, which is the whole difference
 * between this technique and the one at the other end of the table: the
 * insect is flown, and the owl does not move at all.
 */
export const OWL_SIZE = 0.22
/**
 * The bird's own grey-blue, re-published so the panel can ink a card in it.
 *
 * Every other colour at this table is named here — the answers, her red, the
 * graveyard's grey — and the record the owl hands over is a row of cards like
 * any other row of cards. It is inked in the thing that filmed it.
 */
export const OWL_COLOUR = OWL

/**
 * How wide the bird's picture is, in degrees.
 *
 * Narrower than the fly's, and for the opposite reason: the insect is a hand's
 * width above the cards and needs the angle to hold all seven, while the owl is
 * two and a half metres off and would otherwise film the room with the fan in
 * the middle of it, too small to read.
 */
export const OWL_FOV = 46

/**
 * What the owl is filming, or nothing where no owl was brought in.
 *
 * The same shape the eye's feed has, and pointed at the same seven cards — but
 * it is not the same picture, and the corner it is shown in says so. Little Eye
 * is a live feed: the insect is over the fan *now*, and when it leaves there is
 * nothing. Secret Window is a recording. The bird was on that bulkhead from the
 * moment the guest sat down, filming a table nobody had asked it about, and
 * what the technique buys is not the watching — it is the going back over what
 * was already watched.
 *
 * Which is why this answers nothing until the cast: an owl that hands you its
 * picture the moment you sit down has not been reviewed, it has been *watched*,
 * and the two are different techniques. And why it never stops answering
 * afterwards, not even when the hand is over: footage is a thing you keep.
 */
export function owlFilm(game: MorenaGame, floor: number): EyeFeed | null {
  const reviewed = spentOn(game, 'surveillance')
  if (!reviewed) return null
  const top = floor + TABLE_HEIGHT
  return {
    at: OWL_AT,
    y: floor + OWL_PERCH,
    look: [TABLE_AT[0], TABLE_AT[1] - 0.3],
    lookY: top,
  }
}

/**
 * Her fan, as the owl saw it — which is not her fan as it is now.
 *
 * The registry's own line for this ability is that it "retains earlier footage
 * for later review", and that is the one thing a live feed cannot do: a picture
 * of the table is out of date the moment she spends a card, and a recording is
 * not. So the record is taken at the cast and then it stops moving. Questions
 * asked since are still in it, because they were still in her hand when the
 * bird filmed them.
 *
 * Read off the transcript rather than stored, so nothing here is a rule: the
 * log already says when the technique was played and which questions went
 * afterwards, and the fan at that moment is what is left plus what has gone
 * since. Ordered as the deck is ordered, so a record and a fan lay out the
 * same way whichever order the hand happened to be spent in.
 */
export function owlSaw(game: MorenaGame): QuestionCard[] | null {
  const reviewed = spentOn(game, 'surveillance')
  if (!reviewed) return null
  const cast = game.log.findIndex((beat) => beat.kind === 'played')
  const since = game.log
    .slice(cast + 1)
    .flatMap((beat) => (beat.kind === 'asked' ? [beat.question] : []))
  const filmed = new Set<QuestionCard>([...game.questions, ...since])
  return QUESTION_CARDS.filter((question) => filmed.has(question))
}

/**
 * What the woman opposite is doing, as the one number the scene is given.
 *
 * `stage` is the only channel this file has to a mesh, so the whole of her
 * reaction to a hand goes through this vocabulary — and two of the five are
 * *removals*. She already breathes and already turns to whoever sat down, so
 * the way to show that something has changed in her is to take one of those
 * away: caught, she goes still; blinded, she stops finding you. Adding a
 * gesture to a body that is already moving reads as noise. Taking one away
 * reads as news.
 *
 * - `0` — dealing.
 * - `1` — leaning in with the kiss.
 * - `2` — sat back, the hand played out.
 * - `3` — the room has just told her something. She stops breathing.
 * - `4` — sight, hearing and voice taken. She stops turning to you.
 */
export function dealerStage(game: MorenaGame): number {
  // Three Monkeys outlasts the hand it ended: the game is over the moment it is
  // cast, and she is still sitting there, unable to find the person opposite.
  if (spentOn(game, 'senses')) return 4
  // Nothing else in the walk announces the detection roll. The transcript says
  // it in words, and this says it in a body — which is the half a reader who is
  // looking at the table rather than at the panel actually gets.
  const last = game.log[game.log.length - 1]
  if (last && ((last.kind === 'played' && last.seen) || last.kind === 'exposed')) return 3
  if (game.phase === 'deal') return 1
  if (game.phase === 'over') return 2
  return 0
}

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
  /**
   * What the visitor may take hold of this phase.
   *
   * Read here rather than decided here: `morenaHands` says which `id`s are
   * moves, and the layout's whole part in it is marking the cards it was
   * already drawing. A card that can be played and a card that is on the table
   * are the same card, and that is the point of asking one file both.
   */
  const hands = withinReach(game)

  // Morena herself, seated behind her fan.
  seen.push({
    ...common,
    id: 'morena-dealer',
    kind: 'dealer',
    at: DEALER_AT,
    y: floor + 0.72,
    size: 0.42,
    colour: DEALER_COLOUR,
    stage: dealerStage(game),
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
    /** What is printed on it, for a card that is lying face up. */
    face?: CardFace
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
      face: card.face,
      pick: hands.has(card.id),
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
      // Face up means a face: a card that has been read and still shows nothing
      // is a card the reader has been told about rather than shown. This is
      // what the technique bought, and it is on the table where it was bought.
      face: game.read ? question : undefined,
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
      face: question,
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
    // And the card foresight has picked out, standing off the wood.
    //
    // Three techniques buy the same sentence — the Dowsing Chain, Parallel
    // Future and a phone call — and none of them had anything to look at: the
    // read-out said which card she would take and the table said nothing at
    // all. A card lifted a finger's width is the smallest thing that can be
    // seen from a seated eye, and it costs the rule nothing: it is still a card
    // that is not moving. It is where it was *put*, and something put it there.
    const foreseen = !nicked && game.foreseen === card
    // And the card that is not a card: Texture Surprise adds a face to the
    // hand, and the aura that is holding that face together is the whole of
    // what it is. It is drawn until the kiss finds it, and then it is nicked
    // like any other card somebody has already read.
    const forged = !nicked && game.forged === card
    lay({
      id: `hand-${card}`,
      index,
      count: game.hand.length,
      depth: 0.3,
      colour: CARD_COLOURS[card],
      face: card,
      stage: nicked ? 3 : forged ? 5 : foreseen ? 4 : 1,
      lift: foreseen ? 0.045 : game.phase === 'settling' || game.phase === 'over' ? 0.02 : 0,
    })
  })
  // And what Morena has taken, stacked off to the guest's left.
  //
  // Until it is something to choose from. The kiss buys a card back out of that
  // stack and a Back reaches into it, and neither is a choice you can make of a
  // pile: a hand that has to be picked from is a hand that gets spread, which is
  // what anybody holding cards does the moment somebody else has to point at
  // one. Spread, they are face up as well — the panel has always listed what she
  // took, and a card you are being asked to buy that you cannot read is a
  // shell game rather than a negotiation.
  const offered = game.graveyard.some((card) => hands.has(`buried-${card}`))
  game.graveyard.forEach((card, index) => {
    const along = (index - (game.graveyard.length - 1) / 2) * 0.15
    seen.push({
      ...common,
      id: `buried-${card}`,
      kind: 'game-card',
      at: offered
        ? [TABLE_AT[0] - 0.62, TABLE_AT[1] + 0.14 + along]
        : [TABLE_AT[0] - 0.62, TABLE_AT[1] + 0.14],
      y: top + 0.01 + (offered ? 0.02 : index * 0.012),
      size: 0.11,
      colour: offered ? CARD_COLOURS[card] : BURIED_COLOUR,
      stage: offered ? 1 : 2,
      face: offered ? card : undefined,
      pick: hands.has(`buried-${card}`),
    })
  })

  // The two directions a Joker can be pointed.
  //
  // They are not cards and they are not in the deck — the Joker is the one
  // answer that means nothing until it is aimed, and aiming it is the only move
  // in this game with nothing on the table to make it with. So the table lays
  // the two words down beside your hand, faintly, for exactly as long as the
  // choice is live: point at one and the Joker goes down as that.
  if (game.phase === 'settling' && needsAChoice(game) === 'joker') {
    ;(['yes', 'no'] as const).forEach((side, index) => {
      seen.push({
        ...common,
        id: AIM_AT[side],
        kind: 'game-card',
        at: [TABLE_AT[0] + (index === 0 ? -0.34 : 0.34), TABLE_AT[1] + 0.3],
        y: top + 0.01,
        size: 0.11,
        colour: CARD_COLOURS[side],
        // Dimmed, which is what the walk already draws a card that is not quite
        // a card in: this is where a Yes would be, not a Yes.
        stage: 2,
        face: side,
        pick: hands.has(AIM_AT[side]),
      })
    })
  }

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

  // Cross Game's card, laid on the table rather than over a room: blue while
  // she is merely seated, yellow once two questions have made an expulsion
  // possible, red when it has been used. The escalation is the capability —
  // Mizaistom expels nobody he has not already cautioned — so the fan is shown
  // from the moment somebody sits down carrying it, and turning a card is the
  // warning being given rather than a state being reported.
  if (spentOn(game, 'tribunal') !== null) {
    const stage = game.aftermath.includes('evicted') ? 3 : game.asked.length >= 2 ? 2 : 1
    seen.push({
      ...common,
      id: 'tribunal-card',
      kind: 'card',
      at: [TABLE_AT[0] + 0.62, TABLE_AT[1]],
      y: top + 0.2,
      size: 0.16,
      colour: TRIBUNAL_CARDS[stage - 1],
      stage,
    })
  }

  // Little Eye's insect, which is at this table before it is used and is the
  // only technique here that is *somewhere* rather than merely held.
  //
  // Sayird's sphere is a camera on a fly: nobody casts it at a person, they
  // send it into a room and then tell it what to look at. So it is in the room
  // from the moment somebody sits down carrying it — up in the ceiling corner,
  // working the office over, which is a thing a reader can see and not yet
  // read anything into — and the cast is it coming down onto her fan and
  // holding there. That descent is the read: what the panel says in a line of
  // text, the room says by putting the camera on the cards.
  const flown = spentOn(game, 'scout')
  if (flown !== null) {
    const filming = flown > 0
    seen.push({
      ...common,
      id: 'scout-insect',
      kind: 'insect',
      at: filming ? [TABLE_AT[0], TABLE_AT[1] - EYE_FILMING] : TABLE_AT,
      y: filming ? top + 0.28 : floor + EYE_PERCH,
      // Small: this one is looked at from a metre and a half rather than
      // across a promenade, and a thumb-sized fly over a card table is a fly.
      size: 0.05,
      colour: INSECT,
      stage: 0,
      spread: filming ? EYE_HOLD : EYE_RANGE,
    })
  }

  // Secret Window's owl, on the bulkhead behind her, and the other half of the
  // argument the insect makes.
  //
  // Musse attaches a bird and leaves; it eavesdrops through barriers and keeps
  // what it saw. So this one is passive in the strict sense — it is in the room
  // from the moment somebody sits down carrying it, it does not move when the
  // technique is played, and it does not move when the hand ends. Nothing about
  // it changes at all, which is exactly what a camera bolted to a wall does.
  //
  // What the cast changes is on the screen rather than in the room: the
  // recording it has been making all along is put up in the corner. A bird that
  // swooped would be a fly with feathers.
  if (spentOn(game, 'surveillance') !== null) {
    seen.push({
      ...common,
      id: 'window-owl',
      kind: 'owl',
      at: OWL_AT,
      y: floor + OWL_PERCH,
      size: OWL_SIZE,
      colour: OWL,
      stage: 0,
      spread: 0,
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
