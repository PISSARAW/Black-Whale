/**
 * Morena's negotiation game, as rules rather than as a table.
 *
 * Ch. 407-410 sits Borksen down opposite Morena Prudo in the Heil-Ly hideout
 * and plays twelve cards between them: seven questions in Morena's hand, five
 * answers in her guest's. The recruit spends a question a round to learn what
 * they are agreeing to, and Morena takes an answer a round at random until one
 * is left. That last card is the answer, whatever it turns out to be — which is
 * the whole cruelty of it: you buy knowledge with the only thing that can still
 * say no.
 *
 * This is the reducer `docs/jeu-de-morena.md` §4.1 asks for: a pure, total
 * function on a small state, with chance injected as `random` so a test can
 * settle a deal it did not shuffle. It has **no engine dependency at all** —
 * not the SDK, not the world engine, not three.js — because it is consumed
 * from both ends: `module.ts` turns each move into world events, and the walk
 * at `/tour/morena` plays it move by move in front of the visitor.
 *
 * What it does not do is decide what anything is called. A card is an id; what
 * Morena *says* when she answers a question belongs to whoever is rendering.
 */

import { type AnswerCard, type QuestionCard, ANSWER_CARDS, QUESTION_CARDS, WIDER_VOCABULARY } from './deck.js';
import { type GamePhase } from './phases.js';
import { type Verdict, type Rider, type Aftermath } from './verdict.js';
import { type TableMove, type TableKind, type TablePage, exposureNow, moveFor, livePages, spentOn } from './table.js';

export * from './deck.js';
export * from './phases.js';
export * from './verdict.js';
export * from './table.js';

/** One line of what happened, in the order it happened. */
export type Beat =
  | { kind: 'asked'; round: number; question: QuestionCard }
  | { kind: 'taken'; round: number; card: AnswerCard }
  | { kind: 'offered'; round: number }
  | { kind: 'kissed'; round: number; card: AnswerCard }
  | { kind: 'declined'; round: number }
  | { kind: 'recovered'; round: number; card: AnswerCard }
  | { kind: 'marked'; round: number; card: AnswerCard }
  | { kind: 'settled'; round: number; card: AnswerCard; verdict: Verdict }
  /** A technique played at the table, and whether the room saw it. */
  | { kind: 'played'; round: number; technique: TableKind; seen: boolean }
  /** The sanction the canon names: the vocabulary narrowed to Yes and No. */
  | { kind: 'narrowed'; round: number; because: 'cheating' | 'leaving' }
  /** A forged card given away by the one thing in the game that is a touch. */
  | { kind: 'exposed'; round: number; card: AnswerCard }
  /** What a rider did when the last card came down. */
  | { kind: 'aftermath'; round: number; what: Aftermath }
  /** Ten seconds taken back, and how many of her draws are owed again. */
  | { kind: 'rewound'; round: number; cards: number }

export interface MorenaGame {
  phase: GamePhase
  /** One-based, and it counts questions spent rather than cards on the table. */
  round: number
  /** Still in Morena's fan, face down to the guest. */
  questions: QuestionCard[]
  /** Spent, in the order they were asked. */
  asked: QuestionCard[]
  /** The guest's hand. */
  hand: AnswerCard[]
  /** What Morena has taken out of it. */
  graveyard: AnswerCard[]
  /**
   * The card Morena marked before dealing.
   *
   * She cheats, and the game is her own restriction — so the marking is not a
   * way to win the hand, it is a trap laid on one card. Reaching for it is what
   * lets the manipulative component in. `null` for a clean deal, which is a
   * game she never actually plays and a mode worth having anyway.
   */
  marked: AnswerCard | null
  /** Whether the kiss has been traded for a card out of the graveyard. */
  kissed: boolean
  /** Whether the offer has already been made, so it is made only once. */
  dealt: boolean
  verdict: Verdict | null
  /** The card the game came down to, once it is over. */
  finalCard: AnswerCard | null

  // ── What a Hatsu has done to this table ────────────────────────

  /** The technique the visitor sat down with, or `null` for an honest hand. */
  technique: TableKind | null
  /** How many times each move has been spent, so a one-shot stays one. */
  spent: number
  /**
   * The other page, when the visitor sat down with Double Face.
   *
   * Chrollo's bookmark is the one thing in the roster that is not a technique
   * at all: it holds a *second* stolen ability live beside the open one, and
   * both can be played. So a guest carrying it does not sit down with a
   * technique, they sit down with two — and the second needs its own counter,
   * because a one-shot on the open page has nothing to do with a one-shot
   * under the ribbon.
   *
   * Kept as a second slot rather than as a list of techniques because that is
   * what the ability is: a book open at one page with a ribbon in another. Two
   * is the number, and nothing at this table can make it three.
   */
  bookmark: { kind: TableKind; spent: number } | null
  /**
   * How watchful the room is, from 0 to 1.
   *
   * One at the hideout, and the hideout is where the game is played: LSDF is
   * canon, it exists only while Morena is here, and it grades its guards on how
   * serious the offence is. That is the detector, and it is why sitting down
   * with a technique in hand is a gamble rather than a win.
   */
  watch: number
  /**
   * Whether the Manipulation has landed.
   *
   * Canon, and the one sanction the game has: cheating **or walking out**
   * narrows the answer to Yes or No. In twelve cards that is not an abstract
   * state — it is Back, Joker and X taken off the table, which is exactly what
   * "limited to Yes or No" means when the answers are objects.
   */
  manipulated: boolean
  /** Whether it cannot land: a vow is the one true immunity to it. */
  shielded: boolean
  /** Her fan, face up. */
  read: boolean
  /** Which answer she takes next, when something has told you. */
  foreseen: AnswerCard | null
  /** A card in the hand that is not yours, and what touching it would reveal. */
  forged: AnswerCard | null
  /** Whether somebody else is in the chair. */
  proxied: boolean
  /** Hung on the outcome, and paid out when the last card comes down. */
  riders: Rider[]
  /** What those riders actually did. Empty until the game is over. */
  aftermath: Aftermath[]
  /** How it closed, when it closed on something other than a card. */
  ending: 'played' | 'abandoned' | null

  /**
   * The hand as it stood one exchange ago, and nothing further back.
   *
   * The only technique here that goes backwards needs somewhere to go back to,
   * and ten seconds at this table is one exchange: she answers, she reaches,
   * and it is gone. Held on the game itself rather than by whoever is holding
   * the game, because going back is a rule and not a piece of interface — the
   * dashboard replaying a branch has to reach the same state the walk does.
   *
   * Never nested: the snapshot carries `previous: null`, so this is one step of
   * undo and not a tape of the whole negotiation.
   */
  previous: MorenaGame | null
  /**
   * What Morena has to do again, in the order she did it.
   *
   * The canon rule of Parallel Future is that everyone *except* its user goes
   * on living the prediction: the ten seconds she has already spent are the
   * ten seconds she is going to spend, whatever the guest does differently.
   * So these are the cards she took in the erased stretch, and she takes them
   * again — the shuffle is not consulted until the list is empty, which is
   * also when the room stops being out of step with itself.
   */
  forced: AnswerCard[]

  log: Beat[]
}


export interface DealOptions {
  /** Which card Morena marks. Defaults to the one she marks in ch. 410. */
  marked?: AnswerCard | null
  /** The shuffle, injected so a test can play a hand it chose. */
  random?: () => number
  /** The technique the visitor is carrying as they sit down. */
  technique?: TableKind | null
  /** And the page under the ribbon, when what they carry is Double Face. */
  bookmark?: TableKind | null
  /** How watchful the room is. One at the hideout, which is where this is. */
  watch?: number
}

/**
 * A fresh game: seven questions, five answers, and a marked card.
 *
 * Nothing is shuffled — both hands are open information and the whole point of
 * the game is that neither side is guessing what the other holds. Chance enters
 * once a round, when Morena reaches into the guest's hand.
 */
export function dealTheGame(options: DealOptions = {}): MorenaGame {
  const marked = options.marked === undefined ? 'back' : options.marked
  return {
    phase: 'asking',
    round: 1,
    questions: [...QUESTION_CARDS],
    asked: [],
    hand: [...ANSWER_CARDS],
    graveyard: [],
    marked,
    kissed: false,
    dealt: false,
    verdict: null,
    finalCard: null,
    technique: options.technique ?? null,
    spent: 0,
    bookmark: options.bookmark ? { kind: options.bookmark, spent: 0 } : null,
    watch: options.watch ?? 1,
    manipulated: false,
    shielded: false,
    read: false,
    foreseen: null,
    forged: null,
    proxied: false,
    riders: [],
    aftermath: [],
    ending: null,
    previous: null,
    forced: [],
    log: marked ? [{ kind: 'marked', round: 0, card: marked }] : [],
  }
}

/** A game that cannot move: every step below returns this rather than throwing. */
const unchanged = (game: MorenaGame): MorenaGame => game


/**
 * The Manipulation: the answer narrowed to Yes or No.
 *
 * This is the one sanction the canon gives the game, and it is worded as a
 * restriction on *vocabulary* rather than as an ejection — "limiting the answer
 * to Yes or No". In a game whose answers are objects, that has a literal
 * reading and it is the right one: Back, Joker and X leave the table. What is
 * left is what she was always going to accept.
 *
 * A guest narrowed down to nothing is handed Yes and No back out of the
 * graveyard, because the sanction is a narrowing and not a silencing: the canon
 * says the answer *is limited to* those two, which presumes there is an answer.
 *
 * It fires for cheating and for walking out, and the two are the same offence.
 */
export function narrowTheAnswer(game: MorenaGame, because: 'cheating' | 'leaving'): MorenaGame {
  if (game.manipulated || game.shielded || game.phase === 'over') return unchanged(game)

  let hand = game.hand.filter((card) => !WIDER_VOCABULARY.includes(card))
  const graveyard = game.graveyard.filter((card) => !WIDER_VOCABULARY.includes(card))
  if (hand.length === 0) {
    hand = graveyard.length ? [...graveyard] : ['yes', 'no']
  }

  const kept = new Set(hand)
  return {
    ...game,
    manipulated: true,
    hand,
    graveyard: graveyard.filter((card) => !kept.has(card)),
    // The forged card was one of those three as often as not, and a card that
    // has left the table cannot be exposed by a kiss.
    forged: game.forged && !hand.includes(game.forged) ? null : game.forged,
    foreseen: null,
    phase: hand.length <= 1 ? 'settling' : game.phase === 'deal' ? 'asking' : game.phase,
    log: [...game.log, { kind: 'narrowed', round: game.round, because }],
  }
}

/**
 * Walk out.
 *
 * Canon puts abandoning and cheating under the same sanction, so leaving is not
 * an exit — it is the Manipulation, and then a table you are still sitting at
 * with two cards in your hand. The only way out of the game is through it.
 */
export function leaveTheTable(game: MorenaGame): MorenaGame {
  if (game.phase === 'over') return unchanged(game)
  if (game.shielded) {
    // A vow is a vow. Nothing narrows, and the game simply ends unfinished —
    // which is the one door the canon leaves open, since Morena needs the Yes
    // and cannot take it off a corpse.
    return { ...game, phase: 'over', verdict: 'cancelled', ending: 'abandoned' }
  }
  return { ...narrowTheAnswer(game, 'leaving'), ending: 'abandoned' }
}

/**
 * What a death in the chair is worth, whoever caused it.
 *
 * The one thing at this table that pays out without a card being played: the
 * cat, which needed its owner dead and nothing else, and the double, which is
 * only ever there because somebody already died once. Shared, because a guest
 * who burns their year and a guest who swears on their heart and loses are the
 * same body in the same chair.
 */
function payForTheBody(game: MorenaGame): Aftermath[] {
  const paid: Aftermath[] = []
  if (spentOn(game, 'resurrection') !== null) paid.push('avenged')
  if (spentOn(game, 'guardian') !== null) paid.push('stood-in')
  return paid
}

/**
 * She stands up, because the candidate is spending their life in front of her.
 *
 * Not a move and not a sanction: Morena is a recruiter, and what she is
 * watching is the thing she wants to recruit being used up. The hand ends
 * where it is, nobody says Yes, and nothing is narrowed — she needs the word
 * and she has decided it will not be worth having.
 */
export function sheWillNotPlay(game: MorenaGame): MorenaGame {
  if (game.phase === 'over') return unchanged(game)
  const aftermath: Aftermath[] = ['unaffordable']
  return {
    ...game,
    phase: 'over',
    verdict: 'cancelled',
    ending: 'abandoned',
    aftermath: [...game.aftermath, ...aftermath],
    log: [
      ...game.log,
      ...aftermath.map((what): Beat => ({ kind: 'aftermath', round: game.round, what })),
    ],
  }
}

/**
 * And the other end of the same clock: the year ran out with the hand live.
 *
 * Emperor Time's own price, collected. The game does not finish — there is
 * nobody left to finish it — and whatever the guest brought that answers a
 * death answers this one.
 */
export function theEyesTakeYou(game: MorenaGame): MorenaGame {
  if (game.phase === 'over') return unchanged(game)
  const aftermath: Aftermath[] = ['burnt-out', ...payForTheBody(game)]
  return {
    ...game,
    phase: 'over',
    verdict: 'cancelled',
    ending: 'abandoned',
    aftermath: [...game.aftermath, ...aftermath],
    log: [
      ...game.log,
      ...aftermath.map((what): Beat => ({ kind: 'aftermath', round: game.round, what })),
    ],
  }
}

/**
 * What one of the eight verbs does to the hand.
 *
 * The two that *end* the game are not here — see `playTechnique` — because a
 * verb that returns a finished game and a verb that returns a changed one are
 * two different things, and running them through one switch was how this got
 * hard to read in the first place.
 */
function applyToTheHand(
  move: TableMove,
  game: MorenaGame,
  /** Whether the room saw it, and the shuffle two of the verbs draw on. */
  table: { seen: boolean; random: () => number },
): MorenaGame {
  const { seen, random } = table
  let next = game

  switch (move.effect) {
    case 'read':
      next = { ...next, read: true }
      break

    // Which card she reaches for next. Read off the same shuffle she will use,
    // so what you are told is what happens — this is foresight, not a hint.
    case 'foresee': {
      const reach = Math.min(
        next.hand.length - 1,
        Math.max(0, Math.floor(random() * next.hand.length)),
      )
      next = { ...next, foreseen: next.hand[reach] ?? null }
      break
    }

    // The only legal pause in the game: a round that costs no answer. It does
    // not count as walking out, which is the whole of what makes it worth
    // having — three minutes of held attention is three minutes nobody left.
    case 'pass':
      next = {
        ...next,
        round: next.round + 1,
        phase: next.hand.length <= 1 ? 'settling' : 'asking',
      }
      break

    // A card out of the graveyard without the kiss. The kiss is Morena's price
    // for exactly this, so anything that does it for free is taking money out
    // of her hand — which is why most of these are frauds.
    case 'recover': {
      const back = next.graveyard[0]
      if (!back) break
      next = {
        ...next,
        hand: [...next.hand, back],
        graveyard: next.graveyard.slice(1),
        phase: 'asking',
        log: [...next.log, { kind: 'recovered', round: next.round, card: back }],
      }
      break
    }

    // A card that is not yours. It plays like any other until somebody touches
    // it, and this game ends in a kiss — see `takeTheDeal`.
    case 'forge': {
      const wanted: AnswerCard = next.hand.includes('yes') ? 'no' : 'yes'
      next = {
        ...next,
        forged: wanted,
        hand: [...next.hand, wanted],
        phase: 'asking',
      }
      break
    }

    case 'shield':
      next = { ...next, shielded: true }
      break

    // The room stops watching. Everything played after this is played in a
    // place that cannot report it.
    case 'hide':
      next = { ...next, watch: 0 }
      break

    // Somebody else in the chair. They have no desire for Morena to name and
    // nothing of their own to stake, so the game cannot be won through them —
    // it can only be survived. See `settle`.
    //
    // A proxy that is seen is not a proxy. Whatever was wearing the face falls
    // away and the person who sent it is the person sitting there, which is why
    // the four cheapest ones are priced at zero exposure and the four that can
    // be caught are worth catching.
    case 'proxy':
      next = { ...next, proxied: !seen }
      break

    // The two that end the game rather than change it, the clause that holds
    // `rider`, and the one that puts the table back where it was — all handled
    // by the caller.
    case 'blind':
    case 'evict':
    case 'rider':
    case 'rewind':
      break
  }

  return next
}

/**
 * The last exchange, unwound — and made to happen again on her side only.
 *
 * Tserriednich's ten seconds are lived twice and the canon is exact about who
 * gets the second go: *everyone except him* goes on perceiving the prediction,
 * so the room plays out as it already played out while he alone is free to do
 * something else. At a table that is not a metaphor and it is not a hint — the
 * question you spent comes back to your hand, the card she took goes back into
 * yours, and she is going to take that same card again whichever question you
 * spend this time.
 *
 * What does *not* come back is anything the aura knows. Her fan stays face up
 * if something read it; the technique stays spent; the transcript keeps both
 * passes, because a record with the ten seconds quietly cut out of it would be
 * the page pretending the vision never happened. Only the table goes back.
 *
 * Which is why this reads the way it does — the current game with the table
 * fields overwritten out of the snapshot, rather than the snapshot with the
 * aura's fields patched back in. Anything added to this state later will
 * default to surviving the rewind, which is the honest default: knowledge does.
 */
function unspool(played: MorenaGame): MorenaGame {
  const back = played.previous!
  // What she did in the erased stretch, off the transcript rather than off the
  // graveyard: a card can leave the graveyard again, and a kiss in those ten
  // seconds would otherwise take her draw out of the record of it.
  const forced = played.log
    .slice(back.log.length)
    .flatMap((beat) => (beat.kind === 'taken' ? [beat.card] : []))
  return {
    ...played,
    phase: back.phase,
    round: back.round,
    questions: [...back.questions],
    asked: [...back.asked],
    hand: [...back.hand],
    graveyard: [...back.graveyard],
    kissed: back.kissed,
    dealt: back.dealt,
    foreseen: back.foreseen,
    forged: back.forged,
    verdict: back.verdict,
    finalCard: back.finalCard,
    ending: back.ending,
    // One step of undo, and it has been taken: there is no going back twice.
    previous: null,
    forced,
    log: [...played.log, { kind: 'rewound', round: back.round, cards: forced.length }],
  }
}

/**
 * Play the technique in hand across the table.
 *
 * One call does the whole of it: what the move buys, and whether the room saw
 * it. The room is the Heil-Ly hideout and LSDF is standing in it, so seeing is
 * the default and not the exception — a capability used here is a bet that the
 * thing it buys is worth more than the three cards it may cost.
 *
 * A move that is not a fraud is played in the open and costs nothing when it is
 * seen. That is not generosity: a contract signed at the table, a coin minted a
 * year ago, a vow taken out loud are all things the game has no rule against.
 */
export function playTechnique(
  game: MorenaGame,
  options: { random?: () => number; page?: TablePage } = {},
): MorenaGame {
  if (game.phase === 'over') return unchanged(game)
  const second = options.page === 'second'
  const kind = second ? (game.bookmark?.kind ?? null) : game.technique
  if (!kind) return unchanged(game)
  const move = moveFor(kind)
  const already = second ? game.bookmark!.spent : game.spent
  if (already >= move.uses) return unchanged(game)

  // The legal eviction is a red card, and a red card comes after a warning:
  // Mizaistom does not expel anybody he has not already cautioned. Two
  // questions asked is that caution, and playing it earlier is not a move.
  if (move.effect === 'evict' && !move.fraud && game.asked.length < 2) return unchanged(game)

  // And there is nothing to take back before anything has happened: ten seconds
  // of a hand nobody has played yet are ten seconds of two people sitting down.
  if (move.effect === 'rewind' && !game.previous) return unchanged(game)

  const random = options.random ?? Math.random
  const seen = move.fraud && random() < exposureNow(move, game)

  // The count goes on the page that was played, and on that one only: two live
  // pages are two separate one-shots, and a book that spent them out of one
  // purse would make the ribbon a way of halving what Chrollo stole.
  const played: MorenaGame = {
    ...game,
    ...(second ? { bookmark: { kind, spent: already + 1 } } : { spent: already + 1 }),
    log: [...game.log, { kind: 'played', round: game.round, technique: kind, seen }],
  }

  // She cannot see, hear or speak, so she cannot ask the last question. A game
  // she cannot play is a game abandoned, and abandonment is punished on both
  // sides: this buys a draw and pays the full price for it.
  if (move.effect === 'blind') {
    return {
      ...leaveTheTable(played),
      phase: 'over',
      verdict: 'cancelled',
      ending: 'abandoned',
      aftermath: ['proxied'],
    }
  }

  // The ten seconds, taken back.
  if (move.effect === 'rewind') return unspool(played)

  // And her chair, emptied. Nobody says Yes, so nobody is infected — the only
  // clean way out of this game the canon leaves standing, and it closes the
  // hand rather than changing it. Seen doing it, you are simply the cheat.
  if (move.effect === 'evict' && !seen) {
    return {
      ...played,
      phase: 'over',
      verdict: 'cancelled',
      ending: 'abandoned',
      aftermath: ['evicted'],
    }
  }

  let next = applyToTheHand(move, played, { seen, random })

  if (move.rider && !next.riders.includes(move.rider)) {
    next = { ...next, riders: [...next.riders, move.rider] }
  }

  return seen ? narrowTheAnswer(next, 'cheating') : next
}

/**
 * Spend a question, and pay for it with an answer.
 *
 * The order matters and it is the order the manga plays: the guest asks first
 * and hears the reply, *then* Morena reaches. So a question is never asked into
 * a hand that has already been narrowed by the same round — you always know
 * more than you did, and you can always do less about it.
 */
export function askMorena(
  game: MorenaGame,
  question: QuestionCard,
  options: { random?: () => number } = {},
): MorenaGame {
  if (game.phase !== 'asking') return unchanged(game)
  if (!game.questions.includes(question)) return unchanged(game)
  // A hand of one is already settling; there is nothing left to pay with.
  if (game.hand.length <= 1) return unchanged(game)

  const random = options.random ?? Math.random
  const log: Beat[] = [...game.log, { kind: 'asked', round: game.round, question }]

  // She is not choosing at all while the ten seconds are being caught up: the
  // prediction is immutable for everybody but the person who saw it, so the
  // card she took the first time is the card she takes now — whatever question
  // it is being spent on this time round. Ahead of foresight, because a
  // technique that says what she will do next cannot outrank her doing it.
  const owed = game.forced.length ? game.forced[0] : null
  const repeats = owed && game.hand.includes(owed) ? owed : null
  // Foresight is foresight: a technique that told you which card she would take
  // is not a hint that turns out to be wrong. She takes the card you were
  // shown, and the shuffle is only consulted when nothing showed you anything.
  const foreseen = game.foreseen && game.hand.includes(game.foreseen) ? game.foreseen : null
  const wanted = repeats ?? foreseen
  const reach = wanted
    ? game.hand.indexOf(wanted)
    : Math.min(game.hand.length - 1, Math.max(0, Math.floor(random() * game.hand.length)))
  const taken = game.hand[reach]
  // `indexOf` answers -1 for a card she wanted and no longer holds — the guest
  // may have conjured it away since. There is nothing to take then, and the
  // round is left standing rather than a card being invented for it.
  if (taken === undefined) return game
  const hand = game.hand.filter((_, index) => index !== reach)
  log.push({ kind: 'taken', round: game.round, card: taken })

  const next: MorenaGame = {
    ...game,
    round: game.round + 1,
    // One exchange of undo, taken before this one is applied and holding no
    // snapshot of its own: this is a step back, not a tape of the hand.
    previous: { ...game, previous: null },
    // A second of the ten, spent. It goes whether or not she managed to repeat
    // herself — a card the guest has since conjured out of the erased stretch
    // is not a reason for the vision to run long.
    forced: game.forced.slice(1),
    questions: game.questions.filter((held) => held !== question),
    asked: [...game.asked, question],
    hand,
    graveyard: [...game.graveyard, taken],
    // A forged card she has taken is a forged card off the table: nothing is
    // left to expose, and the fraud goes with it.
    forged: game.forged === taken ? null : game.forged,
    // Spent. Seeing one round ahead is not seeing the game.
    foreseen: null,
    log,
  }

  // The kiss is offered the moment refusing it starts to cost something: two
  // answers left, one of which is about to go. Once only, and only if the
  // graveyard has anything worth buying back.
  if (!next.dealt && !next.kissed && next.hand.length === 2 && next.graveyard.length > 0) {
    next.dealt = true
    next.phase = 'deal'
    next.log = [...log, { kind: 'offered', round: next.round }]
    return writeTheProphecy(next, random)
  }

  next.phase = next.hand.length <= 1 ? 'settling' : 'asking'
  return writeTheProphecy(next, random)
}

/**
 * The one technique at this table that nobody plays.
 *
 * Lovely Ghostwriter is automatic writing: the beast writes, and what it writes
 * is not asked for. So it is not on the panel's button with the rest of them —
 * it fires on the first thing that happens to the guest, which in this game is
 * Morena's hand closing on one of their five cards. Nothing is spent, nothing
 * is chosen, and the quatrain is simply there afterwards.
 *
 * Written once. The prophecy does not revise itself, which is the whole reason
 * a prophecy is worth anything: it was set down before the branch was taken.
 */
function writeTheProphecy(game: MorenaGame, random: () => number): MorenaGame {
  const seat = livePages(game).find((page) => page.kind === 'prophecy')
  if (!seat || seat.spent > 0) return game
  return playTechnique(game, { random, page: seat.page })
}

/**
 * Take the kiss, and take a card back out of the graveyard.
 *
 * The kiss is one of the three conditions of Contagion in its own right, which
 * is why this is a trade and not a gift: the guest buys back the answer they
 * needed and hands over a third of the infection to do it. A No won with a
 * kissed mouth is still a No — the other two conditions are not met — but the
 * game has already had its way with them.
 */
export function takeTheDeal(game: MorenaGame, card: AnswerCard): MorenaGame {
  if (game.phase !== 'deal') return unchanged(game)
  if (!game.graveyard.includes(card)) return unchanged(game)
  const graveyard = [...game.graveyard]
  graveyard.splice(graveyard.indexOf(card), 1)

  // The kiss is a reach like any other: buying the marked card back with it
  // springs the trap at once, the mouth notwithstanding. The game closes here
  // for the same reason `settle` closes on the marker — a forced Yes is an
  // ending, not a card still in hand.
  if (card === game.marked) {
    const aftermath = payTheRiders(game, 'forced')
    return {
      ...game,
      phase: 'over',
      ending: 'played',
      kissed: true,
      hand: [card],
      graveyard,
      verdict: 'forced',
      finalCard: card,
      aftermath,
      log: [
        ...game.log,
        { kind: 'kissed', round: game.round, card },
        { kind: 'settled', round: game.round, card, verdict: 'forced' as Verdict },
        ...aftermath.map((what): Beat => ({ kind: 'aftermath', round: game.round, what })),
      ],
    }
  }

  const kissed: MorenaGame = {
    ...game,
    phase: 'asking',
    kissed: true,
    hand: [...game.hand, card],
    graveyard,
    log: [
      ...game.log,
      { kind: 'kissed', round: game.round, card },
      { kind: 'recovered', round: game.round, card },
    ],
  }

  // The canon undoing of Texture Surprise is touch, and the one touch this game
  // contains is the kiss. A guest who forged a card and then took the deal has
  // handed Morena the fraud along with their mouth — which is the whole shape
  // of that capability at this table: it wins a game it cannot conclude.
  if (kissed.forged) {
    return narrowTheAnswer(
      {
        ...kissed,
        log: [...kissed.log, { kind: 'exposed', round: kissed.round, card: kissed.forged }],
      },
      'cheating',
    )
  }

  return kissed
}

/** Refuse it, and get on with the hand you have. */
export function refuseTheDeal(game: MorenaGame): MorenaGame {
  if (game.phase !== 'deal') return unchanged(game)
  return {
    ...game,
    phase: game.hand.length <= 1 ? 'settling' : 'asking',
    log: [...game.log, { kind: 'declined', round: game.round }],
  }
}

/** The one card left, once the questions have been paid for. */
export function lastCard(game: MorenaGame): AnswerCard | null {
  return game.hand.length === 1 ? (game.hand[0] ?? null) : null
}

/**
 * Whether settling the game still needs something from the guest.
 *
 * A Joker has to be pointed at Yes or No, and a Back has to name what it is
 * pulling out of the graveyard. The other three answer for themselves.
 */
export function needsAChoice(game: MorenaGame): 'joker' | 'back' | null {
  const card = lastCard(game)
  if (card === 'joker') return 'joker'
  if (card === 'back') return game.graveyard.length > 0 ? 'back' : null
  return null
}

/** What a settled card is worth, before the marking is taken into account. */
function verdictOf(card: AnswerCard): Verdict {
  if (card === 'yes') return 'infected'
  if (card === 'x') return 'cancelled'
  return 'refused'
}

/**
 * What the riders did, once the last card is down.
 *
 * Every one of these answers a gap the canon leaves open rather than a rule it
 * states: the game produces a word, and a word binds nobody. What each rider
 * does is decide what that word was worth — and none of them changes the word.
 */
function payTheRiders(game: MorenaGame, verdict: Verdict): Aftermath[] {
  const said = verdict === 'infected' || verdict === 'forced'
  const paid: Aftermath[] = []

  // Moonlight Act: terms, duration, penalties, enforced by Manipulation. The
  // one capability that turns a spoken answer into something anybody can hold
  // the other to — which cuts both ways, and is why it is not a fraud.
  if (game.riders.includes('bound') && verdict !== 'cancelled') paid.push('bound')

  // The Sun and Moon marks by contact, and the kiss is a contact. No kiss, no
  // mark: the mechanic is paid out of Morena's own second condition.
  if (game.riders.includes('moon') && game.kissed) paid.push('moon')

  // Skill Hunter needs the ability seen in action, its owner questioned and
  // answering, and the imprint touched — inside an hour. A negotiation game in
  // a closed room is the one place in the canon where all three fall out of the
  // thing itself: she deals, she answers, she kisses.
  if (game.riders.includes('stolen') && game.kissed && game.asked.length > 0) {
    paid.push('stolen')
  }

  // Judgment Chain, pointed at oneself: "I will not answer Yes." It is the only
  // true immunity to the Manipulation, and it is priced at a life.
  if (game.riders.includes('sworn') && said) paid.push('sworn-struck')

  // And Cat's Name, which is the only thing here that is paid to a corpse.
  //
  // It is not on the rider list, because a rider is something the guest hung on
  // the outcome and this is not: the cat does not care whether it was declared,
  // whether the room saw it, or whether anybody at the table believed in it. It
  // cares that its owner is dead. The one death this game contains is the vow
  // collecting itself — so the two seats of the dissuasive family and the one
  // that kills you meet here, and the guest who swore on their heart and lost
  // takes Morena with them.
  if (paid.includes('sworn-struck')) paid.push(...payForTheBody(game))

  // Gallery Fake: the copy is inert and gone inside a day. The fraud is not
  // detected at the table, it is detected the morning after — when the game is
  // closed and Morena has been paid in something that no longer exists.
  if (game.riders.includes('smoke')) paid.push('smoke')

  // Three-Lie Transformation taxes the bluff, for both players. It is the only
  // arrangement at this table under which playing honestly is strictly better.
  if (game.riders.includes('taxed')) paid.push('taxed')

  // Desire Trap opens by naming what the other one wants, which is Morena's own
  // opening played back at her.
  if (game.riders.includes('trapped')) paid.push('trapped')

  // The dissuasive family: your death is not worth having. It answers the clause
  // that the game ends at the death of the target — and Morena does not kill her
  // candidates in any case, she recruits them.
  if (game.riders.includes('deterred')) paid.push('deterred')

  // «Are You Free?», which collected its yes whatever this table did with its
  // own. It is paid out unconditionally, because that is the entire point being
  // made: nothing about the hand, the kiss or the marking makes any difference
  // to a creature that simply asks until somebody agrees.
  if (game.riders.includes('solicited')) paid.push('solicited')

  // Somebody else was in the chair. A puppet has no desire to be named and
  // nothing of its own to stake, so a Yes taken off one is a Yes taken off
  // nobody: the game is capped at a draw, which is the correct price for the
  // best-hidden fraud in the list.
  if (game.proxied) paid.push('proxied')

  return paid
}

/**
 * Play the last card.
 *
 * `choice` is the Joker's direction, or the card a Back is reaching for. A Back
 * with an empty graveyard is nothing — there is no answer behind it — and reads
 * as a refusal, which is what a guest who spent everything and kept the wrong
 * card has actually done.
 *
 * The marking is checked on what the guest *reaches for*, not on what they end
 * up with: Morena marked a card so that touching it would open the door, and a
 * Back pulled off a marked slot hands her the answer whatever was written on
 * the card behind it.
 */
export function settle(game: MorenaGame, choice?: AnswerCard | 'yes' | 'no'): MorenaGame {
  if (game.phase !== 'settling') return unchanged(game)
  const card = lastCard(game)
  if (!card) return unchanged(game)

  /**
   * The card that was played stays on the table.
   *
   * A hand emptied at the end leaves the guest's side of the table bare, which
   * is the one thing that never happens: the answer is lying there face up,
   * and it is the only thing in the room anybody is looking at.
   */
  const close = (finalCard: AnswerCard, verdict: Verdict, extra: Beat[] = []): MorenaGame => {
    const aftermath = payTheRiders(game, verdict)
    return {
      ...game,
      phase: 'over',
      ending: 'played',
      hand: [finalCard],
      graveyard:
        finalCard === card
          ? game.graveyard
          : [...game.graveyard.filter((buried) => buried !== finalCard), card],
      verdict,
      finalCard,
      aftermath,
      log: [
        ...game.log,
        ...extra,
        { kind: 'settled', round: game.round, card: finalCard, verdict },
        ...aftermath.map((what): Beat => ({ kind: 'aftermath', round: game.round, what })),
      ],
    }
  }

  // Reaching for the marked card is the cheat springing. The manipulative half
  // of Contagion narrows the answer to Yes or No and Morena picks the Yes.
  if (game.marked === card) return close(card, 'forced')

  if (card === 'joker') {
    if (choice !== 'yes' && choice !== 'no') return unchanged(game)
    return close(choice, verdictOf(choice))
  }

  if (card === 'back') {
    if (game.graveyard.length === 0) return close('back', 'refused')
    if (!choice || !game.graveyard.includes(choice as AnswerCard)) return unchanged(game)
    const recovered = choice as AnswerCard
    // Reaching through the graveyard counts as reaching: pulling the marked
    // card out of it springs the trap whatever the guest meant to answer with.
    if (recovered === game.marked) {
      return close(recovered, 'forced', [
        { kind: 'recovered', round: game.round, card: recovered },
      ])
    }
    // A Back that pulls a Joker still has to be pointed somewhere, and there is
    // nothing left to point it with: an unaimed Joker is a refusal.
    if (recovered === 'joker') {
      return close('joker', 'refused', [{ kind: 'recovered', round: game.round, card: recovered }])
    }
    return close(recovered, verdictOf(recovered), [
      { kind: 'recovered', round: game.round, card: recovered },
    ])
  }

  return close(card, verdictOf(card))
}

/**
 * The three conditions of Contagion, as this game left them.
 *
 * Winning the Yes is one of them; the kiss is another; the murder the recruit
 * has to witness happens after the table is cleared and is not this game's to
 * give. Reported rather than judged, because the interesting outcome is the
 * one where the guest walks out kissed and uninfected.
 */
export function infectionAfter(game: MorenaGame): {
  said: boolean
  kissed: boolean
  witnessed: boolean
  level: number | null
  /** Whether the answer, and everything after it, landed on somebody else. */
  proxied: boolean
  /** Whether Contagion itself changed hands at this table. */
  stolen: boolean
} {
  const said = game.verdict === 'infected' || game.verdict === 'forced'
  const stolen = game.aftermath.includes('stolen')
  // A Yes given by a puppet is a Yes given by nobody: the person who sat down
  // is not the person who was recruited, and the caster was never at the table
  // to be infected. It is the correct ceiling for the best-hidden fraud there
  // is — the proxy protects you and cannot win for you.
  const onMe = said && !game.proxied
  return {
    said,
    kissed: game.kissed && !game.proxied,
    witnessed: false,
    level: onMe ? 0 : null,
    proxied: game.proxied,
    stolen,
  }
}

// ── What the game hands back to Contagion ──────────────────────────

/**
 * The three canonical conditions of Contagion, in the order they are met.
 *
 * They live here rather than in `module.ts` because the first of them *is*
 * this game: the checklist step named `game-won-yes` is what a hand played to
 * a Yes produces, and the second is a card bought with a kiss. Only the third
 * happens after the table has been cleared.
 */
export const INFECTION_STEPS = ['game-won-yes', 'kiss', 'witnessed-murder'] as const

export type InfectionStep = (typeof INFECTION_STEPS)[number]

/**
 * Which of the three conditions this hand actually established.
 *
 * The shape `checklist()` wants: a list to hand back as `completedSteps` when
 * Morena comes to spend the game on an infection. A game that has not closed
 * establishes nothing — a Yes is only a Yes once the last card is down.
 *
 * A proxied game establishes nothing either. The puppet said it and the puppet
 * was kissed; whoever cast it was never at the table to be infected.
 */
export function infectionStepsFrom(game: MorenaGame): InfectionStep[] {
  if (game.phase !== 'over' || game.proxied) return []
  const met: InfectionStep[] = []
  if (game.verdict === 'infected' || game.verdict === 'forced') met.push('game-won-yes')
  if (game.kissed) met.push('kiss')
  return met
}

/**
 * The game flattened into effect attributes.
 *
 * Two readings of the same move, deliberately. The flat counters are what a
 * timeline projection or a dashboard column reads without deserialising
 * anything; `game` is the state itself, so a branch can be replayed to the
 * exact hand rather than to a summary of it. `docs/jeu-de-morena.md` §4.2 asks
 * for one event per move, and this is what that event carries.
 *
 * Everything here survives `JSON.parse(JSON.stringify(...))`, which is what the
 * world reducer does to the whole state on every event.
 */
export function summariseGame(game: MorenaGame): Record<string, unknown> {
  return {
    round: game.round,
    phase: game.phase,
    questionsLeft: game.questions.length,
    answersLeft: game.hand.length,
    asked: [...game.asked],
    hand: [...game.hand],
    graveyard: [...game.graveyard],
    kissed: game.kissed,
    manipulated: game.manipulated,
    shielded: game.shielded,
    proxied: game.proxied,
    technique: game.technique,
    bookmark: game.bookmark?.kind ?? null,
    riders: [...game.riders],
    aftermath: [...game.aftermath],
    verdict: game.verdict,
    finalCard: game.finalCard,
    ending: game.ending,
    completedSteps: infectionStepsFrom(game),
    game: JSON.parse(JSON.stringify(game)) as MorenaGame,
  }
}

